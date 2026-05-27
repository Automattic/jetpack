/**
 * Runtime helpers that read the `akismetExperimental` payload injected by
 * `wp_localize_script` in `class.akismet-experimental.php`.
 *
 * The Bearer Blackbox key is NEVER serialized into this payload (see
 * GUARDRAILS.md §"Enforcement mechanisms"). The shape here mirrors the PHP
 * side exactly.
 */

export type AkismetExperimentalGlobal = {
	apiNonce: string;
	apiRoot: string;
	jetpackActive: boolean;
	apiKey: string;
	pluginUrl: string;
	pageSlug: string;
	blackbox: {
		enrolled: boolean;
		clientId: string | null;
		apiHost: string;
	};
	allowMutations: boolean;
	integrations?: {
		woocommerce: boolean;
	};
};

/**
 * Read the `window.akismetExperimental` global, defensively. SSR-safe.
 *
 * @return Partial shape — every accessor below handles missing keys.
 */
export function readGlobal(): Partial< AkismetExperimentalGlobal > {
	if ( typeof window === 'undefined' ) {
		return {};
	}
	return (
		( window as unknown as { akismetExperimental?: Partial< AkismetExperimentalGlobal > } )
			.akismetExperimental ?? {}
	);
}

/**
 * Whether the Jetpack plugin is active on this site.
 *
 * @return True iff `class_exists( 'Jetpack' )` returned true in PHP.
 */
export function isJetpackActive(): boolean {
	return readGlobal().jetpackActive === true;
}

/**
 * Whether the prototype is permitted to perform mutating actions.
 *
 * Maps to the `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` wp-config constant.
 * Default false. See GUARDRAILS.md.
 *
 * @return True iff mutations are explicitly enabled for this site.
 */
export function allowMutations(): boolean {
	return readGlobal().allowMutations === true;
}
