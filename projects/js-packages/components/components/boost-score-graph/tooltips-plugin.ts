import ReactDOM from 'react-dom/client';
import uPlot from 'uplot';
import { Period } from './index.tsx';
import { Tooltip } from './tooltip.tsx';

/**
 * Custom tooltips plugin for uPlot.
 *
 * @param periods - The periods to display in the tooltip.
 * @return The uPlot plugin object with hooks.
 */
export function tooltipsPlugin( periods: Period[] ) {
	const reactRoot = document.createElement( 'div' );
	const container = document.createElement( 'div' );
	let reactDom;

	/**
	 * Initializes the tooltips plugin.
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function init( u: uPlot ) {
		container.classList.add( 'jb-score-tooltips-container' );
		if ( ! reactDom ) {
			reactDom = ReactDOM.createRoot( reactRoot );
		}
		reactRoot.classList.add( 'jb-score-tooltip-react-root' );

		container.appendChild( reactRoot );

		u.over.appendChild( container );

		u.over.addEventListener( 'mouseenter', () => {
			container.classList.add( 'visible' );
		} );

		u.over.addEventListener( 'mouseleave', () => {
			container.classList.remove( 'visible' );
		} );

		reactRoot.addEventListener( 'mouseenter', () => {
			reactRoot.classList.add( 'visible' );
		} );

		reactRoot.addEventListener( 'mouseleave', () => {
			reactRoot.classList.remove( 'visible' );
		} );
	}

	/**
	 * Called when the chart is resized.
	 * @param {uPlot} u - The uPlot instance.
	 */
	function setSize( u: uPlot ) {
		container.style.paddingTop = u.over.clientHeight + 'px';
	}

	/**
	 * Sets the cursor for tooltips.
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function setCursor( u ) {
		const { idx } = u.cursor;

		const period = periods[ idx ];

		if ( ! period ) {
			return;
		}

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
