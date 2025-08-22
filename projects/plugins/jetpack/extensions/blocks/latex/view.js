import domReady from '@wordpress/dom-ready';
import katex from 'katex';
import './style.scss';

function renderAllLatexBlocks() {
	const blocks = document.querySelectorAll( '.jetpack-latex' );
	blocks.forEach( block => {
		const latex = block.getAttribute( 'data-latex' ) || '';
		const renderContainers = block.querySelectorAll( '.jetpack-latex-render' );
		renderContainers.forEach( renderContainer => {
			renderContainer.innerHTML = katex.renderToString( latex, {
				throwOnError: false,
			} );
		} );
	} );
}

domReady( renderAllLatexBlocks );
