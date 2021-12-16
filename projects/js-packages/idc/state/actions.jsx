const SET_IS_ACTION_IN_PROGRESS = 'SET_IS_ACTION_IN_PROGRESS';

const actions = {
	setIsActionInProgress: isInProgress => {
		return { type: SET_IS_ACTION_IN_PROGRESS, isInProgress };
	},
};

export { SET_IS_ACTION_IN_PROGRESS, actions as default };
