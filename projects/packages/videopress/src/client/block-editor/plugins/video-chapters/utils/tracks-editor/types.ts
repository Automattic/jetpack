import { TRACK_KIND_OPTIONS } from '.';

type trackKindOptionsProps = typeof TRACK_KIND_OPTIONS;
export type trackKindOptionProps = trackKindOptionsProps[ number ];

export type uploadTrackDataProps = {
	label: string;
	srcLang: string;
	kind: trackKindOptionProps;
	tmpFile: File;
};
