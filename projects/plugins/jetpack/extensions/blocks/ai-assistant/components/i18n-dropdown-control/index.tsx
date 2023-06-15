/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { globe } from '@wordpress/icons';
import React from 'react';
import './style.scss';

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

export type LanguageProp = ( typeof LANGUAGE_LIST )[ number ];

type LanguageDropdownControlProps = {
	value?: LanguageProp;
	onChange: ( value: string ) => void;
	label?: string;
};

const defaultLanguageLocale =
	window?.Jetpack_Editor_Initial_State?.siteLocale || navigator?.language;

const defaultLabel = __( 'Translate', 'jetpack' );

export const defaultLanguage = ( defaultLanguageLocale?.split( '-' )[ 0 ] || 'en' ) as LanguageProp;

export const defaultLocale = defaultLanguageLocale?.split( '-' )?.[ 1 ] || null;

export const LANGUAGE_MAP = {
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

const I18nMenuGroup = ( {
	value,
	onChange,
}: Pick< LanguageDropdownControlProps, 'value' | 'onChange' > ) => {
	// Move the default language to the top of the list.
	const languageList = [
		defaultLanguage,
		...LANGUAGE_LIST.filter( language => language !== defaultLanguage ),
	];

	return (
		<MenuGroup label={ __( 'Select language', 'jetpack' ) }>
			{ languageList.map( language => {
				return (
					<MenuItem
						key={ `key-${ language }` }
						onClick={ () => onChange( language + ' (' + LANGUAGE_MAP[ language ].label + ')' ) }
						isSelected={ value === language }
					>
						{ LANGUAGE_MAP[ language ].label }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
};

export default function I18nDropdownControl( {
	value = defaultLanguage,
	label = defaultLabel,
	onChange,
}: LanguageDropdownControlProps ) {
	return (
		<ToolbarDropdownMenu
			icon={ globe }
			label={ label }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => <I18nMenuGroup value={ value } onChange={ onChange } /> }
		</ToolbarDropdownMenu>
	);
}

export function I18nMenuDropdown( {
	value = defaultLanguage,
	label = defaultLabel,
	onChange,
}: Pick< LanguageDropdownControlProps, 'label' | 'onChange' | 'value' > ) {
	return (
		<DropdownMenu
			className="ai-assistant__i18n-dropdown"
			icon={ globe }
			label={ label }
			toggleProps={ {
				children: (
					<>
						<div className="ai-assistant__i18n-dropdown__toggle-label">{ label }</div>
						<Icon icon={ chevronRight } />
					</>
				),
			} }
		>
			{ () => <I18nMenuGroup onChange={ onChange } value={ value } /> }
		</DropdownMenu>
	);
}
