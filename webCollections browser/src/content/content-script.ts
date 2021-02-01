import * as Background from "../shared/backContOps";
import { DomStuffs } from "./dom-stuffs";
import { backgroundHandler } from "../shared/backContHandler";
import { MapState } from "./map-state";

var background = new backgroundHandler();
var mapState = new MapState();
var dom: DomStuffs = new DomStuffs(mapState);


function handleCollections(collections: [string]){
    console.log("Available collections", collections);
    mapState.collections = collections;
    dom.triggerUpdateNeeded();
}

function handleHostReadiness(ready: boolean){
    mapState.hostReady = ready;
    dom.triggerUpdateNeeded();
    console.log(`Native host is ready ${mapState.hostReady}`);

    if(mapState.hostReady) loadCurrentMap();
}

function handleMapCollections(mapId: string, available: boolean, collections: [string] | undefined): void{
    if(mapId != currentMapId()) {
        console.log("Received mapCheckResults for different map (old?)", mapId);
        return;
    }
    console.log("Received mapCheckResults!", mapId, available, collections);

    mapState.mapLoaded = true;
    mapState.mapAvailable = available;
    mapState.mapCollections = collections;
    dom.triggerUpdateNeeded();
}

function addCollection(collection: string): void{
    // TODO
    console.log("Adding to collection", collection);
}

function removeCollection(collection: string): void{
    // TODO
    console.log("Removing from collection", collection);
}

function currentMapString(): string | null {
    let mapLink = document.getElementsByClassName("beatmapset-beatmap-picker__beatmap--active")[0] as HTMLLinkElement;
    return mapLink?.getAttribute("href") ?? "";
}

function currentMapId(): string | null{
    let tokens = currentMapString()?.split("/")
    if(!tokens || tokens.length < 2) return null;
    return tokens[1];
}

function loadCurrentMap(): void{
    if(!mapState.hostReady) return;
    console.log("In fact loading current song");
    mapState.mapLoaded = false;
    dom.triggerUpdateNeeded();

    console.log("still at it");
    const mapId = currentMapId();
    if(mapId){
        console.log(`Loading map ${mapId}`);
        background.postOperation(new Background.MapCheckOperation(mapId));
    } else {
        console.log("Couldn't get current map. Trying again soon.");
        setTimeout(loadCurrentMap, 100);
    }
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
    dom.start();
    dom.registerBeatmapChangeListener(loadCurrentMap);
    dom.collectionsPageCallback = ()=>background.postOperation(new Background.Operation(Background.OperationType.collectionsPageOpen));
    connect();
}

main();
