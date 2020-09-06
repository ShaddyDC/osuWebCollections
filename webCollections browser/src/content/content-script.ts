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
            if(!hostReady) handleHostUnready;
            break;

        case Background.OperationType.collections:
            const collections = (message as Background.CollectionsOperation).collections;
            console.log("Available collections", collections);
            dom.setInputCollections(collections);
            break;
    
        default:
            console.warn("Unknown operation from native host!", message);
            break;
    }
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

    dom.setUp();
    connect();
    dom.registerBeatmapChangeListener(()=>console.log("beatmap changed"));
}

main();
