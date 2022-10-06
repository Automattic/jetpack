import api from './api';

export async function setGetStarted(): Promise< boolean > {
	return api.post< boolean >( `/get-started` );
}
