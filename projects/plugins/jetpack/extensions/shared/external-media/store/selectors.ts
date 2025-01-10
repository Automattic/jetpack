import { MediaSource } from '../media-service/types';

const isAuthenticated = ( state, source: MediaSource ) =>
	state.mediaSourceIsAuthenticated.get( source ) ?? false;

const mediaPhotosPickerSession = state => state.mediaPhotosPickerSession ?? null;

export default { isAuthenticated, mediaPhotosPickerSession };
