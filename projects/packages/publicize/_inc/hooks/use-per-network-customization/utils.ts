import { AttachedMedia, MediaSourceValue } from '../../utils';

interface ComputeAttachedMediaParams {
	mediaSource: MediaSourceValue | undefined;
	globalAttachedMedia: Array< AttachedMedia > | undefined;
	featuredImageId: number | undefined;
	featuredImageUrl: string | undefined;
	featuredImageMime: string;
}

/**
 * Compute attached media for per-network mode based on media source.
 * Per-network mode forces attachment, so we need to populate attached_media
 * appropriately based on the effective source.
 *
 * @param {ComputeAttachedMediaParams} params - Parameters for computing attached media
 * @return {Array<AttachedMedia> | undefined} The computed attached media
 */
export function computeAttachedMediaForSource( {
	mediaSource,
	globalAttachedMedia,
	featuredImageId,
	featuredImageUrl,
	featuredImageMime,
}: ComputeAttachedMediaParams ): Array< AttachedMedia > | undefined {
	// Determine effective source (detect featured image fallback if undefined)
	let effectiveSource: MediaSourceValue | undefined = mediaSource;
	if ( effectiveSource === undefined && featuredImageId ) {
		effectiveSource = 'featured-image';
	}

	switch ( effectiveSource ) {
		case 'media-library':
		case 'upload-video':
			return globalAttachedMedia;
		case 'featured-image':
			if ( featuredImageId && featuredImageUrl ) {
				return [ { id: featuredImageId, url: featuredImageUrl, type: featuredImageMime } ];
			}
			return undefined;
		case 'sig':
			// For SIG, use global attached media (contains SIG URL)
			return globalAttachedMedia;
		default:
			return undefined;
	}
}

/**
 * Get the effective media source, detecting featured image fallback if needed.
 *
 * @param {MediaSourceValue | undefined} mediaSource     - The explicit media source
 * @param {number | undefined}           featuredImageId - The featured image ID
 * @return {MediaSourceValue | undefined} The effective media source
 */
export function getEffectiveMediaSource(
	mediaSource: MediaSourceValue | undefined,
	featuredImageId: number | undefined
): MediaSourceValue | undefined {
	if ( mediaSource === undefined && featuredImageId ) {
		return 'featured-image';
	}
	return mediaSource;
}
