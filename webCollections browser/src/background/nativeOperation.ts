export enum OperationType{
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
    collectionMapAdd,
    collectionMapRemove,
}

export class Operation{
    constructor(operation: OperationType)
    {
        this.operation = operation;
    }

    operation!: OperationType;
}

export class MultiPacket extends Operation{
    id!: number;
    data!: string;
    finished!: boolean;
}

export class ProxyOperation extends Operation{
    constructor(operation: OperationType, origin: number){
        super(operation);
        this.origin = origin;
    }
    origin: number;
}

export class StatusOperation extends Operation{
    status!: string;
}

export class OsuFolderOperation extends Operation{
    constructor(osuFolder: string)
    {
        super(OperationType.osuFolder);
        this.osuFolder = osuFolder;
    }
    osuFolder: string;
}

export class CollectionsOperation extends Operation{
    collectionsJSON!: string;
}

export class MapCheckOperation extends Operation{
    constructor(mapId: string, origin: number)
    {
        super(OperationType.mapCheck);
        this.mapId = mapId;
        this.origin = origin;
    }

    mapId: string;
    origin: number;
    available: boolean | undefined;
    mapCollectionsJSON: string | undefined;
}

export class CollectionMapsRequestOperation extends ProxyOperation{
    constructor(collection: string | null, origin: number)
    {
        super(OperationType.collectionMaps, origin);
        this.collection = collection;
    }
    collection: string | null;
}


export class CollectionMapsOperation extends Operation{
    origin!: number;
    collection!: string;
    collectionSize!: number;
    mapsJSON!: string;
}

export class CollectionMapAddOperation extends Operation{
    constructor(collection: string, mapId: string)
    {
        super(OperationType.collectionMapAdd);
        this.collection = collection;
        this.mapId = Number(mapId) || -1;
    }
    collection: string;
    mapId: number;
}

export class CollectionMapRemoveOperation extends Operation{
    constructor(collection: string, mapId: string)
    {
        super(OperationType.collectionMapRemove);
        this.collection = collection;
        this.mapId = Number(mapId) || -1;
    }
    collection: string;
    mapId: number;
}
