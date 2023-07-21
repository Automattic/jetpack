import uPlot from 'uplot';

/**
 * Custom tooltips plugin for uPlot.
 *
 * @returns {object} The uPlot plugin object with hooks.
 */
export function tooltipsPlugin() {
	let cursortt;
	let seriestt;
	const context = {
		cursorMemo: new Map(),
	};

	/**
	 * Initializes the tooltips plugin.
	 *
	 * @param {uPlot} u - The uPlot instance.
	 * @param {object} opts - Options for the uPlot instance.
	 */
	function init( u, opts ) {
		const over = u.over;

		const tooltipCursor = ( cursortt = document.createElement( 'div' ) );
		tooltipCursor.className = 'tooltip';
		tooltipCursor.textContent = '(x,y)';
		tooltipCursor.style.pointerEvents = 'none';
		tooltipCursor.style.position = 'absolute';
		tooltipCursor.style.background = 'rgba(0,0,255,0.1)';
		over.appendChild( tooltipCursor );

		seriestt = opts.series.map( ( s, i ) => {
			if ( i === 0 ) {
				return;
			}

			const tt = document.createElement( 'div' );
			tt.className = 'tooltip';
			tt.textContent = 'Tooltip!';
			tt.style.pointerEvents = 'none';
			tt.style.position = 'absolute';
			tt.style.background = 'rgba(0,0,0,0.1)';
			tt.style.color = s.color;
			over.appendChild( tt );
			return tt;
		} );

		/**
		 * Hides all tooltips.
		 */
		function hideTips() {
			cursortt.style.display = 'none';
			seriestt.forEach( ( tt, i ) => {
				if ( i === 0 ) {
					return;
				}

				tt.style.display = 'none';
			} );
		}

		/**
		 * Shows all tooltips.
		 */
		function showTips() {
			cursortt.style.display = null;
			seriestt.forEach( ( tt, i ) => {
				if ( i === 0 ) {
					return;
				}

				const s = u.series[ i ];
				tt.style.display = s.show ? null : 'none';
			} );
		}

		over.addEventListener( 'mouseleave', () => {
			if ( ! u.cursor._lock ) {
				hideTips();
			}
		} );

		over.addEventListener( 'mouseenter', () => {
			showTips();
		} );

		if ( u.cursor.left < 0 ) {
			hideTips();
		} else {
			showTips();
		}
	}

	/**
	 * Sets the cursor for tooltips.
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function setCursor( u ) {
		const { left, top, idx } = u.cursor;
		context?.cursorMemo?.set( left, top );
		cursortt.style.left = left + 'px';
		cursortt.style.top = top + 'px';
		cursortt.textContent =
			'(' + u.posToVal( left, 'x' ).toFixed( 2 ) + ', ' + u.posToVal( top, 'y' ).toFixed( 2 ) + ')';

		seriestt.forEach( ( tt, i ) => {
			if ( i === 0 ) {
				return;
			}

			const s = u.series[ i ];

			if ( s.show ) {
				const xVal = u.data[ 0 ][ idx ];
				const yVal = u.data[ i ][ idx ];

				tt.textContent = '(' + xVal + ', ' + yVal + ')';

				tt.style.left = Math.round( u.valToPos( xVal, 'x' ) ) + 'px';
				tt.style.top = Math.round( u.valToPos( yVal, s.scale ) ) + 'px';
			}
		} );
	}

	return {
		hooks: {
			init,
			setCursor,
		},
	};
}
