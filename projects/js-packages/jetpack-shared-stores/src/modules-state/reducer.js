const defaultState = {
	isLoading: false,
	isUpdating: {},
	data: {},
};

const setModulesData = ( state = defaultState, action ) => {
	switch ( action.type ) {
		case 'SET_JETPACK_MODULES':
			return {
				...state,
				...action.options,
			};
		case 'SET_MODULE_UPDATING':
			return {
				...state,
				...{
					isUpdating: {
						...state.isUpdating,
						[ action.name ]: action.isUpdating,
					},
				},
			};
	}
	return state;
};

export default setModulesData;
