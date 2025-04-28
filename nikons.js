const fs = require('fs');
const _ = require('lodash');

const loadNikons = () => {
    try {
        const dataBuffer = fs.readFileSync('nikons.json');
        return JSON.parse(dataBuffer.toString());
    } catch (e) {
        return [];
    }
};

const saveNikons = (nikons) => {
    try {
        fs.writeFileSync('nikons.json', JSON.stringify(nikons, null, 2));
        return true;
    } catch (e) {
        return false;
    }
};

const addNikon = (Pixel, Sensor, Lens, Battery) => {
    const nikons = loadNikons();
    const duplicateNikon = _.find(nikons, { Pixel });
    if (!duplicateNikon) {
        nikons.push({ Pixel, Sensor, Lens, Battery });
        saveNikons(nikons);
        return { success: true, message: 'New Nikon camera added!' };
    }
    return { success: false, message: 'A Nikon camera with this Pixel count already exists!' };
};

const removeNikon = (Pixel) => {
    const nikons = loadNikons();
    const nikonsToKeep = _.reject(nikons, { Pixel });
    if (nikons.length > nikonsToKeep.length) {
        saveNikons(nikonsToKeep);
        return { success: true, message: 'Nikon camera removed!' };
    }
    return { success: false, message: 'No Nikon camera found!' };
};

const listNikons = () => loadNikons();

const readNikon = (Pixel) => {
    const nikon = _.find(loadNikons(), { Pixel });
    return nikon ? { success: true, data: nikon } : { success: false, message: 'Nikon camera not found!' };
};

module.exports = { addNikon, removeNikon, listNikons, readNikon, saveNikons };