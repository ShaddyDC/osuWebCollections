import { browser, Runtime } from "webextension-polyfill-ts";
import * as Ops from "./backContOps"

export class backgroundHandler{
    public connect(): void{
        this.port = browser.runtime.connect();
        this.port.onMessage.addListener((x)=>this.handleMessage(x));
    }

    private handleMessage(message: Ops.Operation): void{
        switch (message.operation) {
            case Ops.OperationType.ready:
                if(this.readyHandler) this.readyHandler();
                break;

            case Ops.OperationType.hostReady:
                if(this.hostReadyHandler) this.hostReadyHandler((message as Ops.HostReadyOperation).ready);
                break;

            case Ops.OperationType.collections:
                if(this.collectionsHandler) this.collectionsHandler((message as Ops.CollectionsOperation).collections);
                break;

            case Ops.OperationType.mapCheckResults:
                let check = message as Ops.MapCheckResultsOperation;
                if(this.mapCheckResultsHandler) this.mapCheckResultsHandler(check.mapId, check.available, check.mapCollections);
                break;

            case Ops.OperationType.collectionMaps:
                let colMaps = message as Ops.CollectionMapsOperation;
                if(this.collectionsMapsHandler) this.collectionsMapsHandler(colMaps.collection, colMaps.collectionSize, colMaps.maps);
                break;

            case Ops.OperationType.collectionMapAdd:
                const addM = message as Ops.CollectionMapAddOperation;
                if(this.collectionMapAddHandler) this.collectionMapAddHandler(addM.collection, addM.mapId);
                break;
    
            case Ops.OperationType.collectionMapRemove:
                const remM = message as Ops.CollectionMapRemoveOperation;
                if(this.collectionMapRemoveHandler) this.collectionMapRemoveHandler(remM.collection, remM.mapId);
                break;
            
        
            default:
                console.log("Unexpected operation", message);
                break;
        }
    }

    public postOperation(operation: Ops.Operation): void{
        this.port.postMessage(operation);
    }

    public readyHandler: (() => void) | undefined;
    public hostReadyHandler: ((ready: boolean) => void) | undefined;
    public collectionsHandler: ((collections: [string]) => void) | undefined;
    public mapCheckResultsHandler: ((mapId: string, available: boolean, collections: [string] | undefined) => void) | undefined;
    public collectionsMapsHandler: ((collection: string, size: number, maps: [Beatmap.Beatmap]) => void) | undefined;
    public collectionMapAddHandler: ((collection: string, mapId: string) => void) | undefined;
    public collectionMapRemoveHandler: ((collection: string, mapId: string) => void) | undefined;

    private port!: Runtime.Port;
}