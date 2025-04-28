document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cameraForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                Pixel: document.getElementById('Pixel').value,
                Sensor: document.getElementById('Sensor').value,
                Lens: document.getElementById('Lens').value,
                Battery: document.getElementById('Battery').value
            };
            const method = window.location.pathname === '/add' ? 'POST' : 'PUT';
            const url = method === 'POST' ? '/api/nikons' : `/api/nikons/${formData.Pixel}`;

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    window.location.href = '/';
                } else {
                    alert(data.error || 'Error processing request');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error processing request');
            }
        });
    }
});

async function deleteCamera(pixel) {
    if (confirm('Are you sure you want to delete this camera?')) {
        try {
            const response = await fetch(`/api/nikons/${pixel}`, { method: 'DELETE' });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.error || 'Error deleting camera');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting camera');
        }
    }
}