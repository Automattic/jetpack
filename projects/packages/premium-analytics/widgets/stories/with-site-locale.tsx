/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { createSiteSettingDecorator } from './with-site-setting';
import type { SiteSettingControl } from './with-site-setting';

// WordPress locale names, as `getSettings().l10n.locale` carries them.
const SITE_LOCALES = {
	German: 'de_DE',
	Japanese: 'ja',
	'Brazilian Portuguese': 'pt_BR',
} as const;

export interface SiteLocaleControls {
	siteLocale?: SiteSettingControl< keyof typeof SITE_LOCALES >;
}

const defaultL10n = getSettings().l10n;

/**
 * Puts the site's locale under a story control, so a chart can be read as a
 * visitor to a site in that language sees it.
 */
export const { argTypes: siteLocaleArgTypes, decorator: withSiteLocale } =
	createSiteSettingDecorator( {
		argName: 'siteLocale',
		options: Object.keys( SITE_LOCALES ) as ( keyof typeof SITE_LOCALES )[],
		description:
			"The site's WordPress locale. Chart dates are written in it, so picking another language shows what a reader of a site in that language sees.",
		apply: language => {
			const locale = language ? SITE_LOCALES[ language ] : undefined;

			setSettings( {
				...getSettings(),
				l10n: locale ? { ...defaultL10n, locale } : defaultL10n,
			} );
		},
	} );
