import uPlot from 'uplot';

/**
 * Definition of the column highlight plugin.
 *
 * @returns {object} The uPlot plugin object with hooks.
 */
export function dayHighlightPlugin() {
	let overEl, highlightEl;

	/**
	 * Initialize the plugin
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function init( u: uPlot ) {
		overEl = u.over;

		highlightEl = document.createElement( 'div' );

		highlightEl.classList.add( 'day-highlighter' );

		uPlot.assign( highlightEl.style, {
			pointerEvents: 'none',
			display: 'none',
			position: 'absolute',
			left: 0,
			top: 0,
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.04)',
		} );

		overEl.appendChild( highlightEl );

		// show/hide highlight on enter/exit
		overEl.addEventListener( 'mouseenter', () => {
			highlightEl.style.display = null;
		} );
		overEl.addEventListener( 'mouseleave', () => {
			highlightEl.style.display = 'none';
		} );
	}

	/**
	 * On update
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function update( u ) {
		const { idx } = u.cursor;

		// Timestamp of the cursor position
		const timestamp = u.data[ 0 ][ idx ];

		// Find start and end of day for the cursor position
		const startOfDay = timestamp - ( timestamp % 86400 );
		const endOfDay = startOfDay + 86400;

		// Find the left position, and width of the box, bounded by the range of the graph
		const boxLeft = u.valToPos( Math.max( startOfDay, u.scales.x.min ), 'x' );
		const boxWidth = u.valToPos( Math.min( endOfDay, u.scales.x.max ), 'x' ) - boxLeft;

		// Update the highlight box
		highlightEl.style.transform = 'translateX(' + Math.round( boxLeft ) + 'px)';
		highlightEl.style.width = Math.round( boxWidth ) + 'px';
	}

	return {
		opts: ( u, opts ) => {
			uPlot.assign( opts, {
				cursor: {
					x: false,
					y: false,
				},
			} );
		},
		hooks: {
			init: init,
			setCursor: update,
		},
	};
}
