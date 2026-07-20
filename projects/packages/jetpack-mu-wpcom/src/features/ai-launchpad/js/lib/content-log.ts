// Type-only: the runtime global is read directly so this module stays loadable by the node test
// runner, which chokes on the package's non-erasable type imports.
import type { JetpackScriptData } from '@automattic/jetpack-script-data';

/**
 * Logstash event for the gallery-page CTA — the one creation flow whose content is picked by
 * client-side reasoning (pattern scoring) rather than taken from the persisted AI output. Posted
 * from the browser, mirroring the HTTP dispatch of `Jetpack_Mu_Wpcom::log2logstash()`.
 * Best-effort: logging must never fail the creation flow.
 */

const LOGSTASH_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/logstash';

/**
 * Build the `params` form field of a logstash record. `extra` is JSON-encoded within the
 * JSON-encoded record, matching the server dispatch shape.
 *
 * @param message - Event message slug.
 * @param extra   - Event-specific properties.
 * @param blogId  - The WP.com blog id, or 0 when unknown.
 * @return The JSON-encoded record.
 */
export function buildLogstashParams( message: string, extra: object, blogId: number ): string {
	return JSON.stringify( {
		blog_id: blogId,
		feature: 'atomic_ai_launchpad',
		message,
		extra: JSON.stringify( extra ),
	} );
}

/**
 * Send a `content_tailored` event, fire-and-forget. `sendBeacon` survives the navigation to the
 * editor that follows content creation.
 *
 * @param buildExtra - Builds the event properties; called inside the guard so a throwing payload
 *                   cannot fail the creation flow. No user free-text.
 */
export function logContentTailored( buildExtra: () => object ): void {
	try {
		const scriptData: JetpackScriptData | undefined = window.JetpackScriptData;
		const blogId = scriptData?.site?.wpcom?.blog_id ?? 0;
		const body = new URLSearchParams( {
			params: buildLogstashParams( 'content_tailored', buildExtra(), blogId ),
		} );

		let sent = false;
		try {
			sent = navigator.sendBeacon( LOGSTASH_ENDPOINT, body );
		} catch {
			// Fall through to the fetch fallback.
		}
		if ( ! sent ) {
			fetch( LOGSTASH_ENDPOINT, { method: 'POST', body, keepalive: true } ).catch( () => {} );
		}
	} catch {
		// Best-effort.
	}
}
