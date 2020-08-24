import { browser, Runtime } from "webextension-polyfill-ts";
import { OperationType, Operation } from "../shared/backContComm";

var ports : Array<Runtime.Port> = [];

function contentConnectHandler(port: Runtime.Port){
    console.log(`Connection from port ${port.name} with id ${port.sender?.id} at url ${port.sender?.url}`);

    if(port.sender?.tab?.id == undefined){
        console.log("Sender is undefined");
        return;
    }
    ports[port.sender?.tab?.id] = port;

    port.postMessage(new Operation(OperationType.ready));
}

function main(){
    console.log("Started osu!collections!");

    browser.runtime.onConnect.addListener(contentConnectHandler);
}

main();
