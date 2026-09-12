/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
import { useEffect } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

export const SITE_LOCALE_DEFAULT = 'Site default';

// WordPress locale names, as `getSettings().l10n.locale` carries them.
const SITE_LOCALES = {
	German: 'de_DE',
	Japanese: 'ja',
	'Brazilian Portuguese': 'pt_BR',
} as const;

export interface SiteLocaleControls {
	siteLocale?: typeof SITE_LOCALE_DEFAULT | keyof typeof SITE_LOCALES;
}

export const siteLocaleArgTypes = {
	siteLocale: {
		control: 'select',
		options: [ SITE_LOCALE_DEFAULT, ...Object.keys( SITE_LOCALES ) ],
		description:
			"The site's WordPress locale. Chart dates are written in it, so picking another language shows what a reader of a site in that language sees.",
	},
} as const;

const defaultL10n = getSettings().l10n;

function applySiteLocale( language: SiteLocaleControls[ 'siteLocale' ] ) {
	const locale =
		language && language !== SITE_LOCALE_DEFAULT ? SITE_LOCALES[ language ] : undefined;

	setSettings( {
		...getSettings(),
		l10n: locale ? { ...defaultL10n, locale } : defaultL10n,
	} );
}

function SiteLocale( {
	language,
	children,
}: {
	language: SiteLocaleControls[ 'siteLocale' ];
	children: ReactNode;
} ) {
	// Applied during render: the widget reads the setting while rendering below.
	applySiteLocale( language );
	useEffect( () => () => applySiteLocale( undefined ), [] );

	return <>{ children }</>;
}

/**
 * Puts the site's locale under a story control, so a chart can be read as a
 * visitor to a site in that language sees it.
 */
export const withSiteLocale: Decorator = ( Story, { args } ) => {
	const language = ( args as SiteLocaleControls ).siteLocale;

	return (
		<SiteLocale language={ language }>
			{ /* Charts read the locale once per mount, so a change has to remount them. */ }
			<Story key={ language ?? SITE_LOCALE_DEFAULT } />
		</SiteLocale>
	);
};
