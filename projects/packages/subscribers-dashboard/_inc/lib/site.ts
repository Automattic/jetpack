export type JetpackBlogId = number;

type ScriptDataShape = {
	jetpack?: {
		site?: {
			id?: number | string;
		};
	};
	site?: {
		id?: number | string;
	};
	wpcomBlogId?: number | string;
	[ key: string ]: unknown;
};

/**
 * Best-effort lookup of the WP.com blog id from globals exposed by the Jetpack admin runtime.
 * Returns null when no id can be resolved (e.g. the page is loaded outside Jetpack's enqueueing
 * pipeline or the script-data global isn't there yet).
 *
 * @return WP.com blog id or null.
 */
export function getBlogId(): JetpackBlogId | null {
	if ( typeof window === 'undefined' ) {
		return null;
	}

	const data = ( window as unknown as { JetpackScriptData?: ScriptDataShape } ).JetpackScriptData;
	const candidate = data?.jetpack?.site?.id ?? data?.site?.id ?? data?.wpcomBlogId ?? null;

	const id = candidate != null ? Number( candidate ) : NaN;
	return Number.isFinite( id ) && id > 0 ? id : null;
}
