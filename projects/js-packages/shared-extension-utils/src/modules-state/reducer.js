const defaultState = {
	isLoading: false,
	isUpdating: false,
	data: {},
};

const setModulesData = ( state = defaultState, action ) => {
	switch ( action.type ) {
		case 'SET_JETPACK_MODULES':
			return {
				...state,
				...action.options,
			};
	}
	return state;
};

export default setModulesData;
