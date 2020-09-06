import { browser, Runtime } from "webextension-polyfill-ts";
import { OperationType, Operation } from "../shared/backContComm";
import { DomStuffs } from "./dom-stuffs";

var port: Runtime.Port;
var dom: DomStuffs = new DomStuffs();

function backgroundHandler(message: Operation): void {
    console.log("Received", message);

    switch (message.operation) {
        case OperationType.ready:
            console.log("Tab is ready!");
            break;
    
        default:
            break;
    }
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
