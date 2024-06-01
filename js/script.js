//Definisi Variabel Global
const url = 'http://127.0.0.1:3000/db/databaseCleanGabung.json'; //Ganti url untuk tunjukkan chart & scorecard.

function toggleSidebar() {
    const stylesheet = document.getElementById('stylesheet');
    if (stylesheet.getAttribute('href') === 'css/styles.css') {
        stylesheet.setAttribute('href', 'css/styles2.css');
    } else {
        stylesheet.setAttribute('href', 'css/styles.css');
    }
}

// ----- SCORECARD: TOTAL INCOME -----
async function fetchTotalIncome() {
    try {
        //Koneksi ke data melalui URL
        const data = await connectToData(url);
        // logData(data);

        // Calculate total income from the fetched data
        let totalIncome = calculateTotalIncome(data);

        // Update the DOM with total income
        document.getElementById('totalIncomeCard').querySelector('span').textContent = '$'+totalIncome.toFixed(2);

    } catch (error) {
        console.error("Failed to display data:", error.message);
    }
}

// ----- SCORECARD: SALES VOLUME -----
async function fetchSalesVolume() {
    try {
        //Koneksi ke data melalui URL
        const data = await connectToData(url);
        // logData(data);

        let salesVolume = calculateSalesVolume(data)

        // Update the DOM with total sales volume
        document.getElementById('salesVolumeCard').querySelector('span').textContent = salesVolume;

    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}


// ----- SCORECARD: QUANTITY OF PRODUCTS SOLD -----
async function fetchQuantitySold() {
    try {
        //Koneksi ke data melalui URL
        const data = await connectToData(url);
        // logData(data);

        //Hitung Quantity of Products Sold
        let quantitySold = calculateQuantityOfProductSold(data);

        // Update the DOM with total quantity sold
        document.getElementById('quantitySoldCard').querySelector('span').textContent = quantitySold;
        
    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}


// ----- CHART: AMOUNT OF SALES BY CATEGORY -----
// --- Fetch Data dan Buat Chart Berdasarkan Kategori ---
async function fetchCategory() {
    try {
        const data = await connectToData(url);

        // Hitung nilai kategori
        const categories = calculateAmountOfSalesByCategory(data);

        // Get canvas
        const ctx = document.getElementById('myChart').getContext('2d');

        // Hapus chart sebelumnya jika ada
        if (window.myChart && typeof window.myChart.destroy === 'function') {
            window.myChart.destroy();
        }

        // Buat chart baru
        window.myChart = createBarChart(ctx, Object.keys(categories), Object.values(categories), 'Quantity of Category Sold', 'y');

    } catch (error) {
        console.error("Failed to fetch data:", error.message);
    }
}

async function fetchData() {
    await fetchTotalIncome();
    await fetchSalesVolume();
    await fetchQuantitySold();
    await fetchCategory();
    await populateProductOptions()
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
        let currentSortColumn = null;
        let currentSortDirection = 'asc';


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
                    <button class="pagination-button" onclick="goToPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>Previous</button>
                    <span>Page ${page} of ${totalPages}</span>
                    <button class="pagination-button" onclick="goToPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next</button>
                `;
            } else {
                console.error("Element with ID 'paginationControls' not found!");
            }
        }

        function updateDataAndDisplay(searchTerm) {
            let filteredData = sortedData;
            if (searchTerm) {
                searchTerm = searchTerm.toLowerCase();
                filteredData = sortedData.filter(item => item.Product.toLowerCase().includes(searchTerm));
            }
            displayPage(currentPage, filteredData);
        }

        function sortData(column) {
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortDirection = 'asc';
            }
            currentSortColumn = column;
            sortedData.sort((a, b) => {
                if (column === 'Product') {
                    if (a.Product < b.Product) return currentSortDirection === 'asc' ? -1 : 1;
                    if (a.Product > b.Product) return currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                } else {
                    return currentSortDirection === 'asc' ? a.RQty - b.RQty : b.RQty - a.RQty;
                }
            });
            displayPage(currentPage, sortedData);
        }

        window.goToPage = function(page) {
            const totalPages = Math.ceil(sortedData.length / itemsPerPage);
            if (page > 0 && page <= totalPages) {
                currentPage = page;
                displayPage(currentPage, sortedData);
            }
        }

        window.searchProduct = function() {
            const searchInput = document.getElementById("searchInput");
            if (searchInput) {
                const searchTerm = searchInput.value.trim();
                updateDataAndDisplay(searchTerm);
            } else {
                console.error("Element with ID 'searchInput' not found!");
            }
        }

        // Menambahkan event listener untuk input pencarian
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", searchProduct);
        } else {
            console.error("Element with ID 'searchInput' not found!");
        }

        // Menambahkan event listener ke header kolom untuk sorting
        document.getElementById("tableContent").addEventListener("click", function(event) {
            if (event.target.classList.contains("thProduct")) {
                sortData('Product');
            } else if (event.target.classList.contains("thQtt")) {
                sortData('RQty');
            }
        });

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
        const data = await connectToData(url); // Ambil data dari URL

        // logData(data); // Log data yang diterima

        if (Array.isArray(data)) {
            // Proses data menggunakan fungsi kalkulasi
            const { sortedPrices, quantities } = calculateQuantityOfProductSoldByPrice(data);

            // Get canvas
            const ctx = document.getElementById('myChart2').getContext('2d');

            // Buat chart
            window.myChart2 = createBarChart(ctx, sortedPrices, quantities, 'Quantity Sold Based on Price', 'x');

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

//Deklarasi variabel (objek UI Filter)
const filterLocation = document.getElementById("Location");
const filterProduct = document.getElementById("Product");
const filterStartDate = document.getElementById("start_date");
const filterEndDate = document.getElementById("end_date");

//Menambahkan eventListener dengan Function Filter
filterLocation.addEventListener('change', filterData)
filterProduct.addEventListener('change', filterData)
filterStartDate.addEventListener('change', filterData)
filterEndDate.addEventListener('change', filterData)

//Function untuk filter data berdasarkan input user
async function filterData() {
    try {
        //Koneksi ke data melalui URL
        const data = await connectToData(url);

        // Mengambil nilai dari dropdown (select) input user (eventListener)
        var userFilter = [
            document.getElementById("Location").value, 
            document.getElementById("Product").value, 
            document.getElementById("start_date").value, 
            document.getElementById("end_date").value
        ];

        // Filter data JSON berdasarkan input pengguna (Gerbang Logika)
        const filteredData = data.filter(item => {
            const locationMatch = (userFilter[0] === 'all' || item.Location === userFilter[0]);
            const productMatch = (userFilter[1] === 'all' || item.Product === userFilter[1]);
            const startDateMatch = (!userFilter[2] || new Date(item.Date) >= new Date(userFilter[2]));
            const endDateMatch = (!userFilter[3] || new Date(item.Date) <= new Date(userFilter[3]));

            return locationMatch && productMatch && startDateMatch && endDateMatch;
        });

        // Hitung nilai Scorecard & Chart
        let totalIncome = calculateTotalIncome(filteredData);
        let salesVolume = calculateSalesVolume(filteredData);
        let quantitySold = calculateQuantityOfProductSold(filteredData);
        const amountOfSalesByCategory = calculateAmountOfSalesByCategory(filteredData);
        const { sortedPrices, quantities } = calculateQuantityOfProductSoldByPrice(filteredData);

        // Log data yang difilter
        // logData(filteredData);

        // Perbarui Scorecard & Chart
        document.getElementById('totalIncomeCard').querySelector('span').textContent = '$' + totalIncome.toFixed(2); // Total Income
        document.getElementById('salesVolumeCard').querySelector('span').textContent = salesVolume; // Sales Volume
        document.getElementById('quantitySoldCard').querySelector('span').textContent = quantitySold; // Quantity Sold

        // Perbarui Chart Berdasarkan Kategori
        const ctx = document.getElementById('myChart').getContext('2d');

        if (window.myChart && typeof window.myChart.destroy === 'function') {
            window.myChart.destroy();
        }
        window.myChart = createBarChart(ctx, Object.keys(amountOfSalesByCategory), Object.values(amountOfSalesByCategory), 'Quantity of Category Sold', 'y');

         // Perbarui Chart Quantity of Product Sold Based on Price
         const ctx2 = document.getElementById('myChart2').getContext('2d');
         if (window.myChart2 && typeof window.myChart2.destroy === 'function') {
             window.myChart2.destroy();
         }
         window.myChart2 = createBarChart(ctx2, sortedPrices, quantities, 'Quantity Sold Based on Price', 'x');

         // Hitung dan Tampilkan Top Products
        const groupedData = groupByProduct(filteredData);
        const sortedData = sortByQuantity(groupedData);
        const itemsPerPage = 10;
        let currentPage = 1;

        // Fungsi untuk menampilkan halaman
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

        // Fungsi untuk memperbarui kontrol pagination
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

        // Fungsi untuk navigasi halaman
        window.goToPage = function(page) {
            const totalPages = Math.ceil(sortedData.length / itemsPerPage);
            if (page > 0 && page <= totalPages) {
                currentPage = page;
                displayPage(currentPage, sortedData);
            }
        }

        // Tampilkan halaman pertama
        displayPage(currentPage, sortedData);
    } catch (error) {
        console.error("Failed to display data:", error.message);
    }
}

// Menambahkan isi option filter ketika halaman di load FUNCTION
async function populateProductOptions() {
    try {
        const data = await connectToData(url);

        const productSelect = document.getElementById('Product');
        
        // Mengambil data unik dari properti "Product" dan mengurutkannya
        const products = [...new Set(data.map(item => item.Product))].sort();

        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product;
            option.textContent = product;
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to populate product options:', error);
    }
}
// --- Scorecard Total Income FUNCTION ---
function calculateTotalIncome(data) {
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

    return totalIncome;
}

// --- calculate Sales Volume FUNCTION ---
function calculateSalesVolume(data) {
    let salesVolume = 0;

    if (Array.isArray(data)) {
        // Menghitung Sales Volume dari data yang di filter
        salesVolume = data.reduce((total, item) => {
            if (typeof item.RQty === 'number') {
                return total + item.RQty * 6; // Asumsi konversi ke sales volume
            } else {
                console.error("RQty is not a number in item:", item);
                return total;
            }
        }, 0);
    } else {
        console.error("Data format is not as expected:", data);
    }

    return salesVolume;
}

// --- calculate Quantity of Product Sold FUNCTION ---
function calculateQuantityOfProductSold(data) {
    let quantitySold = 0;

    if (Array.isArray(data)) {
        // Menghitung Quantity of Products Sold dari data yang di filter
        quantitySold = data.reduce((total, item) => {
            if (typeof item.RQty === 'number') {
                return total + item.RQty;
            } else {
                console.error("RQty is not a number in item:", item);
                return total;
            }
        }, 0);
    } else {
        console.error("Data format is not as expected:", data);
    }

    return quantitySold;
}

// --- Calculate Amount of Sales By Category FUNCTION ---
function calculateAmountOfSalesByCategory(data) {
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
    return categories;
}

// --- Calculate Quantity Of Product Sold By Price FUNCTION ---
function calculateQuantityOfProductSoldByPrice(data) {
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

    return { sortedPrices, quantities };
}


// --- Buat Bar Chart FUNCTION ---
function createBarChart(ctx, labels, data, label, indexAxis = 'x') {
    const backgroundColor = 'rgba(0, 95, 177, 1)';

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Mengatur rasio aspek tetap
            indexAxis: indexAxis, // 'x' for vertical, 'y' for horizontal
            scales: {
                [indexAxis === 'x' ? 'y' : 'x']: {
                    beginAtZero: true,
                    grid: {
                        display: true // Matikan (false) ata u hidupkan (true) grid
                    },
                    ticks: {
                        autoSkip: true, // Skip labels if they are too dense
                        maxTicksLimit: 10, // Maximum number of ticks
                        padding: 10, // Padding around the labels
                        font: {
                            size: 12 // Font size for the labels
                        }
                    }
                },
                [indexAxis]: {
                    grid: {
                        display: false // Matikan grid
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    position: 'top',
                },
                tooltip: { 
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    cornerRadius: 4,
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw;
                        }
                    }
                },
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            }
        }
    });
}

//--- Fetch Data FUNCTION ---
async function connectToData(url) {
    const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

    return await response.json();
}

// --- Log Data FUNCTION --- 
function logData(data) {
    console.log(data);
}

// ---------- ABOUT -----------
document.addEventListener("DOMContentLoaded", function() {
    // Buka link di tab baru pada tombol Source Code
    document.getElementById("our_project-source_code").onclick = function() {
        window.open("https://github.com/Kampus-Merdeka-Software-Engineering/km-feb24-jayapura-1");
    };

    // Buka link di tab baru pada tombol Dataset
    document.getElementById("our_project-dataset").onclick = function() {
        window.open("https://www.kaggle.com/datasets/awesomeasingh/vending-machine-sales");
    };
});


// ------ Modal Canvas ------
document.addEventListener("DOMContentLoaded", function() {
    // Dapatkan modal dan elemen terkait
    var modal = document.getElementById("myModal");
    var modalCanvas = document.getElementById("modalCanvas");
    var closeBtn = document.getElementsByClassName("close")[0];
    var originalCanvas1 = document.getElementById("myChart");
    var originalCanvas2 = document.getElementById("myChart2");

    // Fungsi untuk membuka modal dan menyalin canvas
    function openModal(originalCanvas) {
        modal.style.display = "block";
        var context = modalCanvas.getContext("2d");
        modalCanvas.width = originalCanvas.width;
        modalCanvas.height = originalCanvas.height;
        context.drawImage(originalCanvas, 0, 0);
    }

    // Tambahkan event listener ke canvas myChart
    originalCanvas1.addEventListener("click", function() {
        openModal(originalCanvas1);
    });

    // Tambahkan event listener ke canvas myChart2
    originalCanvas2.addEventListener("click", function() {
        openModal(originalCanvas2);
    });

    // Fungsi untuk menutup modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // Tutup modal jika pengguna mengklik di luar modal
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});