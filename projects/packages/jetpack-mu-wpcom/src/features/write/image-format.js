/**
 * Write — image/figure formatting helpers.
 *
 * Pure-ish module extracted from view.js so it can be unit-tested without the
 * Interactivity API store or global DOM listeners. The figure helpers touch
 * only an element's `classList` / `className`, so tests can drive them with a
 * lightweight classList mock rather than full jsdom.
 */

// Image size presets we ship. Wide/full layouts and custom widths stay in the
// block editor (see RSM-3472).
export const IMAGE_SIZE_SLUGS = [ 'thumbnail', 'medium', 'large', 'full' ];

// Image alignment values we ship. All three are made explicit on save —
// every image gets an `align*` class on the figure and an `align`
// attribute in the block JSON, including center, so themes can rely on
// the class to position the figure (many don't center unaligned figures
// by default).
export const IMAGE_ALIGNS = [ 'left', 'center', 'right' ];

/**
 * Read the attachment ID embedded in `wp-image-<id>` on an `<img>`.
 *
 * @param {HTMLImageElement} img - The image element.
 * @return {number|null} Numeric attachment ID, or null when the class is absent.
 */
export function getMediaIdFromImg( img ) {
	if ( ! img ) return null;
	const match = img.className.match( /(?:^|\s)wp-image-(\d+)(?:\s|$)/ );
	return match ? parseInt( match[ 1 ], 10 ) : null;
}

/**
 * Toggle a size class on a figure, replacing any existing one.
 *
 * @param {Element} fig  - The figure element.
 * @param {string}  slug - A size slug or '' (clear).
 */
export function setFigureSize( fig, slug ) {
	IMAGE_SIZE_SLUGS.forEach( s => fig.classList.remove( 'size-' + s ) );
	if ( slug ) fig.classList.add( 'size-' + slug );
}

/**
 * Toggle an alignment class on a figure, replacing any existing one.  Always
 * adds one of alignleft/aligncenter/alignright so the published view centers
 * reliably (themes key off these classes; unaligned figures don't center
 * consistently across themes).
 *
 * @param {Element} fig   - The figure element.
 * @param {string}  align - 'left', 'center', or 'right'.
 */
export function setFigureAlignment( fig, align ) {
	fig.classList.remove( 'alignleft', 'alignright', 'aligncenter' );
	if ( align === 'left' ) fig.classList.add( 'alignleft' );
	else if ( align === 'right' ) fig.classList.add( 'alignright' );
	else fig.classList.add( 'aligncenter' );
}

/**
 * Read the current alignment from a figure's class list. Returns 'center'
 * when no align class is set.
 *
 * @param {Element} fig - The figure element.
 * @return {string} 'left', 'center', or 'right'.
 */
export function getFigureAlignment( fig ) {
	if ( fig.classList.contains( 'alignleft' ) ) return 'left';
	if ( fig.classList.contains( 'alignright' ) ) return 'right';
	return 'center';
}

/**
 * Pick the smallest reasonable thumbnail URL for the grid. Falls back to the
 * full-size source_url for images without registered sizes (e.g. uploads that
 * pre-date a media setting change).
 *
 * @param {object} media - Media item from /wp/v2/media.
 * @return {string} The thumbnail URL to render.
 */
export function libraryThumbUrl( media ) {
	const sizes = media.media_details?.sizes;
	return sizes?.thumbnail?.source_url || sizes?.medium?.source_url || media.source_url || '';
}
