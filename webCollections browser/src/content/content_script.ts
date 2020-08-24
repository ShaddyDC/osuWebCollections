import { browser, Runtime } from "webextension-polyfill-ts";
import { OperationType, Operation } from "../shared/backContComm";
import { DomStuffs } from "./dom_stuffs";

var port: Runtime.Port;
var dom: DomStuffs = new DomStuffs();

function backgroundHandler(message: Operation) {
    console.log("Received", message);

    switch (message.operation) {
        case OperationType.ready:
            console.log("Tab is ready!");
            break;
    
        default:
            break;
    }
}

function connect() {
    console.log("Attempting to connect to background...");

    port = browser.runtime.connect();
    port.onMessage.addListener(backgroundHandler);
}

function main() {
    console.log("Injected osu!collections!");

    dom.setUp();
    connect();
    dom.registerBeatmapChangeListener(()=>console.log("beatmap changed"));

    [].forEach(()=>console.log(""));
}

main();
