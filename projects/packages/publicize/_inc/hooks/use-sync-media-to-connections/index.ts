import { useSyncFeaturedImageToConnections } from './use-sync-featured-image-to-connections';
import { useSyncSigToConnections } from './use-sync-sig-to-connections';

/**
 * Hook that syncs media URLs to connections based on their media source.
 *
 * When per-network customization is enabled, this hook updates the attached_media
 * field for connections based on their media_source:
 * - 'sig': Uses the SIG URL computed from the global token
 * - 'featured-image': Uses the featured image URL from the post
 */
export function useSyncMediaToConnections() {
	useSyncSigToConnections();
	useSyncFeaturedImageToConnections();
}
