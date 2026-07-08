/**
 * Constants for API endpoints
 */
export const statsProxyPath = '/jetpack-premium-analytics/v1/proxy';
export const reportsPath = `${ statsProxyPath }/v2/analytics/reports`;
export const wpcomSimpleReportsPath = '/wpcom/v2/analytics/reports';
export const noticesPath = '/jetpack-premium-analytics/v1/notices';
export const wpcomSimpleNoticesPath = '/wpcom/v2/jetpack-stats-dashboard/notices';

type JetpackScriptDataWindow = Window & {
	JetpackScriptData?: {
		site?: {
			host?: string;
			wpcom?: {
				blog_id?: number | string;
			};
		};
	};
};

export function isWpcomSimpleSite() {
	if ( typeof window === 'undefined' ) {
		return false;
	}

	return ( window as JetpackScriptDataWindow ).JetpackScriptData?.site?.host === 'wpcom';
}

export function getWpcomBlogId() {
	if ( typeof window === 'undefined' ) {
		return undefined;
	}

	return ( window as JetpackScriptDataWindow ).JetpackScriptData?.site?.wpcom?.blog_id;
}

export function getReportsPath() {
	return isWpcomSimpleSite() ? wpcomSimpleReportsPath : reportsPath;
}

export function getNoticesPath() {
	return isWpcomSimpleSite() ? wpcomSimpleNoticesPath : noticesPath;
}
