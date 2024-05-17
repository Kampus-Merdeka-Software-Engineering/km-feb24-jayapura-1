function toggleSidebar() {
    const stylesheet = document.getElementById('stylesheet');
    if (stylesheet.getAttribute('href') === 'css/styles.css') {
        stylesheet.setAttribute('href', 'css/styles2.css');
    } else {
        stylesheet.setAttribute('href', 'css/styles.css');
    }
}
