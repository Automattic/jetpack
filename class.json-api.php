<?php

defined( 'WPCOM_JSON_API__DEBUG' ) or define( 'WPCOM_JSON_API__DEBUG', false );

require_once dirname( __FILE__ ) . '/sal/class.json-api-platform.php';

class WPCOM_JSON_API {
	static $self = null;

	public $endpoints = array();

	public $token_details = array();

	public $method = '';
	public $url = '';
	public $path = '';
	public $version = null;
	public $query = array();
	public $post_body = null;
	public $files = null;
	public $content_type = null;
	public $accept = '';

	public $_server_https;
	public $exit = true;
	public $public_api_scheme = 'https';

	public $output_status_code = 200;

	public $trapped_error = null;
	public $did_output = false;

	public $extra_headers = array();

	/**
	 * @return WPCOM_JSON_API instance
	 */
	static function init( $method = null, $url = null, $post_body = null ) {
		if ( !self::$self ) {
			$class = function_exists( 'get_called_class' ) ? get_called_class() : __CLASS__;
			self::$self = new $class( $method, $url, $post_body );
		}
		return self::$self;
	}

	function add( WPCOM_JSON_API_Endpoint $endpoint ) {
		$path_versions = serialize( array (
			$endpoint->path,
			$endpoint->min_version,
			$endpoint->max_version,
		) );
		if ( !isset( $this->endpoints[$path_versions] ) ) {
			$this->endpoints[$path_versions] = array();
		}
		$this->endpoints[$path_versions][$endpoint->method] = $endpoint;
	}

	static function is_truthy( $value ) {
		switch ( strtolower( (string) $value ) ) {
		case '1' :
		case 't' :
		case 'true' :
			return true;
		}

		return false;
	}

	static function is_falsy( $value ) {
		switch ( strtolower( (string) $value ) ) {
			case '0' :
			case 'f' :
			case 'false' :
				return true;
		}

		return false;
	}

	function __construct() {
		$args = func_get_args();
		call_user_func_array( array( $this, 'setup_inputs' ), $args );
	}

	function setup_inputs( $method = null, $url = null, $post_body = null ) {
		if ( is_null( $method ) ) {
			$this->method = strtoupper( $_SERVER['REQUEST_METHOD'] );
		} else {
			$this->method = strtoupper( $method );
		}
		if ( is_null( $url ) ) {
			$this->url = set_url_scheme( 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] );
		} else {
			$this->url = $url;
		}

		$parsed     = parse_url( $this->url );
		$this->path = $parsed['path'];

		if ( !empty( $parsed['query'] ) ) {
			wp_parse_str( $parsed['query'], $this->query );
		}

		if ( isset( $_SERVER['HTTP_ACCEPT'] ) && $_SERVER['HTTP_ACCEPT'] ) {
			$this->accept = $_SERVER['HTTP_ACCEPT'];
		}

		if ( 'POST' === $this->method ) {
			if ( is_null( $post_body ) ) {
				$this->post_body = file_get_contents( 'php://input' );

				if ( isset( $_SERVER['HTTP_CONTENT_TYPE'] ) && $_SERVER['HTTP_CONTENT_TYPE'] ) {
					$this->content_type = $_SERVER['HTTP_CONTENT_TYPE'];
				} elseif ( isset( $_SERVER['CONTENT_TYPE'] ) && $_SERVER['CONTENT_TYPE'] ) {
					$this->content_type = $_SERVER['CONTENT_TYPE'] ;
				} elseif ( '{' === $this->post_body[0] ) {
					$this->content_type = 'application/json';
				} else {
					$this->content_type = 'application/x-www-form-urlencoded';
				}

				if ( 0 === strpos( strtolower( $this->content_type ), 'multipart/' ) ) {
					$this->post_body = http_build_query( stripslashes_deep( $_POST ) );
					$this->files = $_FILES;
					$this->content_type = 'multipart/form-data';
				}
			} else {
				$this->post_body = $post_body;
				$this->content_type = '{' === isset( $this->post_body[0] ) && $this->post_body[0] ? 'application/json' : 'application/x-www-form-urlencoded';
			}
		} else {
			$this->post_body = null;
			$this->content_type = null;
		}

		$this->_server_https = array_key_exists( 'HTTPS', $_SERVER ) ? $_SERVER['HTTPS'] : '--UNset--';
	}

	function initialize() {
		$this->token_details['blog_id'] = Jetpack_Options::get_option( 'id' );
	}

	function serve( $exit = true ) {
		ini_set( 'display_errors', false );

		$this->exit = (bool) $exit;

		// This was causing problems with Jetpack, but is necessary for wpcom
		// @see https://github.com/Automattic/jetpack/pull/2603
		// @see r124548-wpcom
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_filter( 'home_url', array( $this, 'ensure_http_scheme_of_home_url' ), 10, 3 );
		}

		add_filter( 'user_can_richedit', '__return_true' );

		add_filter( 'comment_edit_pre', array( $this, 'comment_edit_pre' ) );

		$initialization = $this->initialize();
		if ( 'OPTIONS' == $this->method ) {
			/**
			 * Fires before the page output.
			 * Can be used to specify custom header options.
			 *
			 * @module json-api
			 *
			 * @since 3.1.0
			 */
			do_action( 'wpcom_json_api_options' );
			return $this->output( 200, '', 'text/plain' );
		}

		if ( is_wp_error( $initialization ) ) {
			$this->output_error( $initialization );
			return;
		}

		// Normalize path and extract API version
		$this->path = untrailingslashit( $this->path );
		preg_match( '#^/rest/v(\d+(\.\d+)*)#', $this->path, $matches );
		$this->path = substr( $this->path, strlen( $matches[0] ) );
		$this->version = $matches[1];

		$allowed_methods = array( 'GET', 'POST' );
		$four_oh_five = false;

		$is_help = preg_match( '#/help/?$#i', $this->path );
		$matching_endpoints = array();

		if ( $is_help ) {
			$origin = get_http_origin();

			if ( !empty( $origin ) && 'GET' == $this->method ) {
				header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
			}

			$this->path = substr( rtrim( $this->path, '/' ), 0, -5 );
			// Show help for all matching endpoints regardless of method
			$methods = $allowed_methods;
			$find_all_matching_endpoints = true;
			// How deep to truncate each endpoint's path to see if it matches this help request
			$depth = substr_count( $this->path, '/' ) + 1;
			if ( false !== stripos( $this->accept, 'javascript' ) || false !== stripos( $this->accept, 'json' ) ) {
				$help_content_type = 'json';
			} else {
				$help_content_type = 'html';
			}
		} else {
			if ( in_array( $this->method, $allowed_methods ) ) {
				// Only serve requested method
				$methods = array( $this->method );
				$find_all_matching_endpoints = false;
			} else {
				// We don't allow this requested method - find matching endpoints and send 405
				$methods = $allowed_methods;
				$find_all_matching_endpoints = true;
				$four_oh_five = true;
			}
		}

		// Find which endpoint to serve
		$found = false;
		foreach ( $this->endpoints as $endpoint_path_versions => $endpoints_by_method ) {
			$endpoint_path_versions = unserialize( $endpoint_path_versions );
			$endpoint_path        = $endpoint_path_versions[0];
			$endpoint_min_version = $endpoint_path_versions[1];
			$endpoint_max_version = $endpoint_path_versions[2];

			// Make sure max_version is not less than min_version
			if ( version_compare( $endpoint_max_version, $endpoint_min_version, '<' ) ) {
				$endpoint_max_version = $endpoint_min_version;
			}

			foreach ( $methods as $method ) {
				if ( !isset( $endpoints_by_method[$method] ) ) {
					continue;
				}

				// Normalize
				$endpoint_path = untrailingslashit( $endpoint_path );
				if ( $is_help ) {
					// Truncate path at help depth
					$endpoint_path = join( '/', array_slice( explode( '/', $endpoint_path ), 0, $depth ) );
				}

				// Generate regular expression from sprintf()
				$endpoint_path_regex = str_replace( array( '%s', '%d' ), array( '([^/?&]+)', '(\d+)' ), $endpoint_path );

				if ( !preg_match( "#^$endpoint_path_regex\$#", $this->path, $path_pieces ) ) {
					// This endpoint does not match the requested path.
					continue;
				}

				if ( version_compare( $this->version, $endpoint_min_version, '<' ) || version_compare( $this->version, $endpoint_max_version, '>' ) ) {
					// This endpoint does not match the requested version.
					continue;
				}

				$found = true;

				if ( $find_all_matching_endpoints ) {
					$matching_endpoints[] = array( $endpoints_by_method[$method], $path_pieces );
				} else {
					// The method parameters are now in $path_pieces
					$endpoint = $endpoints_by_method[$method];
					break 2;
				}
			}
		}

		if ( !$found ) {
			return $this->output( 404, '', 'text/plain' );
		}

		if ( $four_oh_five ) {
			$allowed_methods = array();
			foreach ( $matching_endpoints as $matching_endpoint ) {
				$allowed_methods[] = $matching_endpoint[0]->method;
			}

			header( 'Allow: ' . strtoupper( join( ',', array_unique( $allowed_methods ) ) ) );
			return $this->output( 405, array( 'error' => 'not_allowed', 'error_message' => 'Method not allowed' ) );
		}

		if ( $is_help ) {
			/**
			 * Fires before the API output.
			 *
			 * @since 1.9.0
			 *
			 * @param string help.
			 */
			do_action( 'wpcom_json_api_output', 'help' );
			$proxied = function_exists( 'wpcom_is_proxied_request' ) ? wpcom_is_proxied_request() : false;
			if ( 'json' === $help_content_type ) {
				$docs = array();
				foreach ( $matching_endpoints as $matching_endpoint ) {
					if ( $matching_endpoint[0]->is_publicly_documentable() || $proxied || WPCOM_JSON_API__DEBUG )
						$docs[] = call_user_func( array( $matching_endpoint[0], 'generate_documentation' ) );
				}
				return $this->output( 200, $docs );
			} else {
				status_header( 200 );
				foreach ( $matching_endpoints as $matching_endpoint ) {
					if ( $matching_endpoint[0]->is_publicly_documentable() || $proxied || WPCOM_JSON_API__DEBUG )
						call_user_func( array( $matching_endpoint[0], 'document' ) );
				}
			}
			exit;
		}

		if ( $endpoint->in_testing && !WPCOM_JSON_API__DEBUG ) {
			return $this->output( 404, '', 'text/plain' );
		}

		/** This action is documented in class.json-api.php */
		do_action( 'wpcom_json_api_output', $endpoint->stat );

		$response = $this->process_request( $endpoint, $path_pieces );

		if ( !$response && !is_array( $response ) ) {
			return $this->output( 500, '', 'text/plain' );
		} elseif ( is_wp_error( $response ) ) {
			return $this->output_error( $response );
		}

		$output_status_code = $this->output_status_code;
		$this->set_output_status_code();

		return $this->output( $output_status_code, $response, 'application/json', $this->extra_headers );
	}

	function process_request( WPCOM_JSON_API_Endpoint $endpoint, $path_pieces ) {
		$this->endpoint = $endpoint;
		return call_user_func_array( array( $endpoint, 'callback' ), $path_pieces );
	}

	function output_early( $status_code, $response = null, $content_type = 'application/json' ) {
		$exit = $this->exit;
		$this->exit = false;
		if ( is_wp_error( $response ) )
			$this->output_error( $response );
		else
			$this->output( $status_code, $response, $content_type );
		$this->exit = $exit;
		if ( ! defined( 'XMLRPC_REQUEST' ) || ! XMLRPC_REQUEST ) {
			$this->finish_request();
		}
	}

	function set_output_status_code( $code = 200 ) {
		$this->output_status_code = $code;
	}

	function output( $status_code, $response = null, $content_type = 'application/json', $extra = array() ) {
		// In case output() was called before the callback returned
		if ( $this->did_output ) {
			if ( $this->exit )
				exit;
			return $content_type;
		}
		$this->did_output = true;

		// 400s and 404s are allowed for all origins
		if ( 404 == $status_code || 400 == $status_code )
			header( 'Access-Control-Allow-Origin: *' );

		if ( is_null( $response ) ) {
			$response = new stdClass;
		}

		if ( 'text/plain' === $content_type ) {
			status_header( (int) $status_code );
			header( 'Content-Type: text/plain' );
			foreach( $extra as $key => $value ) {
				header( "$key: $value" );
			}
			echo $response;
			if ( $this->exit ) {
				exit;
			}

			return $content_type;
		}

		$response = $this->filter_fields( $response );

		if ( isset( $this->query['http_envelope'] ) && self::is_truthy( $this->query['http_envelope'] ) ) {
			$headers = array(
				array(
					'name' => 'Content-Type',
					'value' => $content_type,
				)
			);
			
			foreach( $extra as $key => $value ) {
				$headers[] = array( 'name' => $key, 'value' => $value );
			}

			$response = array(
				'code' => (int) $status_code,
				'headers' => $headers,
				'body' => $response,
			);
			$status_code = 200;
			$content_type = 'application/json';
		}

		status_header( (int) $status_code );
		header( "Content-Type: $content_type" );
		if ( isset( $this->query['callback'] ) && is_string( $this->query['callback'] ) ) {
			$callback = preg_replace( '/[^a-z0-9_.]/i', '', $this->query['callback'] );
		} else {
			$callback = false;
		}

		if ( $callback ) {
			// Mitigate Rosetta Flash [1] by setting the Content-Type-Options: nosniff header
			// and by prepending the JSONP response with a JS comment.
			// [1] http://miki.it/blog/2014/7/8/abusing-jsonp-with-rosetta-flash/
			echo "/**/$callback(";

		}
		echo $this->json_encode( $response );
		if ( $callback ) {
			echo ");";
		}

		if ( $this->exit ) {
			exit;
		}

		return $content_type;
	}

	public static function serializable_error ( $error ) {

		$status_code = $error->get_error_data();

		if ( is_array( $status_code ) ) {
			$status_code = $status_code['status_code'];
		}

		if ( !$status_code ) {
			$status_code = 400;
		}
		$response = array(
			'error'   => $error->get_error_code(),
			'message' => $error->get_error_message(),
		);
		
		if ( $additional_data = $error->get_error_data( 'additional_data' ) ) {
			$response['data'] = $additional_data;
		}		

		return array(
			'status_code' => $status_code,
			'errors' => $response
		);
	}

	function output_error( $error ) {
		$error_response = $this->serializable_error( $error );

		return $this->output( $error_response[ 'status_code'], $error_response['errors'] );
	}

	function filter_fields( $response ) {
		if ( empty( $this->query['fields'] ) || ( is_array( $response ) && ! empty( $response['error'] ) ) || ! empty( $this->endpoint->custom_fields_filtering ) )
			return $response;

		$fields = array_map( 'trim', explode( ',', $this->query['fields'] ) );

		if ( is_object( $response ) ) {
			$response = (array) $response;
		}

		$has_filtered = false;
		if ( is_array( $response ) && empty( $response['ID'] ) ) {
			$keys_to_filter = array(
				'categories',
				'comments',
				'connections',
				'domains',
				'groups',
				'likes',
				'media',
				'notes',
				'posts',
				'services',
				'sites',
				'suggestions',
				'tags',
				'themes',
				'topics',
				'users',
			);

			foreach ( $keys_to_filter as $key_to_filter ) {
				if ( ! isset( $response[ $key_to_filter ] ) || $has_filtered )
					continue;

				foreach ( $response[ $key_to_filter ] as $key => $values ) {
					if ( is_object( $values ) ) {
						if ( is_object( $response[ $key_to_filter ] ) ) {
							$response[ $key_to_filter ]->$key = (object) array_intersect_key( ( (array) $values ), array_flip( $fields ) );
						} elseif ( is_array( $response[ $key_to_filter ] ) ) {
							$response[ $key_to_filter ][ $key ] = (object) array_intersect_key( ( (array) $values ), array_flip( $fields ) );
						}
					} elseif ( is_array( $values ) ) {
						$response[ $key_to_filter ][ $key ] = array_intersect_key( $values, array_flip( $fields ) );
					}
				}

				$has_filtered = true;
			}
		}

		if ( ! $has_filtered ) {
			if ( is_object( $response ) ) {
				$response = (object) array_intersect_key( (array) $response, array_flip( $fields ) );
			} else if ( is_array( $response ) ) {
				$response = array_intersect_key( $response, array_flip( $fields ) );
			}
		}

		return $response;
	}

	function ensure_http_scheme_of_home_url( $url, $path, $original_scheme ) {
		if ( $original_scheme ) {
			return $url;
		}

		return preg_replace( '#^https:#', 'http:', $url );
	}

	function comment_edit_pre( $comment_content ) {
		return htmlspecialchars_decode( $comment_content, ENT_QUOTES );
	}

	function json_encode( $data ) {
		return json_encode( $data );
	}

	function ends_with( $haystack, $needle ) {
		return $needle === substr( $haystack, -strlen( $needle ) );
	}

	// Returns the site's blog_id in the WP.com ecosystem
	function get_blog_id_for_output() {
		return $this->token_details['blog_id'];
	}

	// Returns the site's local blog_id
	function get_blog_id( $blog_id ) {
		return $GLOBALS['blog_id'];
	}

	function switch_to_blog_and_validate_user( $blog_id = 0, $verify_token_for_blog = true ) {
		if ( $this->is_restricted_blog( $blog_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot access this restricted blog', 403 );
		}

		if ( -1 == get_option( 'blog_public' ) && !current_user_can( 'read' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot access this private blog.', 403 );
		}

		return $blog_id;
	}

	// Returns true if the specified blog ID is a restricted blog
	function is_restricted_blog( $blog_id ) {
		/**
		 * Filters all REST API access and return a 403 unauthorized response for all Restricted blog IDs.
		 *
		 * @module json-api
		 *
		 * @since 3.4.0
		 *
		 * @param array $array Array of Blog IDs.
		 */
		$restricted_blog_ids = apply_filters( 'wpcom_json_api_restricted_blog_ids', array() );
		return true === in_array( $blog_id, $restricted_blog_ids );
	}

	function post_like_count( $blog_id, $post_id ) {
		return 0;
	}

	function is_liked( $blog_id, $post_id ) {
		return false;
	}

	function is_reblogged( $blog_id, $post_id ) {
		return false;
	}

	function is_following( $blog_id ) {
		return false;
	}

	function add_global_ID( $blog_id, $post_id ) {
		return '';
	}

	function get_avatar_url( $email, $avatar_size = null ) {
		if ( function_exists( 'wpcom_get_avatar_url' ) ) {
			return null === $avatar_size
				? wpcom_get_avatar_url( $email )
				: wpcom_get_avatar_url( $email, $avatar_size );
		} else {
			return null === $avatar_size
				? get_avatar_url( $email )
				: get_avatar_url( $email, $avatar_size );
		}
	}

	/**
	 * traps `wp_die()` calls and outputs a JSON response instead.
	 * The result is always output, never returned.
	 *
	 * @param string|null $error_code  Call with string to start the trapping.  Call with null to stop.
	 * @param int         $http_status  HTTP status code, 400 by default.
	 */
	function trap_wp_die( $error_code = null, $http_status = 400 ) {
		if ( is_null( $error_code ) ) {
			$this->trapped_error = null;
			// Stop trapping
			remove_filter( 'wp_die_handler', array( $this, 'wp_die_handler_callback' ) );
			return;
		}

		// If API called via PHP, bail: don't do our custom wp_die().  Do the normal wp_die().
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( ! defined( 'REST_API_REQUEST' ) || ! REST_API_REQUEST ) {
				return;
			}
		} else {
			if ( ! defined( 'XMLRPC_REQUEST' ) || ! XMLRPC_REQUEST ) {
				return;
			}
		}

		$this->trapped_error = array(
			'status'  => $http_status,
			'code'    => $error_code,
			'message' => '',
		);
		// Start trapping
		add_filter( 'wp_die_handler', array( $this, 'wp_die_handler_callback' ) );
	}

	function wp_die_handler_callback() {
		return array( $this, 'wp_die_handler' );
	}

	function wp_die_handler( $message, $title = '', $args = array() ) {
		// Allow wp_die calls to override HTTP status code...
		$args = wp_parse_args( $args, array(
			'response' => $this->trapped_error['status'],
		) );

		// ... unless it's 500 ( see http://wp.me/pMz3w-5VV )
		if ( (int) $args['response'] !== 500 ) {
			$this->trapped_error['status'] = $args['response'];
		}

		if ( $title ) {
			$message = "$title: $message";
		}

		$this->trapped_error['message'] = wp_kses( $message, array() );

		switch ( $this->trapped_error['code'] ) {
			case 'comment_failure' :
				if ( did_action( 'comment_duplicate_trigger' ) ) {
					$this->trapped_error['code'] = 'comment_duplicate';
				} else if ( did_action( 'comment_flood_trigger' ) ) {
					$this->trapped_error['code'] = 'comment_flood';
				}
				break;
		}

		// We still want to exit so that code execution stops where it should.
		// Attach the JSON output to the WordPress shutdown handler
		add_action( 'shutdown', array( $this, 'output_trapped_error' ), 0 );
		exit;
	}

	function output_trapped_error() {
		$this->exit = false; // We're already exiting once.  Don't do it twice.
		$this->output( $this->trapped_error['status'], (object) array(
			'error'   => $this->trapped_error['code'],
			'message' => $this->trapped_error['message'],
		) );
	}

	function finish_request() {
		if ( function_exists( 'fastcgi_finish_request' ) )
			return fastcgi_finish_request();
	}
}
