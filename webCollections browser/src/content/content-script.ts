import * as Background from "../shared/backContOps";
import { DomStuffs } from "./dom-stuffs";
import { backgroundHandler } from "../shared/backContHandler";

var background = new backgroundHandler();
var dom: DomStuffs = new DomStuffs();
var hostReady = false;

function handleCollections(collections: [string]){
    console.log("Available collections", collections);
    dom.setInputCollections(collections);
}

function handleHostReadiness(ready: boolean){
    hostReady = ready;
    console.log(`Native host is ready ${hostReady}`);
    if(!hostReady) handleHostUnready();
    else loadCurrentMap();
}

function handleMapCollections(mapId: string, available: boolean, collections: [string] | undefined): void{
    if(mapId != currentMapId()) {
        console.log("Received mapCheckResults for different map (old?)", mapId);
        return;
    }
    console.log("Received mapCheckResults!", mapId);
    if(available && collections){
        dom.setMapCollections(collections);
    }
}

function addCollection(collection: string): void{
    // TODO
    console.log("Adding to collection", collection);
}

function removeCollection(collection: string): void{
    // TODO
    console.log("Removing from collection", collection);
}

function currentMapString(): string{
    let mapLink = document.getElementsByClassName("beatmapset-beatmap-picker__beatmap--active")[0] as HTMLLinkElement;
    return mapLink.getAttribute("href") ?? "";
}

function currentMapId(): string{
    return currentMapString().split("/")[1];
}

function loadCurrentMap(): void{
    if(!hostReady) return;

    const mapId = currentMapId();
    console.log(`Loading map ${mapId}`);
    background.postOperation(new Background.MapCheckOperation(mapId));
}

function handleHostUnready(): void{
    dom.reset();
}

function connect(): void {
    console.log("Attempting to connect to background...");

    background.connect();
}

function main(): void {
    console.log("Injected osu!collections!");
    
    background.readyHandler = ()=>console.log("Tab is ready");
    background.hostReadyHandler = handleHostReadiness;
    background.collectionsHandler = handleCollections;
    background.mapCheckResultsHandler = handleMapCollections;

    dom.removeCollectionCallback = removeCollection;
    dom.addCollectionCallback = addCollection;
    dom.setUp();
    connect();
    dom.registerBeatmapChangeListener(loadCurrentMap);
}

main();
