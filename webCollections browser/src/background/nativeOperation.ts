export enum NativeOperationType{
    ping,
    pong,
    error,
    status,
    exit,
    osuFolder,
    collections,

}

export class NativeOperation{
    constructor(operation: NativeOperationType)
    {
        this.operation = operation;
    }

    operation!: NativeOperationType;
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
    getCollections(): [string]{
        return JSON.parse(this.collections);
    }
    collections!: string;
}
