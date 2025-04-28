const express = require('express');
const path = require('path');
const cors = require('cors');
const hbs = require('hbs');
const _ = require('lodash');
const { MongoClient } = require('mongodb');
const nikons = require('./nikons.js');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection URL
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'Mern';
const collectionName = 'camera';
let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars setup
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Set layout
app.set('view options', { layout: 'layouts/main' });

// Web Routes
app.get('/', async (req, res) => {
    const cameras = await db.collection(collectionName).find({}).toArray();
    res.render('pages/home', { title: 'Home', cameras });
});

app.get('/dashboard', async (req, res) => {
    const cameras = await db.collection(collectionName).find({}).toArray();
    const totalCameras = cameras.length;
    const uniqueSensors = _.uniqBy(cameras, 'Sensor').length;
    const mostCommonLens = _.chain(cameras)
        .countBy('Lens')
        .entries()
        .maxBy(_.last)
        .head()
        .value() || 'N/A';
    const recentCameras = cameras.slice(-3);
    res.render('pages/dashboard', {
        title: 'Dashboard',
        cameras,
        totalCameras,
        uniqueSensors,
        mostCommonLens,
        recentCameras
    });
});

app.get('/add', (req, res) => {
    res.render('pages/add', { title: 'Add Camera' });
});

app.get('/edit', async (req, res) => {
    try {
        const cameras = await db.collection(collectionName).find({}).toArray();
        const pixel = req.query.pixel;
        const camera = pixel ? 
            await db.collection(collectionName).findOne({ Pixel: pixel }) : 
            null;
        
        res.render('pages/edit', { 
            title: 'Edit Camera', 
            cameras, 
            camera,
            error: !camera && pixel ? 'Camera not found' : null
        });
    } catch (error) {
        res.status(500).render('pages/edit', { 
            title: 'Edit Camera', 
            error: 'Error loading camera data' 
        });
    }
});

app.get('/about', (req, res) => {
    res.render('pages/about', { title: 'About' });
});

app.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'Contact' });
});

app.get('/help', (req, res) => {
    res.render('pages/help', { title: 'Help' });
});

// Add these routes before the API routes section
app.post('/delete', async (req, res) => {
    try {
        const pixel = req.body.pixel;
        const result = await db.collection(collectionName).deleteOne({ Pixel: pixel });
        
        if (result.deletedCount === 0) {
            return res.redirect('/edit?error=Camera not found');
        }
        
        res.redirect('/?success=Camera deleted successfully');
    } catch (error) {
        console.error('Delete error:', error);
        res.redirect('/edit?error=Error deleting camera');
    }
});

app.post('/update', async (req, res) => {
    try {
        const { Pixel, Sensor, Lens, Battery } = req.body;
        
        if (!Pixel) {
            return res.redirect('/edit?error=Pixel value is required');
        }

        // Handle Pixel value - if it's an array, use first element
        const pixelValue = Array.isArray(Pixel) ? Pixel[0] : Pixel;

        if (!Sensor || !Lens || !Battery) {
            return res.redirect(`/edit?pixel=${pixelValue}&error=All fields are required`);
        }

        const updateResult = await db.collection(collectionName).updateOne(
            { Pixel: pixelValue },
            {
                $set: {
                    Sensor,
                    Lens,
                    Battery
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.redirect(`/edit?pixel=${pixelValue}&error=Camera not found`);
        }

        if (updateResult.modifiedCount === 1) {
            return res.redirect('/?success=Camera updated successfully');
        }

        res.redirect(`/edit?pixel=${pixelValue}&error=No changes made`);
    } catch (error) {
        res.redirect('/edit?error=Error updating camera');
    }
});

// API Routes
app.get('/api/nikons', async (req, res) => {
    try {
        const cameras = await db.collection(collectionName).find({}).toArray();
        res.json(cameras);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching cameras' });
    }
});

app.post('/api/nikons', async (req, res) => {
    const { Pixel, Sensor, Lens, Battery } = req.body;
    if (!Pixel || !Sensor || !Lens || !Battery) {
        return res.status(400).json({ error: 'All fields are required!' });
    }
    try {
        const result = await db.collection(collectionName).insertOne({
            Pixel, Sensor, Lens, Battery
        });
        res.status(201).json({ message: 'Camera added successfully!' });
    } catch (error) {
        res.status(400).json({ error: 'Error adding camera' });
    }
});

app.delete('/api/nikons/:pixel', async (req, res) => {
    try {
        const result = await db.collection(collectionName)
            .deleteOne({ Pixel: req.params.pixel });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'No Nikon camera found!' });
        }
        res.json({ message: 'Nikon camera removed!' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting camera' });
    }
});

app.put('/api/nikons/:pixel', async (req, res) => {
    try {
        const { Sensor, Lens, Battery } = req.body;
        const Pixel = req.params.pixel.toString(); // Ensure Pixel is treated as a string
        
        if (!Sensor || !Lens || !Battery) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        // First check if camera exists
        const camera = await db.collection(collectionName).findOne({ Pixel: Pixel });
        
        if (!camera) {
            return res.status(404).json({ error: 'Camera not found!' });
        }

        // If camera exists, update it
        const updateResult = await db.collection(collectionName).updateOne(
            { Pixel: Pixel },
            {
                $set: {
                    Sensor,
                    Lens,
                    Battery
                }
            }
        );

        if (updateResult.modifiedCount === 1) {
            res.json({ message: 'Camera updated successfully!' });
        } else {
            res.status(500).json({ error: 'Failed to update camera' });
        }
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Error updating camera: ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});