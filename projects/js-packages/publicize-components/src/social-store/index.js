import { createReduxStore, register } from '@wordpress/data';
import actions from './actions';
import controls from './controls';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const SOCIAL_STORE_ID = 'jetpack-social-plugin';
export const SOCIAL_STORE_CONFIG = {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState:
		window?.jetpackSocialInitialState || // Jetpack Social
		window?.Initial_State?.socialInitialState || // Jetpack Dashboard
		window?.Jetpack_Editor_Initial_State?.social || // Gutenberg
		{},
};

export const CONNECTION_SERVICE_FACEBOOK = 'facebook';
export const CONNECTION_SERVICE_INSTAGRAM_BUSINESS = 'instagram-business';
export const CONNECTION_SERVICE_LINKEDIN = 'linkedin';
export const CONNECTION_SERVICE_MASTODON = 'mastodon';
export const CONNECTION_SERVICE_NEXTDOOR = 'nextdoor';
export const CONNECTION_SERVICE_TUMBLR = 'tumblr';
export const CONNECTION_SERVICE_TWITTER = 'twitter';

export const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );
