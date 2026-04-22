import { store } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	actions: {
		/**
		 * Apply a new sort order and re-run search.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} search action.
		 */
		*onSortChange( event ) {
			const { state, actions } = store( NAMESPACE );
			state.sortOrder = event.target.value;
			yield actions.search();
		},
	},
} );
