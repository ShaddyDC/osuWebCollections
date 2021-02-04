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
    const mapId = currentMapId();
    console.log("Adding to collection", mapId, collection);
    if(!mapId) return;
    background.postOperation(new Background.CollectionMapAddOperation(collection, mapId));
}

function removeCollection(collection: string): void{
    const mapId = currentMapId();
    console.log("Removing from collection", mapId, collection);
    if(!mapId) return;
    background.postOperation(new Background.CollectionMapRemoveOperation(collection, mapId));
}

function collectionAddMapEvent(collection: string, mapId: string): void{
    if(currentMapId() != mapId) return;

    if(mapState.mapCollections?.indexOf(collection)) {
        console.log(`Couldn't add ${mapId} to collection ${collection} as it was already in collection`);
        return
    };

    mapState.mapCollections?.push(collection);
    dom.triggerUpdateNeeded();

    console.log(`Added ${mapId} to collection ${collection}`);
}

function collectionRemoveMapEvent(collection: string, mapId: string): void{
    if(currentMapId() != mapId) return;

    let index = mapState.mapCollections?.indexOf(collection);
    if(!index) {
        console.log(`Couldn't remove ${mapId} from collection ${collection} as collection wasn't found`);
        return
    };
    mapState.mapCollections?.splice(index, 1);
    dom.triggerUpdateNeeded();

    console.log(`Removed ${mapId} from collection ${collection}`);
}

function currentMapString(): string | undefined {
    let mapLink = document.getElementsByClassName("beatmapset-beatmap-picker__beatmap--active")[0] as HTMLLinkElement;
    return mapLink?.getAttribute("href") ?? "";
}

function currentMapId(): string | undefined{
    let tokens = currentMapString()?.split("/")
    return tokens?.[1];
}

function loadCurrentMap(): void{
    if(!mapState.hostReady) return;
    mapState.mapLoaded = false;
    dom.triggerUpdateNeeded();

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
    background.collectionMapAddHandler = collectionAddMapEvent; // TODO: Add these to collections page
    background.collectionMapRemoveHandler = collectionRemoveMapEvent;

    dom.removeCollectionCallback = removeCollection;
    dom.addCollectionCallback = addCollection;
    dom.start();
    dom.registerBeatmapChangeListener(loadCurrentMap);
    dom.collectionsPageCallback = ()=>background.postOperation(new Background.Operation(Background.OperationType.collectionsPageOpen));
    connect();
}

main();
