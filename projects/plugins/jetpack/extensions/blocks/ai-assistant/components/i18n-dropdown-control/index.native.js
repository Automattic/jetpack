/*
 * External dependencies
 */
import { ToolbarDropdownMenu, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight, globe } from '@wordpress/icons';

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
];

// TODO: Pick default language from initial props
const defaultLanguageLocale =
	window?.Jetpack_Editor_Initial_State?.siteLocale || navigator?.language;

const defaultLabel = __( 'Translate', 'jetpack' );

export const defaultLanguage = defaultLanguageLocale?.split( '-' )[ 0 ] || 'en';

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

export default function I18nDropdownControl( {
	value = defaultLanguage,
	label = defaultLabel,
	onChange,
} ) {
	const languageList = [ ...LANGUAGE_LIST.filter( language => language !== defaultLanguage ) ];
	// Move the default language to the top of the list if it is included on LANGUAGE_LIST.
	if ( LANGUAGE_LIST.includes( defaultLanguage ) ) {
		languageList.unshift( defaultLanguage );
	}

	return (
		<ToolbarDropdownMenu
			icon={ globe }
			label={ label }
			popoverProps={ {
				variant: 'toolbar',
			} }
			controls={ languageList.map( language => {
				return {
					title: LANGUAGE_MAP[ language ].label,
					isActive: value === language,
					onClick: () => onChange( language + ' (' + LANGUAGE_MAP[ language ].label + ')' ),
				};
			} ) }
		/>
	);
}

export function I18nMenuDropdown( { value = defaultLanguage, label = defaultLabel, onChange } ) {
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
