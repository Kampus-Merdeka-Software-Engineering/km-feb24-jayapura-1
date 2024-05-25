//Definisi Variabel Global
const url = 'http://127.0.0.1:3002/db/databaseCleanGabung.json'; //Ganti url untuk tunjukkan chart & scorecard.

function toggleSidebar() {
    const stylesheet = document.getElementById('stylesheet');
    if (stylesheet.getAttribute('href') === 'css/styles.css') {
        stylesheet.setAttribute('href', 'css/styles2.css');
    } else {
        stylesheet.setAttribute('href', 'css/styles.css');
    }
}

// ----- TOTAL INCOME -----
async function fetchTotalIncome() {

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        
        // Log data for debugging
        console.log(data);

        // Calculate total income from the fetched data
        let totalIncome = 0;
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (typeof item.RPrice === 'number' && typeof item.RQty === 'number') {
                    const income = item.RPrice * item.RQty;
                    totalIncome += income;
                } else {
                    console.error("Data format is not as expected:", item);
                }
            });
        } else {
            console.error("Data format is not as expected:", data);
        }

        // Update the DOM with total income
        document.getElementById('totalIncomeCard').querySelector('span').textContent = '$'+totalIncome.toFixed(2);

    } catch (error) {
        console.error("Failed to display data:", error.message);
    }
}

// ----- SALES VOLUME -----
async function fetchSalesVolume() {

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            // Calculate sales volume
            const salesVolume = data.reduce((total, item) => {
                if (typeof item.RQty === 'number') {
                    return total + item.RQty * 6;
                } else {
                    console.error("RQty is not a number in item:", item);
                    return total;
                }
            }, 0);

            // Update the DOM with total sales volume
            document.getElementById('salesVolumeCard').querySelector('span').textContent = salesVolume;
        } else {
            console.error("Data format is not as expected");
        }
    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}


// ----- QUANTITY SOLD -----
async function fetchQuantitySold() {

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            // Sum of all RQty values
            const quantitySold = data.reduce((total, item) => {
                if (typeof item.RQty === 'number') {
                    return total + item.RQty;
                } else {
                    console.error("RQty is not a number in item:", item);
                    return total;
                }
            }, 0);

            // Update the DOM with total quantity sold
            document.getElementById('quantitySoldCard').querySelector('span').textContent = quantitySold;
        } else {
            console.error("Data format is not as expected");
        }
    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}


// ----- CHART CATEGORY -----
async function fetchCategory() {
    try {

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        // Proses data untuk chart
        const categories = {};
        data.forEach(item => {
            const category = item.Category;
            const sales = parseInt(item.RQty);
            if (!isNaN(sales)) {
                categories[category] = (categories[category] || 0) + sales;
            } else {
                console.error("Invalid sales data for item:", item);
            }
        });

        // Get canvas
        const ctx = document.getElementById('myChart').getContext('2d');

        // Buat chart 
        const myChart = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    label: 'Quantity of Category Sold',
                    data: Object.values(categories),
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
    await fetchTotalIncome();
    await fetchSalesVolume();
    await fetchQuantitySold();
    await fetchCategory();
}

// ----- TOP PRODUCTS -----
document.addEventListener("DOMContentLoaded", async function() {
    try {
        const topProductsResponse = await fetchTopProducts();
        const topProductsData = await topProductsResponse.json();
        const groupedData = groupByProduct(topProductsData);
        const sortedData = sortByQuantity(groupedData);
        const itemsPerPage = 10;
        let currentPage = 1;

        function displayPage(page, data) {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageData = data.slice(start, end);
            const topProductsTable = generateTopProductsTable(pageData);
            const tableContent = document.getElementById("tableContent");
            if (tableContent) {
                tableContent.innerHTML = topProductsTable;
            } else {
                console.error("Element with ID 'tableContent' not found!");
            }
            updatePaginationControls(page, data.length);
        }

        function updatePaginationControls(page, totalItems) {
            const paginationControls = document.getElementById("paginationControls");
            if (paginationControls) {
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                paginationControls.innerHTML = `
                    <button onclick="goToPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>Previous</button>
                    <span>Page ${page} of ${totalPages}</span>
                    <button onclick="goToPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next</button>
                `;
            } else {
                console.error("Element with ID 'paginationControls' not found!");
            }
        }

        window.goToPage = function(page) {
            const totalPages = Math.ceil(sortedData.length / itemsPerPage);
            if (page > 0 && page <= totalPages) {
                currentPage = page;
                displayPage(currentPage, sortedData);
            }
        }

        displayPage(currentPage, sortedData);
    } catch (error) {
        console.error("Failed to fetch top products:", error.message);
    }
});

async function fetchTopProducts() {
    return await fetch(url);
}

function groupByProduct(data) {
    const grouped = data.reduce((acc, item) => {
        if (!acc[item.Product]) {
            acc[item.Product] = { Product: item.Product, RQty: 0 };
        }
        acc[item.Product].RQty += item.RQty;
        return acc;
    }, {});
    return Object.values(grouped);
}

function sortByQuantity(data) {
    return data.sort((a, b) => b.RQty - a.RQty);
}

function generateTopProductsTable(data) {
    let tableHTML = '<table>';
    tableHTML += '<tr><th class="thProduk">Product</th><th class="thQtt">Quantity Sold</th></tr>';
    data.forEach(product => {
        tableHTML += `<tr><td>${product.Product}</td><td>${product.RQty}</td></tr>`;
    });
    tableHTML += '</table>';
    return tableHTML;
}

fetchData();


// ----- CHART QUANTITY PRODUCT -----
async function fetchQuantityProduct() {

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            // Proses data untuk chart
            const quantityByPrice = {};
            data.forEach(item => {
                if (typeof item.RPrice === 'number' && typeof item.RQty === 'number') {
                    quantityByPrice[item.RPrice] = (quantityByPrice[item.RPrice] || 0) + item.RQty;
                } else {
                    console.error("RPrice or RQty is not a number in item:", item);
                }
            });

            // Urutkan harga
            const sortedPrices = Object.keys(quantityByPrice).map(price => parseFloat(price)).sort((a, b) => a - b);
            const quantities = sortedPrices.map(price => quantityByPrice[price]);

            // Get canvas
            const ctx = document.getElementById('myChart2').getContext('2d');

            // Buat chart
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedPrices,
                    datasets: [{
                        label: 'Quantity Sold',
                        data: quantities,
                        backgroundColor: 'rgba(0, 95, 177, 1)',
                        borderColor: 'rgba(0, 95, 177, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    indexAxis: 'x', // vertical bar chart
                    scales: {
                        y: {
                            beginAtZero: true,
    
                        },
                    }
                }
            });

        } else {
            console.error("Data format is not as expected");
        }
    } catch (error) {
        console.error("Failed to display data:", error.message);
    }
}

fetchQuantityProduct();

// ---------- FILTER ----------
//Mem-filter data pada scorecard, table, dan chart berdasarkan input user.

//Deklarasi variabel
var userFilter = [
    document.getElementById("Location").value, 
    document.getElementById("Product").value, 
    document.getElementById("start_date").value, 
    document.getElementById("end_date").value
];

const filterLocation = document.getElementById("Location");
const filterProduct = document.getElementById("Product");
const filterStartDate = document.getElementById("start_date");
const filterLEndDate = document.getElementById("end_date");

//Mengambil nilai dari dropdown (select) input user (eventListener)


console.log(userFilter);

//filter data JSON berdasarkan input user (Gerbang Logika)


//Ambil hasil filter data


//Proses hasil filter data


//Tunjukkan pada scorecard


//Tunjukkan pada chart


// ---------- ABOUT -----------
//Buka link di tab baru pada tombol Source Code
document.getElementById("our_project-source_code").onclick = function () {
    window.open("https://github.com/Kampus-Merdeka-Software-Engineering/km-feb24-jayapura-1");
};

//Buka link di tab baru pada tombol Dataset
document.getElementById("our_project-dataset").onclick = function () {
    window.open("https://www.kaggle.com/datasets/awesomeasingh/vending-machine-sales");
};