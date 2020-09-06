
export enum OperationType {
    ready,
    osuFolderStatus,
    collections,
}

export class Operation {
    constructor(operation: OperationType)
    {
        this.operation = operation;
    }

    operation!: OperationType;
}

export class OsuFolderStatusOperation extends Operation{
    constructor(loaded: boolean)
    {
        super(OperationType.osuFolderStatus);
        this.loaded = loaded;
    }
    
    loaded!: boolean;
}



export class CollectionsOperation extends Operation{
    constructor(collections: [string])
    {
        super(OperationType.collections);
        this.collections = collections;
    }
    
    collections!: [string];
}
