import type { PlayerApi } from './loader';

/**
 * Return valid intrinsic dimensions as the block's height-to-width percentage.
 *
 * @param dimensions - The player API or message payload.
 * @return The ratio, or null while dimensions are unknown or invalid.
 */
export function getVideoRatio( dimensions: unknown ): number | null {
	if ( ! dimensions || typeof dimensions !== 'object' ) {
		return null;
	}
	const { width, height } = dimensions as { width: number; height: number };
	const ratio = ( height / width ) * 100;
	return Number.isFinite( width ) &&
		width > 0 &&
		Number.isFinite( height ) &&
		height > 0 &&
		Number.isFinite( ratio ) &&
		ratio > 0
		? ratio
		: null;
}

/**
 * Follow shape changes and recover dimensions announced before this subscription.
 *
 * @param api      - The mounted player's API; older bundles may lack dimensions.
 * @param callback - Receives the height-to-width percentage.
 * @return A function that stops listening and ignores pending reads.
 */
export function observeVideoRatio(
	api: PlayerApi | null | undefined,
	callback: ( ratio: number ) => void
): () => void {
	const info = api?.info;
	if ( ! info?.dimensions || ! info.onDimensionsChanged ) {
		return () => {};
	}
	let active = true;
	let receivedChange = false;
	const apply = ( dimensions: unknown ) => {
		const ratio = getVideoRatio( dimensions );
		if ( active && ratio !== null ) {
			callback( ratio );
		}
	};
	const id = info.onDimensionsChanged( dimensions => {
		receivedChange = true;
		apply( dimensions );
	} );
	info
		.dimensions()
		.then( dimensions => {
			// A delayed initial read must not overwrite a newer media event.
			if ( ! receivedChange ) {
				apply( dimensions );
			}
		} )
		.catch( () => {} );
	return () => {
		active = false;
		info.offDimensionsChanged?.( id );
	};
}
