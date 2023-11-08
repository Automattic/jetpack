import { merge } from 'lodash';
import {
	SET_AUTO_CONVERSION_SETTINGS,
	SET_JETPACK_SOCIAL_SETTINGS,
	SET_SOCIAL_IMAGE_GENERATOR_SETTINGS,
} from '../actions/jetpack-social-settings';

const jetpackSocialSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_JETPACK_SOCIAL_SETTINGS:
			return merge( {}, state, action.options );
		case SET_AUTO_CONVERSION_SETTINGS:
			return merge( {}, state, { autoConversionSettings: action.options } );
		case SET_SOCIAL_IMAGE_GENERATOR_SETTINGS:
			return merge( {}, state, { socialImageGeneratorSettings: action.options } );
	}
	return state;
};

export default jetpackSocialSettings;
