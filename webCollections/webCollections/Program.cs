using System;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace webCollections
{
    internal class Program
    {
        private OsuManager _osuManager;
        private bool _running = true;

        private Program()
        {
            SendStatus("Waiting for osu folder");
        }

        public static void SendStatus(string status)
        {
            var obj = new JObject
            {
                ["operation"] = (int) ExtensionCommunicator.OperationType.Status,
                ["status"] = status
            };
            ExtensionCommunicator.Write(obj);
        }

        private static void SendError(JObject obj, string error)
        {
            obj["obj"] = obj;
            obj["operation"] = (int) ExtensionCommunicator.OperationType.Error;
            obj["error"] = error;
            ExtensionCommunicator.Write(obj);
        }

        private void HandleMapCheck(JObject obj)
        {
            var mapId = obj["mapId"]?.ToObject<int>();
            if (mapId == null)
            {
                SendError(obj, "mapCheck has no mapId specified");
                return;
            }

            var available = _osuManager.MapHash(mapId.Value) != null;
            obj["available"] = available;
            if (available)
            {
                var list = _osuManager.IdCollections(mapId.Value);
                obj["mapCollectionsJSON"] = JsonConvert.SerializeObject(list);
            }

            ExtensionCommunicator.Write(obj);
        }

        private void HandleAddMapCollection(JObject obj)
        {
            var mapId = obj["mapId"].ToObject<int>();
            var hash = _osuManager.MapHash(mapId);
            var collection = obj["collection"].ToString();
            _osuManager.AddMapCollection(hash, collection);

            SendCollections(); //Todo: Only send when new collection
            ExtensionCommunicator.Write(obj);
        }

        private void HandleRemoveMapCollection(JObject obj)
        {
            var mapId = obj["mapId"].ToObject<int>();
            var hash = _osuManager.MapHash(mapId);
            var collection = obj["collection"].ToString();
            _osuManager.RemoveMapCollection(hash, collection);

            ExtensionCommunicator.Write(obj);
        }

        private void HandleAddMapFile(JObject obj)
        {
            var mapFile = obj["mapFile"].ToString();
            _osuManager.AddMapFile(mapFile);

            ExtensionCommunicator.Write(obj);
        }

        private void HandleCollectionMaps(JObject obj)
        {
            var collectionsMaps = _osuManager.CollectionsMaps();

            if (obj["collection"] != null && obj["collection"].Type != JTokenType.Null)
            {
                var maps = _osuManager.CollectionMaps(obj["collection"].ToString());
                obj["collectionSize"] = maps?.Count;
                obj["mapsJSON"] = JsonConvert.SerializeObject(maps);
                ExtensionCommunicator.Write(obj);
            }
            else
            {
                foreach (var (collection, length, dbBeatmaps) in collectionsMaps)
                {
                    obj["collection"] = collection;
                    obj["collectionSize"] = length;
                    obj["mapsJSON"] = JsonConvert.SerializeObject(dbBeatmaps);
                    ExtensionCommunicator.Write(obj);
                }
            }
        }

        private void HandleOsuFolder(JObject obj)
        {
            if (obj["osuFolder"] == null)
            {
                SendError(obj, "osuFolder Operation requires osuFolder to be set");
                return;
            }

            var folder = obj["osuFolder"].ToString();
            SendStatus("Loading databases");
            _osuManager = new OsuManager(folder);
            SendStatus("Ready");
            SendCollections();
        }

        private void SendCollections()
        {
            var obj = new JObject
            {
                ["operation"] = (int) ExtensionCommunicator.OperationType.Collections,
                ["collectionsJSON"] = JsonConvert.SerializeObject(_osuManager.Collections())
            };
            ExtensionCommunicator.Write(obj);
        }

        private void HandleOperation()
        {
            var obj = ExtensionCommunicator.Read();
            if (obj == null) return;

            if (!obj.ContainsKey("operation") || obj["operation"] == null)
            {
                SendError(obj, "No operation specified");
                return;
            }

            try
            {
                switch ((ExtensionCommunicator.OperationType) obj["operation"].ToObject<int>())
                {
                    case ExtensionCommunicator.OperationType.Ping:
                        obj["operation"] = (int) ExtensionCommunicator.OperationType.Pong;
                        ExtensionCommunicator.Write(obj);
                        break;
                    case ExtensionCommunicator.OperationType.Exit:
                        _running = false;
                        SendStatus("Exiting...");
                        break;

                    case ExtensionCommunicator.OperationType.OsuFolder:
                        HandleOsuFolder(obj);
                        break;

                    case ExtensionCommunicator.OperationType.MapCheck:
                        HandleMapCheck(obj);
                        break;

                    case ExtensionCommunicator.OperationType.CollectionMaps:
                        HandleCollectionMaps(obj);
                        break;

                    case ExtensionCommunicator.OperationType.CollectionMapAdd:
                        HandleAddMapCollection(obj);
                        break;

                    case ExtensionCommunicator.OperationType.CollectionMapRemove:
                        HandleRemoveMapCollection(obj);
                        break;

                    default:
                        SendError(obj, "Unsupported Operation");
                        break;
                }
            }
            catch (Exception e)
            {
                SendError(obj, $"Exception: {e}");
            }
        }

        private static void Main(string[] args)
        {
            if (args.Length == 1 && args[0] == "install")
            {
                Installer.Install();
                return;
            }

            var program = new Program();
            while (program._running)
            {
                program.HandleOperation();
                Thread.Sleep(10);
            }
        }
    }
}