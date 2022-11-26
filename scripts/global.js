let isDarkTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches;



document.addEventListener('DOMContentLoaded', () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    
    let useDarkTheme = params.theme ? params.theme == "dark" : isDarkTheme();
    document.querySelector('body').classList.add(useDarkTheme ? 'theme-dark' : 'theme-light');

    let tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
