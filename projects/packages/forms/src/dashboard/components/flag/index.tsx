/**
 * External dependencies
 */
import { Tooltip } from '@wordpress/components';
import { getTranslatedCountryName } from '../../../util/country-names-translated.js';

type FlagProps = {
	countryCode?: string;
};

/**
 * Render the country flag emoji based on a country code.
 *
 * @param {FlagProps}        props             - The component props.
 * @param {string|undefined} props.countryCode - Two-letter ISO 3166-1 alpha-2 country code (e.g., "US") or undefined if unknown.
 * @return {JSX.Element} The Flag component
 */
export default function Flag( { countryCode }: FlagProps ): JSX.Element | null {
	if ( ! countryCode ) {
		return null;
	}
	const upperCountryCode = countryCode.toUpperCase();
	const offset = 127397;

	const flag = String.fromCodePoint(
		upperCountryCode.charCodeAt( 0 ) + offset,
		upperCountryCode.charCodeAt( 1 ) + offset
	);

	const countryName = getTranslatedCountryName( countryCode );

	return (
		<Tooltip text={ countryName }>
			<span aria-label={ countryName } role="img">
				{ flag }
			</span>
		</Tooltip>
	);
}
