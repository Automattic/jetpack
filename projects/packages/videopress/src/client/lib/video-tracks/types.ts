import { TRACK_KIND_OPTIONS } from '.';

type TrackKindOptionsProps = typeof TRACK_KIND_OPTIONS;
export type trackKindOptionProps = TrackKindOptionsProps[ number ];

export type UploadTrackDataProps = {
	label: string;
	srcLang: string;
	kind: trackKindOptionProps;
	tmpFile: File;
};

export type DeleteTrackDataProps = {
	kind: trackKindOptionProps;
	srcLang: string;
};
