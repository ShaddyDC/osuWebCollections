using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace webCollections
{
    static class ExtensionCommunicator
    {
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
        public static void Write(JObject s)
        {
            var stdout = Console.OpenStandardOutput();
            var bytes = System.Text.Encoding.UTF8.GetBytes(s.ToString(Formatting.None));
            stdout.Write(BitConverter.GetBytes(bytes.Length));
            stdout.Write(bytes);
            stdout.Flush();
        }

        public static void SendStatus(string status)
        {
            var obj = new JObject
            {
                ["operation"] = "status",
                ["status"] = status
            };
            Write(obj);
        }
    }
}
