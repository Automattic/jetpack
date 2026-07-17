<?php
/**
 * Country_Code_Utils trait.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Trait for country code utilities including emoji flags and phone prefix mapping.
 *
 * This trait provides reusable methods for:
 * - Converting two-letter ISO country codes (e.g., 'US', 'GB', 'DE') into emoji flags
 * - Mapping international phone prefixes to country codes
 */
trait Country_Code_Utils {

	/**
	 * Convert a country code to an emoji flag.
	 *
	 * @param string $country_code The two-letter country code (e.g., 'US', 'GB', 'DE').
	 *
	 * @return string The emoji flag for the country code, or empty string if invalid.
	 */
	private static function country_code_to_emoji_flag( $country_code ) {
		if ( empty( $country_code ) || strlen( $country_code ) !== 2 ) {
			return '';
		}

		$country_code = strtoupper( $country_code );

		// Convert each letter to a regional indicator symbol.
		// Regional indicator symbols start at Unicode code point 127462 (🇦)
		// and correspond to A-Z (ASCII 65-90).
		$flag = '';
		for ( $i = 0; $i < 2; $i++ ) {
			$char = $country_code[ $i ];

			// Check if the character is a valid uppercase letter (A-Z).
			if ( ord( $char ) < 65 || ord( $char ) > 90 ) {
				return '';
			}

			$code_point = 127462 + ( ord( $char ) - 65 );

			// Convert code point to UTF-8 encoded character.
			$flag .= mb_chr( $code_point, 'UTF-8' );
		}

		return $flag;
	}

	/**
	 * Get the mapping of international phone prefixes to ISO country codes.
	 *
	 * The array is sorted by prefix length (longest first) to ensure
	 * more specific prefixes are matched before general ones
	 * (e.g., +1264 Anguilla before +1 USA).
	 *
	 * @return array<string, string> Phone prefix => ISO country code mapping.
	 */
	private static function get_phone_prefix_to_country_map() {
		static $sorted_map = null;

		if ( $sorted_map !== null ) {
			return $sorted_map;
		}

		/*
			 * This list is synced with the JavaScript country list at:
			 * projects/packages/forms/src/blocks/field-telephone/country-list.js
			 *
			 * Some territories from the JS list are intentionally omitted here because they
			 * share phone prefixes with other countries (e.g., Guernsey, Jersey, and Isle of Man
			 * all share +44 with the UK). Since we can only map one country per prefix for
			 * flag display, we use the primary country for shared prefixes.
			 */
			$prefix_to_country = array(
				// 4-digit prefixes (Caribbean and other NANP territories).
				'+1264' => 'AI', // Anguilla
				'+1268' => 'AG', // Antigua and Barbuda
				'+1242' => 'BS', // Bahamas
				'+1246' => 'BB', // Barbados
				'+1441' => 'BM', // Bermuda
				'+1284' => 'VG', // British Virgin Islands
				'+1345' => 'KY', // Cayman Islands
				'+1767' => 'DM', // Dominica
				'+1809' => 'DO', // Dominican Republic
				'+1829' => 'DO', // Dominican Republic
				'+1849' => 'DO', // Dominican Republic
				'+1473' => 'GD', // Grenada
				'+1671' => 'GU', // Guam
				'+1876' => 'JM', // Jamaica
				'+1664' => 'MS', // Montserrat
				'+1670' => 'MP', // Northern Mariana Islands
				'+1787' => 'PR', // Puerto Rico
				'+1939' => 'PR', // Puerto Rico
				'+1869' => 'KN', // Saint Kitts and Nevis
				'+1758' => 'LC', // Saint Lucia
				'+1784' => 'VC', // Saint Vincent and the Grenadines
				'+1721' => 'SX', // Sint Maarten
				'+1868' => 'TT', // Trinidad and Tobago
				'+1649' => 'TC', // Turks and Caicos Islands
				'+1340' => 'VI', // U.S. Virgin Islands
				'+1684' => 'AS', // American Samoa

			// 3-digit prefixes.
				'+355'  => 'AL', // Albania
				'+213'  => 'DZ', // Algeria
				'+376'  => 'AD', // Andorra
				'+244'  => 'AO', // Angola
				'+246'  => 'IO', // British Indian Ocean Territory
				'+374'  => 'AM', // Armenia
				'+297'  => 'AW', // Aruba
				'+994'  => 'AZ', // Azerbaijan
				'+973'  => 'BH', // Bahrain
				'+880'  => 'BD', // Bangladesh
				'+375'  => 'BY', // Belarus
				'+501'  => 'BZ', // Belize
				'+229'  => 'BJ', // Benin
				'+975'  => 'BT', // Bhutan
				'+591'  => 'BO', // Bolivia
				'+387'  => 'BA', // Bosnia and Herzegovina
				'+267'  => 'BW', // Botswana
				'+269'  => 'KM', // Comoros
				'+673'  => 'BN', // Brunei
				'+359'  => 'BG', // Bulgaria
				'+226'  => 'BF', // Burkina Faso
				'+257'  => 'BI', // Burundi
				'+855'  => 'KH', // Cambodia
				'+237'  => 'CM', // Cameroon
				'+238'  => 'CV', // Cape Verde
				'+236'  => 'CF', // Central African Republic
				'+235'  => 'TD', // Chad
				'+682'  => 'CK', // Cook Islands
				'+506'  => 'CR', // Costa Rica
				'+385'  => 'HR', // Croatia
				'+357'  => 'CY', // Cyprus
				'+420'  => 'CZ', // Czech Republic
				'+243'  => 'CD', // Democratic Republic of the Congo
				'+253'  => 'DJ', // Djibouti
				'+593'  => 'EC', // Ecuador
				'+503'  => 'SV', // El Salvador
				'+240'  => 'GQ', // Equatorial Guinea
				'+291'  => 'ER', // Eritrea
				'+298'  => 'FO', // Faroe Islands
				'+372'  => 'EE', // Estonia
				'+268'  => 'SZ', // Eswatini
				'+251'  => 'ET', // Ethiopia
				'+679'  => 'FJ', // Fiji
				'+358'  => 'FI', // Finland
				'+594'  => 'GF', // French Guiana
				'+689'  => 'PF', // French Polynesia
				'+241'  => 'GA', // Gabon
				'+220'  => 'GM', // Gambia
				'+995'  => 'GE', // Georgia
				'+233'  => 'GH', // Ghana
				'+350'  => 'GI', // Gibraltar
				'+299'  => 'GL', // Greenland
				'+590'  => 'GP', // Guadeloupe
				'+502'  => 'GT', // Guatemala
				'+224'  => 'GN', // Guinea
				'+245'  => 'GW', // Guinea-Bissau
				'+592'  => 'GY', // Guyana
				'+509'  => 'HT', // Haiti
				'+504'  => 'HN', // Honduras
				'+852'  => 'HK', // Hong Kong
				'+354'  => 'IS', // Iceland
				'+964'  => 'IQ', // Iraq
				'+353'  => 'IE', // Ireland
				'+972'  => 'IL', // Israel
				'+225'  => 'CI', // Ivory Coast
				'+962'  => 'JO', // Jordan
				'+254'  => 'KE', // Kenya
				'+686'  => 'KI', // Kiribati
				'+383'  => 'XK', // Kosovo
				'+965'  => 'KW', // Kuwait
				'+996'  => 'KG', // Kyrgyzstan
				'+856'  => 'LA', // Laos
				'+371'  => 'LV', // Latvia
				'+961'  => 'LB', // Lebanon
				'+266'  => 'LS', // Lesotho
				'+231'  => 'LR', // Liberia
				'+218'  => 'LY', // Libya
				'+423'  => 'LI', // Liechtenstein
				'+370'  => 'LT', // Lithuania
				'+352'  => 'LU', // Luxembourg
				'+853'  => 'MO', // Macau
				'+261'  => 'MG', // Madagascar
				'+265'  => 'MW', // Malawi
				'+960'  => 'MV', // Maldives
				'+223'  => 'ML', // Mali
				'+356'  => 'MT', // Malta
				'+692'  => 'MH', // Marshall Islands
				'+596'  => 'MQ', // Martinique
				'+222'  => 'MR', // Mauritania
				'+230'  => 'MU', // Mauritius
				'+691'  => 'FM', // Micronesia
				'+373'  => 'MD', // Moldova
				'+377'  => 'MC', // Monaco
				'+976'  => 'MN', // Mongolia
				'+382'  => 'ME', // Montenegro
				'+212'  => 'MA', // Morocco
				'+258'  => 'MZ', // Mozambique
				'+264'  => 'NA', // Namibia
				'+674'  => 'NR', // Nauru
				'+977'  => 'NP', // Nepal
				'+687'  => 'NC', // New Caledonia
				'+505'  => 'NI', // Nicaragua
				'+227'  => 'NE', // Niger
				'+234'  => 'NG', // Nigeria
				'+683'  => 'NU', // Niue
				'+672'  => 'NF', // Norfolk Island
				'+850'  => 'KP', // North Korea
				'+389'  => 'MK', // North Macedonia
				'+968'  => 'OM', // Oman
				'+680'  => 'PW', // Palau
				'+970'  => 'PS', // Palestine
				'+500'  => 'FK', // Falkland Islands
				'+507'  => 'PA', // Panama
				'+675'  => 'PG', // Papua New Guinea
				'+595'  => 'PY', // Paraguay
				'+974'  => 'QA', // Qatar
				'+242'  => 'CG', // Republic of the Congo
				'+262'  => 'RE', // Reunion (also Mayotte)
				'+250'  => 'RW', // Rwanda
				'+290'  => 'SH', // Saint Helena
				'+508'  => 'PM', // Saint Pierre and Miquelon
				'+685'  => 'WS', // Samoa
				'+378'  => 'SM', // San Marino
				'+239'  => 'ST', // Sao Tome and Principe
				'+966'  => 'SA', // Saudi Arabia
				'+221'  => 'SN', // Senegal
				'+381'  => 'RS', // Serbia
				'+248'  => 'SC', // Seychelles
				'+232'  => 'SL', // Sierra Leone
				'+421'  => 'SK', // Slovakia
				'+386'  => 'SI', // Slovenia
				'+677'  => 'SB', // Solomon Islands
				'+252'  => 'SO', // Somalia
				'+211'  => 'SS', // South Sudan
				'+249'  => 'SD', // Sudan
				'+597'  => 'SR', // Suriname
				'+963'  => 'SY', // Syria
				'+886'  => 'TW', // Taiwan
				'+992'  => 'TJ', // Tajikistan
				'+255'  => 'TZ', // Tanzania
				'+228'  => 'TG', // Togo
				'+670'  => 'TL', // Timor-Leste
				'+690'  => 'TK', // Tokelau
				'+676'  => 'TO', // Tonga
				'+216'  => 'TN', // Tunisia
				'+993'  => 'TM', // Turkmenistan
				'+688'  => 'TV', // Tuvalu
				'+256'  => 'UG', // Uganda
				'+380'  => 'UA', // Ukraine
				'+971'  => 'AE', // United Arab Emirates
				'+598'  => 'UY', // Uruguay
				'+998'  => 'UZ', // Uzbekistan
				'+678'  => 'VU', // Vanuatu
				'+379'  => 'VA', // Vatican City
				'+681'  => 'WF', // Wallis and Futuna
				'+967'  => 'YE', // Yemen
				'+260'  => 'ZM', // Zambia
				'+263'  => 'ZW', // Zimbabwe
				'+351'  => 'PT', // Portugal
				'+872'  => 'PN', // Pitcairn Islands

			// 2-digit prefixes.
				'+93'   => 'AF', // Afghanistan
				'+54'   => 'AR', // Argentina
				'+61'   => 'AU', // Australia
				'+43'   => 'AT', // Austria
				'+32'   => 'BE', // Belgium
				'+55'   => 'BR', // Brazil
				'+56'   => 'CL', // Chile
				'+86'   => 'CN', // China
				'+57'   => 'CO', // Colombia
				'+53'   => 'CU', // Cuba
				'+45'   => 'DK', // Denmark
				'+20'   => 'EG', // Egypt
				'+33'   => 'FR', // France
				'+49'   => 'DE', // Germany
				'+30'   => 'GR', // Greece
				'+36'   => 'HU', // Hungary
				'+91'   => 'IN', // India
				'+62'   => 'ID', // Indonesia
				'+98'   => 'IR', // Iran
				'+39'   => 'IT', // Italy
				'+81'   => 'JP', // Japan
				'+77'   => 'KZ', // Kazakhstan
				'+82'   => 'KR', // South Korea
				'+60'   => 'MY', // Malaysia
				'+52'   => 'MX', // Mexico
				'+95'   => 'MM', // Myanmar
				'+31'   => 'NL', // Netherlands
				'+64'   => 'NZ', // New Zealand
				'+47'   => 'NO', // Norway
				'+92'   => 'PK', // Pakistan
				'+51'   => 'PE', // Peru
				'+63'   => 'PH', // Philippines
				'+48'   => 'PL', // Poland
				'+40'   => 'RO', // Romania
				'+7'    => 'RU', // Russia (also Kazakhstan +77)
				'+65'   => 'SG', // Singapore
				'+27'   => 'ZA', // South Africa
				'+34'   => 'ES', // Spain
				'+94'   => 'LK', // Sri Lanka
				'+46'   => 'SE', // Sweden
				'+41'   => 'CH', // Switzerland
				'+66'   => 'TH', // Thailand
				'+90'   => 'TR', // Turkey
				'+44'   => 'GB', // United Kingdom
				'+1'    => 'US', // United States/Canada (NANP)
				'+58'   => 'VE', // Venezuela
				'+84'   => 'VN', // Vietnam
			);

			// Sort by prefix length (longest first) to match most specific prefix.
			uksort(
				$prefix_to_country,
				static function ( $a, $b ) {
					return strlen( $b ) - strlen( $a );
				}
			);

		$sorted_map = $prefix_to_country;

		return $sorted_map;
	}
}
