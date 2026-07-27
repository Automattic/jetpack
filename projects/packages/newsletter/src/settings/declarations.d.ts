import { NewsletterModeScriptData, NewsletterScriptData } from './types';

// Use module augmentation to add the newsletter properties to JetpackScriptData
declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		newsletter: NewsletterScriptData;
		// Only the Newsletter Mode surfaces carry this — see
		// Mode::maybe_add_script_data().
		newsletter_mode?: NewsletterModeScriptData;
	}
}
