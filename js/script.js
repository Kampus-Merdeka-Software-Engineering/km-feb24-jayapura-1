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

        // Hitung total income dari data yang diambil
        let totalIncome = calculateTotalIncome(data);

        // Perbarui DOM dengan total income yang diformat
        updateScorecardValue('totalIncomeCard', totalIncome, true);

    } catch (error) {
        console.error("Failed to display data:", error.message);
    }
}

// ----- SCORECARD: SALES VOLUME -----
async function fetchSalesVolume() {
    try {
        const data = await connectToData(url);
        let salesVolume = calculateSalesVolume(data)
        updateScorecardValue('salesVolumeCard', salesVolume);

    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}


// ----- SCORECARD: QUANTITY OF PRODUCTS SOLD -----
async function fetchQuantitySold() {
    try {
        const data = await connectToData(url);
        let quantitySold = calculateQuantityOfProductSold(data);
        updateScorecardValue('quantitySoldCard', quantitySold);
        
    } catch (error) {
        console.error("Failed to display data", error.message);
    }
}

// Fungsi untuk memformat angka dengan pemisah ribuan dan tanda dolar
function formatCurrency(value) {
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Fungsi untuk memformat angka dengan pemisah ribuan
function formatNumber(value) {
    return value.toLocaleString('en-US');
}

// Fungsi untuk memperbarui DOM dengan nilai yang diformat
function updateScorecardValue(elementId, value, isCurrency = false) {
    const formattedValue = isCurrency ? formatCurrency(value) : formatNumber(value);
    document.getElementById(elementId).querySelector('span').textContent = formattedValue;
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
        window.myChart =createPieChart(ctx, Object.keys(categories), Object.values(categories));

    } catch (error) {
        console.error("Failed to fetch data:", error.message);
    }
}

async function fetchData() {
    await fetchTotalIncome();
    await fetchSalesVolume();
    await fetchQuantitySold();
    await fetchCategory();
    await fetchDataAndRenderChart();
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
document.addEventListener('DOMContentLoaded', () => {
    const filterLocation = document.getElementById("Location");
    const filterProduct = document.getElementById("Product");
    const filterStartDate = document.getElementById("start_date");
    const filterEndDate = document.getElementById("end_date");
    
    //Menambahkan eventListener dengan Function Filter
    filterLocation.addEventListener('change', filterData)
    filterProduct.addEventListener('change', filterData)
    filterStartDate.addEventListener('change', filterData)
    filterEndDate.addEventListener('change', filterData)

    filterData(); // Initial load
});

//Function untuk filter data berdasarkan input user
async function filterData() {
    try {
        // Koneksi ke data melalui URL
        const data = await connectToData(url);

        // Mengambil nilai dari dropdown (select) input user (eventListener)
        const userFilter = {
            location: document.getElementById("Location").value,
            product: document.getElementById("Product").value,
            startDate: document.getElementById("start_date").value,
            endDate: document.getElementById("end_date").value
        };

        // Convert date strings to Date Object
        const startDate = userFilter.startDate ? new Date(userFilter.startDate) : null;
        const endDate = userFilter.endDate ? new Date(userFilter.endDate) : null;

        // Filter data JSON berdasarkan input pengguna (Gerbang Logika)
        const filteredData = data.filter(item => {
            const itemDate = new Date(item.TransDate.split('/').reverse().join('-'));
            const locationMatch = (userFilter.location === 'all' || item.Location === userFilter.location);
            const productMatch = (userFilter.product === 'all' || item.Product === userFilter.product);
            const startDateMatch = (!startDate || itemDate >= startDate);
            const endDateMatch = (!endDate || itemDate <= endDate);

            return locationMatch && productMatch && startDateMatch && endDateMatch;
        });

        // Hitung nilai Scorecard & Chart
        let totalIncome = calculateTotalIncome(filteredData);
        let salesVolume = calculateSalesVolume(filteredData);
        let quantitySold = calculateQuantityOfProductSold(filteredData);
        const amountOfSalesByCategory = calculateAmountOfSalesByCategory(filteredData);
        const { sortedPrices, quantities } = calculateQuantityOfProductSoldByPrice(filteredData);
        const incomePerMonth = calculateIncomePerMonth(filteredData);

        // Perbarui Scorecard & Chart
        updateScorecardValue('totalIncomeCard', totalIncome, true); // Total Income
        updateScorecardValue('salesVolumeCard', salesVolume); // Sales Volume
        updateScorecardValue('quantitySoldCard', quantitySold); // Quantity Sold

        // Perbarui chart berdasarkan total income per month
        const ctx3 = document.getElementById('myChart3').getContext('2d');
        if (window.myChart3 instanceof Chart) {
            window.myChart3.destroy();
        }
        window.myChart3 = createLineChart(ctx3, Object.keys(incomePerMonth), Object.values(incomePerMonth));

        // Perbarui Chart Berdasarkan Kategori
        const ctx = document.getElementById('myChart').getContext('2d');
        if (window.myChart instanceof Chart) {
            window.myChart.destroy();
        }
        window.myChart = createPieChart(ctx, Object.keys(amountOfSalesByCategory), Object.values(amountOfSalesByCategory));

        // Perbarui Chart Quantity of Product Sold Based on Price
        const ctx2 = document.getElementById('myChart2').getContext('2d');
        if (window.myChart2 instanceof Chart) {
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
                    <button class="pagination-button" onclick="goToPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>Previous</button>
                    <span>Page ${page} of ${totalPages}</span>
                    <button class="pagination-button" onclick="goToPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>Next</button>
                `;
            } else {
                console.error("Element with ID 'paginationControls' not found!");
            }
        }

        // Fungsi untuk navigasi halaman
        window.goToPage = function (page) {
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
    const baseColor = { r: 0, g: 95, b: 177 }; // Warna dasar untuk nilai tertinggi
    const lowColor = { r: 198, g: 236, b: 255 }; // Warna untuk nilai terendah (#C6ECFF)

    // Cari nilai maksimum dan minimum dari data
    const max = Math.max(...data);
    const min = Math.min(...data);

    // Buat warna berdasarkan saturasi nilai data
    let backgroundColors;

    if (data.length === 1) {
        // Jika hanya ada satu value, gunakan baseColor
        backgroundColors = [`rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`];
    } else {
        // Interpolasi warna untuk lebih dari satu value
        backgroundColors = data.map(value => {
            const ratio = (value - min) / (max - min); // Normalisasi nilai data

            // Interpolasi warna antara lowColor dan baseColor
            const r = Math.round(lowColor.r + (baseColor.r - lowColor.r) * ratio);
            const g = Math.round(lowColor.g + (baseColor.g - lowColor.g) * ratio);
            const b = Math.round(lowColor.b + (baseColor.b - lowColor.b) * ratio);

            return `rgba(${r}, ${g}, ${b}, 1)`;
        });
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Mengatur rasio aspek tetap
            indexAxis: indexAxis, // 'x' untuk vertikal, 'y' untuk horizontal
            scales: {
                [indexAxis === 'x' ? 'y' : 'x']: {
                    beginAtZero: true,
                    grid: {
                        display: true // Matikan (false) atau hidupkan (true) grid
                    },
                    ticks: {
                        autoSkip: true, // Lewati label jika terlalu rapat
                        maxTicksLimit: 10, // Jumlah maksimum ticks
                        padding: 10, // Padding sekitar label
                        font: {
                            size: 12 // Ukuran font untuk label
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

// --- Buat Pie Chart FUNCTION ---
function createPieChart(ctx, labels, data) {
    const baseColor = { r: 0, g: 95, b: 177 }; // Warna dasar untuk nilai tertinggi
    const lowColor = { r: 198, g: 236, b: 255 }; // Warna untuk nilai terendah (#C6ECFF)

    // Gabungkan data dengan labels untuk memudahkan sorting
    const combined = data.map((value, index) => ({
        value: value,
        label: labels[index]
    }));

    // Urutkan berdasarkan nilai dari tertinggi ke terendah
    combined.sort((a, b) => b.value - a.value);

    // Pisahkan kembali labels dan data yang telah diurutkan
    const sortedLabels = combined.map(item => item.label);
    const sortedData = combined.map(item => item.value);

    // Buat warna berdasarkan saturasi nilai data
    const backgroundColors = sortedData.map((value, index, array) => {
        if (array.length === 1) {
            // Jika hanya ada satu nilai, gunakan warna dasar
            return `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`;
        } else {
            const ratio = index / (array.length - 1); // Normalisasi indeks data

            // Interpolasi warna antara baseColor dan lowColor (kebalikan)
            const r = Math.round(baseColor.r + (lowColor.r - baseColor.r) * ratio);
            const g = Math.round(baseColor.g + (lowColor.g - baseColor.g) * ratio);
            const b = Math.round(baseColor.b + (lowColor.b - baseColor.b) * ratio);

            return `rgba(${r}, ${g}, ${b}, 1)`;
        }
    });

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sortedLabels,
            datasets: [{
                data: sortedData,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Mengatur rasio aspek tetap
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    enabled: true,
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
                        label: function (tooltipItem) {
                            const label = tooltipItem.label || '';
                            const value = tooltipItem.raw || 0;
                            return `${label}: ${value}`;
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

// ------ Modal Canvas ------
document.addEventListener("DOMContentLoaded", function() {
    // Dapatkan modal dan elemen terkait
    var modal = document.getElementById("myModal");
    var modalCanvas = document.getElementById("modalCanvas");
    var closeBtn = document.getElementsByClassName("close")[0];
    var originalCanvas1 = document.getElementById("myChart");
    var originalCanvas2 = document.getElementById("myChart2");
    var originalCanvas3 = document.getElementById("myChart3");

    // Variabel untuk menyimpan referensi ke chart yang aktif
    var activeChart = null;

    // Fungsi untuk membuka modal dan menyalin canvas
    function openModal(originalCanvas) {
        modal.style.display = "block";
        var context = modalCanvas.getContext("2d");
        modalCanvas.width = originalCanvas.width;
        modalCanvas.height = originalCanvas.height;
        context.drawImage(originalCanvas, 0, 0);

        // Inisialisasi ulang chart di canvas modal dengan konfigurasi yang sama
        const chartId = originalCanvas.id;
        const chartConfig = window[chartId].config;
        activeChart = new Chart(modalCanvas, chartConfig);
    }

    // Tambahkan event listener ke masing-masing canvas yang menunjukkan bahwa chart dapat diklik
    [originalCanvas1, originalCanvas2, originalCanvas3].forEach(function(canvas) {
        canvas.addEventListener("mouseover", function() {
            this.style.cursor = "pointer";
        });

        canvas.addEventListener("click", function() {
            openModal(this);
        });
    });

    // Fungsi untuk menutup modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
        // Hancurkan chart yang aktif saat modal ditutup
        if (activeChart) {
            activeChart.destroy();
            activeChart = null;
        }
    }
});

// --- Buat Line Chart --- //
// Function to calculate total income per month
function calculateIncomePerMonth(data) {
    const incomeByMonth = {};

    const monthsInOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach(item => {
        const month = item.Month;
        const income = item.RQty * item.RPrice;
        
        if (!incomeByMonth[month]) {
            incomeByMonth[month] = 0;
        }
        incomeByMonth[month] += income;
    });

    // Sort  berdasarkan bulan
    const sortedIncomeByMonth = {};
    monthsInOrder.forEach((month, index) => {
        if (incomeByMonth[month]) {
            sortedIncomeByMonth[monthAbbreviations[index]] = incomeByMonth[month];
        }
    });

    return sortedIncomeByMonth;
}

// Function to fetch and process data, then render the chart
async function fetchDataAndRenderChart() {
    try {
        const data = await connectToData(url);

        // Calculate income per month
        const incomePerMonth = calculateIncomePerMonth(data);

        // Get canvas
        const ctx3 = document.getElementById('myChart3').getContext('2d');

        // Hapus chart sebelumnya jika ada
        if (window.myChart3 instanceof Chart) {
            window.myChart3.destroy();
        }
        
        // Buat line chart baru
        window.myChart3 = createLineChart(ctx3, Object.keys(incomePerMonth), Object.values(incomePerMonth));
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}

function createLineChart(ctx, labels, data) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Income',
                data: data,
                borderColor: 'rgba(0, 95, 177, 1)',
                backgroundColor: 'rgba(0, 95, 177, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                    text: 'Total Income per Month'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Income ($)'
                    }
                }
            },
            interaction: {
                mode: 'index', 
                intersect: false // Nonaktifkan intersect untuk memperbesar jangkauan tooltip
            }
        }
    });
}