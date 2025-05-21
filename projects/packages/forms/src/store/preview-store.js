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
	/**
	 * Gets information about the current step (label and index) based on the steps array.
	 * This is a higher-level selector that requires the steps array from the block editor.
	 *
	 * @param {object} state        - The store state
	 * @param {string} formClientId - The ID of the form
	 * @param {Array}  steps        - The array of step blocks from the block editor
	 * @return {object} An object with step information
	 */
	getCurrentStepInfo( state, formClientId, steps ) {
		const selectedStepId = selectors.getActivePreviewStepId( state, formClientId );

		if ( selectedStepId == null ) {
			return {
				stepLabel: '',
				index: -1,
				isFirstStep: false,
				isLastStep: false,
			};
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepId );
		if ( currentStepIndex >= 0 ) {
			const stepLabel = steps[ currentStepIndex ]?.attributes?.stepLabel || '';
			const result = {
				stepLabel,
				index: currentStepIndex,
				isFirstStep: currentStepIndex === 0,
				isLastStep: currentStepIndex === steps.length - 1,
			};

			return result;
		}
		return {
			stepLabel: '',
			index: -1,
			isFirstStep: false,
			isLastStep: false,
		};
	},
};

const STORE_NAME = 'jetpack/forms/preview';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
