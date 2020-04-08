using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace webCollections
{
    static class Installer
    {
        private static readonly string currentFile = System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName.Replace(@"\", @"\\");
        private static readonly string connectorContent =
$@"{{
  ""name"": ""webCollections"",
  ""description"": ""Example host for native messaging"",
  ""path"": ""{currentFile}"",
  ""type"": ""stdio"",
  ""allowed_extensions"": [""webCollections@shaddy.dev""]
}}";

        private static readonly string[] key_folders =
        {
                @"SOFTWARE\Mozilla\NativeMessagingHosts",
                @"SOFTWARE\Mozilla\ManagedStorage",
                @"SOFTWARE\Mozilla\PKCS11Modules"
            };

        static internal void InstallFirefox()
        {
            var file = Path.GetFullPath("connector.json");

            Console.WriteLine($"Creating {file}...");
            File.WriteAllText(file, connectorContent);

            Console.WriteLine($"Pointing registry to file...");

            foreach (var key_folder in key_folders)
            {
                var key = Registry.CurrentUser.CreateSubKey(Path.Combine(key_folder, "webCollections"));
                key.SetValue("", file);
            }

            Console.WriteLine("Installed!");
        }
    }
}
