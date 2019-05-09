/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import analytics from '../../_inc/client/lib/analytics';

const trackGutenbergSearch = event => {
	const searchTerm = event.target.value;
	const hasResults = document.getElementsByClassName( 'editor-inserter__no-results' ).length === 0;

	if ( searchTerm === '' ) {
		return;
	}

	analytics.tracks.recordEvent( 'jetpack_gutenberg_block_picker_search_term', {
		searchTerm: searchTerm,
	} );

	if ( hasResults ) {
		return;
	}

	// Create a separate event for search with no results to make it easier to filter by them
	analytics.tracks.recordEvent( 'jetpack_gutenberg_block_picker_no_results', {
		searchTerm: searchTerm,
	} );
};

registerPlugin( 'track-no-search-results', {
	render: () => {
		document.onkeyup = event => {
			if ( event.target.id.indexOf( 'editor-inserter__search' ) === 0 ) {
				trackGutenbergSearch( event );
			}
		};

		return null;
	},
} );
