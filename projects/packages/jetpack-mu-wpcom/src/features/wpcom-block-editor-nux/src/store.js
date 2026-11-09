import { combineReducers, registerStore } from '@wordpress/data';
import { apiFetch as apiFetchControls, controls } from '@wordpress/data-controls';

const shouldShowFirstPostPublishedModalReducer = ( state = false, action ) => {
	switch ( action.type ) {
		case 'WPCOM_SET_SHOULD_SHOW_FIRST_POST_PUBLISHED_MODAL':
			return action.value;
		default:
			return state;
	}
};

const fourForFourEligibleReducer = ( state = false, action ) => {
	switch ( action.type ) {
		case 'WPCOM_SET_FOUR_FOR_FOUR_ELIGIBLE':
			return action.value;
		default:
			return state;
	}
};

const reducer = combineReducers( {
	shouldShowFirstPostPublishedModal: shouldShowFirstPostPublishedModalReducer,
	fourForFourEligible: fourForFourEligibleReducer,
} );

export const actions = {
	*fetchShouldShowFirstPostPublishedModal() {
		const response = yield apiFetchControls( {
			path: '/wpcom/v2/block-editor/should-show-first-post-published-modal',
		} );

		return {
			type: 'WPCOM_SET_SHOULD_SHOW_FIRST_POST_PUBLISHED_MODAL',
			value: response.should_show_first_post_published_modal,
		};
	},
	setFourForFourEligible: value => ( {
		type: 'WPCOM_SET_FOUR_FOR_FOUR_ELIGIBLE',
		value,
	} ),
	// Resolves to whether the decision was saved. An opt-in must be saved before
	// the writer leaves for the Reader, where only opted-in writers can complete.
	*setFourForFourStatus( status ) {
		if ( status === 'opted_out' ) {
			yield { type: 'WPCOM_SET_FOUR_FOR_FOUR_ELIGIBLE', value: false };
		}
		try {
			yield apiFetchControls( {
				path: '/wpcom/v2/block-editor/four-for-four',
				method: 'POST',
				data: { status },
			} );
		} catch {
			return false;
		}
		return true;
	},
};

export const resolvers = {
	*isFourForFourEligible() {
		const response = yield apiFetchControls( { path: '/wpcom/v2/block-editor/four-for-four' } );
		return actions.setFourForFourEligible( !! response.eligible );
	},
};

export const selectors = {
	getShouldShowFirstPostPublishedModal: state => state.shouldShowFirstPostPublishedModal,
	isFourForFourEligible: state => state.fourForFourEligible,
};

/**
 * Register the wpcom-welcome-guide store
 *
 * @return {object} The registered store.
 */
export function register() {
	return registerStore( 'automattic/wpcom-welcome-guide', {
		reducer,
		actions,
		selectors,
		resolvers,
		controls,
		persist: true,
	} );
}
