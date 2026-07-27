import { getScriptData } from '@automattic/jetpack-script-data';
import type { NewsletterModeScriptData, NewsletterScriptData } from './types';

/**
 * Get the newsletter script data from the window object.
 *
 * @return The newsletter script data.
 */
export function getNewsletterScriptData(): NewsletterScriptData | undefined {
	return getScriptData()?.newsletter;
}

/**
 * Get the Newsletter Mode script data from the window object. Only the mode's
 * own pages carry it — everywhere else this is undefined.
 *
 * @return The Newsletter Mode script data.
 */
export function getNewsletterModeScriptData(): NewsletterModeScriptData | undefined {
	return getScriptData()?.newsletter_mode;
}
