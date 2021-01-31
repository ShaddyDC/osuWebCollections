export class MapState{
    public hostReady = false;
    public mapLoaded = false;
    public mapAvailable = false;
    public collections: [string] | undefined = undefined;
    public mapCollections: [string] | undefined = undefined;
}