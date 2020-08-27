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

        enum Browser
        {
            chrome, firefox
        }
        
        private static string connectorContent(Browser browser)
        {
            var allowedKey = browser switch
            {
                Browser.chrome => "allowed_origins",
                Browser.firefox => "allowed_extensions",
                _ => ""
            };
            var allowedValue = browser switch
            {
                Browser.chrome => "chrome-extension://pplnclfbilfnbjcdbjeoajbageakgjfa/",
                Browser.firefox => "webcollections@shaddy.dev",
                _ => ""
            };
            
            
            return $@"{{
  ""name"": ""dev.shaddy.webcollections"",
  ""description"": ""Example host for native messaging"",
  ""path"": ""{launchFile}"",
  ""type"": ""stdio"",
  ""{allowedKey}"": [""{allowedValue}""]
}}";
        }

        private static readonly string linuxLaunchContent = $"#!/bin/sh\nDIR=\"$( cd \"$( dirname \"${{BASH_SOURCE[0]}}\" )\" >/dev/null 2>&1 && pwd )\"\ndotnet \"$DIR/{Path.GetFileName(System.Reflection.Assembly.GetEntryAssembly().Location)}\"";

        private static readonly string[] firefoxRegistryFolders =
        {
            @"SOFTWARE\Mozilla\NativeMessagingHosts",
            @"SOFTWARE\Mozilla\ManagedStorage",
            @"SOFTWARE\Mozilla\PKCS11Modules"
        };

        static internal void Install()
        {
            var file = "dev.shaddy.webcollections.json";

            if (isWindows)
            {
                file = Path.GetFullPath(file);
                Console.WriteLine($"Creating {file}...");
                File.WriteAllText(file, connectorContent(Browser.firefox));
                
                Console.WriteLine($"Pointing registry to file...");
                foreach (var key_folder in firefoxRegistryFolders)
                {
                    var key = Registry.CurrentUser.CreateSubKey(Path.Combine(key_folder, "webcollections"));
                    key.SetValue("", file);
                }
            }
            else
            {
                var chromeFile = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".config/google-chrome/NativeMessagingHosts", file);
                var firefoxFile = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".mozilla/native-messaging-hosts", file);

                if (Directory.Exists(Path.GetFullPath(chromeFile)))
                {
                    Console.WriteLine($"Creating {chromeFile}...");
                    File.WriteAllText(chromeFile, connectorContent(Browser.chrome));
                    Exec($"chmod o+r {chromeFile}");
                }


                if (Directory.Exists(Path.GetFullPath(firefoxFile)))
                {
                    Console.WriteLine($"Creating {firefoxFile}...");
                    File.WriteAllText(firefoxFile, connectorContent(Browser.firefox));
                    Exec($"chmod o+r {firefoxFile}");
                }

                Console.WriteLine($"Adding launch file and making it executable");
                File.WriteAllText(linuxFile, linuxLaunchContent);
                Exec($"chmod +x \"{linuxFile}\"");
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
