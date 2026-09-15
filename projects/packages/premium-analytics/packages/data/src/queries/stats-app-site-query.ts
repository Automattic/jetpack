/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export type StatsAppSiteResponse = {
	options?: {
		/** The site's registration on WordPress.com, ISO 8601 with offset. */
		created_at?: string;
	};
};

// Both transports ask for the registration date alone; the proxy pins these
// server-side so a caller cannot widen the record.
const SITE_RECORD_PARAMS = { fields: 'options', options: 'created_at' };

export const statsAppSiteQuery = () => {
	const simple = isSimpleSite();
	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	const query = statsAppProxyQuery< StatsAppSiteResponse >( {
		name: 'site',
		version: '1.1',
		// Simple's apiFetch bridge forwards a `/sites/<id>` path as-is; connected
		// sites reach the record through the proxy's `site` group.
		endpoint: simple ? `sites/${ blogId }` : 'site',
		params: SITE_RECORD_PARAMS,
	} );

	return {
		...query,
		enabled: ! simple || Boolean( blogId ),
		// The registration date never changes.
		staleTime: Infinity,
	};
};
