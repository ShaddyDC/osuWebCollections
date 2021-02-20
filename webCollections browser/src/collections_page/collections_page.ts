import * as Background from "../shared/backContOps";
import BackgroundHandler from "../shared/backContHandler";
import { Beatmap } from "../shared/beatmap";

const background = new BackgroundHandler();

function buildRequestCollection(collection: string) {
  return function requestCollection() {
    console.log(`Requesting data for collection ${collection}`);
    background.postOperation(
      new Background.CollectionMapsRequestOperation(collection)
    );
  };
}

function updateCollections(collections: [string]): void {
  console.log("Updating collections");

  const list = document.getElementById("collections-list")!;
  list.innerHTML = "";
  collections.forEach((collection) => {
    const element = list.appendChild(document.createElement("li"));
    element.id = `li-${collection}`;

    const section = element.appendChild(document.createElement("div"));

    const collectionName = section.appendChild(document.createElement("p"));
    collectionName.textContent = collection;
    collectionName.style.display = "inline";

    const collectionSize = section.appendChild(document.createElement("p"));
    collectionSize.id = `li-${collection}-size`;
    collectionSize.style.display = "inline";
    collectionSize.style.margin = "3ch";

    const button = section.appendChild(document.createElement("button"));
    button.textContent = "(Re)Load collection";
    button.addEventListener("click", buildRequestCollection(collection));
    button.style.display = "inline";

    const mapList = section.appendChild(document.createElement("ol"));
    mapList.id = `li-${collection}-list`;
    mapList.classList.add("collapsed");

    collectionName.addEventListener("click", () => {
      mapList.classList.toggle("collapsed");
    });
  });
}

function modeToString(m: number): string | null {
  switch (m) {
    case 0:
      return "osu";
    case 1:
      return "taiko";
    case 2:
      return "fruits";
    case 3:
      return "mania";
    default:
      return null;
  }
}

function collectionMaps(
  collection: string,
  size: number,
  maps: [Beatmap]
): void {
  console.log(`Got collection "${collection}" with "${maps}"`);

  const sizeNode = document.getElementById(
    `li-${collection}-size`
  ) as HTMLDivElement;
  sizeNode.textContent = `${size}`;

  const list = document.getElementById(
    `li-${collection}-list`
  ) as HTMLOListElement;
  list.innerHTML = "";
  maps.forEach((m) => {
    const listElement = list.appendChild(document.createElement("li"));
    const listLink = listElement.appendChild(document.createElement("a"));
    listLink.textContent = `${m.Artist} - ${m.Title} [${m.Difficulty}]`;
    listLink.href = `https://osu.ppy.sh/beatmapsets/${
      m.BeatmapSetId
    }#${modeToString(m.Ruleset)}/${m.BeatmapId}`;

    const uid = `${collection}/${m.BeatmapSetId}/${m.BeatmapId}-preview`;
    listLink.addEventListener("mouseover", () => {
      let preview = document.getElementById(uid) as HTMLIFrameElement;
      if (!preview) {
        preview = listLink.appendChild(document.createElement("iframe"));
        preview.id = uid;
        preview.classList.add("cover-preview");
        preview.src = `https://assets.ppy.sh/beatmaps/${m.BeatmapSetId}/covers/cover.jpg`;
      }
      preview.style.display = "inherit";
    });

    listLink.addEventListener("mouseout", () => {
      const preview = document.getElementById(uid) as HTMLIFrameElement;
      if (!preview) return;
      preview.style.display = "none";
    });
  });
}

function collectionAddMapEvent(collection: string, mapId: string): void {
  console.log(`Added ${mapId} to collection ${collection}`);

  // Get size
  const sizeNode = document.getElementById(
    `li-${collection}-size`
  ) as HTMLDivElement;
  const size = Number(sizeNode.textContent);

  // Unfortunately we don't have all information to populate the list entry
  // If collection is sufficiently small, we just reload it
  // TODO: Flag as outdated otherwise
  if (size <= 100) {
    background.postOperation(
      new Background.CollectionMapsRequestOperation(collection)
    );
  }
}

function collectionRemoveMapEvent(collection: string, mapId: string): void {
  console.log(`Removed ${mapId} from collection ${collection}`);

  // Get size
  const sizeNode = document.getElementById(
    `li-${collection}-size`
  ) as HTMLDivElement;
  const size = Number(sizeNode.textContent);

  // We theoretically have the information to update this, but I don't want to have it asymmetric
  // If collection is sufficiently small, we just reload it
  // TODO: Flag as outdated otherwise
  if (size <= 100) {
    background.postOperation(
      new Background.CollectionMapsRequestOperation(collection)
    );
  }
}

function connect(): void {
  console.log("Attempting to connect to background...");

  background.connect();
}

function nativeHostReady(ready: boolean) {
  console.log(`Native host is ready: ${ready}`);

  const statusNode = document.getElementById("status");
  if (statusNode) statusNode.hidden = ready;

  const collectionsNode = document.getElementById("collections-list");
  if (collectionsNode) collectionsNode.hidden = !ready;

  if (ready)
    background.postOperation(
      new Background.CollectionMapsRequestOperation(null)
    );
}

background.readyHandler = () => {
  console.log(
    "Tab is ready! Waiting for host ready message before requesting collections + maps"
  );
};

background.hostReadyHandler = nativeHostReady;
background.collectionsHandler = updateCollections;
background.collectionsMapsHandler = collectionMaps;
background.collectionMapAddHandler = collectionAddMapEvent;
background.collectionMapRemoveHandler = collectionRemoveMapEvent;

connect();
