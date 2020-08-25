using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace webCollections
{
    static class Installer
    {
        private static readonly bool isWindows =
            System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
        private static readonly string windowsFile = System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName.Replace(@"\", @"\\");
        private static readonly string linuxFile = Path.Combine(Path.GetDirectoryName(System.Reflection.Assembly.GetEntryAssembly().Location), "launch.sh");
        private static readonly string launchFile = isWindows ? windowsFile : linuxFile;

        private static readonly string connectorContent =
$@"{{
  ""name"": ""webCollections"",
  ""description"": ""Example host for native messaging"",
  ""path"": ""{launchFile}"",
  ""type"": ""stdio"",
  ""allowed_extensions"": [""webCollections@shaddy.dev""]
  ""allowed_origins"": [""webCollections@shaddy.dev""]
}}";
        
        private static readonly string linuxLaunchContent = $"#!/bin/sh\nDIR=\"$( cd \"$( dirname \"${{BASH_SOURCE[0]}}\" )\" >/dev/null 2>&1 && pwd )\"\ndotnet \"$DIR/{Path.GetFileName(System.Reflection.Assembly.GetEntryAssembly().Location)}\"";

        private static readonly string[] key_folders =
        {
                @"SOFTWARE\Mozilla\NativeMessagingHosts",
                @"SOFTWARE\Mozilla\ManagedStorage",
                @"SOFTWARE\Mozilla\PKCS11Modules"
            };

        static internal void InstallFirefox()
        {
            var file = "dev.shaddy.webCollections.json";

            if (isWindows)
                file = Path.GetFullPath(file);
            else
            {
                // file = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                //     ".config/google-chrome/NativeMessagingHosts", file);
                file = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".mozilla/native-messaging-hosts", file);
            }

            Console.WriteLine($"Creating {file}...");
            File.WriteAllText(file, connectorContent);

            if (!isWindows)
            {
                Console.WriteLine($"Adding launch file and making it executable");
                File.WriteAllText(linuxFile, linuxLaunchContent);
                Exec($"chmod +x \"{linuxFile}\"");
            }


            if (isWindows)
            {
                Console.WriteLine($"Pointing registry to file...");
                foreach (var key_folder in key_folders)
                {
                    var key = Registry.CurrentUser.CreateSubKey(Path.Combine(key_folder, "webCollections"));
                    key.SetValue("", file);
                }
            }

            Console.WriteLine("Installed!");
        }
        
        public static void Exec(string cmd)
        {
            var escapedArgs = cmd.Replace("\"", "\\\"");

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    FileName = "/bin/sh",
                    Arguments = $"-c \"{escapedArgs}\""
                }
            };

            process.Start();
            process.WaitForExit();
        }
    }
}
