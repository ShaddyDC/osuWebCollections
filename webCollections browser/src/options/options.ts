import { browser } from "webextension-polyfill-ts";

function saveOptions(e: Event) {
    let input = document.querySelector("#osu-folder") as HTMLInputElement;

    browser.storage.local.set({
        osuFolder: input.value
      });
    
    e.preventDefault();
}

function restoreOptions() {
    let input = document.querySelector("#osu-folder") as HTMLInputElement;

    browser.storage.local.get('osuFolder')
        .then(res => {
            input.value = res.osuFolder;
        });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form")?.addEventListener("submit", saveOptions);
