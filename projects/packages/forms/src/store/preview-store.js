import { registerStore } from '@wordpress/data';

// Ensure this is consistent or imported from a central place if used elsewhere
const ALL_STEPS_VALUE = '__all__';

const DEFAULT_STATE = {
	activePreviewStepId: ALL_STEPS_VALUE,
};

const actions = {
	setActivePreviewStepId( clientId ) {
		return {
			type: 'SET_ACTIVE_PREVIEW_STEP_ID',
			payload: { clientId },
		};
	},
	showAllSteps() {
		return {
			type: 'SET_ACTIVE_PREVIEW_STEP_ID', // Same action type, different payload
			payload: { clientId: ALL_STEPS_VALUE },
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_ACTIVE_PREVIEW_STEP_ID':
			return {
				...state,
				activePreviewStepId: action.payload.clientId,
			};
		default:
			return state;
	}
};

const selectors = {
	getActivePreviewStepId( state ) {
		return state.activePreviewStepId;
	},
	isPreviewMode( state ) {
		return state.activePreviewStepId !== ALL_STEPS_VALUE;
	},
};

// The unique name for the store
const STORE_NAME = 'jetpack/forms/preview';

registerStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
	// initialState: DEFAULT_STATE, // initialState can be set here or handled by reducer default
} );

// Exporting constants and store name can be useful for consumers
export { ALL_STEPS_VALUE, STORE_NAME };
// No need to export the store object itself from registerStore, it's globally registered.
