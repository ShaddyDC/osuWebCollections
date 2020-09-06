
export class DomStuffs{
    setUp(): void{
        if(document.getElementById("collections-container") == null)
            this.createCollectionsContainer();
        else this.reset();

        if(this.beatmapObserver) this.beatmapObserver.disconnect();

        this.beatmapObserver = new MutationObserver(()=> this.beatmapChangeCallback());
        let beatmapPicker = document.getElementsByClassName("beatmapset-beatmap-picker").item(0);
        if(beatmapPicker){
            this.beatmapObserver.observe(beatmapPicker, {attributes: true, subtree: true});
        }
    }

    clearInputCollections(): void{
        let inputList = document.getElementById("collections-input-list");
        if(inputList) inputList.innerHTML = "";
    }

    setInputCollections(collections: [string]): void{
        let inputList = document.getElementById("collections-input-list");
        if(!inputList) return;

        this.clearInputCollections();

        collections.forEach(collection => {
            let option = document.createElement("option");
            option.value = collection;
            inputList?.appendChild(option);
        });
    }

    private createCollectionsContainer(): void {
        // get mapsetinfo to insert data
        let mapsetInfo = document.getElementsByClassName("beatmapset-info").item(0);
        if(!mapsetInfo) return;
        if(mapsetInfo.childElementCount < 2) return;

        // container
        let container = document.createElement("div");
        container.className = "beatmapset-info__box beatmapset-info__box--meta";
        container.id = "collections-container";
        
        mapsetInfo.insertBefore(container, mapsetInfo.children[1]);

        // section + heading
        let section = document.createElement("div");
        container.appendChild(section);
        let heading = document.createElement("h3");
        heading.id = "collections-id";
        heading.className = "beatmapset-info__header";
        heading.innerText = "Collections";
        section.appendChild(heading);

        // prepare input
        let collectionsInput = document.createElement("input");
        collectionsInput.className = "quick-search-input__input js-click-menu--autofocus";

        let inputList = document.createElement("datalist");
        inputList.id = "collections-input-list";
        collectionsInput.appendChild(inputList);
        collectionsInput.setAttribute("list", "collections-input-list");

        collectionsInput.id = "collections-input";
        // collectionsInput.onkeydown = inputKeyDown;
        section.appendChild(collectionsInput);

        // actual list
        let collectionsList = document.createElement("div");
        collectionsList.id = "collections-list";
        section.appendChild(collectionsList);    
    }

    reset(): void{
        if(document.getElementById("collections-container") == null)
            return;

        this.clearInputCollections();

        let collectionsList = document.getElementById("collections-list");
        if(collectionsList) collectionsList.innerHTML = "";
    }

    private beatmapChangeCallback(): void{
        this.beatmapChangeCallbacks.forEach(
            callback => callback()
        );
    }

    registerBeatmapChangeListener(callback: ()=>void): void{
        this.beatmapChangeCallbacks.push(callback);
    }

    private beatmapObserver!: MutationObserver;
    private beatmapChangeCallbacks: Array<()=>void> = [];
}
