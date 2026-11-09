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
		case 'SEED_JETPACK_MODULES':
			// Initial state is a page-load snapshot, so it must never replace data the store already holds.
			if ( Object.keys( state.data ?? {} ).length > 0 ) {
				return state;
			}
			return { ...state, data: action.data };
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
