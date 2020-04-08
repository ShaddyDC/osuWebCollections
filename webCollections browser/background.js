// connect to native
var nativePort = browser.runtime.connectNative("webCollections");

// tab ports
var ports = [];

var collectionsObject = null;
var ready = false;

// load osu path
var osuFolder = null;
loadSettings();

browser.storage.onChanged.addListener(loadSettings)

function loadSettings() {
  ready = false;
  browser.storage.local.get("osuFolder",
    items => {
      osuFolder = items.osuFolder;
      console.log(`osu folder set to ${osuFolder}`);
      if (osuFolder) {
        nativePort.postMessage({
          operation: "osuFolder",
          osuFolder: osuFolder
        });
      }
      sendToAllPorts({
        operation: "requireOsuFolder",
        requireOsuFolder: !osuFolder
      });
    });
}

function sendToAllPorts(obj) {
  ports.forEach(port => port.postMessage(obj));
}

/*
Listen for messages from the app.
*/
nativePort.onMessage.addListener((obj) => {
  if (obj.port != null) {
    console.log(`Redirecting ${obj["operation"]} to ${obj["port"]}`)
    ports[obj["port"]].postMessage(obj);
    return;
  }

  switch (obj["operation"]) {
    case "status":
      console.log("Status changed to " + obj["status"]);
      if(obj["status"] == "Ready"){
        ready = true;
        sendToAllPorts({
          operation: "ready"
        });
      }
      break;

    case "collections":
      collectionsObject = obj;
      collectionsObject["collections"] = JSON.parse(obj["collections"]);
      sendToAllPorts(obj);
      break;

    case "pong":
      console.log("Recieved response pong!");
      break;

    default:
      console.log(`Not handling ${obj["operation"].toString()} operation from native host`);
      console.log(obj);
      break;
  }
});

/*
On a click on the browser action, send the app a message.
*/
browser.browserAction.onClicked.addListener(() => {
  console.log("Pinging native host");
  nativePort.postMessage({ operation: "ping" });
});

// messages from content
function connected(port) {
  console.log("Connection from tab established: " + port.sender.tab.id)
  ports[port.sender.tab.id] = port;

  port.postMessage({
    operation: "connected"
  });

  if(ready){
    port.postMessage({
      operation: "ready"
    });
  }

  if (collectionsObject) {
    port.postMessage(collectionsObject);
  }

  if (!osuFolder) {
    port.postMessage({
      operation: "requireOsuFolder",
      requireOsuFolder: true
    });
  }

  // cs Message handler
  port.onMessage.addListener(function (obj) {
    if (obj.port != null && obj.port == "native") {
      if (!osuFolder) {
        console.log(`Not redirecting ${obj["operation"]} to native host due to no osuFolder`);
        return;
      }

      console.log(`Redirecting ${obj["operation"]} to native host`);
      obj["port"] = port.sender.tab.id;
      nativePort.postMessage(obj);
      return;
    }
    switch (obj["operation"]) {
      case "downloadMap":
        obj["port"] = port.sender.tab.id;
        downloadPacketHandler(obj);
        break;

      case "openSettings":
        console.log("Opening Options");
        browser.runtime.openOptionsPage();
        break;

      default:
        console.log(`Not handling ${obj["operation"]} operation from content port ${port.sender.tab.id}`);
        console.log(obj);
        break;
    }
  })
}

function finishedDownload(downloadItems, [originPort, setId]) {
  let downloadItem = downloadItems[0];
  console.log(`Finished Download "${downloadItem.filename}"! Sending to host...`);
  nativePort.postMessage({
    operation: "addMapFile",
    port: originPort,
    mapFile: downloadItem.filename,
    setId: setId
  });
}

function activeDownload(id, [originPort, setId]) {
  console.log(`Downloading with id ${id}`);
  let listener = function (downloadDelta) {
    if (downloadDelta.id == id && downloadDelta.state.current == "complete") {
      console.log("Complete. Searching Download...");
      browser.downloads.search({ id: id }).then(downloadItems => finishedDownload(downloadItems, [originPort, setId]));
      browser.downloads.onChanged.removeListener(listener);
    }
  };
  browser.downloads.onChanged.addListener(listener);
}

function downloadPacketHandler(obj) {
  console.log(`Downloading ${obj["mapFile"]} as "${obj["filename"]}"...`);
  let downloading = browser.downloads.download({
    url: obj["mapFile"],
    filename: obj["filename"],
    saveAs: false
  });
  downloading.then(
    id => activeDownload(id, [obj["port"], obj["setId"]]),
    function (error) {
      console.log(`Download failed ${error}`);
    }
  )
}

browser.runtime.onConnect.addListener(connected);

console.log("Loaded myself :)");


// Because osu only partly reloads the page on site changes, content-script needs to be notified
browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  if ("url" in changeInfo) {
    console.log("Reloading Tab", tabId, tabInfo);
    ports[tabId].postMessage({
      operation: "mapSwitch",
      url: tabInfo["url"]
    });
  }
}, {
  urls: ["*://osu.ppy.sh/beatmapsets/*"]
});
