/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import type { trackKindOptionProps, VideoTextTrack } from './types';

export const CAPTION_DRAFT_META = {
	guid: '_videopress_guid',
	kind: '_videopress_caption_kind',
	srcLang: '_videopress_caption_src_lang',
	label: '_videopress_caption_label',
	sourceTrackKind: '_videopress_source_track_kind',
	sourceTrackSrcLang: '_videopress_source_track_src_lang',
	sourceTrackSrc: '_videopress_source_track_src',
} as const;

type CaptionDraftMeta = {
	[ CAPTION_DRAFT_META.guid ]: string;
	[ CAPTION_DRAFT_META.kind ]: trackKindOptionProps;
	[ CAPTION_DRAFT_META.srcLang ]: string;
	[ CAPTION_DRAFT_META.label ]: string;
	[ CAPTION_DRAFT_META.sourceTrackKind ]?: string;
	[ CAPTION_DRAFT_META.sourceTrackSrcLang ]?: string;
	[ CAPTION_DRAFT_META.sourceTrackSrc ]?: string;
};

export type CaptionDraft = {
	id?: number;
	title: string;
	content: string;
	status?: 'draft' | 'publish';
	meta: CaptionDraftMeta;
};

export type SavedCaptionDraft = Required< Pick< CaptionDraft, 'id' | 'title' | 'content' > > & {
	status: 'draft' | 'publish';
	meta: CaptionDraftMeta;
};

const REST_PATH = '/jetpack/v4/videopress/caption-drafts';

/**
 * Load caption drafts for a VideoPress GUID.
 *
 * @param guid - VideoPress GUID.
 * @return Caption drafts.
 */
export function fetchCaptionDrafts( guid: string ): Promise< SavedCaptionDraft[] > {
	return apiFetch( {
		path: addQueryArgs( REST_PATH, { guid } ),
	} );
}

/**
 * Save a caption draft.
 *
 * @param draft - Draft payload.
 * @return Saved draft.
 */
export function saveCaptionDraft( draft: CaptionDraft ): Promise< SavedCaptionDraft > {
	return apiFetch( {
		method: draft.id ? 'PUT' : 'POST',
		path: draft.id ? `${ REST_PATH }/${ draft.id }` : REST_PATH,
		data: draft,
	} );
}

/**
 * Convert a source text track to draft source metadata.
 *
 * @param track - Source track.
 * @return Source metadata.
 */
export function getSourceTrackMeta(
	track: VideoTextTrack | null
): Pick<
	CaptionDraftMeta,
	| typeof CAPTION_DRAFT_META.sourceTrackKind
	| typeof CAPTION_DRAFT_META.sourceTrackSrcLang
	| typeof CAPTION_DRAFT_META.sourceTrackSrc
> {
	return track
		? {
				[ CAPTION_DRAFT_META.sourceTrackKind ]: track.kind,
				[ CAPTION_DRAFT_META.sourceTrackSrcLang ]: track.srcLang,
				[ CAPTION_DRAFT_META.sourceTrackSrc ]: track.src,
		  }
		: {};
}
