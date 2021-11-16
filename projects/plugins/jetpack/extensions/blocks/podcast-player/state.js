export const actions = {
	EDIT_URL: 'EDIT_URL',
	FINISH_EDITING: 'FINISH_EDITING',
	START_EDITING: 'START_EDITING',
	SELECT_EPISODE: 'SELECT_EPISODE',
	FEED_RECEIVED: 'FEED_RECEIVED',
	CLEAR_FEED: 'CLEAR_FEED',
	MAKE_INTERACTIVE: 'MAKE_INTERACTIVE',
	PREVENT_INTERACTIONS: 'PREVENT_INTERACTIONS',
	START_FETCH: 'START_FETCH',
	CHECK_URL: 'CHECK_URL',
};

export const podcastPlayerReducer = ( state, action ) => {
	switch ( action.type ) {
		case actions.EDIT_URL:
			return {
				...state,
				editedUrl: action.payload,
			};
		case actions.START_EDITING:
			return {
				...state,
				isEditing: true,
				isLoading: false,
			};
		case actions.FINISH_EDITING:
			return {
				...state,
				editedUrl: action.payload,
				isEditing: false,
			};
		case actions.FEED_RECEIVED:
			return {
				...state,
				isLoading: false,
				feedData: action.payload,
			};
		case actions.CLEAR_FEED:
			return {
				...state,
				feedData: {},
			};
		case actions.MAKE_INTERACTIVE:
			return {
				...state,
				isInteractive: true,
			};
		case actions.PREVENT_INTERACTIONS:
			return {
				...state,
				isInteractive: false,
			};
		case actions.START_FETCH:
			return {
				...state,
				isLoading: true,
			};
		case actions.SELECT_EPISODE:
			return {
				...state,
				selectedGuid: action.payload,
			};
		case actions.CHECK_URL:
			return {
				...state,
				selectedGuid: null,
				feedData: {},
				checkUrl: action.payload,
			};
		default:
			return { ...state };
	}
};
