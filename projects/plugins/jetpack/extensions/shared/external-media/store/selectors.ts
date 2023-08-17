import { MediaSource } from '../media-service/types';

const isAuthenticated = ( state, source: MediaSource ) =>
	state.mediaSourceIsAuthenticated.get( source ) ?? false;

export default { isAuthenticated };
