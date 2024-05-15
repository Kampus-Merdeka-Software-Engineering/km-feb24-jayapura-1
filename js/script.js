
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('card-container');
        
        // Asumsikan struktur JSON: { namaProvinsi, jumlahRekaman }
        const html = data.map(entry => `
            <div class="card">
                <h3>${entry.namaProvinsi}</h3>
                <p>Jumlah Rekaman: ${entry.jumlahRekaman}</p>
            </div>
        `).join('');
        
        container.innerHTML = html;
    })
    .catch(error => console.error('Error fetching data:', error));
