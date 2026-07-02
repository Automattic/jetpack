/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import type { trackKindOptionProps, VideoTextTrack } from './types';

export const CAPTION_TRACK_META = {
	guid: '_videopress_guid',
	kind: '_videopress_caption_kind',
	srcLang: '_videopress_caption_src_lang',
	label: '_videopress_caption_label',
	sourceTrackKind: '_videopress_source_track_kind',
	sourceTrackSrcLang: '_videopress_source_track_src_lang',
	sourceTrackSrc: '_videopress_source_track_src',
} as const;

type CaptionTrackMeta = {
	[ CAPTION_TRACK_META.guid ]: string;
	[ CAPTION_TRACK_META.kind ]: trackKindOptionProps;
	[ CAPTION_TRACK_META.srcLang ]: string;
	[ CAPTION_TRACK_META.label ]: string;
	[ CAPTION_TRACK_META.sourceTrackKind ]?: string;
	[ CAPTION_TRACK_META.sourceTrackSrcLang ]?: string;
	[ CAPTION_TRACK_META.sourceTrackSrc ]?: string;
};

export type CaptionTrack = {
	id?: number;
	title: string;
	content: string;
	status?: 'draft' | 'publish';
	meta: CaptionTrackMeta;
};

export type SavedCaptionTrack = Required< Pick< CaptionTrack, 'id' | 'title' | 'content' > > & {
	status: 'draft' | 'publish';
	meta: CaptionTrackMeta;
};

const REST_PATH = '/wpcom/v2/videopress/caption-tracks';

/**
 * Load caption tracks for a VideoPress GUID.
 *
 * @param guid - VideoPress GUID.
 * @return Caption tracks.
 */
export function fetchCaptionTracks( guid: string ): Promise< SavedCaptionTrack[] > {
	return apiFetch( {
		path: addQueryArgs( REST_PATH, { guid } ),
	} );
}

/**
 * Save a caption track.
 *
 * @param track - Caption track payload.
 * @return Saved caption track.
 */
export function saveCaptionTrack( track: CaptionTrack ): Promise< SavedCaptionTrack > {
	return apiFetch( {
		method: track.id ? 'PUT' : 'POST',
		path: track.id ? `${ REST_PATH }/${ track.id }` : REST_PATH,
		data: track,
	} );
}

/**
 * Delete a caption track.
 *
 * @param id - Caption track ID.
 * @return Deletion result.
 */
export function deleteCaptionTrack( id: number ): Promise< { deleted: boolean; id: number } > {
	return apiFetch( {
		method: 'DELETE',
		path: `${ REST_PATH }/${ id }`,
	} );
}

/**
 * Convert a source text track to caption track source metadata.
 *
 * @param track - Source track.
 * @return Source metadata.
 */
export function getSourceTrackMeta(
	track: VideoTextTrack | null
): Pick<
	CaptionTrackMeta,
	| typeof CAPTION_TRACK_META.sourceTrackKind
	| typeof CAPTION_TRACK_META.sourceTrackSrcLang
	| typeof CAPTION_TRACK_META.sourceTrackSrc
> {
	return track
		? {
				[ CAPTION_TRACK_META.sourceTrackKind ]: track.kind,
				[ CAPTION_TRACK_META.sourceTrackSrcLang ]: track.srcLang,
				[ CAPTION_TRACK_META.sourceTrackSrc ]: track.src,
		  }
		: {};
}
