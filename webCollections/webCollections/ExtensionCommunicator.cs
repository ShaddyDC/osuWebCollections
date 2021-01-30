using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace webCollections
{
    static class ExtensionCommunicator
    {
        internal enum OperationType
        {
            multiPacket,
            ping,
            pong,
            error,
            status,
            exit,
            osuFolder,
            collections,
            mapCheck,
            collectionMaps,
        }
        
        public static JObject Read()
        {
            var stdin = Console.OpenStandardInput();
            var lengthBytes = new byte[4];
            stdin.Read(lengthBytes);

            var length = BitConverter.ToInt32(lengthBytes);

            var buffer = new char[length];
            using (var reader = new StreamReader(stdin))
            {
                reader.Read(buffer);
            }
            var s = new string(buffer);

            if (s == "")
                return null;
            File.AppendAllText("packets", $"{s}\n");
            return JsonConvert.DeserializeObject<JObject>(s);
        }

        private static int _messageId = 0;
        public static void Write(JObject obj)
        {
            const int maximumMessageSize = 1024 * 1024 / 2; // 2 because of UTF-16
            const int margin = 1000 * 2;

            var s = obj.ToString(Formatting.None);

            if (s.Length < maximumMessageSize)
            {
                Write(s);
                return;
            }
            
            var messageId = _messageId++;
            
            do
            {
                var length = Math.Min(maximumMessageSize - margin, s.Length);
                Program.SendStatus($"Using {length}/{s.Length}");
                var current = s.Substring(0, length);
                s = s.Remove(0, length);
                Program.SendStatus($"did string stuff");
                var currentObj = new JObject
                {
                    ["id"] = messageId,
                    ["operation"] = (int) OperationType.multiPacket,
                    ["data"] = current,
                    ["finished"] = s.Length == 0
                };
                
                Write(currentObj.ToString(Formatting.None));
            } while (s.Length != 0);
        }

        private static void Write(string s)
        {
            var stdout = Console.OpenStandardOutput();
            var bytes = System.Text.Encoding.UTF8.GetBytes(s);
            stdout.Write(BitConverter.GetBytes(bytes.Length));
            stdout.Write(bytes);
            stdout.Flush();
        }
    }
}
