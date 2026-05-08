/**
 * Reads the `podcast` slice injected into `JetpackScriptData` by class-settings.php.
 *
 * The script data is static for the lifetime of the page, so we resolve it once
 * on first read and hand back the same frozen object on every subsequent call.
 */

import { getScriptData } from '@automattic/jetpack-script-data';
import type { PodcastScriptData } from './types';

const DEFAULTS: PodcastScriptData = {
	categoryId: 0,
	feedUrl: '',
	siteUrl: '',
	adminUrl: '',
	editPostUrlBase: '',
	newPostUrl: '',
	mediaLibraryUrl: '',
	userEmail: '',
	dateFormat: 'F j, Y',
};

let cached: PodcastScriptData | null = null;

/**
 * Resolve the podcast script-data slice on first call and return the same
 * frozen object on every subsequent call.
 *
 * @return The page's podcast script data, with defaults filled in for missing keys.
 */
export function getPodcastScriptData(): PodcastScriptData {
	if ( cached ) {
		return cached;
	}
	const data = getScriptData() as { podcast?: Partial< PodcastScriptData > };
	cached = Object.freeze( { ...DEFAULTS, ...data.podcast } ) as PodcastScriptData;
	return cached;
}
