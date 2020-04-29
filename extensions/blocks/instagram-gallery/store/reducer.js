/**
 * External dependencies
 */
import { union, without } from 'lodash';

export default function( state = [], action ) {
	switch ( action.type ) {
		case 'INSTAGRAM_GALLERY_BLOCK_ADD_TOKEN':
			return union( state, [ action.token ] );
		case 'INSTAGRAM_GALLERY_BLOCK_REMOVE_TOKEN':
			return without( state, state, [ action.token ] );
	}

	return state;
}
