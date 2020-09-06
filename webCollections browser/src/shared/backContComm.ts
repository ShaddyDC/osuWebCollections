
export enum OperationType {
    ready,
    hostReady,
    collections,
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



export class CollectionsOperation extends Operation{
    constructor(collections: [string])
    {
        super(OperationType.collections);
        this.collections = collections;
    }
    
    collections!: [string];
}
