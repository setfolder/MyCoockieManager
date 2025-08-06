// Save cookies as a file
document.getElementById("save").addEventListener("click", async () => {
    try {
        const cookies = await getCookiesForCurrentDomain();
        const blob = new Blob( [ JSON.stringify(cookies, null, 2) ], {type: "application/json"} );
        const url = URL.createObjectURL(blob);

        chrome.downloads.download(
        {
            url: url,
            filename: "cookies.json",
            saveAs: true
        },
        (downloadId) => {
            if (chrome.runtime.lastError) {
                showStatus("Error the file dowloading: " + chrome.runtime.lastError.message);
            }
        }
        );
    } catch (e) {
        showStatus("Error while getting cookies: " + e.message);
    }
});

// Show the file select
document.getElementById("loadFileBtn").addEventListener("click", ()=>{
    document.getElementById("loadFileInput").click();
});

// Load cookies from a file
document.getElementById("loadFileInput").addEventListener("change", event=>{
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
        try {
            const cookies = JSON.parse(reader.result);
            for (const cookie of cookies) {
                const domain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
                const path = cookie.path || "/";
                const url = (cookie.secure ? "https://" : "http://") + domain + path;
                const details = {
                    url: url,
                    name: cookie.name,
                    value: cookie.value,
                    path: path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite || undefined,
                    storeId: cookie.storeId || undefined
                };
                if ( !cookie.session && cookie.expirationDate ) {
                    details.expirationDate = cookie.expirationDate;
                }
                chrome.cookies.set(details, (res)=>{
                    if (chrome.runtime.lastError) {
                        console.warn(`Error the cookies setting "${cookie.name}":`, chrome.runtime.lastError.message);
                    }
                });
            };
            showStatus("Cookies are downloaded from the file");
        } catch (e) {
            showStatus("File parsing error: " + e.message);
        }
    };
    reader.readAsText(file);
});

// Load cookies from the text field
document.getElementById("loadTextBtn").addEventListener("click", ()=>{
    const text = document.getElementById("cookieInput").value.trim();
    try {
        const cookies = JSON.parse(text);
        for (const cookie of cookies) {
            const domain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
            const path = cookie.path || "/";
            const url = (cookie.secure ? "https://" : "http://") + domain + path;
            const details = {
                url: url,
                name: cookie.name,
                value: cookie.value,
                path: path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite || undefined,
                storeId: cookie.storeId || undefined
            };
            if ( !cookie.session && cookie.expirationDate ) {
                details.expirationDate = cookie.expirationDate;
            }
            chrome.cookies.set(details, (res)=>{
                if (chrome.runtime.lastError) {
                    console.warn(`Error the cookies setting "${cookie.name}":`, chrome.runtime.lastError.message);
                }
            });
        }
        showStatus("Cookies are downloaded from the text");
    } catch (e) {
        showStatus("Wrong JSON: " + e.message);
    }
});

// Messages field
const showStatus = (msg, error = false) => {
    const elm = document.getElementById("status");
    elm.textContent = msg;
    elm.style.color = error ? "red" : "green";
    setTimeout( () => elm.textContent = "", 4000 );
};

// Show cookies in the text field
document.getElementById("showCookiesBtn").addEventListener("click", async ()=>{
    try {
        const cookies = await getCookiesForCurrentDomain();
        const textArea = document.getElementById("cookieInput");
        textArea.value = JSON.stringify(cookies, null, 2);
    } catch (e) {
        showStatus("Error the cookies getting: " + e.message, true);
    }
});

// get second level domain
function getSecondLevelDomain(hostname) {
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length >= 2) {
        return parts.slice(-2).join('.');
    }
    return hostname;
};

// get cookies for this domain only
async function getCookiesForCurrentDomain() {
    const [ tab ] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const baseDomain = getSecondLevelDomain(url.hostname);
    const allCookies = await chrome.cookies.getAll({});
    return allCookies.filter( c =>
        c.domain === baseDomain ||
        c.domain === '.' + baseDomain ||
        c.domain.endsWith('.' + baseDomain)
    );
};
