document.addEventListener('DOMContentLoaded', () => {
    let tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
