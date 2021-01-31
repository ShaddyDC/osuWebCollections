import { browser, Runtime } from "webextension-polyfill-ts";
import * as Content from "../shared/backContOps";
import * as Native from "./nativeOperation";

var ports : Array<Runtime.Port> = [];
var nativePort: Runtime.Port;
var osuFolder: string | null = null;
var collections: [string];
var hostReady: boolean = false;
var partialPackets = new Map<number, string>();

function loadSettings(): void{
    setReadyStatus(false);
    function loader(items: any){
        osuFolder = items.osuFolder;
        console.log(`osuFolder set to ${osuFolder}`);
        
        if(osuFolder != null && osuFolder != ""){
            nativePort.postMessage(new Native.NativeOsuFolderOperation(osuFolder));
        }        
    }

    browser.storage.local.get("osuFolder").then(loader);
}

function setReadyStatus(status: boolean): void{
    hostReady = status;
    sendToAllPorts(new Content.HostReadyOperation(status));
}

function shareCollections(): void{
    sendToAllPorts(new Content.CollectionsOperation(collections));
}

function contentConnectHandler(port: Runtime.Port): void{
    console.log(`Connection from port ${port.name} with id ${port.sender?.id} at url ${port.sender?.url}`);

    if(port.sender?.tab?.id == undefined){
        console.log("Sender is undefined");
        return;
    }
    ports[port.sender?.tab?.id] = port;
    port.onMessage.addListener(contentHandler);

    port.postMessage(new Content.Operation(Content.OperationType.ready));
    if(hostReady) {
        port.postMessage(new Content.HostReadyOperation(true));
        port.postMessage(new Content.CollectionsOperation(collections));
    }
}

function nativeHandler(message: Native.NativeOperation): void{
    switch (message.operation) {
        case Native.NativeOperationType.multiPacket:
            unpackMessage(message as Native.NativeMultiPacket);
            break;

        case Native.NativeOperationType.pong:
            console.log("Pong from native host!");
            break;

        case Native.NativeOperationType.error:
            console.warn("Error on host", message);
            break;

        case Native.NativeOperationType.status:
            let status = message as Native.NativeStatusOperation;
            console.log(`Native status: ${status.status}`);
            break;

        case Native.NativeOperationType.collections:
            collections = JSON.parse((message as Native.NativeCollectionsOperation).collectionsJSON);
            console.log("Updating collections", collections);
            setReadyStatus(true);
            shareCollections();
            break;

        case Native.NativeOperationType.mapCheck:
            handleMapCheckResults(message as Native.NativeMapCheckOperation);
            break;

        case Native.NativeOperationType.collectionMaps:
            const m = message as Native.NativeCollectionMapsOperation;
            console.log(`Sending NativeOperationType for "${m.collection}" to ${m.origin}`);
            ports[m.origin].postMessage(new Content.CollectionMapsOperation(m.collection, m.collectionSize, JSON.parse(m.mapsJSON)));
            break;
    
        default:
            console.warn("Unknown operation from native host!", message);
            break;
    }
}

function unpackMessage(packet: Native.NativeMultiPacket): void
{
    console.log("Unpacking packet", packet);

    if(partialPackets.get(packet.id) == null) partialPackets.set(packet.id, "");

    partialPackets.set(packet.id, partialPackets.get(packet.id) + packet.data);

    if(packet.finished){
        let data = partialPackets.get(packet.id);
        partialPackets.delete(packet.id);
        if(!data) {
            console.warn("Received invalid object", packet);
            return;   
        }
        let obj = JSON.parse(data) as Native.NativeCollectionsOperation;
        nativeHandler(obj);
    }
}

function contentHandler(message: Content.Operation, port: Runtime.Port): void{
    switch (message.operation) {
        case Content.OperationType.mapCheck:
            handleMapCheck(message as Content.MapCheckOperation, port);
            break;

        case Content.OperationType.collectionMaps:
            const origin = port.sender?.tab?.id;
            if(!origin){
                console.warn("collectionMaps from unknown port", port, message);
                return;
            }
        
            console.log(`collectionMaps from ${origin}`);
            let collection = (message as Content.CollectionMapsRequestOperation).collection;
            nativePort.postMessage(new Native.NativeCollectionMapsRequestOperation(collection, origin));
            break;

    
        default:
            console.warn(`Unknown operation from port ${port.sender?.tab?.id}!`, message);
            break;
    }
}

function handleMapCheckResults(message: Native.NativeMapCheckOperation): void{
    console.log(`Redirecting mapCheck results to port ${message.origin}`, message);

    let mapCollections = undefined;
    if(message.available && message.mapCollectionsJSON){
        mapCollections = JSON.parse(message.mapCollectionsJSON);
    }

    ports[message.origin].postMessage(new Content.MapCheckResultsOperation(
        message.mapId, message.available!, mapCollections
    ));
}

function handleMapCheck(message: Content.MapCheckOperation, port: Runtime.Port){
    const origin = port.sender?.tab?.id;
    if(!origin){
        console.warn("Map Check from unknown port", port, message);
        return;
    }

    console.log(`Map Check for ${message.mapId} from ${origin}`);
    nativePort.postMessage(new Native.NativeMapCheckOperation(message.mapId, origin));
}

function ping(): void{
    console.log("Pinging native host");
    nativePort.postMessage(new Native.NativeOperation(Native.NativeOperationType.ping));
}

function killNative(): void{
    console.log("Killing native host");
    nativePort.postMessage(new Native.NativeOperation(Native.NativeOperationType.exit));
}

function sendToAllPorts(obj: Content.Operation): void{
    ports.forEach(port => port.postMessage(obj));
}

function main(): void{
    console.log("Started osu!collections!");

    browser.runtime.onConnect.addListener(contentConnectHandler);

    nativePort = browser.runtime.connectNative("dev.shaddy.webcollections");
    nativePort.onMessage.addListener(nativeHandler);    
    console.log("Connected to native port!");

    // Ping host when icon is clicked
    browser.browserAction.onClicked.addListener(()=>browser.tabs.create({url: "collections_page/collections_page.html"}));

    loadSettings();
    browser.storage.onChanged.addListener(loadSettings);
}

main();
