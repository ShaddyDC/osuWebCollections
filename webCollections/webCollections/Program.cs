using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OsuParsers.Database;
using OsuParsers.Decoders;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;

namespace webCollections
{
    class Program
    {
        OsuManager osuManager;
        private bool running = true;
        Program()
        {
            SendStatus("Waiting for osu folder");
        }


        
        public static void SendStatus(string status)
        {
            var obj = new JObject
            {
                ["operation"] = (int)ExtensionCommunicator.OperationType.status,
                ["status"] = status
            };
            ExtensionCommunicator.Write(obj);
        }

        void SendError(JObject obj, string error)
        {
            obj["obj"] = obj;
            obj["operation"] = (int)ExtensionCommunicator.OperationType.error;
            obj["error"] = error;
            ExtensionCommunicator.Write(obj);
        }

        void HandleMapCheck(JObject obj)
        {
            var mapId = obj["mapId"]?.ToObject<int>();
            if (mapId == null)
            {
                SendError(obj, "mapCheck has no mapId specified");
                return;
            }
            var available = osuManager.MapHash(mapId.Value) != null;
            obj["available"] = available;
            if (available)
            {
                var list = osuManager.IdCollections(mapId.Value);
                obj["mapCollectionsJSON"] = JsonConvert.SerializeObject(list);
            }
            ExtensionCommunicator.Write(obj);
        }

        void HandleAddMapCollection(JObject obj)
        {
            var mapId = obj["mapId"].ToObject<int>();
            var hash = osuManager.MapHash(mapId);
            var collection = obj["collection"].ToString();
            osuManager.AddMapCollection(hash, collection);

            SendCollections();  //Todo: Only send when new collection
            ExtensionCommunicator.Write(obj);
        }

        void HandleRemoveMapCollection(JObject obj)
        {
            var mapId = obj["mapId"].ToObject<int>();
            var hash = osuManager.MapHash(mapId);
            var collection = obj["collection"].ToString();
            osuManager.RemoveMapCollection(hash, collection);

            ExtensionCommunicator.Write(obj);
        }

        void HandleAddMapFile(JObject obj)
        {
            var mapFile = obj["mapFile"].ToString();
            osuManager.AddMapFile(mapFile);

            ExtensionCommunicator.Write(obj);
        }

        private void HandleCollectionMaps(JObject obj)
        {
            var collectionsMaps = osuManager.CollectionsMaps();

            if (obj["collection"] != null && obj["collection"].Type != JTokenType.Null)
            {
                var maps = osuManager.CollectionMaps(obj["collection"].ToString());
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
        
        void HandleOsuFolder(JObject obj)
        {
            if (obj["osuFolder"] == null)
            {
                SendError(obj, "osuFolder Operation requires osuFolder to be set");
                return;
            }
            var folder = obj["osuFolder"].ToString();
            SendStatus("Loading databases");
            osuManager = new OsuManager(folder);
            SendStatus("Ready");
            SendCollections();
        }

        void SendCollections()
        {
            var obj = new JObject
            {
                ["operation"] = (int)ExtensionCommunicator.OperationType.collections,
                ["collectionsJSON"] = JsonConvert.SerializeObject(osuManager.Collections())
            };
            ExtensionCommunicator.Write(obj);
        }

        void HandleOperation()
        {
            var obj = ExtensionCommunicator.Read();
            if (obj == null) return;

            if (!obj.ContainsKey("operation") || obj["operation"] == null)
            {
                SendError(obj, "No operation specified");
                return;
            }

            try { 
                switch ((ExtensionCommunicator.OperationType)obj["operation"].ToObject<int>())
                {
                    case ExtensionCommunicator.OperationType.ping:
                        obj["operation"] = (int)ExtensionCommunicator.OperationType.pong;
                        ExtensionCommunicator.Write(obj);
                        break;
                    case ExtensionCommunicator.OperationType.exit:
                        running = false;
                        SendStatus("Exiting...");
                        break;
                    
                    case ExtensionCommunicator.OperationType.osuFolder:
                        HandleOsuFolder(obj);
                        break;
                    
                    case ExtensionCommunicator.OperationType.mapCheck:
                        HandleMapCheck(obj);
                        break;
                    
                    case ExtensionCommunicator.OperationType.collectionMaps:
                        HandleCollectionMaps(obj);
                        break;
                    
                    case ExtensionCommunicator.OperationType.collectionMapAdd:
                        HandleAddMapCollection(obj);
                        break;
                    
                    case ExtensionCommunicator.OperationType.collectionMapRemove:
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

        static void Main(string[] args)
        {
            if(args.Length == 1 && args[0] == "installFirefox")
            {
                Installer.Install();
                return;
            }

            var program = new Program();
            while (program.running)
            {
                program.HandleOperation();
                Thread.Sleep(10);
            }
        }
    }
}
