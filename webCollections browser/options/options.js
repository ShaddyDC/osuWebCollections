function saveOptions(e) {
    browser.storage.local.set({
        osuFolder: document.querySelector("#osu-folder").value
      });
    
    e.preventDefault();
}

function restoreOptions() {
    var storageItem = browser.storage.local.get('osuFolder');
    storageItem.then((res) => {
        document.querySelector("#osu-folder").value = res.osuFolder;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
