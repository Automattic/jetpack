import { createReduxStore, register } from '@wordpress/data';
import { getSocialScriptData } from '../utils';
import actions from './actions';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const SOCIAL_STORE_ID = 'jetpack-social-plugin';
export const SOCIAL_STORE_CONFIG = {
	reducer,
	actions,
	selectors,
	resolvers,
	initialState: getSocialScriptData()?.store_initial_state,
};

export const CONNECTION_SERVICE_FACEBOOK = 'facebook';
export const CONNECTION_SERVICE_INSTAGRAM_BUSINESS = 'instagram-business';
export const CONNECTION_SERVICE_LINKEDIN = 'linkedin';
export const CONNECTION_SERVICE_MASTODON = 'mastodon';
export const CONNECTION_SERVICE_BLUESKY = 'bluesky';
export const CONNECTION_SERVICE_NEXTDOOR = 'nextdoor';
export const CONNECTION_SERVICE_TUMBLR = 'tumblr';
export const CONNECTION_SERVICE_TWITTER = 'twitter';
export const CONNECTION_SERVICE_THREADS = 'threads';

export const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );
