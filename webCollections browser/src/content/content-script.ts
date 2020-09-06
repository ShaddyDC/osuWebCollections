import { browser, Runtime } from "webextension-polyfill-ts";
import * as Background from "../shared/backContComm";
import { DomStuffs } from "./dom-stuffs";

var port: Runtime.Port;
var dom: DomStuffs = new DomStuffs();
var hostReady = false;

function backgroundHandler(message: Background.Operation): void {
    switch (message.operation) {
        case Background.OperationType.ready:
            console.log("Tab is ready!");
            break;

        case Background.OperationType.hostReady:
            hostReady = (message as Background.HostReadyOperation).ready;
            console.log(`Native host is ready ${hostReady}`);
            if(!hostReady) handleHostUnready();
            else loadCurrentMap();
            break;

        case Background.OperationType.collections:
            const collections = (message as Background.CollectionsOperation).collections;
            console.log("Available collections", collections);
            dom.setInputCollections(collections);
            break;

        case Background.OperationType.mapCheckResults:
            handleMapCollections(message as Background.MapCheckResultsOperation);
            break;
    
        default:
            console.warn("Unknown operation from native host!", message);
            break;
    }
}

function handleMapCollections(message: Background.MapCheckResultsOperation): void{
    if(message.mapId != currentMapId()) {
        console.log("Received mapCheckResults for different map (old?)", message);
        return;
    }
    console.log("Received mapCheckResults!", message);
    if(message.available && message.mapCollections){
        dom.setMapCollections(message.mapCollections);
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
    port.postMessage(new Background.MapCheckOperation(mapId));
}

function handleHostUnready(): void{
    dom.reset();
}

function connect(): void {
    console.log("Attempting to connect to background...");

    port = browser.runtime.connect();
    port.onMessage.addListener(backgroundHandler);
}

function main(): void {
    console.log("Injected osu!collections!");

    dom.removeCollectionCallback = removeCollection;
    dom.addCollectionCallback = addCollection;
    dom.setUp();
    connect();
    dom.registerBeatmapChangeListener(loadCurrentMap);
}

main();
