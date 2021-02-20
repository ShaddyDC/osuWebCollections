using System;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace webCollections
{
    internal static class ExtensionCommunicator
    {
        private static int _messageId;

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

            return s == "" ? null : JsonConvert.DeserializeObject<JObject>(s);
        }

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
                Program.SendStatus("did string stuff");
                var currentObj = new JObject
                {
                    ["id"] = messageId,
                    ["operation"] = (int) OperationType.MultiPacket,
                    ["data"] = current,
                    ["finished"] = s.Length == 0
                };

                Write(currentObj.ToString(Formatting.None));
            } while (s.Length != 0);
        }

        private static void Write(string s)
        {
            var stdout = Console.OpenStandardOutput();
            var bytes = Encoding.UTF8.GetBytes(s);
            stdout.Write(BitConverter.GetBytes(bytes.Length));
            stdout.Write(bytes);
            stdout.Flush();
        }

        internal enum OperationType
        {
            MultiPacket,
            Ping,
            Pong,
            Error,
            Status,
            Exit,
            OsuFolder,
            Collections,
            MapCheck,
            CollectionMaps,
            CollectionMapAdd,
            CollectionMapRemove
        }
    }
}