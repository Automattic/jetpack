import { Tooltip } from '@wordpress/components';
import { Icon, globe } from '@wordpress/icons';
import { getTranslatedCountryName } from '../../../util/country-names-translated.js';
import type { ReactNode } from 'react';
import './style.scss';

type TextWithFlagProps = {
	countryCode?: string;
	children: ReactNode;
	fallbackIcon?: boolean;
};

/**
 * Get the flag emoji for a country code.
 * @param {string} countryCode - The country code to get the flag emoji for.
 * @return {string} The flag emoji for the country code, or empty string if invalid.
 */
function getFlagEmoji( countryCode: string ): string {
	if ( ! countryCode || countryCode.length !== 2 ) {
		return '';
	}

	const upperCountryCode = countryCode.toUpperCase();

	// Validate that both characters are A-Z letters
	if ( ! /^[A-Z]{2}$/.test( upperCountryCode ) ) {
		return '';
	}

	const offset = 127397;

	return String.fromCodePoint(
		upperCountryCode.charCodeAt( 0 ) + offset,
		upperCountryCode.charCodeAt( 1 ) + offset
	);
}

/**
 * Renders text content with an optional country flag.
 *
 * @param {TextWithFlagProps} props              - The component props.
 * @param {string|undefined}  props.countryCode  - Two-letter ISO 3166-1 alpha-2 country code (e.g., "US") or undefined if unknown.
 * @param {boolean}           props.fallbackIcon - Whether to display a fallback icon if the country code is not provided.
 * @param {React.ReactNode}   props.children     - The text content to display after the flag. Can be a string or React elements (e.g., Tooltip, ExternalLink).
 * @return {JSX.Element} The TextWithFlag component
 */
export default function TextWithFlag( {
	children,
	countryCode,
	fallbackIcon = false,
}: TextWithFlagProps ): JSX.Element {
	let flag, countryName;

	if ( countryCode ) {
		flag = getFlagEmoji( countryCode );
		countryName = getTranslatedCountryName( countryCode );
	}

	return (
		<span>
			{ flag && (
				<>
					<Tooltip text={ countryName }>
						<span aria-label={ countryName } role="img" className="jp-forms__text-with-flag-emoji">
							{ flag }
						</span>
					</Tooltip>{ ' ' }
				</>
			) }
			{ ! flag && fallbackIcon && (
				<>
					<Icon icon={ globe } size={ 16 } className="jp-forms__text-with-flag-globe" />{ ' ' }
				</>
			) }
			{ children }
		</span>
	);
}
