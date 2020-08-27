using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OsuParsers.Database;
using OsuParsers.Decoders;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace webCollections
{
    class Program
    {
        OsuManager osuManager;
        Program()
        {
            ExtensionCommunicator.SendStatus("Waiting for osu folder");
        }

        void HandleMapCollections(JObject obj)
        {
            var mapId = obj["mapId"].ToObject<int>();
            var list = osuManager.IdCollections(mapId);
            obj["mapCollections"] = JsonConvert.SerializeObject(list);
            ExtensionCommunicator.Write(obj);
        }

        void HandleMapExistence(JObject obj)
        {
            var mapId = obj["mapId"].ToObject<int>();
            obj["mapExistence"] = osuManager.MapHash(mapId) != null;
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

        void HandleOsuFolder(JObject obj)
        {
            var folder = obj["osuFolder"].ToString();
            ExtensionCommunicator.SendStatus("Loading databases");
            osuManager = new OsuManager(folder);
            ExtensionCommunicator.SendStatus("Ready");
            SendCollections();
        }

        void SendCollections()
        {
            var obj = new JObject
            {
                ["operation"] = "collections",
                ["collections"] = JsonConvert.SerializeObject(osuManager.Collections())
            };
            ExtensionCommunicator.Write(obj);
        }

        void HandleOperation()
        {
            var obj = ExtensionCommunicator.Read();
            if (obj == null) return;

            try { 
                switch (obj["operation"].ToString())
                {
                    case "mapCollections":
                        HandleMapCollections(obj);
                        break;

                    case "mapExistence":
                        HandleMapExistence(obj);
                        break;

                    case "addMapCollection":
                        HandleAddMapCollection(obj);
                        break;

                    case "removeMapCollection":
                        HandleRemoveMapCollection(obj);
                        break;

                    case "addMapFile":
                        HandleAddMapFile(obj);
                        break;

                    case "osuFolder":
                        HandleOsuFolder(obj);
                        break;

                    case "ping":
                        ExtensionCommunicator.Write(new JObject { ["operation"] = "pong" });
                        break;

                    default:
                        obj["Error"] = "Unsupported operation";
                        ExtensionCommunicator.Write(obj);
                        break;
                }
            }
            catch (NullReferenceException e)
            {
                File.WriteAllText("error", e.ToString());
                obj["Error"] = $"Nullreference Exception handling: {e}\n{obj}";
                ExtensionCommunicator.Write(obj);
            }
        }

        static void Main(string[] args)
        {
            if(args.Length == 1 && args[0] == "installFirefox")
            {
                Installer.InstallFirefox();
                return;
            }

            // try
            // {
                var program = new Program();
                while (true)
                {
                    program.HandleOperation();
                }
            // }
            // catch(Exception e)
            // {
            //     File.WriteAllText("error", e.ToString());
            // }
        }
    }
}
