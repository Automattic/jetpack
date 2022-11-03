import { TRACK_KIND_OPTIONS } from '.';

type TrackKindOptionsProps = typeof TRACK_KIND_OPTIONS;
type TrackKindOptionProps = TrackKindOptionsProps[ number ];

export type TrackDataProps = {
	kind: TrackKindOptionProps;
	srcLang: string;
	label: string;
	tmpFile: File;
};
