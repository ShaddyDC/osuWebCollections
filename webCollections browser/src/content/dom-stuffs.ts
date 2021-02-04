import { MapState } from "./map-state";

export class DomStuffs{
    constructor(mapState: MapState){
        this.mapState = mapState;
    }

    public start(): void{
        setInterval(()=> this.updateInBeatmap(), 1000);
    }

    private setUp(): void{
        this.stateChanged = false;

        this.createCollectionsContainer();

        this.monitorDiffChange();
    }
    
    private monitorDiffChange() {
        if (this.beatmapObserver)
            this.beatmapObserver.disconnect();

        this.beatmapObserver = new MutationObserver(() => this.beatmapChangeCallback());
        let beatmapPicker = document.getElementsByClassName("beatmapset-beatmap-picker").item(0);
        if (beatmapPicker) {
            this.beatmapObserver.observe(beatmapPicker, { attributes: true, subtree: true });
        }
        else {
            console.warn("Couldn't place mutation observer to see beatmap changes!");
        }
    }

    private isLoaded(): boolean{
        return document.getElementById("collections-container") != null;
    }

    private updateInBeatmap(): void{
        let inBeatmap = document.getElementsByClassName("beatmaps_show").length > 0;
        if(inBeatmap && (this.stateChanged || !this.isLoaded())) this.setUp();
        
        this.insertColNav();
    }

    private clearInputCollections(): void{
        let inputList = document.getElementById("collections-input-list");
        if(inputList) inputList.innerHTML = "";
    }

    private setInputCollections(collections: [string]): void{
        let inputList = document.getElementById("collections-input-list");
        if(!inputList) return;

        this.clearInputCollections();

        collections.forEach(collection => {
            let option = document.createElement("option");
            option.value = collection;
            inputList?.appendChild(option);
        });
    }

    private clearMapCollections(): void{
        let collectionsList = document.getElementById("collections-list");
        if(collectionsList) collectionsList.innerHTML = "";
    }

    private setMapCollections(collections: [string]): void{
        let collectionsList = document.getElementById("collections-list");
        if(!collectionsList) return;


        let thisInstance = this;

        function createNode(collection: string): Array<HTMLElement>{
            let node = document.createElement("a");
            node.innerText = collection;
            node.onclick = () => {
                if(thisInstance.removeCollectionCallback){
                    thisInstance.removeCollectionCallback(collection);
                }
            };
            return [ node, document.createElement("br") ];
        }

        this.clearMapCollections();
        collections.forEach(collection =>{
            const nodes = createNode(collection);
            nodes.forEach(node => collectionsList?.appendChild(node));
        });
    }

    private createCollectionsContainer(): void {
        // get mapsetinfo to insert data
        let mapsetInfo = document.getElementsByClassName("beatmapset-info").item(0);
        if(!mapsetInfo) return;
        if(mapsetInfo.childElementCount < 2) return;

        console.log("Updating dom...");

        // container
        let container = document.getElementById("collections-container");
        if(container) container.innerHTML = "";
        else{
            container = document.createElement("div");
            container.className = "beatmapset-info__box beatmapset-info__box--meta u-fancy-scrollbar";
            container.id = "collections-container";
            mapsetInfo.insertBefore(container, mapsetInfo.children[1]);
            container.style.overflow = "scroll";
        }

        // section + heading
        let section = container.appendChild(document.createElement("div"));
        let heading = section.appendChild(document.createElement("h3"));
        heading.className = "beatmapset-info__header";
        heading.innerText = "Collections";

        if(!this.mapState.hostReady){
            let stateText = section.appendChild(document.createElement("p"));
            stateText.textContent = "Waiting for host...";
            return;
        }

        if(!this.mapState.mapLoaded){
            let stateText = section.appendChild(document.createElement("p"));
            stateText.textContent = "Loading song...";
            return;
        }

        if(!this.mapState.mapAvailable){
            let stateText = section.appendChild(document.createElement("p"));
            stateText.textContent = "Song not in downloaded";
            return;
        }

        // prepare input
        let collectionsInput = section.appendChild(document.createElement("input"));
        collectionsInput.className = "quick-search-input__input js-click-menu--autofocus";
        collectionsInput.id = "collections-input";
        collectionsInput.placeholder = "<collection>";
        collectionsInput.autocomplete = "on";

        let inputList = collectionsInput.appendChild(document.createElement("datalist"));
        inputList.id = "collections-input-list";
        collectionsInput.setAttribute("list", "collections-input-list");
        
        let inputButton = section.appendChild(document.createElement("button"));
        inputButton.textContent = "test";
        inputButton.onclick = () => {
            if(this.addCollectionCallback){
                this.addCollectionCallback(collectionsInput.value);
            }
        }

        // actual list
        let collectionsList = section.appendChild(document.createElement("div"));
        collectionsList.id = "collections-list";

        // Data
        if(this.mapState.collections) this.setInputCollections(this.mapState.collections);
        if(this.mapState.mapCollections) this.setMapCollections(this.mapState.mapCollections);
    }

    private reset(): void{
        if(document.getElementById("collections-container") == null)
            return;

        this.clearInputCollections();
        this.clearMapCollections();
    }

    private beatmapChangeCallback(): void{
        this.beatmapChangeCallbacks.forEach(
            callback => callback()
        );
    }

    private insertColNav(): void{
        if(document.getElementById("nav-collections-container")) return;

        let navbarCol = document.getElementsByClassName("nav2");
        if(navbarCol.length != 1){
            navbarCol = document.getElementsByClassName("landing-nav");

            if(navbarCol.length != 1){
                console.log("Couldn't get navbar");
                return;
            }
        }
        
        let navbar = navbarCol[0];
        if(navbar && navbar.childElementCount > 0) navbar = navbar.children[0];

        if(navbar.childElementCount < 3){
            console.log("Not enough navbar children");
            return;
        }

        let beatmaps = navbar.children[2];

        let collectionsContainer = beatmaps.insertAdjacentElement('afterend', document.createElement("div"));
        if(!collectionsContainer) return;

        collectionsContainer.id = "nav-collections-container";
        collectionsContainer.className = "nav2__col nav2__col--menu";

        let collectionsLink = collectionsContainer.appendChild(document.createElement("a"));
        collectionsLink.text = "Collections";
        collectionsLink.className = "nav2__menu-link-main js-menu";
        collectionsLink.addEventListener("click", ()=>{
            if(this.collectionsPageCallback) this.collectionsPageCallback();
        });
    }

    public triggerUpdateNeeded(){
        this.stateChanged = true;
    }

    registerBeatmapChangeListener(callback: ()=>void): void{
        this.beatmapChangeCallbacks.push(callback);
    }

    private beatmapObserver!: MutationObserver;
    private beatmapChangeCallbacks: Array<()=>void> = [];
    private stateChanged = true;
    private mapState: MapState;

    addCollectionCallback: ((collection: string)=>void) | undefined;
    removeCollectionCallback: ((collection: string)=>void) | undefined;
    collectionsPageCallback: (()=>void) | undefined;
}
