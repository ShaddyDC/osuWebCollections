import { browser, Runtime } from "webextension-polyfill-ts";
import * as Content from "../shared/backContComm";
import * as Native from "./nativeOperation";

var ports : Array<Runtime.Port> = [];
var nativePort: Runtime.Port;
var osuFolder: string | null = null;
var collections: [string];
var loaded: boolean = false;

function loadSettings(){
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

function setReadyStatus(status: boolean){
    loaded = status;
    sendToAllPorts(new Content.OsuFolderStatusOperation(status));
}

function shareCollections(){
    sendToAllPorts(new Content.CollectionsOperation(collections));
}

function contentConnectHandler(port: Runtime.Port){
    console.log(`Connection from port ${port.name} with id ${port.sender?.id} at url ${port.sender?.url}`);

    if(port.sender?.tab?.id == undefined){
        console.log("Sender is undefined");
        return;
    }
    ports[port.sender?.tab?.id] = port;

    port.postMessage(new Content.Operation(Content.OperationType.ready));
    if(loaded) {
        port.postMessage(new Content.OsuFolderStatusOperation(true));
        port.postMessage(new Content.CollectionsOperation(collections));
    }
}

function nativeHandler(message: Native.NativeOperation){
    switch (message.operation) {
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
            collections = JSON.parse((message as Native.NativeCollectionsOperation).collections);
            console.log("Updating collections", collections);
            setReadyStatus(true);
            shareCollections();
            break;
    
        default:
            console.warn("Unknown operation from native host!", message);
            break;
    }
}

function ping(){
    console.log("Pinging native host");
    nativePort.postMessage(new Native.NativeOperation(Native.NativeOperationType.ping));
}

function killNative(){
    console.log("Killing native host");
    nativePort.postMessage(new Native.NativeOperation(Native.NativeOperationType.exit));
}

function sendToAllPorts(obj: Content.Operation){
    ports.forEach(port => port.postMessage(obj));
}

function main(){
    console.log("Started osu!collections!");

    browser.runtime.onConnect.addListener(contentConnectHandler);

    nativePort = browser.runtime.connectNative("dev.shaddy.webcollections");
    nativePort.onMessage.addListener(nativeHandler);    
    console.log("Connected to native port!");

    // Ping host when icon is clicked
    browser.browserAction.onClicked.addListener(killNative);

    loadSettings();
    browser.storage.onChanged.addListener(loadSettings);
}

main();
