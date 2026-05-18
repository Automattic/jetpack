import { createAiAnswersController } from './controller';
import { createAiAnswersPanel } from './panel';
import './style.scss';

const DEFAULT_TITLE_SELECTORS = [
	'.wp-block-query-title',
	'.page-title',
	'.archive-title',
	'.entry-title',
	'.nv-page-title',
	'.page-subheading',
];

/**
 * Find the best insertion point for the theme-search AI answer panel.
 *
 * @param {Array<string>} selectors - Title selectors.
 * @return {Element|null} Target element.
 */
function findInsertionTarget( selectors ) {
	for ( const selector of selectors ) {
		const target = document.querySelector( selector );
		if ( target ) {
			return target;
		}
	}
	return document.querySelector( 'main' ) || document.body;
}

/**
 * Insert the AI Answers container into the theme search results page.
 *
 * @param {object} options - Server-provided options.
 * @return {HTMLElement|null} Container element.
 */
function createContainer( options ) {
	const selectors = options.titleSelectors || DEFAULT_TITLE_SELECTORS;
	const target = findInsertionTarget( selectors );
	if ( ! target ) {
		return null;
	}

	const container = document.createElement( 'div' );
	container.className = 'jetpack-search-ai-answers';
	container.hidden = true;

	if ( target.matches?.( 'main, body' ) ) {
		target.prepend( container );
		return container;
	}

	target.insertAdjacentElement( 'afterend', container );
	return container;
}

/**
 * Boot AI Answers for theme-rendered search results.
 */
function initializeThemeSearchAiAnswers() {
	const options = window.JetpackSearchAIAnswersOptions || {};
	const query = ( options.query ?? '' ).trim();
	if ( options.aiAnswersEnabled === false || ! query ) {
		return;
	}

	const container = createContainer( options );
	if ( ! container ) {
		return;
	}

	const refs = {};
	const panel = createAiAnswersPanel( container, {
		strings: options.strings,
		onShowMore: () => refs.controller?.showMore(),
	} );
	refs.controller = createAiAnswersController( {
		siteId: options.siteId,
		options,
		strings: options.strings,
		onUpdate: displayState => panel.render( displayState ),
	} );
	refs.controller.start( query );
}

if ( document.readyState !== 'loading' ) {
	initializeThemeSearchAiAnswers();
} else {
	document.addEventListener( 'DOMContentLoaded', initializeThemeSearchAiAnswers );
}
