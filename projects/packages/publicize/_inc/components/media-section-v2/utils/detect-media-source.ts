/**
 * Detect media source utility
 */

import { MediaSourceType } from '../types';

/**
 * Detect the current media source based on existing data (for backward compatibility)
 *
 * @param {Array}   attachedMedia   - Attached media array
 * @param {number}  featuredImageId - Featured image ID
 * @param {boolean} sigEnabled      - Whether SIG is enabled
 * @return {MediaSourceType} Current media source type
 */
export function detectMediaSource(
	attachedMedia: Array< { id: number; url: string; type: string } >,
	featuredImageId: number | null,
	sigEnabled: boolean
): MediaSourceType {
	// Priority 1: Attached media (uploaded content)
	if ( attachedMedia && attachedMedia.length > 0 ) {
		// Check if attached media is the featured image (shared as attachment)
		if ( featuredImageId && attachedMedia[ 0 ].id === featuredImageId ) {
			return 'featured-image';
		}
		// Check if it's SIG in attachment mode (id=0 with SIG enabled)
		if ( sigEnabled && attachedMedia[ 0 ].id === 0 ) {
			return 'sig';
		}
		return 'media-library';
	}

	// Priority 2: Social Image Generator
	if ( sigEnabled ) {
		return 'sig';
	}

	// Priority 3: Featured Image
	if ( featuredImageId ) {
		return 'featured-image';
	}

	// No media selected
	return null;
}
