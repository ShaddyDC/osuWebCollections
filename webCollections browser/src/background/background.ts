import { browser, Runtime } from "webextension-polyfill-ts";
import { OperationType, Operation } from "../shared/backContComm";

var ports : Array<Runtime.Port> = [];
var nativePort: Runtime.Port;

function contentConnectHandler(port: Runtime.Port){
    console.log(`Connection from port ${port.name} with id ${port.sender?.id} at url ${port.sender?.url}`);

    if(port.sender?.tab?.id == undefined){
        console.log("Sender is undefined");
        return;
    }
    ports[port.sender?.tab?.id] = port;

    port.postMessage(new Operation(OperationType.ready));
}

function nativeHandler(message: any){
    console.log("Host message", message);
}

function ping(){
    nativePort.postMessage({operation: "ping"});
}

function main(){
    console.log("Started osu!collections!");

    browser.runtime.onConnect.addListener(contentConnectHandler);

    nativePort = browser.runtime.connectNative("dev.shaddy.webcollections");
    nativePort.onMessage.addListener(nativeHandler);
    
    console.log("Connected to native port!");
}

main();
