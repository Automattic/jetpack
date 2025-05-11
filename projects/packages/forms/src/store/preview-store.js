import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	forms: {}, // Store preview state per form
};

const actions = {
	setPreviewMode( formClientId, previewMode ) {
		return {
			type: 'SET_PREVIEW_MODE',
			payload: { formClientId, previewMode },
		};
	},
	setActivePreviewStepId( formClientId, stepClientId ) {
		return {
			type: 'SET_ACTIVE_PREVIEW_STEP_ID',
			payload: { formClientId, stepClientId },
		};
	},
	showAllSteps( formClientId ) {
		return {
			type: 'SHOW_ALL_STEPS',
			payload: { formClientId },
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
						activePreviewStepId: stepClientId,
						previewMode: true,
					},
				},
			};
		}
		case 'SET_PREVIEW_MODE': {
			const { formClientId, previewMode } = action.payload;
			return {
				...state,
				forms: {
					...state.forms,
					[ formClientId ]: {
						activePreviewStepId: null,
						previewMode,
					},
				},
			};
		}
		case 'SHOW_ALL_STEPS': {
			const { formClientId } = action.payload;
			return {
				...state,
				forms: {
					...state.forms,
					[ formClientId ]: {
						activePreviewStepId: null,
						previewMode: false,
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
		return state.forms[ formClientId ]?.activePreviewStepId ?? null;
	},
	isPreviewMode( state, formClientId ) {
		return !! state.forms[ formClientId ]?.previewMode;
	},
};

const STORE_NAME = 'jetpack/forms/preview';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
