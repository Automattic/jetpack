import uPlot from 'uplot';
import { Annotation } from '.';

import './style-annotation.scss';

// eslint-disable-next-line jsdoc/require-returns
/**
 * Custom tooltips plugin for uPlot.
 *
 * @param {Annotation[]} annotations - The periods to display in the tooltip.
 */
export function annotationsPlugin( annotations: Annotation[] ) {
	let containerEl, annotationsContainer;

	/**
	 * Initialize the plugin
	 *
	 * @param {uPlot} u - The uPlot instance.
	 */
	function init( u: uPlot ) {
		containerEl = u.under;

		annotationsContainer = document.createElement( 'div' );

		annotationsContainer.classList.add( 'jb-graph-annotations' );

		const annotationEl = document.createElement( 'div' );
		annotationEl.classList.add( 'jb-graph-annotations__annotation' );

		annotations.forEach( annotation => {
			const lineEl = document.createElement( 'div' );
			lineEl.classList.add( 'jb-graph-annotations__line' );
			lineEl.addEventListener( 'mouseenter', () => {
				annotationEl.innerHTML = annotation.text;
				annotationEl.style.display = 'block';
				annotationEl.style.left = u.valToPos( annotation.timestamp / 1000, 'x' ) + 'px';
			} );

			annotation.line = lineEl;
			annotationsContainer.appendChild( lineEl );
		} );

		annotationEl.addEventListener( 'mouseleave', () => {
			annotationEl.style.display = 'none';
		} );

		containerEl.appendChild( annotationsContainer );
		u.over.appendChild( annotationEl );
	}

	/**
	 * Called when the chart is resized.
	 * @param {uPlot} u - The uPlot instance.
	 */
	function setSize( u: uPlot ) {
		annotations.forEach( annotation => {
			const annotationEl = annotation.line;

			uPlot.assign( annotationEl.style, {
				left: u.valToPos( annotation.timestamp / 1000, 'x' ) + 'px',
			} );
		} );
	}

	return {
		hooks: {
			init,
			setSize,
		},
	};
}
