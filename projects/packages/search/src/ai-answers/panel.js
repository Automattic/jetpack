import { markdownToHtml } from '../instant-search/lib/markdown';

const DEFAULT_STRINGS = {
	aiAnswer: 'AI answer',
	aiAnswersFinding: 'Finding an answer',
	aiAnswersError: 'Sorry, an error occurred while generating an answer.',
	aiAnswersShowMore: 'Show more',
	aiAnswersErrorCode: 'Error code: %s',
};

/**
 * Return an absolute http(s) citation URL or a harmless placeholder.
 *
 * @param {string} url - Citation URL.
 * @return {string} Safe URL for href.
 */
function safeCitationUrl( url ) {
	return /^https?:\/\//i.test( url ) ? url : '#';
}

/**
 * Build a tiny animated ellipsis span.
 *
 * @param {Document} doc - Owner document.
 * @return {HTMLElement} Ellipsis span.
 */
function createEllipsis( doc ) {
	const span = doc.createElement( 'span' );
	span.className = 'jp-search-answers-panel__ellipsis';
	span.setAttribute( 'aria-hidden', 'true' );
	span.textContent = '...';
	return span;
}

/**
 * Create a DOM renderer for AI Answers panels.
 *
 * @param {HTMLElement} container          - Panel container.
 * @param {object}      options            - Renderer options.
 * @param {object}      options.strings    - UI strings.
 * @param {Function}    options.onShowMore - Show-more callback.
 * @return {{render: Function}} Panel renderer.
 */
export function createAiAnswersPanel( container, { strings = {}, onShowMore = () => {} } = {} ) {
	const labels = { ...DEFAULT_STRINGS, ...strings };

	return {
		render( displayState ) {
			if ( ! container ) {
				return;
			}

			const { ownerDocument: doc } = container;
			container.replaceChildren();

			if ( ! displayState || displayState.status === 'idle' ) {
				container.hidden = true;
				return;
			}

			container.hidden = false;
			const panel = doc.createElement( 'div' );
			panel.className = 'jp-search-answers-panel';
			if ( displayState.status === 'error' ) {
				panel.classList.add( 'jp-search-answers-panel--error' );
				panel.setAttribute( 'role', 'alert' );
			} else {
				panel.setAttribute( 'aria-live', 'polite' );
			}

			const heading = doc.createElement( 'h2' );
			heading.className = 'jp-search-answers-panel__heading';
			heading.textContent = labels.aiAnswer;
			panel.appendChild( heading );

			if ( displayState.status === 'error' ) {
				const error = doc.createElement( 'div' );
				error.className = 'jp-search-answers-panel__error';
				const message = doc.createElement( 'p' );
				message.className = 'jp-search-answers-panel__error-message';
				message.textContent = labels.aiAnswersError;
				error.appendChild( message );

				if ( displayState.error ) {
					const detail = doc.createElement( 'p' );
					detail.className = 'jp-search-answers-panel__error-detail';
					detail.textContent = displayState.error.message;
					if ( displayState.error.code !== null ) {
						detail.appendChild( doc.createElement( 'br' ) );
						detail.append( labels.aiAnswersErrorCode.replace( '%s', displayState.error.code ) );
					}
					error.appendChild( detail );
				}
				panel.appendChild( error );
				container.appendChild( panel );
				return;
			}

			if ( displayState.status === 'loading' ) {
				const loading = doc.createElement( 'div' );
				loading.className = 'jp-search-answers-panel__loading';
				loading.append( labels.aiAnswersFinding, createEllipsis( doc ) );
				panel.appendChild( loading );
			}

			if ( displayState.status === 'streaming' || displayState.status === 'done' ) {
				const content = doc.createElement( 'div' );
				content.className = 'jp-search-answers-panel__content';
				const text = doc.createElement( 'div' );
				text.className = 'jp-search-answers-panel__text';
				text.innerHTML = markdownToHtml( displayState.text );
				content.appendChild( text );

				if ( displayState.status === 'done' && displayState.citations.length > 0 ) {
					const citations = doc.createElement( 'ul' );
					citations.className = 'jp-search-answers-panel__citations';
					displayState.citations.forEach( citation => {
						const item = doc.createElement( 'li' );
						const link = doc.createElement( 'a' );
						link.href = safeCitationUrl( citation.url );
						link.target = '_blank';
						link.rel = 'noopener noreferrer';
						link.textContent = citation.title;
						item.appendChild( link );
						citations.appendChild( item );
					} );
					content.appendChild( citations );
				}

				panel.appendChild( content );
			}

			if ( displayState.showExtended && displayState.loadingHint ) {
				const hint = doc.createElement( 'p' );
				hint.className = 'jp-search-answers-panel__loading-hint';
				hint.append(
					displayState.loadingHint.endsWith( '…' )
						? displayState.loadingHint.slice( 0, -1 )
						: displayState.loadingHint,
					createEllipsis( doc )
				);
				panel.appendChild( hint );
			}

			if ( displayState.canShowMore ) {
				const button = doc.createElement( 'button' );
				button.className = 'jp-search-answers-panel__toggle';
				button.type = 'button';
				button.textContent = labels.aiAnswersShowMore;
				button.addEventListener( 'click', onShowMore );
				panel.appendChild( button );
			}

			container.appendChild( panel );
		},
	};
}
