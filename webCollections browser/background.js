// connect to native
var nativePort = browser.runtime.connectNative("webCollections");

// tab ports
var ports = [];

var collectionsObject = null;

// load osu path
var osuFolder = null;
browser.storage.local.get("osuFolder", 
  items => {
    osuFolder = items.osuFolder;
    console.log(`osu folder set to ${osuFolder}`);
    if(osuFolder){
      nativePort.postMessage({
        operation: "osuFolder",
        osuFolder: osuFolder
      });
      sendToAllPorts({
        operation: "requireOsuFolder",
        requireOsuFolder: false
      });
    }
  });

// // Clear storage
// browser.storage.local.set({
//   osuFolder: null
// });


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
      break;

    case "collections":
      collectionsObject = obj;
      collectionsObject["collections"] = JSON.parse(obj["collections"]);
      sendToAllPorts(obj);
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
  obj = { operation: "ping" }
  console.log("Sending:  ");
  console.log(obj)
  nativePort.postMessage(obj);
});

// messages from content
function connected(port) {
  console.log("Connection from tab established: " + port.sender.tab.id)
  ports[port.sender.tab.id] = port;

  if(collectionsObject){
    port.postMessage(collectionsObject);
  }

  if(osuFolder == null){
    port.postMessage({
      operation: "requireOsuFolder",
      requireOsuFolder: true
    });
  }  

  // cs Message handler
  port.onMessage.addListener(function (obj) {
    if (obj.port != null && obj.port == "native") {
      if(osuFolder == null){
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

      case "osuFolder":
        osuFolder = obj["osuFolder"];
        console.log(`osu folder set to ${osuFolder}`);
        browser.storage.local.set({
          osuFolder: osuFolder
        });
        nativePort.postMessage(obj);
        sendToAllPorts({
          operation: "requireOsuFolder",
          requireOsuFolder: false
        });
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
