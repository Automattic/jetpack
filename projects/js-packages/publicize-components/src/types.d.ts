import { SocialInitialState } from './types/types';

// Use module augmentation to add the social property to JetpackInitialState
declare module '@automattic/jetpack-initial-state' {
	interface JetpackInitialState {
		social: SocialInitialState;
	}
}
