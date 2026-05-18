import { store } from '@wordpress/interactivity';
import { createAiAnswersController } from '../../../ai-answers/controller';
import { createAiAnswersPanel } from '../../../ai-answers/panel';
import '../../../ai-answers/style.scss';
import './style.scss';
// Importing the store registers the shared actions/state on pages with this block.
import '../../store';

const NAMESPACE = 'jetpack-search';
const panels = new WeakMap();

/**
 * Initialize AI Answers panels rendered by results-list blocks.
 */
function initializeAiAnswers() {
	const { state } = store( NAMESPACE );
	if ( ! state.aiAnswersEnabled ) {
		return;
	}

	document.querySelectorAll( '[data-jetpack-search-ai-answers]' ).forEach( container => {
		if ( panels.has( container ) ) {
			return;
		}

		const refs = {};
		const panel = createAiAnswersPanel( container, {
			strings: state.strings,
			onShowMore: () => refs.controller?.showMore(),
		} );
		refs.controller = createAiAnswersController( {
			siteId: state.siteId,
			options: {
				aiAnswersEnabled: state.aiAnswersEnabled,
				homeUrl: state.homeUrl,
				locale: state.locale,
			},
			getFilters: () => state.activeFilters,
			strings: state.strings,
			onUpdate: displayState => panel.render( displayState ),
		} );

		window.addEventListener( 'jetpack-search:search-start', event => {
			refs.controller.start( event.detail?.query ?? '' );
		} );

		panels.set( container, refs.controller );
	} );
}

if ( document.readyState !== 'loading' ) {
	initializeAiAnswers();
} else {
	document.addEventListener( 'DOMContentLoaded', initializeAiAnswers );
}
