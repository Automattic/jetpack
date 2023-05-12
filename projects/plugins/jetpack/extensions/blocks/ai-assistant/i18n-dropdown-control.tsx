declare global {
	interface Window {
		Jetpack_Editor_Initial_State: { siteLocale: string };
	}
}

/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import React from 'react';
import { useCallback } from 'react';

const LANGUAGE_LIST = [
	'en',
	'es',
	'fr',
	'de',
	'it',
	'pt',
	'ru',
	'zh',
	'ja',
	'ar',
	'hi',
	'ko',
	// more languages here...
] as const;

const navigatorLanguage = navigator.language.split( '-' )[ 0 ];
const siteLanguage = window.Jetpack_Editor_Initial_State.siteLocale.split( '-' )[ 0 ];
const defaultLanguage = siteLanguage || navigatorLanguage;

export const DEFAULT_PROMPT_LANGUAGE = 'en';

const LANGUAGE_MAP = {
	en: {
		label: __( 'English', 'jetpack' ),
		flag: '🇬🇧',
	},
	es: {
		label: __( 'Spanish', 'jetpack' ),
		flag: '🇪🇸',
	},
	fr: {
		label: __( 'French', 'jetpack' ),
		flag: '🇫🇷',
	},
	de: {
		label: __( 'German', 'jetpack' ),
		flag: '🇩🇪',
	},
	it: {
		label: __( 'Italian', 'jetpack' ),
		flag: '🇮🇹',
	},
	pt: {
		label: __( 'Portuguese', 'jetpack' ),
		flag: '🇵🇹',
	},
	ru: {
		label: __( 'Russian', 'jetpack' ),
		flag: '🇷🇺',
	},
	zh: {
		label: __( 'Chinese', 'jetpack' ),
		flag: '🇨🇳',
	},
	ja: {
		label: __( 'Japanese', 'jetpack' ),
		flag: '🇯🇵',
	},
	ar: {
		label: __( 'Arabic', 'jetpack' ),
		flag: '🇸🇦',
	},
	hi: {
		label: __( 'Hindi', 'jetpack' ),
		flag: '🇮🇳',
	},
	ko: {
		label: __( 'Korean', 'jetpack' ),
		flag: '🇰🇷',
	},

	id: {
		label: __( 'Indonisian', 'jetpack' ),
		flag: '🇮🇩',
	},

	tl: {
		label: __( 'Filipino', 'jetpack' ),
		flag: '🇵🇭',
	},

	vi: {
		label: __( 'Vietnamese', 'jetpack' ),
		flag: '🇻🇳',
	},
};

export type LanguageProp = ( typeof LANGUAGE_LIST )[ number ];

type LanguageDropdownControlProps = {
	value: LanguageProp;
	onChange: ( value: string ) => void;
};

export default function I18nDropdownControl( {
	value = DEFAULT_PROMPT_LANGUAGE,
	onChange,
}: LanguageDropdownControlProps ) {
	// Move the default language to the top of the list.
	const languageList = [
		defaultLanguage,
		...LANGUAGE_LIST.filter( language => language !== defaultLanguage ),
	];

	// Set the `<html lang>` attribute to the selected language.
	const changeLanguage = useCallback(
		( language: string ) => {
			/*
			 * If the selected language doesn’t match the site language,
			 * set <html lang=“” />
			 */
			if ( language !== defaultLanguage ) {
				document.documentElement.lang = language;
			} else {
				document.documentElement.lang = '';
			}

			onChange( language );
		},
		[ onChange ]
	);

	return (
		<ToolbarDropdownMenu
			icon={ globe }
			label={ __( 'Language', 'jetpack' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => {
				return (
					<MenuGroup label={ __( 'Select language', 'jetpack' ) }>
						{ languageList.map( language => {
							return (
								<MenuItem
									key={ `key-${ language }` }
									onClick={ () => changeLanguage( language ) }
									isSelected={ value === language }
								>
									{ LANGUAGE_MAP[ language ].label }
								</MenuItem>
							);
						} ) }
					</MenuGroup>
				);
			} }
		</ToolbarDropdownMenu>
	);
}
