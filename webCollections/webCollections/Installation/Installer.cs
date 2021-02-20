using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace webCollections.Installation
{
    internal static class Installer
    {
        private const string Title = "dev.shaddy.webcollections";

        private static readonly bool IsWindows =
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

        private static readonly string CurrentDir =
            Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location) ?? string.Empty;

        private static readonly string WindowsFile =
            Path.Combine(CurrentDir, "launch.bat");

        private static readonly string LinuxFile =
            Path.Combine(CurrentDir, "launch.sh");

        private static readonly string LaunchFile = (IsWindows ? WindowsFile : LinuxFile).Replace("\\", "/");

        private static readonly string WindowsFileContent =
            $"@echo off\ndotnet {Assembly.GetEntryAssembly()?.Location}";

        private static readonly string LinuxLaunchContent = //TODO try without DIR GetFileName
            $"#!/bin/sh\nDIR=\"$( cd \"$( dirname \"${{BASH_SOURCE[0]}}\" )\" >/dev/null 2>&1 && pwd )\"\nexec dotnet \"$DIR/{Path.GetFileName(Assembly.GetEntryAssembly()?.Location)}\"";

        private static string ConnectorContent(Browser browser)
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
                var firefoxFile = Path.Combine(CurrentDir, "firefox-" + file);
                var chromeFile = Path.Combine(CurrentDir, "chrome-" + file);

                var installationSteps = new INInstallStep[]
                {
                    new ConfigFileStep(firefoxFile, ConnectorContent(Browser.Firefox)),
                    new RegistryKeyStep(chromeFile, ConnectorContent(Browser.Chrome)),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Mozilla\NativeMessagingHosts", Title), firefoxFile),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Mozilla\ManagedStorage", Title), firefoxFile),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Mozilla\PKCS11Modules", Title), firefoxFile),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Google\Chrome\NativeMessagingHosts", Title),
                        chromeFile),
                    new ExeFileStep(WindowsFile, WindowsFileContent)
                };

                foreach (var step in installationSteps)
                {
                    step.Apply();
                }

                Console.WriteLine("Finished installing!");
            }
            else
            {
                var firefoxFile = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".mozilla/native-messaging-hosts", file);
                var chromeFile = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".config/google-chrome/NativeMessagingHosts", file);
                
                var installationSteps = new INInstallStep[]
                {
                    new ConfigFileStep(chromeFile, ConnectorContent(Browser.Chrome)),
                    new ConfigFileStep(firefoxFile, ConnectorContent(Browser.Firefox)),
                    new ExeFileStep(LinuxFile, LinuxLaunchContent)
                    
                };
            }

            Console.WriteLine("Finished installing!");
        }

        private enum Browser
        {
            Chrome,
            Firefox
        }
    }
}