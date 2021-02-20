import { browser, Runtime } from "webextension-polyfill-ts";
import * as Content from "../shared/backContOps";
import * as Native from "./nativeOperation";

const ports: Array<Runtime.Port> = [];
let nativePort: Runtime.Port;
let osuFolder: string | null = null;
let collections: [string];
let hostReady: boolean = false;
let hostBroken: boolean = false;
const partialPackets = new Map<number, string>();

function sendToAllPorts(obj: Content.Operation): void {
  ports.forEach((port) => port.postMessage(obj));
}

function setReadyStatus(status: boolean): void {
  hostReady = status;
  sendToAllPorts(new Content.HostReadyOperation(status));
}

function loadSettings(): void {
  setReadyStatus(false);
  function loader(items: any) {
    osuFolder = items.osuFolder;
    console.log(`osuFolder set to ${osuFolder}`);

    if (osuFolder != null && osuFolder !== "") {
      sendToNative(new Native.OsuFolderOperation(osuFolder));
    }
  }

  browser.storage.local.get("osuFolder").then(loader);
}

function shareCollections(): void {
  sendToAllPorts(new Content.CollectionsOperation(collections));
}
function handleMapCheck(
  message: Content.MapCheckOperation,
  port: Runtime.Port
) {
  const origin = port.sender?.tab?.id;
  if (!origin) {
    console.warn("Map Check from unknown port", port, message);
    return;
  }

  console.log(`Map Check for ${message.mapId} from ${origin}`);
  sendToNative(new Native.MapCheckOperation(message.mapId, origin));
}

function contentHandler(message: Content.Operation, port: Runtime.Port): void {
  switch (message.operation) {
    case Content.OperationType.mapCheck:
      handleMapCheck(message as Content.MapCheckOperation, port);
      break;

    case Content.OperationType.collectionMaps:
      {
        const origin = port.sender?.tab?.id;
        if (!origin) {
          console.warn("collectionMaps from unknown port", port, message);
          return;
        }

        console.log(`collectionMaps from ${origin}`);
        const {
          collection,
        } = message as Content.CollectionMapsRequestOperation;
        sendToNative(
          new Native.CollectionMapsRequestOperation(collection, origin)
        );
      }
      break;

    case Content.OperationType.collectionsPageOpen:
      browser.tabs.create({
        url: "/src/collections_page/collections_page.html",
      });
      break;

    case Content.OperationType.collectionMapAdd:
      {
        const addM = message as Content.CollectionMapAddOperation;
        sendToNative(
          new Native.CollectionMapAddOperation(addM.collection, addM.mapId)
        );
      }
      break;

    case Content.OperationType.collectionMapRemove:
      {
        const remM = message as Content.CollectionMapRemoveOperation;
        sendToNative(
          new Native.CollectionMapRemoveOperation(remM.collection, remM.mapId)
        );
      }
      break;

    default:
      console.warn(
        `Unknown operation from port ${port.sender?.tab?.id}!`,
        message
      );
      break;
  }
}

function contentConnectHandler(port: Runtime.Port): void {
  console.log(
    `Connection from port ${port.name} with id ${port.sender?.id} at url ${port.sender?.url}`
  );

  if (port.sender?.tab?.id === undefined) {
    console.log("Sender is undefined");
    return;
  }
  ports[port.sender?.tab?.id] = port;
  port.onMessage.addListener(contentHandler);

  port.postMessage(new Content.Operation(Content.OperationType.ready));
  port.postMessage(new Content.HostReadyOperation(hostBroken));
  if (hostReady) {
    port.postMessage(new Content.HostReadyOperation(true));
    port.postMessage(new Content.CollectionsOperation(collections));
  }
}

function handleMapCheckResults(message: Native.MapCheckOperation): void {
  console.log(
    `Redirecting mapCheck results to port ${message.origin}`,
    message
  );

  let mapCollections;
  if (message.available && message.mapCollectionsJSON) {
    mapCollections = JSON.parse(message.mapCollectionsJSON);
  }

  ports[message.origin].postMessage(
    new Content.MapCheckResultsOperation(
      message.mapId,
      message.available!,
      mapCollections
    )
  );
}

function nativeHandlerImpl(message: Native.Operation): void {
  switch (message.operation) {
    case Native.OperationType.pong:
      console.log("Pong from native host!");
      break;

    case Native.OperationType.error:
      console.warn("Error on host", message);
      break;

    case Native.OperationType.status:
      {
        const status = message as Native.StatusOperation;
        console.log(`Native status: ${status.status}`);
      }
      break;

    case Native.OperationType.collections:
      collections = JSON.parse(
        (message as Native.CollectionsOperation).collectionsJSON
      );
      console.log("Updating collections", collections);
      setReadyStatus(true);
      shareCollections();
      break;

    case Native.OperationType.mapCheck:
      handleMapCheckResults(message as Native.MapCheckOperation);
      break;

    case Native.OperationType.collectionMaps:
      {
        const m = message as Native.CollectionMapsOperation;
        console.log(
          `Sending NativeOperationType for "${m.collection}" to ${m.origin}`
        );
        ports[m.origin].postMessage(
          new Content.CollectionMapsOperation(
            m.collection,
            m.collectionSize,
            JSON.parse(m.mapsJSON)
          )
        );
      }
      break;

    case Native.OperationType.collectionMapAdd:
      {
        const addM = message as Native.CollectionMapAddOperation;
        sendToAllPorts(
          new Content.CollectionMapAddOperation(
            addM.collection,
            addM.mapId.toString()
          )
        );
      }
      break;

    case Native.OperationType.collectionMapRemove:
      {
        const remM = message as Native.CollectionMapRemoveOperation;
        sendToAllPorts(
          new Content.CollectionMapRemoveOperation(
            remM.collection,
            remM.mapId.toString()
          )
        );
      }
      break;

    default:
      console.warn("Unknown operation from native host!", message);
      break;
  }
}

function unpackMessage(packet: Native.MultiPacket): void {
  console.log("Unpacking packet", packet);

  if (partialPackets.get(packet.id) == null) partialPackets.set(packet.id, "");

  partialPackets.set(packet.id, partialPackets.get(packet.id) + packet.data);

  if (packet.finished) {
    const data = partialPackets.get(packet.id);
    partialPackets.delete(packet.id);
    if (!data) {
      console.warn("Received invalid object", packet);
      return;
    }
    const obj = JSON.parse(data) as Native.CollectionsOperation;
    nativeHandlerImpl(obj);
  }
}

function nativeHandler(message: Native.Operation): void {
  if (message.operation === Native.OperationType.multiPacket) {
    unpackMessage(message as Native.MultiPacket);
  } else {
    nativeHandlerImpl(message);
  }
}

// function ping(): void {
//   console.log("Pinging native host");
//   sendToNative(new Native.Operation(Native.OperationType.ping));
// }

// function killNative(): void {
//   console.log("Killing native host");
//   sendToNative(new Native.Operation(Native.OperationType.exit));
// }

function sendToNative(obj: Native.Operation): void {
  try {
    nativePort.postMessage(obj);
  } catch (error) {
    console.error("Native Port disconnected!", error);
    setTimeout(connectNative, 1000);
  }
}

async function connectNative(): Promise<void> {
  browser.runtime.onConnect.addListener(contentConnectHandler);

  const application = "dev.shaddy.webcollections";
  nativePort = browser.runtime.connectNative(application);
  nativePort.onMessage.addListener(nativeHandler);

  try {
    console.log("Pinging Native Host to verify connection.");
    console.log(
      await browser.runtime.sendNativeMessage(
        application,
        new Native.Operation(Native.OperationType.ping)
      )
    );
    hostBroken = false;
    sendToAllPorts(new Content.HostBrokenOperation(hostBroken));
  } catch (error) {
    console.error("Couldn't connect to native host!", error);
    hostBroken = true;
    setReadyStatus((hostReady = false));
    sendToAllPorts(new Content.HostBrokenOperation(hostBroken));
    setTimeout(connectNative, 1000);
    return;
  }

  console.log("Connected to native port!");
}

async function main(): Promise<void> {
  console.log("Started osu!collections!");

  connectNative();

  // Open collections page when icon is clicked
  browser.browserAction.onClicked.addListener(() =>
    browser.tabs.create({ url: "/src/collections_page/collections_page.html" })
  );

  loadSettings();
  browser.storage.onChanged.addListener(loadSettings);
}

main();
