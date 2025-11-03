import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	// Map of form client IDs to their single step mode state
	singleStepMode: {},
	// Map of form client IDs to their active step client ID
	activeStepId: {},
};

const actions = {
	/**
	 * Enable single step mode for a form.
	 *
	 * @param {string} formClientId - The client ID of the form.
	 * @return {object} Action object.
	 */
	enableSingleStepMode( formClientId ) {
		return {
			type: 'ENABLE_SINGLE_STEP_MODE',
			formClientId,
		};
	},

	/**
	 * Disable single step mode for a form.
	 *
	 * @param {string} formClientId - The client ID of the form.
	 * @return {object} Action object.
	 */
	disableSingleStepMode( formClientId ) {
		return {
			type: 'DISABLE_SINGLE_STEP_MODE',
			formClientId,
		};
	},

	/**
	 * Set the active step for a form.
	 *
	 * @param {string} formClientId - The client ID of the form.
	 * @param {string} stepClientId - The client ID of the step to set as active.
	 * @return {object} Action object.
	 */
	setActiveStep( formClientId, stepClientId ) {
		return {
			type: 'SET_ACTIVE_STEP',
			formClientId,
			stepClientId,
		};
	},
};

const selectors = {
	/**
	 * Check if a form is in single step mode.
	 *
	 * @param {object} state        - The store state.
	 * @param {string} formClientId - The client ID of the form.
	 * @return {boolean} Whether the form is in single step mode.
	 */
	isSingleStepMode( state, formClientId ) {
		return state.singleStepMode[ formClientId ] !== false;
	},

	/**
	 * Get the active step client ID for a form.
	 *
	 * @param {object} state        - The store state.
	 * @param {string} formClientId - The client ID of the form.
	 * @return {string|null} The client ID of the active step, or null if none.
	 */
	getActiveStepId( state, formClientId ) {
		return state.activeStepId[ formClientId ] || null;
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
		const selectedStepId = selectors.getActiveStepId( state, formClientId );

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

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'ENABLE_SINGLE_STEP_MODE':
			return {
				...state,
				singleStepMode: {
					...state.singleStepMode,
					[ action.formClientId ]: true,
				},
			};
		case 'DISABLE_SINGLE_STEP_MODE':
			return {
				...state,
				singleStepMode: {
					...state.singleStepMode,
					[ action.formClientId ]: false,
				},
			};
		case 'SET_ACTIVE_STEP':
			return {
				...state,
				activeStepId: {
					...state.activeStepId,
					[ action.formClientId ]: action.stepClientId,
				},
			};
		default:
			return state;
	}
};

const STORE_NAME = 'jetpack/forms/single-step';

export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );
