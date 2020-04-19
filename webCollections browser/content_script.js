var collections = [];
var mapCollections = [];
var port;
var mapExistence = null;
var downloading = false;
var requireOsuFolder = false;
var connector = null;

function getBeatmap() {
    return JSON.parse(document.getElementById("json-beatmapset").text);
}

function createFilename() {
    let bm = getBeatmap();
    return `${bm.id} ${bm.artist} - ${bm.title}.osz`;
}

function hashToId(hash){
    let matches = hash.match(/#?(osu|mania|taiko|fruits)\/(\d+)/);
    if (matches == null || matches.length != 3) {
        console.log("mapId not found");
        return null;
    }

    let id = matches[2];
    return id;
}

function getMapId() {
    return hashToId(window.location.hash);
    
}

function getSetId(){
    return getBeatmap().id;
}

function updateMapCollections() {
    function createNode(name) {
        let node = document.createElement("a");
        node.innerText = name;
        node.onclick = function () {
            console.log("Clicked " + node.innerText);
            let obj = {
                operation: "removeMapCollection",
                mapId: getMapId(),
                port: "native",
                collection: node.innerText
            };
            port.postMessage(obj);
        };
        return node;
    }

    // Input field
    let collectionsInput = document.getElementById("collections-input");
    if(mapExistence == null){
        collectionsInput.placeholder = "loading...";
        collectionsInput.readOnly = true;
    }else if(mapExistence){
        collectionsInput.placeholder = "<add collection>";
        collectionsInput.readOnly = false;
    }else{
        collectionsInput.placeholder = downloading ? "<downloading...>" : "<not available>";
        collectionsInput.readOnly = false;
    }

    // clear list
    let nodeList = document.getElementById("node-list");
    nodeList.innerHTML = "";

    // Add elements
    // Todo: Deal with too long list
    mapCollections.forEach(element => {
        nodeList.appendChild(createNode(element));
        nodeList.appendChild(document.createElement("br"));
    });
}

function updateCollectionsList() {
    let collectionsList = document.getElementById("collections-list");
    if (collectionsList == null) return;
    collectionsList.innerHTML = "";
    collections.forEach(element => {
        let option = document.createElement("option");
        option.value = element;
        collectionsList.appendChild(option);
    });
}

function inputKeyDown(event) {
    let collectionsInput = document.getElementById("collections-input");
    if (event.keyCode == 13 && !mapCollections.includes(collectionsInput.value)) {   //13 is enter key
        if (mapExistence) {
            let obj = {
                operation: "addMapCollection",
                mapId: getMapId(),
                port: "native",
                collection: collectionsInput.value
            };
            port.postMessage(obj);
            collectionsInput.value = "";
        }
        else {
            let dlURL = document.location.origin + document.location.pathname + "/download";
            let filename = createFilename();
            console.log(`Sending ${dlURL} to background script for download as "${filename}"`); //Todo: Login Check
            port.postMessage({
                operation: "downloadMap",
                mapFile: dlURL,
                filename: filename,
                setId: getSetId()
            });
        }
    }
}

function handleDiffSwitch(hash){
    mapExistence = null;
    downloading = false;
    mapCollections = [];
    setupDomModifications();
    loadMap(hashToId(hash));
}

function loadUrl(url){
    let hash = url.split("#")[1];
    if(hash){
        handleDiffSwitch(hash);
    }
}

function cleanupOldDom(){
    let infoContainer = document.getElementById("collections-container");
    if(infoContainer != null){
        console.log("DOM already modified. Deleting");
        infoContainer.remove();
    }

    let pathButton = document.getElementById("path-button");
    if(pathButton != null){
        console.log("Deleting path button");
        pathButton.remove();
    }
}

function setupDomModifications() {
    console.log("Modifying DOM");

    // Already existing
    cleanupOldDom();

    // Finding html modification point
    let mapInfo = document.getElementsByClassName("beatmapset-info")[0];
    let infoContainer = document.createElement("div");
    infoContainer.className = "beatmapset-info__box beatmapset-info__box--meta";
    infoContainer.id = "collections-container";
    mapInfo.insertBefore(infoContainer, mapInfo.children[1]);   //Todo: mapInfo may be undefined???

    let section = document.createElement("div");
    infoContainer.appendChild(section);
    let heading = document.createElement("h3");
    heading.id = "collections-id";
    heading.className = "beatmapset-info__header";
    heading.innerText = "Collections";
    section.appendChild(heading);

    // prepare input
    let collectionsInput = document.createElement("input");
    collectionsInput.className = "quick-search-input__input js-click-menu--autofocus";
    let collectionsList = document.createElement("datalist");
    collectionsList.id = "collections-list";
    collectionsInput.setAttribute("list", "collections-list");
    collectionsInput.id = "collections-input";
    collectionsInput.onkeydown = inputKeyDown;
    section.appendChild(collectionsInput);
    collectionsInput.appendChild(collectionsList);

    // actual list
    let nodeList = document.createElement("div");
    nodeList.id = "node-list";
    section.appendChild(nodeList);

    // Update Map Data
    updateMapCollections();

    // In case we don't know the osu folder
    if(requireOsuFolder){
        console.log("Showing folder button instead");
        infoContainer.hidden = true;
        let pathButton = document.createElement("button");
        pathButton.id = "path-button";
        pathButton.className = "btn-osu-big btn-osu-big--beatmapset-header";
        pathButton.onclick = openOptions;
        mapInfo.insertBefore(pathButton, mapInfo.children[1]);
        pathButton.textContent = "SetFolder";
    }
}

function openOptions(){
    console.log("Requesting Options");
    port.postMessage({
        operation: "openSettings"
    });
}

function messageHandler(obj) {
    switch (obj["operation"]) {
        case "collections":
            collections = obj["collections"];
            updateCollectionsList();
            console.log("available collections: " + collections.toString());
            break;

        case "mapExistence":    //TOdo: Sometimes goes missing between background and native host
            console.log("Map available: " + obj["mapExistence"]);
            if (getMapId() == obj["mapId"]) {
                mapExistence = obj["mapExistence"];
                updateMapCollections();
                if(mapExistence){
                    port.postMessage({
                        operation: "mapCollections",
                        port: "native",
                        mapId: getMapId()
                    });
                }
            }
            break;

        case "addMapCollection":
            {
                if (getMapId() == obj["mapId"]) {
                    let collection = obj["collection"];
                    mapCollections.push(collection);
                    updateMapCollections();
                }
                break;
            }

        case "removeMapCollection":
            {
                if (getMapId() == obj["mapId"]) {
                    let collection = obj["collection"];
                    mapCollections = mapCollections.filter(item => item != collection);
                    updateMapCollections();
                }
                break;
            }

        case "addMapFile":
            if (getSetId() == obj["setId"]) {
                console.log("Added map to database!");
                mapExistence = true;
            }
            break;

        case "mapCollections":
            if (getMapId() == obj["mapId"]) {
                console.log("Map is in collections " + obj["mapCollections"].toString());
                mapCollections = JSON.parse(obj["mapCollections"]);
                updateMapCollections();
            }
            break;

        case "requireOsuFolder":
            console.log("Require osu folder: " + obj["requireOsuFolder"]);
            requireOsuFolder = obj["requireOsuFolder"];
            setupDomModifications();
            if(!requireOsuFolder){
                loadCurrentMap();
            }
            break;

        case "mapSwitch":
            console.log("mapSwitch");
            loadUrl(obj["url"]);
            break;

        case "connected":
            console.log("Connected!");
            clearInterval(connector);
            break;


        case "ready":
            console.log("Background is ready!");
            loadCurrentMap();
            break;

        default:
            console.log(`Not handling received operation ${obj["operation"]}`);
            console.log(obj);
            break;
    }
}

function loadMap(id){
    if(requireOsuFolder || id == null) return;

    console.log(`Loading map ${id}`);
    if (id) {
        port.postMessage({
            operation: "mapExistence",
            port: "native",
            mapId: id
        });
    }
}

function loadCurrentMap() {
    loadMap(getMapId());
}

function connect(){
    console.log("connecting...");
    port = browser.runtime.connect({ name: "port-from-cs" });
    port.onMessage.addListener(messageHandler);
}

function main() {
    console.log("Injected! :)");

    connector = setInterval(connect, 100);

    setupDomModifications();
}

main();
