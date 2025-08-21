/**
 * On frontend, load KaTeX (if not already present in the page), then render formulas.
 */

// Extend the global Window interface to include katex
declare global {
	interface Window {
		katex?: {
			renderToString: (
				latex: string,
				options: { throwOnError: boolean; displayMode: boolean }
			) => string;
		};
	}
}

function loadKatexAssets( callback: () => void ): void {
	const cssUrl = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
	const jsUrl = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';

	if ( ! document.querySelector( 'link[data-katex]' ) ) {
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = cssUrl;
		link.setAttribute( 'data-katex', 'true' );
		document.head.appendChild( link );
	}

	if ( typeof window.katex !== 'undefined' ) {
		callback();
	} else {
		const script = document.createElement( 'script' );
		script.src = jsUrl;
		script.async = true;
		script.setAttribute( 'data-katex', 'true' );
		script.onload = callback;
		document.body.appendChild( script );
	}
}

function renderAllLatexBlocks(): void {
	const blocks = document.querySelectorAll( '.jetpack-latex-formula' );
	blocks.forEach( block => {
		const latex = block.getAttribute( 'data-latex' ) || '';
		const renderContainer = block.querySelector( '.jetpack-latex-formula-render' ) as HTMLElement;

		if ( window.katex && renderContainer ) {
			try {
				renderContainer.innerHTML = window.katex.renderToString( latex, {
					throwOnError: false,
					displayMode: true,
				} );
			} catch ( e ) {
				renderContainer.innerHTML = '<span style="color:red;">Latex error</span>';
			}
		}
	} );
}

// On DOMContentLoaded
document.addEventListener( 'DOMContentLoaded', function () {
	loadKatexAssets( renderAllLatexBlocks );
} );
