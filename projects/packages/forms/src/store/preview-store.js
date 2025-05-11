import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	forms: {}, // Store preview state per form
};

const actions = {
	enablePreview( formClientId ) {
		return {
			type: 'ENABLE_PREVIEW',
			payload: { formClientId },
		};
	},
	setPreviewStep( formClientId, stepClientId ) {
		return {
			type: 'SET_PREVIEW_STEP',
			payload: { formClientId, stepClientId },
		};
	},
	disablePreview( formClientId ) {
		return {
			type: 'DISABLE_PREVIEW',
			payload: { formClientId },
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_PREVIEW_STEP': {
			const { formClientId, stepClientId } = action.payload;
			const currentForm = state.forms[ formClientId ] || {};
			return {
				...state,
				forms: {
					...state.forms,
					[ formClientId ]: {
						activePreviewStepId: stepClientId,
						previewMode: !! currentForm.previewMode,
					},
				},
			};
		}
		case 'ENABLE_PREVIEW': {
			const { formClientId } = action.payload;
			const currentForm = state.forms[ formClientId ] || {};
			return {
				...state,
				forms: {
					...state.forms,
					[ formClientId ]: {
						activePreviewStepId: currentForm.activePreviewStepId || null,
						previewMode: true,
					},
				},
			};
		}
		case 'DISABLE_PREVIEW': {
			const { formClientId } = action.payload;
			const currentForm = state.forms[ formClientId ] || {};
			return {
				...state,
				forms: {
					...state.forms,
					[ formClientId ]: {
						activePreviewStepId: currentForm.activePreviewStepId || null,
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
