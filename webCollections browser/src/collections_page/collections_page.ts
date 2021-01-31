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
        element.id = `li-${collection}`;

        let section = element.appendChild(document.createElement("div"));

        let collectionName = section.appendChild(document.createElement("p"));
        collectionName.textContent = collection;
        collectionName.style.display = "inline";

        let collectionSize = section.appendChild(document.createElement("p"));
        collectionSize.id = `li-${collection}-size`;
        collectionSize.style.display = "inline";
        collectionSize.style.margin = "3ch";

        let button = section.appendChild(document.createElement("button"));
        button.textContent = "request collection";
        button.addEventListener("click", buildRequestCollection(collection));
        button.style.display = "inline";

        let mapList = section.appendChild(document.createElement("ol"));
        mapList.id = `li-${collection}-list`;
        mapList.classList.add("collapsed");

        collectionName.addEventListener("click", ()=>{
            mapList.classList.toggle("collapsed");
        });
    });
}

function modeToString(m: number): string | null{
    switch (m) {
        case 0: return "osu";
        case 1: return "taiko";
        case 2: return "fruits";
        case 3: return "mania";    
        default: return null;;
    }
}

function collectionMaps(collection: string, size: number, maps: [Beatmap.Beatmap]): void{
    console.log(`Got collection "${collection}" with "${maps}"`);

    let sizeNode = document.getElementById(`li-${collection}-size`) as HTMLDivElement;
    sizeNode.textContent = `(${size})`;

    let list = document.getElementById(`li-${collection}-list`) as HTMLOListElement;
    list.innerHTML = "";
    maps.forEach(m =>{
        let listElement = list.appendChild(document.createElement("li"));
        let listLink = listElement.appendChild(document.createElement("a"));
        listLink.textContent = `${m.Artist} - ${m.Title} [${m.Difficulty}]`;
        listLink.href = `https://osu.ppy.sh/beatmapsets/${m.BeatmapSetId}#${modeToString(m.Ruleset)}/${m.BeatmapId}`;

        let uid = `${collection}/${m.BeatmapSetId}/${m.BeatmapId}`;
        listLink.addEventListener("mouseover", ()=>{
            let preview = document.getElementById(uid) as HTMLIFrameElement;
            if(!preview) {
                preview = listLink.appendChild(document.createElement("iframe"));
                preview.id = uid;
                preview.classList.add("cover-preview");
                preview.src = `https://assets.ppy.sh/beatmaps/${m.BeatmapSetId}/covers/cover.jpg`; 
            }
            preview.style.display = "inherit";
        });

        listLink.addEventListener("mouseout", ()=>{
            let preview = document.getElementById(uid) as HTMLIFrameElement;
            if(!preview) return;
            preview.style.display = "none";
        });
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
