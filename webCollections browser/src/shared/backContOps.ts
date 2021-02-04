
export enum OperationType {
    ready,
    hostReady,
    collectionsPageOpen,
    collections,
    mapCheck,
    mapCheckResults,
    collectionMaps,
    collectionMapAdd,
    collectionMapRemove,
}

export class Operation {
    constructor(operation: OperationType)
    {
        this.operation = operation;
    }

    operation!: OperationType;
}

export class HostReadyOperation extends Operation{
    constructor(loaded: boolean)
    {
        super(OperationType.hostReady);
        this.ready = loaded;
    }
    
    ready!: boolean;
}

export class MapCheckOperation extends Operation{
    constructor(mapId: string)
    {
        super(OperationType.mapCheck);
        this.mapId = mapId;
    }
    mapId: string;
}

export class MapCheckResultsOperation extends Operation{
    constructor(mapId: string, availability: boolean, mapCollections: [string] | undefined)
    {
        super(OperationType.mapCheckResults);
        this.mapId = mapId;
        this.available = availability;
        this.mapCollections = mapCollections;
    }
    mapId: string;
    available: boolean;
    mapCollections: [string] | undefined;
}

export class CollectionsOperation extends Operation{
    constructor(collections: [string])
    {
        super(OperationType.collections);
        this.collections = collections;
    }
    
    collections!: [string];
}

export class CollectionMapsRequestOperation extends Operation{
    constructor(collection: string | null)
    {
        super(OperationType.collectionMaps);
        this.collection = collection;
    }
    collection: string | null;
}

export class CollectionMapsOperation extends Operation{
    constructor(collection: string, collectionSize: number, maps: [Beatmap.Beatmap])
    {
        super(OperationType.collectionMaps);
        this.collection = collection;
        this.collectionSize = collectionSize;
        this.maps = maps;
    }
    collection: string;
    collectionSize: number;
    maps: [Beatmap.Beatmap];
}

export class CollectionMapAddOperation extends Operation{
    constructor(collection: string, mapId: string)
    {
        super(OperationType.collectionMapAdd);
        this.collection = collection;
        this.mapId = mapId;
    }
    collection: string;
    mapId: string;
}

export class CollectionMapRemoveOperation extends Operation{
    constructor(collection: string, mapId: string)
    {
        super(OperationType.collectionMapRemove);
        this.collection = collection;
        this.mapId = mapId;
    }
    collection: string;
    mapId: string;
}
