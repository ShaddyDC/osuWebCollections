
export enum OperationType {
    ready,
    osuFolderStatus,
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
