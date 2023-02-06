const SET_IS_ACTION_IN_PROGRESS = 'SET_IS_ACTION_IN_PROGRESS';
const SET_ERROR_TYPE = 'SET_ERROR_TYPE';
const CLEAR_ERROR_TYPE = 'CLEAR_ERROR_TYPE';

const actions = {
	setIsActionInProgress: isInProgress => {
		return { type: SET_IS_ACTION_IN_PROGRESS, isInProgress };
	},
	setErrorType: errorType => {
		return { type: SET_ERROR_TYPE, errorType };
	},
	clearErrorType: () => {
		return { type: CLEAR_ERROR_TYPE };
	},
};

export { SET_IS_ACTION_IN_PROGRESS, SET_ERROR_TYPE, CLEAR_ERROR_TYPE, actions as default };
