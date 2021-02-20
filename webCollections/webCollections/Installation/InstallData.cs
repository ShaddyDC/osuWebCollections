using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;

namespace webCollections.Installation
{
    public static class InstallData
    {
        internal const string Title = "dev.shaddy.webcollections";
        internal const string Filename = Title + ".json";

        internal static readonly bool IsWindows =
            RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

        internal static readonly string CurrentDir =
            Path.GetDirectoryName(Assembly.GetEntryAssembly()?.Location) ?? string.Empty;

        internal static readonly string WindowsFile =
            Path.Combine(CurrentDir, "launch.bat");

        internal static readonly string LinuxFile =
            Path.Combine(CurrentDir, "launch.sh");

        private static readonly string LaunchFile = (IsWindows ? WindowsFile : LinuxFile).Replace("\\", "/");

        internal static readonly string WindowsFileContent =
            $"@echo off\ndotnet {Assembly.GetEntryAssembly()?.Location}";

        internal static readonly string LinuxLaunchContent = //TODO try without DIR GetFileName
            $"#!/bin/sh\nDIR=\"$( cd \"$( dirname \"${{BASH_SOURCE[0]}}\" )\" >/dev/null 2>&1 && pwd )\"\nexec dotnet \"$DIR/{Path.GetFileName(Assembly.GetEntryAssembly()?.Location)}\"";

        internal static string ConnectorContent(Browser browser)
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

        internal enum Browser
        {
            Chrome,
            Firefox
        }
    }
}