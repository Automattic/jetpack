import api from './api';

export async function saveGetStarted(): Promise< boolean > {
	return api.post< boolean >( `/get-started` );
}
