using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using OsuParsers.Database;
using OsuParsers.Database.Objects;
using OsuParsers.Decoders;

namespace webCollections
{
    internal class OsuManager
    {
        private readonly CollectionDatabase _collectionDb;
        private readonly Dictionary<string, DbBeatmap> _hashBeatmaps = new Dictionary<string, DbBeatmap>();
        private readonly OsuDatabase _osuDb;
        private readonly string _osuFolder;

        internal OsuManager(string osuFolder)
        {
            this._osuFolder = osuFolder;
            _osuDb = DatabaseDecoder.DecodeOsu(OsuDbFile);
            _collectionDb = DatabaseDecoder.DecodeCollection(OsuCollectionFile);

            foreach (var beatmap in _osuDb.Beatmaps.Where(x => x.MD5Hash != null))
                _hashBeatmaps[beatmap.MD5Hash] = beatmap;
        }

        private string SongsFolder => Path.Combine(_osuFolder, "Songs");
        private string OsuCollectionFile => Path.Combine(_osuFolder, "collection.db");
        private string OsuDbFile => Path.Combine(_osuFolder, "osu!.db");

        internal string MapHash(int mapId)
        {
            return _osuDb.Beatmaps.Find(x => x.BeatmapId == mapId)?.MD5Hash;
        }

        internal List<string> IdCollections(int mapId)
        {
            var hash = MapHash(mapId);
            if (hash == null) return new List<string>(); //Todo: Download missing
            return _collectionDb.Collections.FindAll(x => x.MD5Hashes.Contains(hash)).Select(x => x.Name).ToList();
        }

        internal List<string> Collections()
        {
            return _collectionDb.Collections.Select(x => x.Name).ToList();
        }

        internal List<DbBeatmap> CollectionMaps(string name)
        {
            var collection = _collectionDb.Collections.FirstOrDefault(x => x.Name == name);
            return collection == null ? null : CollectionBeatmaps(collection);
        }

        private List<DbBeatmap> CollectionBeatmaps(Collection collection)
        {
            return collection.MD5Hashes.Select(hash => _hashBeatmaps.GetValueOrDefault(hash)).Where(song => song != null)
                .ToList();
        }

        internal IEnumerable<(string, int, List<DbBeatmap>)> CollectionsMaps(int maxSize = 100)
        {
            foreach (var collection in _collectionDb.Collections)
            {
                var beatmaps = new List<DbBeatmap>();

                if (collection.MD5Hashes.Count <= maxSize)
                    beatmaps = CollectionBeatmaps(collection);

                yield return (collection.Name, collection.MD5Hashes.Count, beatmaps);
            }
        }

        internal void AddMapCollection(string hash, string collectionName)
        {
            var collection = _collectionDb.Collections.Find(x => x.Name == collectionName);
            if (collection == null)
            {
                collection = new Collection
                {
                    Name = collectionName,
                    Count = 1
                };
                collection.MD5Hashes.Add(hash);
                _collectionDb.Collections.Add(collection);
                ++_collectionDb.CollectionCount;
                _collectionDb.Write(OsuCollectionFile);
            }
            else if (!collection.MD5Hashes.Contains(hash))
            {
                collection.MD5Hashes.Add(hash);
                ++collection.Count;
                _collectionDb.Write(OsuCollectionFile);
            }
        }

        internal void AddMapFile(string mapFile)
        {
            var newFile = Path.Combine(SongsFolder, Path.GetFileName(mapFile));
            File.Move(mapFile, newFile, true);
            using var zip = ZipFile.OpenRead(newFile);
            foreach (var entry in zip.Entries.Where(entry => entry.Name.EndsWith(".osu")))
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
                _osuDb.Beatmaps.Add(dbBm);
                ++_osuDb.BeatmapCount;
            }
        }

        internal void RemoveMapCollection(string hash, string collectionName)
        {
            var collection = _collectionDb.Collections.Find(x => x.Name == collectionName);
            if (collection != null)
            {
                --collection.Count;
                collection.MD5Hashes.Remove(hash);
                _collectionDb.Write(OsuCollectionFile);
            }
        }
    }
}