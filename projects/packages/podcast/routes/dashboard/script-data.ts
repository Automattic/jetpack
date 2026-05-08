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
 * Resolve the `podcast` slice of `JetpackScriptData` once and cache it.
 *
 * @return Frozen script data with defaults filled in for missing keys.
 */
export function getPodcastScriptData(): PodcastScriptData {
	if ( cached ) {
		return cached;
	}
	const data = getScriptData() as { podcast?: Partial< PodcastScriptData > };
	cached = Object.freeze( { ...DEFAULTS, ...data.podcast } ) as PodcastScriptData;
	return cached;
}
