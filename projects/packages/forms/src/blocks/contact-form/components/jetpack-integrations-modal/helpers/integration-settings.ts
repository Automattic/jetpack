/**
 * Reads and writes one integration's settings on a form, mirroring the PHP
 * Integration_Settings resolver.
 *
 * Integrations registered through `jetpack_forms_register_integration()` store their per-form
 * settings in the shared `integrations` block attribute, keyed by slug. The bundled
 * integrations predate that container and still use their own top-level attributes; they read
 * those directly and do not go through here.
 */

export type IntegrationSettings = Record< string, unknown >;

type FormAttributes = {
	integrations?: Record< string, IntegrationSettings >;
} & Record< string, unknown >;

/**
 * Get one integration's settings for the form being edited.
 *
 * @param slug       - Integration slug, matching the PHP registration.
 * @param attributes - The contact form block's attributes.
 * @return The stored settings, or an empty object when the form has none.
 */
export function getIntegrationSettings(
	slug: string,
	attributes: FormAttributes | undefined
): IntegrationSettings {
	const stored = attributes?.integrations?.[ slug ];

	return stored && typeof stored === 'object' ? stored : {};
}

/**
 * Merge a change into one integration's settings, leaving other integrations untouched.
 *
 * @param slug          - Integration slug.
 * @param attributes    - The contact form block's current attributes.
 * @param setAttributes - The block's attribute setter.
 * @param patch         - The settings to merge in.
 */
export function updateIntegrationSettings(
	slug: string,
	attributes: FormAttributes | undefined,
	setAttributes: ( ( attrs: Record< string, unknown > ) => void ) | undefined,
	patch: IntegrationSettings
): void {
	if ( ! setAttributes ) {
		return;
	}

	setAttributes( {
		integrations: {
			...( attributes?.integrations ?? {} ),
			[ slug ]: {
				...getIntegrationSettings( slug, attributes ),
				...patch,
			},
		},
	} );
}
