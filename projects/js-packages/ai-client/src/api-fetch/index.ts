/**
 * External dependencies
 */
import apiFetchMod from '@wordpress/api-fetch';

// @wordpress/api-fetch (as of 6.47.0) declares itself in such a way that tsc and node see the function at apiFetchMod.default
// while some other environments (including code running inside WordPress itself) see it at apiFetch.
// See https://arethetypeswrong.github.io/?p=@wordpress/api-fetch@6.47.0
// This is a helper to simplify the usage of the api-fetch module on the ai-client package.
const apiFetch = 'default' in apiFetchMod ? apiFetchMod.default : apiFetchMod;
// eslint-disable-next-line @typescript-eslint/ban-types
type ApiFetchType = typeof apiFetch extends Function ? typeof apiFetch : typeof apiFetchMod;

export default apiFetch as ApiFetchType;
