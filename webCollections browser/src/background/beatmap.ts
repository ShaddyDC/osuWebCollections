declare module Beatmap {

    export interface StandardStarRating {
        None: number;
        DoubleTime: number;
        HalfTime: number;
        Easy: number;
        66: number;
        258: number;
        HardRock: number;
        80: number;
        272: number;
    }

    export interface TaikoStarRating {
    }

    export interface CatchStarRating {
    }

    export interface ManiaStarRating {
    }

    export interface TimingPoint {
        BPM: number;
        Offset: number;
        Inherited: boolean;
    }

    export interface Beatmap {
        BytesOfBeatmapEntry: number;
        Artist: string;
        ArtistUnicode: string;
        Title: string;
        TitleUnicode: string;
        Creator: string;
        Difficulty: string;
        AudioFileName: string;
        MD5Hash: string;
        FileName: string;
        RankedStatus: number;
        CirclesCount: number;
        SlidersCount: number;
        SpinnersCount: number;
        LastModifiedTime: Date;
        ApproachRate: number;
        CircleSize: number;
        HPDrain: number;
        OverallDifficulty: number;
        SliderVelocity: number;
        StandardStarRating: StandardStarRating;
        TaikoStarRating: TaikoStarRating;
        CatchStarRating: CatchStarRating;
        ManiaStarRating: ManiaStarRating;
        DrainTime: number;
        TotalTime: number;
        AudioPreviewTime: number;
        TimingPoints: TimingPoint[];
        BeatmapId: number;
        BeatmapSetId: number;
        ThreadId: number;
        StandardGrade: number;
        TaikoGrade: number;
        CatchGrade: number;
        ManiaGrade: number;
        LocalOffset: number;
        StackLeniency: number;
        Ruleset: number;
        Source: string;
        Tags: string;
        OnlineOffset: number;
        TitleFont: string;
        IsUnplayed: boolean;
        LastPlayed: Date;
        IsOsz2: boolean;
        FolderName: string;
        LastCheckedAgainstOsuRepo: Date;
        IgnoreBeatmapSound: boolean;
        IgnoreBeatmapSkin: boolean;
        DisableStoryboard: boolean;
        DisableVideo: boolean;
        VisualOverride: boolean;
        ManiaScrollSpeed: number;
    }

}

