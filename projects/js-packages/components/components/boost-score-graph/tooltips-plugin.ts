import ReactDOM from 'react-dom/client';
import uPlot from 'uplot';
import { Tooltip } from './tooltip';
import { Period } from '.';

/**
 * Custom tooltips plugin for uPlot.
 *
 * @param {Period[]} periods - The periods to display in the tooltip.
 * @returns {object} The uPlot plugin object with hooks.
 */
export function tooltipsPlugin( periods ) {
	const reactRoot = document.createElement( 'div' );
	const container = document.createElement( 'div' );
	let reactDom;

	/**
	 * Initializes the tooltips plugin.
	 *
	 * @param {uPlot} u - The uPlot instance.
	 * @param {object} _opts - Options for the uPlot instance.
	 */
	function init( u: uPlot, _opts: object ) {
		container.classList.add( 'jb-score-tooltips-container' );

		reactDom = ReactDOM.createRoot( reactRoot );
		reactRoot.style.position = 'absolute';
		reactRoot.style.bottom = -20 + 'px';
		reactRoot.style.translate = '-50% calc( 100% - 20px )';
		reactRoot.style.zIndex = '1000';

		container.appendChild( reactRoot );

		u.over.appendChild( container );

		/**
		 * Hides all tooltips.
		 */
		function hideTips() {
			reactRoot.style.display = 'none';
		}

		/**
		 * Shows all tooltips.
		 */
		function showTips() {
			reactRoot.style.display = null;
		}

		container.addEventListener( 'mouseleave', () => {
			hideTips();
		} );

		container.addEventListener( 'mouseenter', () => {
			showTips();
		} );
	}

	/**
	 * Called when the chart is resized.
	 * @param {uPlot} u - The uPlot instance.
	 */
	function setSize( u: uPlot ) {
		container.style.height = u.over.clientHeight + 'px';
	}

	/**
	 * Sets the cursor for tooltips.
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function setCursor( u ) {
		const { idx } = u.cursor;

		const period = periods[ idx ];

		// Timestamp of the cursor position
		const timestamp = u.data[ 0 ][ idx ];

		// Find start and end of day for the cursor position
		const startOfDay = timestamp - ( timestamp % 86400 );
		const endOfDay = startOfDay + 86400;

		// Find the left position, and width of the box, bounded by the range of the graph
		const boxLeft = u.valToPos( Math.max( startOfDay, u.scales.x.min ), 'x' );
		const boxWidth = u.valToPos( Math.min( endOfDay, u.scales.x.max ), 'x' ) - boxLeft;
		const boxCenter = boxLeft + boxWidth / 2;

		reactRoot.style.left = boxCenter + 'px';
		reactDom.render(
			Tooltip( {
				period,
			} )
		);
	}

	return {
		hooks: {
			init,
			setCursor,
			setSize,
		},
	};
}
