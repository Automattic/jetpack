import { NewsletterScriptData } from './types';

// Use module augmentation to add the newsletter property to JetpackScriptData
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		newsletter: NewsletterScriptData;
	}
}
