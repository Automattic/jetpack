/*
 * External dependencies
 */
import {
	MenuItem,
	MenuGroup,
	ToolbarDropdownMenu,
	DropdownMenu,
	Button,
	Tooltip,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { globe } from '@wordpress/icons';
import React from 'react';
/*
 * Internal dependencies
 */
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
	disabled?: boolean;
};

const defaultLanguageLocale =
	window?.Jetpack_Editor_Initial_State?.siteLocale || navigator?.language;

const defaultLabel = __( 'Translate', 'jetpack' );

export const defaultLanguage = ( defaultLanguageLocale?.split( '-' )[ 0 ] || 'en' ) as LanguageProp;

export const defaultLocale = defaultLanguageLocale?.split( '-' )?.[ 1 ] || null;

export const LANGUAGE_MAP = {
	en: {
		label: __( 'English', 'jetpack' ),
	},
	es: {
		label: __( 'Spanish', 'jetpack' ),
	},
	fr: {
		label: __( 'French', 'jetpack' ),
	},
	de: {
		label: __( 'German', 'jetpack' ),
	},
	it: {
		label: __( 'Italian', 'jetpack' ),
	},
	pt: {
		label: __( 'Portuguese', 'jetpack' ),
	},
	ru: {
		label: __( 'Russian', 'jetpack' ),
	},
	zh: {
		label: __( 'Chinese', 'jetpack' ),
	},
	ja: {
		label: __( 'Japanese', 'jetpack' ),
	},
	ar: {
		label: __( 'Arabic', 'jetpack' ),
	},
	hi: {
		label: __( 'Hindi', 'jetpack' ),
	},
	ko: {
		label: __( 'Korean', 'jetpack' ),
	},

	id: {
		label: __( 'Indonesian', 'jetpack' ),
	},
	tl: {
		label: __( 'Filipino', 'jetpack' ),
	},
	vi: {
		label: __( 'Vietnamese', 'jetpack' ),
	},
};

export const I18nMenuGroup = ( {
	value,
	onChange,
}: Pick< LanguageDropdownControlProps, 'value' | 'onChange' > ) => {
	const languageList = [ ...LANGUAGE_LIST.filter( language => language !== defaultLanguage ) ];
	// Move the default language to the top of the list if it is included on LANGUAGE_LIST.
	if ( LANGUAGE_LIST.includes( defaultLanguage ) ) {
		languageList.unshift( defaultLanguage );
	}

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
	disabled = false,
}: LanguageDropdownControlProps ) {
	return disabled ? (
		<Tooltip text={ label }>
			<Button disabled>
				<Icon icon={ globe } />
			</Button>
		</Tooltip>
	) : (
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
	disabled = false,
}: Pick< LanguageDropdownControlProps, 'label' | 'onChange' | 'value' | 'disabled' > & {
	toggleProps?: Record< string, unknown >;
} ) {
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
				disabled,
			} }
		>
			{ ( { onClose } ) => (
				<I18nMenuGroup
					onChange={ newLanguage => {
						onChange( newLanguage );
						onClose();
					} }
					value={ value }
				/>
			) }
		</DropdownMenu>
	);
}
