import { browser, Runtime } from "webextension-polyfill-ts";
import * as Background from "../shared/backContOps";
import { backgroundHandler } from "../shared/backContHandler";

var port: Runtime.Port;
var background = new backgroundHandler();

function buildRequestCollection(collection: string){
    return function requestCollection(){
        console.log(`Requesting data for collection ${collection}`);
        background.postOperation(new Background.CollectionMapsRequestOperation(collection));
    }
}

function updateCollections(collections: [string]): void {
    console.log("Updating collections");

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

function collectionMaps(collection: string, size: number, maps: [Beatmap.Beatmap]): void{
    console.log(`Got collection "${collection}" with "${maps}"`);

    let sizeNode = document.getElementById(`li-${collection}-size`) as HTMLDivElement;
    sizeNode.textContent = size.toString();

    let list = document.getElementById(`li-${collection}-list`) as HTMLOListElement;
    list.innerHTML = "";
    let l = list.appendChild(document.createElement("ol"));
    l.classList.add("collapsed");
    maps.forEach(m =>{
        let x = l.appendChild(document.createElement("li"));
        x.textContent = m.Title;
    });

    let node = document.getElementById(`li-${collection}`) as HTMLLIElement;
    node.addEventListener("click", ()=>{
        l.classList.toggle("collapsed");
    });
}

function connect(): void {
    console.log("Attempting to connect to background...");

    background.connect();
}

background.readyHandler = ()=>{
    console.log("Tab is ready!");
    background.postOperation(new Background.CollectionMapsRequestOperation(null));
};

background.hostReadyHandler = (ready)=>console.log(`Native host is ready: ${ready}`);
background.collectionsHandler = updateCollections;
background.collectionsMapsHandler = collectionMaps;

connect();
