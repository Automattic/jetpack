<?php
/**
 * Feedback_Field class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Feedback field class.
 *
 * Represents the submitted form data of an individual field.
 */
class Feedback_Field {
	use Country_Flag;

	/**
	 * The key of the field.
	 *
	 * @var string
	 */
	private $key;

	/**
	 * The label of the field.
	 *
	 * @var string
	 */
	private $label;

	/**
	 * The value of the field.
	 *
	 * @var mixed
	 */
	private $value;

	/**
	 * The type of the field.
	 *
	 * @var string
	 */
	private $type;

	/**
	 * Additional metadata for the field.
	 *
	 * @var array
	 */
	private $meta;

	/**
	 * The original form field ID from the form schema.
	 *
	 * @since 5.5.0
	 *
	 * @var string
	 */
	protected $form_field_id = '';

	/**
	 * Constructor.
	 *
	 * @param string      $key           The key of the field.
	 * @param mixed       $label         The label of the field. Non-string values will be converted to empty string.
	 * @param mixed       $value         The value of the field.
	 * @param string      $type          The type of the field (default is 'basic').
	 * @param array       $meta          Additional metadata for the field (default is an empty array).
	 * @param string|null $form_field_id The original form field ID (default is null).
	 */
	public function __construct( $key, $label, $value, $type = 'basic', $meta = array(), $form_field_id = null ) {
		$this->key           = $key;
		$this->label         = is_string( $label ) ? html_entity_decode( $label, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : '';
		$this->value         = $value;
		$this->type          = $type;
		$this->meta          = $meta;
		$this->form_field_id = is_string( $form_field_id ) ? $form_field_id : '';
	}

	/**
	 * Get the value of the field.
	 *
	 * @return string
	 */
	public function get_key() {
		return $this->key;
	}

	/**
	 * Get the label of the field.
	 *
	 * @param string $context The context in which the label is being rendered (default is 'default').
	 * @param int    $count   The count of the label occurrences (default is 1).
	 *
	 * @return string
	 */
	public function get_label( $context = 'default', $count = 1 ) {

		$postfix = $count > 1 ? " ({$count})" : '';

		if ( in_array( $context, array( 'api', 'csv' ), true ) ) {
			if ( empty( $this->label ) ) {
				return __( 'Field', 'jetpack-forms' ) . $postfix;
			}

			return $this->label . $postfix;
		}

		return $this->label . $postfix;
	}

	/**
	 * Get the value of the field.
	 *
	 * @return mixed
	 */
	public function get_value() {
		return $this->value;
	}

	/**
	 * Get the original form field ID.
	 *
	 * @since 5.5.0
	 *
	 * @return string
	 */
	public function get_form_field_id() {
		return $this->form_field_id;
	}

	/**
	 * Get the value of the field for rendering.
	 *
	 * @param string $context The context in which the value is being rendered (default is 'default').
	 *
	 * @return string
	 */
	public function get_render_value( $context = 'default' ) {
		switch ( $context ) {
			case 'submit':
				return $this->get_render_submit_value();
			case 'api':
				return $this->get_render_api_value();
			case 'web': // For the post-submission page screen.
				return $this->get_render_web_value();
			case 'email':
				return $this->get_render_email_value();
			case 'ajax':
				return $this->get_render_web_value(); // For now, we use the same value for ajax and web.
			case 'csv':
				return $this->get_render_csv_value();
			case 'default':
			default:
				return $this->get_render_default_value();
		}
	}

	/**
	 * Get the value of the field for rendering the CSV.
	 *
	 * @return string
	 */
	private function get_render_csv_value() {
		if ( $this->is_of_type( 'image-select' ) ) {
			return implode(
				', ',
				array_map(
					function ( $choice ) {
						$value = $choice['selected'];

						if ( ! empty( $choice['label'] ) ) {
							$value .= ' - ' . $choice['label'];
						}

						return $value;
					},
					$this->value['choices']
				)
			);
		}

		if ( $this->value === null ) {
			return '';
		}

		return $this->get_render_default_value();
	}

	/**
	 * Get the value of the field for rendering the post-submission page.
	 *
	 * @return string
	 */
	private function get_render_web_value() {
		if ( $this->is_of_type( 'image-select' ) ) {
			return $this->value;
		}

		// For phone fields, add country flag before the number.
		if ( $this->is_of_type( 'phone' ) || $this->is_of_type( 'telephone' ) ) {
			return $this->get_phone_value_with_flag();
		}

		return $this->get_render_default_value();
	}

	/**
	 * Get phone value with country flag emoji.
	 *
	 * @return string Phone number with country flag prefix.
	 */
	private function get_phone_value_with_flag() {
		$phone_value = is_array( $this->value ) ? implode( ', ', $this->value ) : $this->value;

		if ( empty( $phone_value ) ) {
			return $phone_value;
		}

		// Try to extract country code from phone number prefix.
		$country_code = $this->get_country_code_from_phone( $phone_value );

		if ( ! empty( $country_code ) ) {
			$flag = self::country_code_to_emoji_flag( $country_code );
			if ( ! empty( $flag ) ) {
				return $flag . ' ' . $phone_value;
			}
		}

		return $phone_value;
	}

	/**
	 * Extract country code from phone number based on its prefix.
	 *
	 * @param string $phone_number The phone number with country prefix (e.g., "+49 123456789").
	 *
	 * @return string|null The ISO country code (e.g., "DE") or null if not found.
	 */
	private function get_country_code_from_phone( $phone_number ) {
		// Remove spaces and normalize the phone number.
		$normalized = preg_replace( '/\s+/', '', $phone_number );

		// Must start with + for international format.
		if ( strpos( $normalized, '+' ) !== 0 ) {
			return null;
		}

		// Phone prefix to country code mapping (most specific/longer prefixes first).
		$prefix_to_country = array(
			// 4-digit prefixes.
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
			// Note: +262 is shared by Mayotte (YT) and Reunion (RE), using RE as primary
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
			'+507'  => 'PA', // Panama
			'+675'  => 'PG', // Papua New Guinea
			'+595'  => 'PY', // Paraguay
			'+974'  => 'QA', // Qatar
			'+242'  => 'CG', // Republic of the Congo
			'+262'  => 'RE', // Reunion
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
			'+351'  => 'PT', // Portugal
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
			function ( $a, $b ) {
				return strlen( $b ) - strlen( $a );
			}
		);

		foreach ( $prefix_to_country as $prefix => $country ) {
			if ( strpos( $normalized, $prefix ) === 0 ) {
				return $country;
			}
		}

		return null;
	}

	/**
	 * Get the value of the field for rendering the email.
	 *
	 * @return string
	 */
	private function get_render_email_value() {
		if ( $this->is_of_type( 'image-select' ) ) {
			$choices = array();

			foreach ( $this->value['choices'] as $choice ) {
				// On the email, we want to show the actual selected value, not the perceived value, as the options can be shuffled.
				$value = $choice['selected'];

				if ( ! empty( $choice['label'] ) ) {
					$value .= ' - ' . $choice['label'];

				}
				$choices[] = $value;
			}

			return implode( ', ', $choices );
		}

		return $this->get_render_default_value();
	}

	/**
	 * Get the default value of the field for rendering.
	 *
	 * @return string
	 */
	private function get_render_default_value() {
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			foreach ( $this->value['files'] as &$file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$file_name = $file['name'] ?? __( 'Attached file', 'jetpack-forms' );
				$file_size = isset( $file['size'] ) ? size_format( $file['size'] ) : '';
				$files[]   = $file_name . ' (' . $file_size . ')';
			}
			return implode( ', ', $files );
		}

		if ( $this->is_of_type( 'image-select' ) ) {
			// Return the array as is.
			return $this->value;
		}

		if ( is_array( $this->value ) ) {
			return implode( ', ', $this->value );
		}

		return $this->value;
	}

	/**
	 * Get the value of the field for the API.
	 *
	 * @return string
	 */
	private function get_render_api_value() {
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			$value = $this->value;
			foreach ( $value['files'] as $file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$file_id                = absint( $file['file_id'] );
				$file['file_id']        = $file_id;
				$file['size']           = size_format( $file['size'] );
				$file['url']            = apply_filters( 'jetpack_unauth_file_download_url', '', $file_id );
				$file['is_previewable'] = $this->is_previewable_file( $file );
				$files[]                = $file;
			}
			$value['files'] = $files;
			return $value;
		}

		if ( $this->is_of_type( 'image-select' ) ) {
			// Return the array as is.
			return $this->value;
		}

		if ( is_array( $this->value ) ) {
			// If the value is an array, we can return it as a JSON string.
			return implode( ', ', $this->value );
		}
		// This method is deprecated, use render_value instead.
		return $this->value;
	}
	/**
	 * Get the value of the field for rendering when submitting.
	 *
	 * This method is used to prepare the value for submission, especially for file fields.
	 *
	 * @return array|string The prepared value for submission.
	 */
	private function get_render_submit_value() {
		if ( $this->is_of_type( 'file' ) ) {
			$files = array();
			foreach ( $this->value['files'] as $file ) {
				if ( ! isset( $file['size'] ) || ! isset( $file['file_id'] ) ) {
					// this shouldn't happen, todo: log this
					continue;
				}
				$files[] = array(
					'file_id' => absint( $file['file_id'] ),
					'name'    => $file['name'] ?? '',
					'size'    => absint( $file['size'] ),
					'type'    => $file['type'] ?? '',
				);
			}

			return array(
				'field_id' => $this->get_form_field_id(),
				'files'    => $files,
			);
		}

		return $this->value;
	}

	/**
	 * Check if the field is of a specific type.
	 *
	 * @param string $type The type to check against.
	 *
	 * @return bool True if the field is of the specified type, false otherwise.
	 */
	public function is_of_type( $type ) {
		return $this->type === $type;
	}

	/**
	 * Check if the field should be compiled.
	 *
	 * @return bool
	 */
	public function compile_field() {
		return $this->get_meta_key_value( 'render' ) === false;
	}

	/**
	 * Get the type of the field.
	 *
	 * @return string
	 */
	public function get_type() {
		return $this->type;
	}

	/**
	 * Get the meta array of the field.
	 *
	 * @return array
	 */
	public function get_meta() {
		return $this->meta;
	}

	/**
	 * Get a specific meta value by key.
	 *
	 * @param string $meta_key The key of the meta to retrieve.
	 *
	 * @return mixed|null Returns the value of the meta key if it exists, null otherwise.
	 */
	public function get_meta_key_value( $meta_key ) {
		if ( isset( $this->meta[ $meta_key ] ) ) {
			return $this->meta[ $meta_key ];
		}
		return null;
	}

	/**
	 * Get the serialized representation of the field.
	 *
	 * @return array
	 */
	public function serialize() {
		return array(
			'key'           => $this->get_key(),
			'label'         => $this->get_label(),
			'value'         => $this->get_value(),
			'type'          => $this->get_type(),
			'meta'          => $this->get_meta(),
			'form_field_id' => $this->get_form_field_id(),
		);
	}
	/**
	 * Create a Feedback_Field object from serialized data.
	 *
	 * @param array $data The serialized data.
	 *
	 * @return Feedback_Field|null Returns a Feedback_Field object or null if the data is invalid.
	 */
	public static function from_serialized( $data ) {
		if ( ! is_array( $data ) || ! isset( $data['key'] ) || ! isset( $data['value'] ) || ! isset( $data['label'] ) ) {
			return null;
		}

		return new self(
			$data['key'],
			$data['label'],
			$data['value'],
			$data['type'] ?? 'basic',
			$data['meta'] ?? array(),
			$data['form_field_id'] ?? ''
		);
	}

	/**
	 * Normalize Unicode characters in a string.
	 *
	 * This is only used for V2 version of the feedback. Since we didn't escape special characters
	 *
	 * @param string $string The string to normalize.
	 *
	 * @return string
	 */
	public static function normalize_unicode( $string ) {
		// Case 1: JSON-style escapes, e.g. "\u003cstrong\u003e" or "\ud83d\ude48"
		if ( strpos( $string, '\u' ) !== false ) {
			$decoded = json_decode( '"' . $string . '"' );
			if ( self::is_valid_json_decode( $decoded ) ) {
				return $decoded;
			}
		}

		// Case 2: Raw surrogate dumps, e.g. "ud83dude48" or "u003cstrongu003e"
		if ( preg_match( '/u[0-9a-fA-F]{4}/', $string ) ) {
			// Add missing backslashes before each uXXXX
			$json_ready = preg_replace( '/u([0-9a-fA-F]{4})/', '\\\\u$1', $string );
			$decoded    = json_decode( '"' . $json_ready . '"' );
			if ( self::is_valid_json_decode( $decoded ) ) {
				return $decoded;
			}
		}

		// Fallback: return unchanged
		return $string;
	}

	/**
	 * Check if the decoded JSON is valid.
	 *
	 * @param mixed $decoded The decoded JSON data.
	 * @return bool True if there are no errors, false otherwise.
	 */
	private static function is_valid_json_decode( $decoded ) {
		return $decoded !== null && json_last_error() === JSON_ERROR_NONE;
	}

	/**
	 * Create a Feedback_Field object from serialized data.
	 *
	 * @param array $data The serialized data.
	 *
	 * @return Feedback_Field|null Returns a Feedback_Field object or null if the data is invalid.
	 */
	public static function from_serialized_v2( $data ) {
		if ( ! is_array( $data ) || ! isset( $data['key'] ) || ! isset( $data['value'] ) || ! isset( $data['label'] ) ) {
			return null;
		}

		if ( is_string( $data['value'] ) ) { // just normalize plain string for now.
			$data['value'] = self::normalize_unicode( $data['value'] );
		}

		if ( is_string( $data['label'] ) ) { // just normalize plain string for now.
			$data['label'] = self::normalize_unicode( $data['label'] );
		}

		return new self(
			$data['key'],
			$data['label'],
			$data['value'],
			$data['type'] ?? 'basic',
			$data['meta'] ?? array(),
			$data['form_field_id'] ?? ''
		);
	}

	/**
	 * Check if the field has a file
	 *
	 * @return bool
	 */
	public function has_file() {
		if ( $this->is_of_type( 'file' ) ) {
			if ( ! isset( $this->value['files'] ) || ! is_array( $this->value['files'] ) ) {
				return false;
			}
			return count( $this->value['files'] ) > 0;
		}

		return false;
	}

	/**
	 * Checks if the file is previewable based on its type or extension.
	 * Only image formats are allowed to be previewed in the modal. PDFs may be previewed in the browser elsewhere, but not in the modal.
	 *
	 * @param array $file File data.
	 * @return bool True if the file is previewable, false otherwise.
	 */
	private function is_previewable_file( $file ) {
		$file_type = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
		// Check if the file is previewable based on its type or extension.
		// Note: This is a simplified check and does not match if the file is allowed to be uploaded by the server.
		$previewable_types = array( 'jpg', 'jpeg', 'png', 'gif', 'webp' );
		return in_array( $file_type, $previewable_types, true );
	}
}
