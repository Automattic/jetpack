<?php
/**
 * HTTP API: WP_Http_Cookie class
 *
 * @package WordPress
 * @subpackage HTTP
 * @since 4.4.0
 */

/**
 * Core class used to encapsulate a single cookie object for internal use.
 *
 * Returned cookies are represented using this class, and when cookies are set, if they are not
 * already a WP_Http_Cookie() object, then they are turned into one.
 *
 * @todo The WordPress convention is to use underscores instead of camelCase for function and method
 * names. Need to switch to use underscores instead for the methods.
 *
 * @since 2.8.0
 */
#[AllowDynamicProperties]
class WP_Http_Cookie {

	/**
	 * Cookie name.
	 *
	 * @since 2.8.0
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Cookie value.
	 *
	 * @since 2.8.0
	 *
	 * @var string
	 */
	public $value;

	/**
	 * When the cookie expires. Unix timestamp or formatted date.
	 *
	 * @since 2.8.0
	 *
	 * @var string|int|null
	 */
	public $expires;

	/**
	 * Cookie URL path.
	 *
	 * @since 2.8.0
	 *
	 * @var string
	 */
	public $path;

	/**
	 * Cookie Domain.
	 *
	 * @since 2.8.0
	 *
	 * @var string
	 */
	public $domain;

	/**
	 * Cookie port or comma-separated list of ports.
	 *
	 * @since 2.8.0
	 *
	 * @var int|string
	 */
	public $port;

	/**
	 * host-only flag.
	 *
	 * @since 5.2.0
	 *
	 * @var bool
	 */
	public $host_only;

	/**
	 * Sets up this cookie object.
	 *
	 * The parameter $data should be either an associative array containing the indices names below
	 * or a header string detailing it.
	 *
	 * @since 2.8.0
	 * @since 5.2.0 Added `host_only` to the `$data` parameter.
	 *
	 * @param string|array $data {
	 *     Raw cookie data as header string or data array.
	 *
	 *     @type string          $name      Cookie name.
	 *     @type mixed           $value     Value. Should NOT already be urlencoded.
	 *     @type string|int|null $expires   Optional. Unix timestamp or formatted date. Default null.
	 *     @type string          $path      Optional. Path. Default '/'.
	 *     @type string          $domain    Optional. Domain. Default host of parsed $requested_url.
	 *     @type int|string      $port      Optional. Port or comma-separated list of ports. Default null.
	 *     @type bool            $host_only Optional. host-only storage flag. Default true.
	 * }
	 * @param string       $requested_url The URL which the cookie was set on, used for default $domain
	 *                                    and $port values.
	 */
	public function __construct( $data, $requested_url = '' ) {
		if ( $requested_url ) {
			$parsed_url = parse_url( $requested_url );
		}
		if ( isset( $parsed_url['host'] ) ) {
			$this->domain = $parsed_url['host'];
		}
		$this->path = isset( $parsed_url['path'] ) ? $parsed_url['path'] : '/';
		if ( '/' !== substr( $this->path, -1 ) ) {
			$this->path = dirname( $this->path ) . '/';
		}

		if ( is_string( $data ) ) {
			// Assume it's a header string direct from a previous request.
			$pairs = explode( ';', $data );

			// Special handling for first pair; name=value. Also be careful of "=" in value.
			$name        = trim( substr( $pairs[0], 0, strpos( $pairs[0], '=' ) ) );
			$value       = substr( $pairs[0], strpos( $pairs[0], '=' ) + 1 );
			$this->name  = $name;
			$this->value = urldecode( $value );

			// Removes name=value from items.
			array_shift( $pairs );

			// Set everything else as a property.
			foreach ( $pairs as $pair ) {
				$pair = rtrim( $pair );

				// Handle the cookie ending in ; which results in a empty final pair.
				if ( empty( $pair ) ) {
					continue;
				}

				list( $key, $val ) = strpos( $pair, '=' ) ? explode( '=', $pair ) : array( $pair, '' );
				$key               = strtolower( trim( $key ) );
				if ( 'expires' === $key ) {
					$val = strtotime( $val );
				}
				$this->$key = $val;
			}
		} else {
			if ( ! isset( $data['name'] ) ) {
				return;
			}

			// Set properties based directly on parameters.
			foreach ( array( 'name', 'value', 'path', 'domain', 'port', 'host_only' ) as $field ) {
				if ( isset( $data[ $field ] ) ) {
					$this->$field = $data[ $field ];
				}
			}

			if ( isset( $data['expires'] ) ) {
				$this->expires = is_int( $data['expires'] ) ? $data['expires'] : strtotime( $data['expires'] );
			} else {
				$this->expires = null;
			}
		}
	}

	/**
	 * Confirms that it's OK to send this cookie to the URL checked against.
	 *
	 * Decision is based on RFC 2109/2965, so look there for details on validity.
	 *
	 * @since 2.8.0
	 *
	 * @param string $url URL you intend to send this cookie to
	 * @return bool true if allowed, false otherwise.
	 */
	public function test( $url ) {
		if ( is_null( $this->name ) ) {
			return false;
		}

		// Expires - if expired then nothing else matters.
		if ( isset( $this->expires ) && time() > $this->expires ) {
			return false;
		}

		// Get details on the URL we're thinking about sending to.
		$url         = parse_url( $url );
		$url['port'] = isset( $url['port'] ) ? $url['port'] : ( 'https' === $url['scheme'] ? 443 : 80 );
		$url['path'] = isset( $url['path'] ) ? $url['path'] : '/';

		// Values to use for comparison against the URL.
		$path   = isset( $this->path ) ? $this->path : '/';
		$port   = isset( $this->port ) ? $this->port : null;
		$domain = isset( $this->domain ) ? strtolower( $this->domain ) : strtolower( $url['host'] );
		if ( false === stripos( $domain, '.' ) ) {
			$domain .= '.local';
		}

		// Host - very basic check that the request URL ends with the domain restriction (minus leading dot).
		$domain = ( '.' === substr( $domain, 0, 1 ) ) ? substr( $domain, 1 ) : $domain;
		if ( substr( $url['host'], -strlen( $domain ) ) !== $domain ) {
			return false;
		}

		// Port - supports "port-lists" in the format: "80,8000,8080".
		if ( ! empty( $port ) && ! in_array( $url['port'], array_map( 'intval', explode( ',', $port ) ), true ) ) {
			return false;
		}

		// Path - request path must start with path restriction.
		if ( substr( $url['path'], 0, strlen( $path ) ) !== $path ) {
			return false;
		}

		return true;
	}

	/**
	 * Convert cookie name and value back to header string.
	 *
	 * @since 2.8.0
	 *
	 * @return string Header encoded cookie name and value.
	 */
	public function getHeaderValue() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		if ( ! isset( $this->name ) || ! isset( $this->value ) ) {
			return '';
		}

		/**
		 * Filters the header-encoded cookie value.
		 *
		 * @since 3.4.0
		 *
		 * @param string $value The cookie value.
		 * @param string $name  The cookie name.
		 */
		return $this->name . '=' . apply_filters( 'wp_http_cookie_value', $this->value, $this->name );
	}

	/**
	 * Retrieve cookie header for usage in the rest of the WordPress HTTP API.
	 *
	 * @since 2.8.0
	 *
	 * @return string
	 */
	public function getFullHeader() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		return 'Cookie: ' . $this->getHeaderValue();
	}

	/**
	 * Retrieves cookie attributes.
	 *
	 * @since 4.6.0
	 *
	 * @return array {
	 *     List of attributes.
	 *
	 *     @type string|int|null $expires When the cookie expires. Unix timestamp or formatted date.
	 *     @type string          $path    Cookie URL path.
	 *     @type string          $domain  Cookie domain.
	 * }
	 */
	public function get_attributes() {
		return array(
			'expires' => $this->expires,
			'path'    => $this->path,
			'domain'  => $this->domain,
		);
	}
}
