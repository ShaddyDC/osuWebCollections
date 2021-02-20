using System;
using System.Collections.Generic;
using System.IO;

namespace webCollections.Installation
{
    internal static class Installer
    {
        private static IEnumerable<INInstallStep> InstallSteps()
        {
            if (InstallData.IsWindows)
            {
                var firefoxFile = Path.Combine(InstallData.CurrentDir, "firefox-" + InstallData.Filename);
                var chromeFile = Path.Combine(InstallData.CurrentDir, "chrome-" + InstallData.Filename);

                var installationSteps = new INInstallStep[]
                {
                    new ConfigFileStep(firefoxFile, InstallData.ConnectorContent(InstallData.Browser.Firefox)),
                    new RegistryKeyStep(chromeFile, InstallData.ConnectorContent(InstallData.Browser.Chrome)),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Mozilla\NativeMessagingHosts", InstallData.Title),
                        firefoxFile),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Mozilla\ManagedStorage", InstallData.Title),
                        firefoxFile),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Mozilla\PKCS11Modules", InstallData.Title),
                        firefoxFile),
                    new RegistryKeyStep(Path.Combine(@"SOFTWARE\Google\Chrome\NativeMessagingHosts", InstallData.Title),
                        chromeFile),
                    new ExeFileStep(InstallData.WindowsFile, InstallData.WindowsFileContent)
                };

                return installationSteps;
            }
            else
            {
                var firefoxFile = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".mozilla/native-messaging-hosts", InstallData.Filename);
                var chromeFile = Path.Join(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    ".config/google-chrome/NativeMessagingHosts", InstallData.Filename);

                var installationSteps = new INInstallStep[]
                {
                    new ConfigFileStep(chromeFile, InstallData.ConnectorContent(InstallData.Browser.Chrome)),
                    new ConfigFileStep(firefoxFile, InstallData.ConnectorContent(InstallData.Browser.Firefox)),
                    new ExeFileStep(InstallData.LinuxFile, InstallData.LinuxLaunchContent)
                };

                return installationSteps;
            }
        }

        internal static void Install()
        {
            var installationSteps = InstallSteps();

            foreach (var step in installationSteps) step.Apply();

            Console.WriteLine("Finished installing!");
        }

        internal static void Uninstall()
        {
            var installationSteps = InstallSteps();

            foreach (var step in installationSteps) step.Undo();

            Console.WriteLine("Finished uninstalling!");
        }
    }
}