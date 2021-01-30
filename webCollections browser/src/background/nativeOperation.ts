import { CollectionMapsOperation } from "../shared/backContComm";

export enum NativeOperationType{
    multiPacket,
    ping,
    pong,
    error,
    status,
    exit,
    osuFolder,
    collections,
    mapCheck,
    collectionMaps,
}

export class NativeOperation{
    constructor(operation: NativeOperationType)
    {
        this.operation = operation;
    }

    operation!: NativeOperationType;
}

export class NativeMultiPacket extends NativeOperation{
    id!: number;
    data!: string;
    finished!: boolean;
}

export class NativeProxyOperation extends NativeOperation{
    constructor(operation: NativeOperationType, origin: number){
        super(operation);
        this.origin = origin;
    }
    origin: number;
}

export class NativeStatusOperation extends NativeOperation{
    status!: string;
}

export class NativeOsuFolderOperation extends NativeOperation{
    constructor(osuFolder: string)
    {
        super(NativeOperationType.osuFolder);
        this.osuFolder = osuFolder;
    }
    osuFolder: string;
}

export class NativeCollectionsOperation extends NativeOperation{
    collectionsJSON!: string;
}

export class NativeMapCheckOperation extends NativeOperation{
    constructor(mapId: string, origin: number)
    {
        super(NativeOperationType.mapCheck);
        this.mapId = mapId;
        this.origin = origin;
    }

    mapId: string;
    origin: number;
    available: boolean | undefined;
    mapCollectionsJSON: string | undefined;
}

export class NativeCollectionMapsRequestOperation extends NativeProxyOperation{
    constructor(collection: string | null, origin: number)
    {
        super(NativeOperationType.collectionMaps, origin);
        this.collection = collection;
    }
    collection: string | null;
}


export class NativeCollectionMapsOperation extends NativeOperation{
    origin!: number;
    collection!: string;
    collectionSize!: number;
    mapsJSON!: string;
}
