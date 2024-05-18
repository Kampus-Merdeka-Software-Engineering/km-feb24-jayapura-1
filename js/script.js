function toggleSidebar() {
    const stylesheet = document.getElementById('stylesheet');
    if (stylesheet.getAttribute('href') === 'css/styles.css') {
        stylesheet.setAttribute('href', 'css/styles2.css');
    } else {
        stylesheet.setAttribute('href', 'css/styles.css');
    }
}

// Fetch Quantity Sold
async function fetchQuantitySold() {
    try {
        const response = await fetch('http://localhost:5500/db/JumlahPenjualan.json');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);

        if (Array.isArray(data) && data.length > 0) {
            const quantitySold = data[0].jumlah_penjualan;
            document.getElementById('quantitySoldCard').querySelector('span').textContent = quantitySold;
        } else {
            console.error("Data format is not as expected");
        }
    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}

//Fetch Total Income
async function fetchTotalIncome() {
    const urls = [
        'http://localhost:5500/db/totalPenjualanEarle.json',
        'http://localhost:5500/db/totalPenjualanLibrary.json',
        'http://localhost:5500/db/totalPenjualanSqMall.json',
        'http://localhost:5500/db/totalPenjualanGuttenplans.json'
    ];

    try {
        const fetchPromises = urls.map(url => fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        }));

        const data = await Promise.all(fetchPromises);

        // Log data for debugging
        console.log(data);

        // Calculate total income from all URLs
        // Masih sementara, nanti jumlah_penjualan diganti line total karena data json ternyata masih belum lengkap (ada miss)
        let totalIncome = 0;
        data.forEach(itemList => {
            if (Array.isArray(itemList)) {
                itemList.forEach(item => {
                    if (typeof item.jumlah_penjualan === 'string') {
                        const harga = parseFloat(item.jumlah_penjualan);
                        if (!isNaN(harga)) {
                            totalIncome += harga;
                        } else {
                            console.error("Invalid number format in item:", item);
                        }
                    } else {
                        console.error("Data format is not as expected:", item);
                    }
                });
            } else {
                console.error("Data format is not as expected:", itemList);
            }
        });

        // Update the DOM with total income
        document.getElementById('totalIncomeCard').querySelector('span').textContent = totalIncome.toFixed(2);

    } catch (error) {
        console.error("Failed to display data:", error.message);
    }
}

//Fetch Category
async function fetchCategory() {
    try {
        const urls = [
            'http://localhost:5500/db/KategoriProdukEarle.json',
            'http://localhost:5500/db/KategoriProdukGuttenplans.json',
            'http://localhost:5500/db/KategoriProdukLibrary.json',
            'http://localhost:5500/db/KategoriProdukSqMall.json'
        ];

        const fetchPromises = urls.map(url => fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        }));

        const data = await Promise.all(fetchPromises);

        // Proses data untuk chart
        const categories = [];
        const salesData = [];

        data.forEach(dataList => {
            dataList.forEach(item => {
                const category = item.Category;
                const sales = parseInt(item.jum_penjualan_mall);
                const index = categories.indexOf(category);
                if (index === -1) {
                    categories.push(category);
                    salesData.push(sales);
                } else {
                    salesData[index] += sales;
                }
            });
        });

        // Get canvas
        const ctx = document.getElementById('myChart').getContext('2d');

        // Buat chart 
        // Ini juga kayanya masi ada miss data soalnya beda hasilnya :(
        const myChart = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: categories,
                datasets: [{
                    label: 'Quantity of Category Sold',
                    data: salesData,
                    backgroundColor: 'rgba(0, 95, 177, 1)',
                    borderColor: 'rgba(0, 95, 177, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // jadi horizontal chart
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
        
    } catch (error) {
        console.error("Failed to fetch data:", error.message);
    }
}

async function fetchData() {
    await fetchQuantitySold();
    await fetchTotalIncome();
    await fetchCategory();
}

fetchData();