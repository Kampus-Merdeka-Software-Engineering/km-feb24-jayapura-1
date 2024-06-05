function toggleSidebar() {
    const stylesheet = document.getElementById('stylesheet');
    if (stylesheet.getAttribute('href') === 'css/styles.css') {
        stylesheet.setAttribute('href', 'css/styles2.css');
    } else {
        stylesheet.setAttribute('href', 'css/styles.css');
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Buka link di tab baru pada tombol Source Code
    document.getElementById("our_project-source_code").onclick = function() {
        console.log("Tombol Source Code diklik");
        window.open("https://github.com/Kampus-Merdeka-Software-Engineering/km-feb24-jayapura-1");
    };

    // Buka link di tab baru pada tombol Dataset
    document.getElementById("our_project-dataset").onclick = function() {
        console.log("Tombol Source Code diklik");
        window.open("https://www.kaggle.com/datasets/awesomeasingh/vending-machine-sales");
    };
});