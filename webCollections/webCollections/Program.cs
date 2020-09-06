﻿using Newtonsoft.Json;
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

        enum OperationType
        {
            ping,
            pong,
            error,
            status,
            exit,
            osuFolder,
            collections,
        }
        
        public static void SendStatus(string status)
        {
            var obj = new JObject
            {
                ["operation"] = (int)OperationType.status,
                ["status"] = status
            };
            ExtensionCommunicator.Write(obj);
        }

        void SendError(JObject obj, string error)
        {
            obj["obj"] = obj;
            obj["operation"] = (int)OperationType.error;
            obj["error"] = error;
            ExtensionCommunicator.Write(obj);
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
                ["operation"] = (int)OperationType.collections,
                ["collections"] = JsonConvert.SerializeObject(osuManager.Collections())
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
                switch ((OperationType)obj["operation"].ToObject<int>())
                {
                    case OperationType.ping:
                        obj["operation"] = (int)OperationType.pong;
                        ExtensionCommunicator.Write(obj);
                        break;
                    case OperationType.exit:
                        running = false;
                        SendStatus("Exiting...");
                        break;
                    
                    case OperationType.osuFolder:
                        HandleOsuFolder(obj);
                        break;
                    
                    default:
                        SendError(obj, "Unsupported Operation");
                        break;
                }
            }
            catch (Exception e)
            {
                SendError(obj, $"Exception: {e}");
                ExtensionCommunicator.Write(obj);
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
