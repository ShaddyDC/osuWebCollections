export enum NativeOperationType{
    ping,
    pong,
    error,
    status,
    exit,
    
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
