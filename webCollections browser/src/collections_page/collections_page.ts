import { browser, Runtime } from "webextension-polyfill-ts";
import * as Background from "../shared/backContComm";

var port: Runtime.Port;
var hostReady = false;

function backgroundHandler(message: Background.Operation): void {
    switch (message.operation) {
        case Background.OperationType.ready:
            console.log("Tab is ready!");

            // Not copied!!
            port.postMessage(new Background.CollectionMapsRequestOperation(null));

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

        case Background.OperationType.collectionMaps:
            const m = message as Background.CollectionMapsOperation;
            console.log(`Got collection "${m.collection}" with "${m.maps}"`);

            let sizeNode = document.getElementById(`li-${m.collection}-size`) as HTMLDivElement;
            sizeNode.textContent = m.collectionSize.toString();

            let list = document.getElementById(`li-${m.collection}-list`) as HTMLOListElement;
            list.innerHTML = "";
            let l = list.appendChild(document.createElement("ol"));
            l.classList.add("collapsed");
            m.maps.forEach(m =>{
                let x = l.appendChild(document.createElement("li"));
                x.textContent = m.Title;
            });

            let node = document.getElementById(`li-${m.collection}`) as HTMLLIElement;
            node.addEventListener("click", ()=>{
                l.classList.toggle("collapsed");
            });

            break;
    
        default:
            console.warn("Unknown operation from native host!", message);
            break;
    }
}

function buildRequestCollection(collection: string){
    return function requestCollection(){
        console.log(`Requesting data for collection ${collection}`);
        port.postMessage(new Background.CollectionMapsRequestOperation(collection));
    }
}


function updateCollections(collections: [string]): void {
    let list = document.getElementById("collections-list")!;
    list.innerHTML = "";
    collections.forEach(collection =>{


        let element = list.appendChild(document.createElement("li"));
        element.textContent = collection;
        element.id = `li-${collection}`;

        element.appendChild(document.createElement("div")).textContent = " - ";

        element.appendChild(document.createElement("div")).id = `li-${collection}-size`;

        let button = element.appendChild(document.createElement("button"));
        button.textContent = "request collection";
        button.addEventListener("click", buildRequestCollection(collection));

        element.appendChild(document.createElement("ol")).id = `li-${collection}-list`;
    });
}

function connect(): void {
    console.log("Attempting to connect to background...");

    port = browser.runtime.connect();
    port.onMessage.addListener(backgroundHandler);
}

connect();
