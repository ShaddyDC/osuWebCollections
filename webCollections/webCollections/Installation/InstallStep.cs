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
            throw new NotImplementedException();
        }
    }

    internal class ConfigFileStep : INInstallStep
    {
        protected readonly string File;
        private readonly string _content;

        public ConfigFileStep(string file, string content)
        {
            File = file;
            _content = content;
        }

        public void Apply()
        {
            Console.Write($"Creating file '{File}'... ");

            if (!Directory.Exists(Path.GetFullPath(File)))
            {
                Console.WriteLine("Directory doesn't exist!");
                return;
            }

            System.IO.File.WriteAllText(File, _content);

            Console.WriteLine("Done!");
            
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) || !System.IO.File.Exists(File)) return;
            Console.Write("Making file readable... ");
            Exec($"chmod o+r {File}");
            Console.WriteLine("Done!");
        }

        public void Undo()
        {
            throw new NotImplementedException();
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
        public ExeFileStep(string file, string content) : base(file, content)
        {
        }

        public new void Apply()
        {
            base.Apply();

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) || !System.IO.File.Exists(File)) return;
            
            Console.Write($"Making file executable ... ");
            Exec($"chmod +x \"{File}\"");
            Console.WriteLine("Done!");

        }
    }
}