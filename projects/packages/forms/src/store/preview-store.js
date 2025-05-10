import { registerStore } from '@wordpress/data';

// Ensure this is consistent or imported from a central place if used elsewhere
const ALL_STEPS_VALUE = '__all__';

const DEFAULT_STATE = {
	forms: {}, // Store preview state per form
};

const actions = {
	setActivePreviewStepId( formClientId, stepClientId ) {
		return {
			type: 'SET_ACTIVE_PREVIEW_STEP_ID',
			payload: { formClientId, stepClientId },
		};
	},
	showAllSteps( formClientId ) {
		return {
			type: 'SET_ACTIVE_PREVIEW_STEP_ID', // Same action type
			payload: { formClientId, stepClientId: ALL_STEPS_VALUE },
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_ACTIVE_PREVIEW_STEP_ID': {
			const { formClientId, stepClientId } = action.payload;
			return {
				...state,
				forms: {
					...state.forms,
					[ formClientId ]: {
						...( state.forms[ formClientId ] || {} ),
						activePreviewStepId: stepClientId,
					},
				},
			};
		}
		default:
			return state;
	}
};

const selectors = {
	getActivePreviewStepId( state, formClientId ) {
		return state.forms[ formClientId ]?.activePreviewStepId || ALL_STEPS_VALUE;
	},
	isPreviewMode( state, formClientId ) {
		const activeStep = state.forms[ formClientId ]?.activePreviewStepId;
		return activeStep !== undefined && activeStep !== ALL_STEPS_VALUE;
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
