import { __, _x, sprintf } from '@wordpress/i18n';

export type SettingsLinkLabel = {
	/** What the link shows. */
	text: string;
	/** Its accessible name, which adds the feature name. */
	label: string;
};

/**
 * The Protect page link's labels: set the feature up there while it is off, manage it once it is on.
 *
 * @param name - The feature name.
 * @param isOn - Whether the feature is on.
 * @return The labels.
 */
export function getProtectLinkLabel( name: string, isOn: boolean ): SettingsLinkLabel {
	if ( ! isOn ) {
		return {
			text: /* translators: "Protect" is a product name. */ __(
				'Set up in Protect',
				'jetpack-my-jetpack'
			),
			label: sprintf(
				/* translators: %s is the feature name. "Protect" is a product name. */
				__( 'Set up %s in Protect', 'jetpack-my-jetpack' ),
				name
			),
		};
	}

	return {
		text: /* translators: "Protect" is a product name. */ __(
			'Manage in Protect',
			'jetpack-my-jetpack'
		),
		label: sprintf(
			/* translators: %s is the feature name. "Protect" is a product name. */
			__( 'Manage %s in Protect', 'jetpack-my-jetpack' ),
			name
		),
	};
}

/**
 * What a settings link that leaves Features says: the page it opens, so people know they are leaving.
 *
 * @param url  - Where the link goes, absolute or relative to wp-admin.
 * @param name - The feature name.
 * @return The labels, or null for a page this cannot name.
 */
export function getLeavingLinkLabel( url: string, name: string ): SettingsLinkLabel | null {
	const { pathname, searchParams } = new URL( url, 'https://example.invalid/wp-admin/' );
	const file = pathname.split( '/' ).pop() ?? '';
	const page = file === 'admin.php' ? searchParams.get( 'page' ) : null;

	if ( /^options-[a-z]+\.php$/.test( file ) ) {
		return {
			text: _x( 'Manage in Settings', 'link to the WordPress Settings menu', 'jetpack-my-jetpack' ),
			label: sprintf(
				/* translators: %s is the feature name. "Settings" is the WordPress admin menu. */
				__( 'Manage %s in Settings', 'jetpack-my-jetpack' ),
				name
			),
		};
	}

	if ( file === 'customize.php' ) {
		return {
			text: __( 'Manage in Customizer', 'jetpack-my-jetpack' ),
			label: sprintf(
				/* translators: %s is the feature name. */
				__( 'Manage %s in Customizer', 'jetpack-my-jetpack' ),
				name
			),
		};
	}

	if ( page === 'jetpack-seo' ) {
		return {
			text: __( 'Manage in SEO', 'jetpack-my-jetpack' ),
			label: sprintf(
				/* translators: %s is the feature name. "SEO" is the name of Jetpack's SEO page. */
				__( 'Manage %s in SEO', 'jetpack-my-jetpack' ),
				name
			),
		};
	}

	if ( page === 'jetpack-monetize' ) {
		return {
			text: /* translators: "Monetize" is a product name. */ __(
				'Manage in Monetize',
				'jetpack-my-jetpack'
			),
			label: sprintf(
				/* translators: %s is the feature name. "Monetize" is a product name. */
				__( 'Manage %s in Monetize', 'jetpack-my-jetpack' ),
				name
			),
		};
	}

	if ( page === 'jetpack-protect' ) {
		return getProtectLinkLabel( name, true );
	}

	return null;
}
