export enum NativeOperationType{
    ping,
    pong,
    error,
    status,
    exit,
    osuFolder,
    collections,
    mapCheck,
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
