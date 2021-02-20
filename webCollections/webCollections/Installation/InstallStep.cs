using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace webCollections.Installation
{
    public interface INInstallStep
    {
        public void Apply();
        public void Undo();
    }

    internal class RegistryKeyStep : INInstallStep
    {
        private readonly string _key;
        private readonly string _value;

        internal RegistryKeyStep(string key, string value)
        {
            _key = key;
            _value = value;
        }

        public void Apply()
        {
            Console.Write($"Creating Registry key '{_key}' with value '{_value}'... ");
            var key = Registry.CurrentUser.CreateSubKey(_key);
            if (key == null)
            {
                Console.WriteLine("Couldn't create key!");
                return;
            }

            key.SetValue("", _value);
            Console.WriteLine("Done!");
        }

        public void Undo()
        {
            Console.Write($"Removing Registry key '{_key}'... ");
            Registry.CurrentUser.DeleteSubKeyTree(_key);
            Console.WriteLine("Done!");
        }
    }

    internal class ConfigFileStep : INInstallStep
    {
        private readonly string _content;
        protected readonly string Filename;

        public ConfigFileStep(string filename, string content)
        {
            Filename = filename;
            _content = content;
        }

        public void Apply()
        {
            Console.Write($"Creating file '{Filename}'... ");

            if (!Directory.Exists(Path.GetFullPath(Filename)))
            {
                Console.WriteLine("Directory doesn't exist!");
                return;
            }

            File.WriteAllText(Filename, _content);

            Console.WriteLine("Done!");

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) || !File.Exists(Filename)) return;
            Console.Write("Making file readable... ");
            Exec($"chmod o+r {Filename}");
            Console.WriteLine("Done!");
        }

        public void Undo()
        {
            Console.Write($"Removing file '{Filename}'... ");

            if (!File.Exists(Path.GetFullPath(Filename)))
            {
                Console.WriteLine("File doesn't exist!");
                return;
            }

            File.Delete(Filename);
            Console.WriteLine("Done!");
        }

        protected static void Exec(string cmd)
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

    internal class ExeFileStep : ConfigFileStep
    {
        public ExeFileStep(string filename, string content) : base(filename, content)
        {
        }

        public new void Apply()
        {
            base.Apply();

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) || !File.Exists(Filename)) return;

            Console.Write("Making file executable ... ");
            Exec($"chmod +x \"{Filename}\"");
            Console.WriteLine("Done!");
        }
    }
}