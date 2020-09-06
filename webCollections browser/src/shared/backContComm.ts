
export enum OperationType {
    ready,
    hostReady,
    collections,
    mapCheck,
    mapCheckResults,
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
