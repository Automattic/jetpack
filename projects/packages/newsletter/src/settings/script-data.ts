import { getScriptData } from '@automattic/jetpack-script-data';
import type { NewsletterScriptData } from './types';

/**
 * Get the newsletter script data from the window object.
 *
 * @return The newsletter script data.
 */
export function getNewsletterScriptData(): NewsletterScriptData | undefined {
	return getScriptData()?.newsletter;
}
