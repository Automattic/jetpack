export function tokens( state = {}, action ) {
	switch ( action.type ) {
		case 'INSTAGRAM_GALLERY_BLOCK_TOKEN_CONNECT':
			return { ...state, [ action.token ]: 'connected' };
		case 'INSTAGRAM_GALLERY_BLOCK_TOKEN_DISCONNECT':
			return { ...state, [ action.token ]: 'disconnected' };
	}

	return state;
}
