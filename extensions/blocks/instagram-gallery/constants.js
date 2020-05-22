/**
 * External dependencies
 */
import { get } from 'lodash';

export const IS_CURRENT_USER_CONNECTED_TO_WPCOM = get( window.Jetpack_Editor_Initial_State, [
	'jetpack',
	'is_current_user_connected',
] );

export const MAX_IMAGE_COUNT = 30;

export const NEW_INSTAGRAM_CONNECTION = 'jetpack-new-instagram-connection';
