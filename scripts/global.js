let isDarkTheme = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("/serviceWorker.js")
    })
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    let useDarkTheme = params.theme ? params.theme == "dark" : isDarkTheme();
    document.querySelector('body').classList.add(useDarkTheme ? 'theme-dark' : 'theme-light');
    
    await updateOnlineStatus();
    setInterval(async () => {await updateOnlineStatus()}, 5000);

    async function updateOnlineStatus() {
        const offlineElement = document.getElementById("offline");
        const onlineElement = document.getElementById("online");
        const prevOnlineState = offlineElement.classList.contains("d-none");
        const isOnline = await checkOnlineStatus();

        if (!prevOnlineState && isOnline) {
            onlineElement.classList.remove("d-none");
            setTimeout(() => {
                onlineElement.classList.add("d-none");
            }, 2000)
        }

        if (isOnline) offlineElement.classList.add("d-none");
        else offlineElement.classList.remove("d-none");
    }

    let tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

async function checkOnlineStatus() {
    try {
        await fetch("https://google.com/", {
            mode: "no-cors"
        });
        return true;
    } catch (error) {
        return false;
    }
}
