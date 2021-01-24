import { browser, Runtime } from "webextension-polyfill-ts";
import * as Background from "../shared/backContComm";

var port: Runtime.Port;
var hostReady = false;

function backgroundHandler(message: Background.Operation): void {
    switch (message.operation) {
        case Background.OperationType.ready:
            console.log("Tab is ready!");
            break;

        case Background.OperationType.hostReady:
            hostReady = (message as Background.HostReadyOperation).ready;
            console.log(`Native host is ready ${hostReady}`);
            break;

        case Background.OperationType.collections:
            const collections = (message as Background.CollectionsOperation).collections;
            console.log("Available collections", collections);
            updateCollections(collections);
            break;
    
        default:
            console.warn("Unknown operation from native host!", message);
            break;
    }
}

function updateCollections(collections: [string]): void {
    let list = document.getElementById("collections-list")!;
    list.innerHTML = "";
    collections.forEach(collection =>{
        let element = document.createElement("li");
        element.textContent = collection;
        list.appendChild(element);
    });
}

function connect(): void {
    console.log("Attempting to connect to background...");

    port = browser.runtime.connect();
    port.onMessage.addListener(backgroundHandler);
}

connect();
