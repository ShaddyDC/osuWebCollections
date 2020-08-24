using OsuParsers.Beatmaps;
using OsuParsers.Database;
using OsuParsers.Database.Objects;
using OsuParsers.Decoders;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace webCollections
{
    class OsuManager
    {
        private OsuDatabase osuDb;
        private CollectionDatabase collectionDb;
        private string osuFolder = null;
        private string songsFolder => Path.Combine(osuFolder, "Songs");
        private string osuCollectionFile => Path.Combine(osuFolder, "collection.db");
        private string osuDbFile => Path.Combine(osuFolder, "osu!.db");
        internal OsuManager(string osuFolder)
        {
            this.osuFolder = osuFolder;
            osuDb = DatabaseDecoder.DecodeOsu(osuDbFile);
            collectionDb = DatabaseDecoder.DecodeCollection(osuCollectionFile);
        }

        internal string MapHash(int mapId)
        {
            return osuDb.Beatmaps.Find(x => x.BeatmapId == mapId)?.MD5Hash;
        }

        internal List<string> IdCollections(int mapId)
        {
            var hash = MapHash(mapId);
            if (hash == null) return new List<string>();    //Todo: Download missing
            return collectionDb.Collections.FindAll(x => x.MD5Hashes.Contains(hash)).Select(x => x.Name).ToList();
        }

        internal List<string> Collections()
        {
            return collectionDb.Collections.Select(x => x.Name).ToList();
        }

        internal void AddMapCollection(string hash, string collectionName)
        {
            var collection = collectionDb.Collections.Find(x => x.Name == collectionName);
            if (collection == null)
            {
                collection = new OsuParsers.Database.Objects.Collection
                {
                    Name = collectionName,
                    Count = 1
                };
                collection.MD5Hashes.Add(hash);
                collectionDb.Collections.Add(collection);
                ++collectionDb.CollectionCount;
                collectionDb.Write(osuCollectionFile);
            }
            else if (!collection.MD5Hashes.Contains(hash))
            {
                collection.MD5Hashes.Add(hash);
                ++collection.Count;
                collectionDb.Write(osuCollectionFile);
            }
        }

        internal void AddMapFile(string mapFile)
        {
            var newFile = Path.Combine(songsFolder, Path.GetFileName(mapFile));
            File.Move(mapFile, newFile, true);
            using(var zip = ZipFile.OpenRead(newFile)){
                foreach(var entry in zip.Entries.Where(entry => entry.Name.EndsWith(".osu")))
                {
                    // Add information to collection that is used for future operation
                    // Note that this data is not saved to disk and will still be populated by osu normally
                    var hash = BitConverter.ToString(MD5.Create().ComputeHash(entry.Open()))
                        .Replace("-", string.Empty).ToLower();
                    var bm = BeatmapDecoder.Decode(entry.Open());
                    var dbBm = new DbBeatmap
                    {
                        BeatmapId = bm.MetadataSection.BeatmapID,
                        BeatmapSetId = bm.MetadataSection.BeatmapSetID,
                        MD5Hash = hash
                    };
                    osuDb.Beatmaps.Add(dbBm);
                    ++osuDb.BeatmapCount;
                }
            }
        }

        internal void RemoveMapCollection(string hash, string collectionName)
        {
            var collection = collectionDb.Collections.Find(x => x.Name == collectionName);
            if (collection != null)
            {
                --collection.Count;
                collection.MD5Hashes.Remove(hash);
                collectionDb.Write(osuCollectionFile);
            }
        }
    }
}
