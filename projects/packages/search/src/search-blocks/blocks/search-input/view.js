import { store } from '@wordpress/interactivity';
import './style.scss';

const NAMESPACE = 'jetpack-search';
let debounceTimer = null;
const DEBOUNCE_MS = 300;

store( NAMESPACE, {
	actions: {
		onSearchInput( event ) {
			const { actions, state } = store( NAMESPACE );
			state.searchQuery = event.target.value;

			clearTimeout( debounceTimer );
			debounceTimer = setTimeout( () => {
				actions.search();
			}, DEBOUNCE_MS );
		},

		onSearchKeydown( event ) {
			if ( event.key === 'Enter' ) {
				clearTimeout( debounceTimer );
				const { actions } = store( NAMESPACE );
				actions.search();
			}
		},

		/**
		 * Clear the current search query and re-run search.
		 *
		 * @yield {Promise} search action.
		 */
		*clearSearch() {
			const { state, actions } = store( NAMESPACE );
			state.searchQuery = '';
			yield actions.search();
		},
	},
} );
