import { SET_SOCIAL_IMAGE_GENERATOR_SETTINGS } from '../actions/social-image-generator-settings';

const socialImageGeneratorSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SOCIAL_IMAGE_GENERATOR_SETTINGS:
			return {
				...state,
				...action.options,
			};
	}
	return state;
};

export default socialImageGeneratorSettings;
