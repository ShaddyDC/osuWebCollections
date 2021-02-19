using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace webCollections
{
    internal static class Installer
    {
        private const string Title = "dev.shaddy.webcollections";

        private static readonly bool IsWindows =
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

        private static readonly string WindowsFile =
            Path.Combine(Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location) ?? string.Empty,
                "launch.bat");

        private static readonly string LinuxFile =
            Path.Combine(Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location) ?? string.Empty,
                "launch.sh");

        private static readonly string LaunchFile = (IsWindows ? WindowsFile : LinuxFile).Replace("\\", "/");

        private static readonly string WindowsFileContent =
            $"@echo off\ndotnet {Assembly.GetEntryAssembly().Location}";

        private static readonly string LinuxLaunchContent = //TODO try without DIR GetFileName
            $"#!/bin/sh\nDIR=\"$( cd \"$( dirname \"${{BASH_SOURCE[0]}}\" )\" >/dev/null 2>&1 && pwd )\"\nexec dotnet \"$DIR/{Path.GetFileName(Assembly.GetEntryAssembly().Location)}\"";

        private static readonly string[] FirefoxRegistryFolders =
        {
            @"SOFTWARE\Mozilla\NativeMessagingHosts",
            @"SOFTWARE\Mozilla\ManagedStorage",
            @"SOFTWARE\Mozilla\PKCS11Modules"
        };

        private static readonly string[] ChromeRegistryFolders =
        {
            @"SOFTWARE\Google\Chrome\NativeMessagingHosts"
        };

        private static string connectorContent(Browser browser)
        {
            var allowedKey = browser switch
            {
                Browser.Chrome => "allowed_origins",
                Browser.Firefox => "allowed_extensions",
                _ => ""
            };
            var allowedValue = browser switch //TODO update id
            {
                Browser.Chrome => "chrome-extension://pplnclfbilfnbjcdbjeoajbageakgjfa/",
                Browser.Firefox => "webcollections@shaddy.dev",
                _ => ""
            };


            return $@"{{
  ""name"": ""{Title}"",
  ""description"": ""Example host for native messaging"",
  ""path"": ""{LaunchFile}"",
  ""type"": ""stdio"",
  ""{allowedKey}"": [""{allowedValue}""]
}}";
        }

        internal static void Install()
        {
            const string file = Title + ".json";

            if (IsWindows)
            {
                var firefoxFile = Path.GetFullPath("firefox-" + file);

                Console.WriteLine($"Creating {firefoxFile}...");
                File.WriteAllText(firefoxFile, connectorContent(Browser.Firefox));

                Console.WriteLine("Pointing registry to firefox file...");
                foreach (var keyFolder in FirefoxRegistryFolders)
                {
                    var key = Registry.CurrentUser.CreateSubKey(Path.Combine(keyFolder, Title));
                    if (key == null) Console.WriteLine("Couldn't create key");
                    else key.SetValue("", firefoxFile);
                }

                var chromeFile = Path.GetFullPath("chrome-" + file);
                Console.WriteLine($"Creating {chromeFile}...");
                File.WriteAllText(chromeFile, connectorContent(Browser.Chrome));

                Console.WriteLine("Pointing registry to chrome file...");
                foreach (var keyFolder in ChromeRegistryFolders)
                {
                    var key = Registry.CurrentUser.CreateSubKey(Path.Combine(keyFolder, Title));
                    if (key == null) Console.WriteLine("Couldn't create key");
                    else key.SetValue("", chromeFile);
                }

                Console.WriteLine("Adding launch file");
                File.WriteAllText(WindowsFile, WindowsFileContent);
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
                    File.WriteAllText(chromeFile, connectorContent(Browser.Chrome));
                    Exec($"chmod o+r {chromeFile}");
                }


                if (Directory.Exists(Path.GetFullPath(firefoxFile)))
                {
                    Console.WriteLine($"Creating {firefoxFile}...");
                    File.WriteAllText(firefoxFile, connectorContent(Browser.Firefox));
                    Exec($"chmod o+r {firefoxFile}");
                }

                Console.WriteLine("Adding launch file and making it executable");
                File.WriteAllText(LinuxFile, LinuxLaunchContent);
                Exec($"chmod +x \"{LinuxFile}\"");
            }

            Console.WriteLine("Installed!");
        }

        private static void Exec(string cmd)
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

        private enum Browser
        {
            Chrome,
            Firefox
        }
    }
}