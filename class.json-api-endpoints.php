<?php

require_once( dirname( __FILE__ ) . '/json-api-config.php' );

// Endpoint
abstract class WPCOM_JSON_API_Endpoint {
	// The API Object
	public $api;

	public $pass_wpcom_user_details = false;

	// One liner.
	public $description;

	// Object Grouping For Documentation (Users, Posts, Comments)
	public $group;

	// Stats extra value to bump
	public $stat;

	// HTTP Method
	public $method = 'GET';

	// Minimum version of the api for which to serve this endpoint
	public $min_version = '0';

	// Maximum version of the api for which to serve this endpoint
	public $max_version = WPCOM_JSON_API__CURRENT_VERSION;

	// Path at which to serve this endpoint: sprintf() format.
	public $path = '';

	// Identifiers to fill sprintf() formatted $path
	public $path_labels = array();

	// Accepted query parameters
	public $query = array(
		// Parameter name
		'context' => array(
			// Default value => description
			'display' => 'Formats the output as HTML for display.  Shortcodes are parsed, paragraph tags are added, etc..',
			// Other possible values => description
			'edit'    => 'Formats the output for editing.  Shortcodes are left unparsed, significant whitespace is kept, etc..',
		),
		'http_envelope' => array(
			'false' => '',
			'true'  => 'Some environments (like in-browser JavaScript or Flash) block or divert responses with a non-200 HTTP status code.  Setting this parameter will force the HTTP status code to always be 200.  The JSON response is wrapped in an "envelope" containing the "real" HTTP status code and headers.',
		),
		'pretty' => array(
			'false' => '',
			'true'  => 'Output pretty JSON',
		),
		'meta' => "(string) Optional. Loads data from the endpoints found in the 'meta' part of the response. Comma-separated list. Example: meta=site,likes",
		'fields' => '(string) Optional. Returns specified fields only. Comma-separated list. Example: fields=ID,title',
		// Parameter name => description (default value is empty)
		'callback' => '(string) An optional JSONP callback function.',
	);

	// Response format
	public $response_format = array();

	// Request format
	public $request_format = array();

	// Is this endpoint still in testing phase?  If so, not available to the public.
	public $in_testing = false;

	// Is this endpoint still allowed if the site in question is flagged?
	public $allowed_if_flagged = false;

	// Is this endpoint allowed if the site is red flagged?
	public $allowed_if_red_flagged = false;

	/**
	 * @var string Version of the API
	 */
	public $version = '';

	/**
	 * @var string Example request to make
	 */
	public $example_request = '';

	/**
	 * @var string Example request data (for POST methods)
	 */
	public $example_request_data = '';

	/**
	 * @var string Example response from $example_request
	 */
	public $example_response = '';

	/**
	 * @var bool Set to true if the endpoint implements its own filtering instead of the standard `fields` query method
	 */
	public $custom_fields_filtering = false;

	/**
	 * @var bool Set to true if the endpoint accepts all cross origin requests. You probably should not set this flag.
	 */
	public $allow_cross_origin_request = false;

	/**
	 * @var bool Set to true if the endpoint can recieve unauthorized POST requests.
	 */
	public $allow_unauthorized_request = false;

	/**
	 * @var bool Set to true if the endpoint should accept site based (not user based) authentication.
	 */
	public $allow_jetpack_site_auth = false;

	function __construct( $args ) {
		$defaults = array(
			'in_testing'           => false,
			'allowed_if_flagged'   => false,
			'allowed_if_red_flagged' => false,
			'description'          => '',
			'group'	               => '',
			'method'               => 'GET',
			'path'                 => '/',
			'min_version'          => '0',
			'max_version'          => WPCOM_JSON_API__CURRENT_VERSION,
			'force'	               => '',
			'deprecated'           => false,
			'new_version'          => WPCOM_JSON_API__CURRENT_VERSION,
			'jp_disabled'          => false,
			'path_labels'          => array(),
			'request_format'       => array(),
			'response_format'      => array(),
			'query_parameters'     => array(),
			'version'              => 'v1',
			'example_request'      => '',
			'example_request_data' => '',
			'example_response'     => '',
			'required_scope'       => '',
			'pass_wpcom_user_details' => false,
			'custom_fields_filtering' => false,
			'allow_cross_origin_request' => false,
			'allow_unauthorized_request' => false,
			'allow_jetpack_site_auth'    => false,
		);

		$args = wp_parse_args( $args, $defaults );

		$this->in_testing  = $args['in_testing'];

		$this->allowed_if_flagged = $args['allowed_if_flagged'];
		$this->allowed_if_red_flagged = $args['allowed_if_red_flagged'];

		$this->description = $args['description'];
		$this->group       = $args['group'];
		$this->stat        = $args['stat'];
		$this->force	   = $args['force'];
		$this->jp_disabled = $args['jp_disabled'];

		$this->method      = $args['method'];
		$this->path        = $args['path'];
		$this->path_labels = $args['path_labels'];
		$this->min_version = $args['min_version'];
		$this->max_version = $args['max_version'];
		$this->deprecated  = $args['deprecated'];
		$this->new_version = $args['new_version'];

		$this->pass_wpcom_user_details = $args['pass_wpcom_user_details'];
		$this->custom_fields_filtering = (bool) $args['custom_fields_filtering'];

		$this->allow_cross_origin_request = (bool) $args['allow_cross_origin_request'];
		$this->allow_unauthorized_request = (bool) $args['allow_unauthorized_request'];
		$this->allow_jetpack_site_auth    = (bool) $args['allow_jetpack_site_auth'];

		$this->version     = $args['version'];

		$this->required_scope = $args['required_scope'];

		if ( $this->request_format ) {
			$this->request_format = array_filter( array_merge( $this->request_format, $args['request_format'] ) );
		} else {
			$this->request_format = $args['request_format'];
		}

		if ( $this->response_format ) {
			$this->response_format = array_filter( array_merge( $this->response_format, $args['response_format'] ) );
		} else {
			$this->response_format = $args['response_format'];
		}

		if ( false === $args['query_parameters'] ) {
			$this->query = array();
		} elseif ( is_array( $args['query_parameters'] ) ) {
			$this->query = array_filter( array_merge( $this->query, $args['query_parameters'] ) );
		}

		$this->api = WPCOM_JSON_API::init(); // Auto-add to WPCOM_JSON_API

		/** Example Request/Response ******************************************/

		// Examples for endpoint documentation request
		$this->example_request      = $args['example_request'];
		$this->example_request_data = $args['example_request_data'];
		$this->example_response     = $args['example_response'];

		$this->api->add( $this );
	}

	// Get all query args.  Prefill with defaults
	function query_args( $return_default_values = true, $cast_and_filter = true ) {
		$args = array_intersect_key( $this->api->query, $this->query );

		if ( !$cast_and_filter ) {
			return $args;
		}

		return $this->cast_and_filter( $args, $this->query, $return_default_values );
	}

	// Get POST body data
	function input( $return_default_values = true, $cast_and_filter = true ) {
		$input = trim( $this->api->post_body );
		$content_type = $this->api->content_type;
		if ( $content_type ) {
			list ( $content_type ) = explode( ';', $content_type );
		}
		$content_type = trim( $content_type );
		switch ( $content_type ) {
		case 'application/json' :
		case 'application/x-javascript' :
		case 'text/javascript' :
		case 'text/x-javascript' :
		case 'text/x-json' :
		case 'text/json' :
			$return = json_decode( $input, true );

			if ( function_exists( 'json_last_error' ) ) {
				if ( JSON_ERROR_NONE !== json_last_error() ) {
					return null;
				}
			} else {
				if ( is_null( $return ) && json_encode( null ) !== $input ) {
					return null;
				}
			}

			break;
		case 'multipart/form-data' :
			$return = array_merge( stripslashes_deep( $_POST ), $_FILES );
			break;
		case 'application/x-www-form-urlencoded' :
			//attempt JSON first, since probably a curl command
			$return = json_decode( $input, true );

			if ( is_null( $return ) ) {
				wp_parse_str( $input, $return );
			}

			break;
		default :
			wp_parse_str( $input, $return );
			break;
		}

		if ( !$cast_and_filter ) {
			return $return;
		}

		return $this->cast_and_filter( $return, $this->request_format, $return_default_values );
	}

	function cast_and_filter( $data, $documentation, $return_default_values = false, $for_output = false ) {
		$return_as_object = false;
		if ( is_object( $data ) ) {
			// @todo this should probably be a deep copy if $data can ever have nested objects
			$data = (array) $data;
			$return_as_object = true;
		} elseif ( !is_array( $data ) ) {
			return $data;
		}

		$boolean_arg = array( 'false', 'true' );
		$naeloob_arg = array( 'true', 'false' );

		$return = array();

		foreach ( $documentation as $key => $description ) {
			if ( is_array( $description ) ) {
				// String or boolean array keys only
				$whitelist = array_keys( $description );

				if ( $whitelist === $boolean_arg || $whitelist === $naeloob_arg ) {
					// Truthiness
					if ( isset( $data[$key] ) ) {
						$return[$key] = (bool) WPCOM_JSON_API::is_truthy( $data[$key] );
					} elseif ( $return_default_values ) {
						$return[$key] = $whitelist === $naeloob_arg; // Default to true for naeloob_arg and false for boolean_arg.
					}
				} elseif ( isset( $data[$key] ) && isset( $description[$data[$key]] ) ) {
					// String Key
					$return[$key] = (string) $data[$key];
				} elseif ( $return_default_values ) {
					// Default value
					$return[$key] = (string) current( $whitelist );
				}

				continue;
			}

			$types = $this->parse_types( $description );
			$type = array_shift( $types );

			// Explicit default - string and int only for now.  Always set these reguardless of $return_default_values
			if ( isset( $type['default'] ) ) {
				if ( !isset( $data[$key] ) ) {
					$data[$key] = $type['default'];
				}
			}

			if ( !isset( $data[$key] ) ) {
				continue;
			}

			$this->cast_and_filter_item( $return, $type, $key, $data[$key], $types, $for_output );
		}

		if ( $return_as_object ) {
			return (object) $return;
		}

		return $return;
	}

	/**
	 * Casts $value according to $type.
	 * Handles fallbacks for certain values of $type when $value is not that $type
	 * Currently, only handles fallback between string <-> array (two way), from string -> false (one way), and from object -> false (one way),
	 * and string -> object (one way)
	 *
	 * Handles "child types" - array:URL, object:category
	 * array:URL means an array of URLs
	 * object:category means a hash of categories
	 *
	 * Handles object typing - object>post means an object of type post
	 */
	function cast_and_filter_item( &$return, $type, $key, $value, $types = array(), $for_output = false ) {
		if ( is_string( $type ) ) {
			$type = compact( 'type' );
		}

		switch ( $type['type'] ) {
		case 'false' :
			$return[$key] = false;
			break;
		case 'url' :
			$return[$key] = (string) esc_url_raw( $value );
			break;
		case 'string' :
			// Fallback string -> array, or for string -> object
			if ( is_array( $value ) || is_object( $value ) ) {
				if ( !empty( $types[0] ) ) {
					$next_type = array_shift( $types );
					return $this->cast_and_filter_item( $return, $next_type, $key, $value, $types, $for_output );
				}
			}

			// Fallback string -> false
			if ( !is_string( $value ) ) {
				if ( !empty( $types[0] ) && 'false' === $types[0]['type'] ) {
					$next_type = array_shift( $types );
					return $this->cast_and_filter_item( $return, $next_type, $key, $value, $types, $for_output );
				}
			}
			$return[$key] = (string) $value;
			break;
		case 'html' :
			$return[$key] = (string) $value;
			break;
		case 'safehtml' :
			$return[$key] = wp_kses( (string) $value, wp_kses_allowed_html() );
			break;
		case 'media' :
			if ( is_array( $value ) ) {
				if ( isset( $value['name'] ) && is_array( $value['name'] ) ) {
					// It's a $_FILES array
					// Reformat into array of $_FILES items
					$files = array();

					foreach ( $value['name'] as $k => $v ) {
						$files[$k] = array();
						foreach ( array_keys( $value ) as $file_key ) {
							$files[$k][$file_key] = $value[$file_key][$k];
						}
					}

					$return[$key] = $files;
					break;
				}
			} else {
				// no break - treat as 'array'
			}
			// nobreak
		case 'array' :
			// Fallback array -> string
			if ( is_string( $value ) ) {
				if ( !empty( $types[0] ) ) {
					$next_type = array_shift( $types );
					return $this->cast_and_filter_item( $return, $next_type, $key, $value, $types, $for_output );
				}
			}

			if ( isset( $type['children'] ) ) {
				$children = array();
				foreach ( (array) $value as $k => $child ) {
					$this->cast_and_filter_item( $children, $type['children'], $k, $child, array(), $for_output );
				}
				$return[$key] = (array) $children;
				break;
			}

			$return[$key] = (array) $value;
			break;
		case 'iso 8601 datetime' :
		case 'datetime' :
			// (string)s
			$dates = $this->parse_date( (string) $value );
			if ( $for_output ) {
				$return[$key] = $this->format_date( $dates[1], $dates[0] );
			} else {
				list( $return[$key], $return["{$key}_gmt"] ) = $dates;
			}
			break;
		case 'float' :
			$return[$key] = (float) $value;
			break;
		case 'int' :
		case 'integer' :
			$return[$key] = (int) $value;
			break;
		case 'bool' :
		case 'boolean' :
			$return[$key] = (bool) WPCOM_JSON_API::is_truthy( $value );
			break;
		case 'object' :
			// Fallback object -> false
			if ( is_scalar( $value ) || is_null( $value ) ) {
				if ( !empty( $types[0] ) && 'false' === $types[0]['type'] ) {
					return $this->cast_and_filter_item( $return, 'false', $key, $value, $types, $for_output );
				}
			}

			if ( isset( $type['children'] ) ) {
				$children = array();
				foreach ( (array) $value as $k => $child ) {
					$this->cast_and_filter_item( $children, $type['children'], $k, $child, array(), $for_output );
				}
				$return[$key] = (object) $children;
				break;
			}

			if ( isset( $type['subtype'] ) ) {
				return $this->cast_and_filter_item( $return, $type['subtype'], $key, $value, $types, $for_output );
			}

			$return[$key] = (object) $value;
			break;
		case 'post' :
			$return[$key] = (object) $this->cast_and_filter( $value, $this->post_object_format, false, $for_output );
			break;
		case 'comment' :
			$return[$key] = (object) $this->cast_and_filter( $value, $this->comment_object_format, false, $for_output );
			break;
		case 'tag' :
		case 'category' :
			$docs = array(
				'ID'          => '(int)',
				'name'        => '(string)',
				'slug'        => '(string)',
				'description' => '(HTML)',
				'post_count'  => '(int)',
				'meta'        => '(object)',
			);
			if ( 'category' === $type['type'] ) {
				$docs['parent'] = '(int)';
			}
			$return[$key] = (object) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'post_reference' :
		case 'comment_reference' :
			$docs = array(
				'ID'    => '(int)',
				'type'  => '(string)',
				'title' => '(string)',
				'link'  => '(URL)',
			);
			$return[$key] = (object) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'geo' :
			$docs = array(
				'latitude'  => '(float)',
				'longitude' => '(float)',
				'address'   => '(string)',
			);
			$return[$key] = (object) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'author' :
			$docs = array(
				'ID'             => '(int)',
				'user_login'     => '(string)',
				'login'          => '(string)',
				'email'          => '(string|false)',
				'name'           => '(string)',
				'first_name'     => '(string)',
				'last_name'      => '(string)',
				'nice_name'      => '(string)',
				'URL'            => '(URL)',
				'avatar_URL'     => '(URL)',
				'profile_URL'    => '(URL)',
				'is_super_admin' => '(bool)',
				'roles'          => '(array:string)'
			);
			$return[$key] = (object) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'role' :
			$docs = array(
				'name'         => '(string)',
				'display_name' => '(string)',
				'capabilities' => '(object:boolean)',
			);
			$return[$key] = (object) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'attachment' :
			$docs = array(
				'ID'        => '(int)',
				'URL'       => '(URL)',
				'guid'      => '(string)',
				'mime_type' => '(string)',
				'width'     => '(int)',
				'height'    => '(int)',
				'duration'  => '(int)',
			);
			$return[$key] = (object) $this->cast_and_filter(
				$value,
				/**
				 * Filter the documentation returned for a post attachment.
				 *
				 * @module json-api
				 *
				 * @since 1.9.0
				 *
				 * @param array $docs Array of documentation about a post attachment.
				 */
				apply_filters( 'wpcom_json_api_attachment_cast_and_filter', $docs ),
				false,
				$for_output
			);
			break;
		case 'metadata' :
			$docs = array(
				'id'       => '(int)',
				'key'       => '(string)',
				'value'     => '(string|false|float|int|array|object)',
				'previous_value' => '(string)',
				'operation'  => '(string)',
			);
			$return[$key] = (object) $this->cast_and_filter(
				$value,
				/** This filter is documented in class.json-api-endpoints.php */
				apply_filters( 'wpcom_json_api_attachment_cast_and_filter', $docs ),
				false,
				$for_output
			);
			break;
		case 'plugin' :
			$docs = array(
				'id'          => '(safehtml) The plugin\'s ID',
				'slug'        => '(safehtml) The plugin\'s Slug',
				'active'      => '(boolean)  The plugin status.',
				'update'      => '(object)   The plugin update info.',
				'name'        => '(safehtml) The name of the plugin.',
				'plugin_url'  => '(url)      Link to the plugin\'s web site.',
				'version'     => '(safehtml) The plugin version number.',
				'description' => '(safehtml) Description of what the plugin does and/or notes from the author',
				'author'      => '(safehtml) The plugin author\'s name',
				'author_url'  => '(url)      The plugin author web site address',
				'network'     => '(boolean)  Whether the plugin can only be activated network wide.',
				'autoupdate'  => '(boolean)  Whether the plugin is auto updated',
				'log'         => '(array:safehtml) An array of update log strings.',
			);
			$return[$key] = (object) $this->cast_and_filter(
				$value,
				/**
				 * Filter the documentation returned for a plugin.
				 *
				 * @module json-api
				 *
				 * @since 3.1.0
				 *
				 * @param array $docs Array of documentation about a plugin.
				 */
				apply_filters( 'wpcom_json_api_plugin_cast_and_filter', $docs ),
				false,
				$for_output
			);
			break;
		case 'jetpackmodule' :
			$docs = array(
				'id'          => '(string)   The module\'s ID',
				'active'      => '(boolean)  The module\'s status.',
				'name'        => '(string)   The module\'s name.',
				'description' => '(safehtml) The module\'s description.',
				'sort'        => '(int)      The module\'s display order.',
				'introduced'  => '(string)   The Jetpack version when the module was introduced.',
				'changed'     => '(string)   The Jetpack version when the module was changed.',
				'free'        => '(boolean)  The module\'s Free or Paid status.',
				'module_tags' => '(array)    The module\'s tags.'
			);
			$return[$key] = (object) $this->cast_and_filter(
				$value,
				/** This filter is documented in class.json-api-endpoints.php */
				apply_filters( 'wpcom_json_api_plugin_cast_and_filter', $docs ),
				false,
				$for_output
			);
			break;
		case 'sharing_button' :
			$docs = array(
				'ID'         => '(string)',
				'name'       => '(string)',
				'URL'        => '(string)',
				'icon'       => '(string)',
				'enabled'    => '(bool)',
				'visibility' => '(string)',
			);
			$return[$key] = (array) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'sharing_button_service':
			$docs = array(
				'ID'               => '(string) The service identifier',
				'name'             => '(string) The service name',
				'class_name'       => '(string) Class name for custom style sharing button elements',
				'genericon'        => '(string) The Genericon unicode character for the custom style sharing button icon',
				'preview_smart'    => '(string) An HTML snippet of a rendered sharing button smart preview',
				'preview_smart_js' => '(string) An HTML snippet of the page-wide initialization scripts used for rendering the sharing button smart preview'
			);
			$return[$key] = (array) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;

		default :
			$method_name = $type['type'] . '_docs';
			if ( method_exists( WPCOM_JSON_API_Jetpack_Overrides, $method_name ) ) {
				$docs = WPCOM_JSON_API_Jetpack_Overrides::$method_name();
			}

			if ( ! empty( $docs ) ) {
				$return[$key] = (object) $this->cast_and_filter(
					$value,
					/** This filter is documented in class.json-api-endpoints.php */
					apply_filters( 'wpcom_json_api_plugin_cast_and_filter', $docs ),
					false,
					$for_output
				);
			} else {
				trigger_error( "Unknown API casting type {$type['type']}", E_USER_WARNING );
			}
		}
	}

	function parse_types( $text ) {
		if ( !preg_match( '#^\(([^)]+)\)#', ltrim( $text ), $matches ) ) {
			return 'none';
		}

		$types = explode( '|', strtolower( $matches[1] ) );
		$return = array();
		foreach ( $types as $type ) {
			foreach ( array( ':' => 'children', '>' => 'subtype', '=' => 'default' ) as $operator => $meaning ) {
				if ( false !== strpos( $type, $operator ) ) {
					$item = explode( $operator, $type, 2 );
					$return[] = array( 'type' => $item[0], $meaning => $item[1] );
					continue 2;
				}
			}
			$return[] = compact( 'type' );
		}

		return $return;
	}

	/**
	 * Checks if the endpoint is publicly displayable
	 */
	function is_publicly_documentable() {
		return '__do_not_document' !== $this->group && true !== $this->in_testing;
	}

	/**
	 * Auto generates documentation based on description, method, path, path_labels, and query parameters.
	 * Echoes HTML.
	 */
	function document( $show_description = true ) {
		global $wpdb;
		$original_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : 'unset';
		unset( $GLOBALS['post'] );

		$doc = $this->generate_documentation();

		if ( $show_description ) :
?>
<caption>
	<h1><?php echo wp_kses_post( $doc['method'] ); ?> <?php echo wp_kses_post( $doc['path_labeled'] ); ?></h1>
	<p><?php echo wp_kses_post( $doc['description'] ); ?></p>
</caption>

<?php endif; ?>

<?php if ( true === $this->deprecated ) { ?>
<p><strong>This endpoint is deprecated in favor of version <?php echo floatval( $this->new_version ); ?></strong></p>
<?php } ?>

<section class="resource-info">
	<h2 id="apidoc-resource-info">Resource Information</h2>

	<table class="api-doc api-doc-resource-parameters api-doc-resource">

	<thead>
		<tr>
			<th class="api-index-title" scope="column">&nbsp;</th>
			<th class="api-index-title" scope="column">&nbsp;</th>
		</tr>
	</thead>
	<tbody>

		<tr class="api-index-item">
			<th scope="row" class="parameter api-index-item-title">Method</th>
			<td class="type api-index-item-title"><?php echo wp_kses_post( $doc['method'] ); ?></td>
		</tr>

		<tr class="api-index-item">
			<th scope="row" class="parameter api-index-item-title">URL</th>
			<?php
			$version = WPCOM_JSON_API__CURRENT_VERSION;
			if ( !empty( $this->max_version ) ) {
				$version = $this->max_version;
			}
			?>
			<td class="type api-index-item-title">https://public-api.wordpress.com/rest/v<?php echo floatval( $version ); ?><?php echo wp_kses_post( $doc['path_labeled'] ); ?></td>
		</tr>

		<tr class="api-index-item">
			<th scope="row" class="parameter api-index-item-title">Requires authentication?</th>
			<?php
			$requires_auth = $wpdb->get_row( $wpdb->prepare( "SELECT requires_authentication FROM rest_api_documentation WHERE `version` = %s AND `path` = %s AND `method` = %s LIMIT 1", $version, untrailingslashit( $doc['path_labeled'] ), $doc['method'] ) );
			?>
			<td class="type api-index-item-title"><?php echo ( true === (bool) $requires_auth->requires_authentication ? 'Yes' : 'No' ); ?></td>
		</tr>

	</tbody>
	</table>

</section>

<?php

		foreach ( array(
			'path'     => 'Method Parameters',
			'query'    => 'Query Parameters',
			'body'     => 'Request Parameters',
			'response' => 'Response Parameters',
		) as $doc_section_key => $label ) :
			$doc_section = 'response' === $doc_section_key ? $doc['response']['body'] : $doc['request'][$doc_section_key];
			if ( !$doc_section ) {
				continue;
			}

			$param_label = strtolower( str_replace( ' ', '-', $label ) );
?>

<section class="<?php echo $param_label; ?>">

<h2 id="apidoc-<?php echo esc_attr( $doc_section_key ); ?>"><?php echo wp_kses_post( $label ); ?></h2>

<table class="api-doc api-doc-<?php echo $param_label; ?>-parameters api-doc-<?php echo strtolower( str_replace( ' ', '-', $doc['group'] ) ); ?>">

<thead>
	<tr>
		<th class="api-index-title" scope="column">Parameter</th>
		<th class="api-index-title" scope="column">Type</th>
		<th class="api-index-title" scope="column">Description</th>
	</tr>
</thead>
<tbody>

<?php foreach ( $doc_section as $key => $item ) : ?>

	<tr class="api-index-item">
		<th scope="row" class="parameter api-index-item-title"><?php echo wp_kses_post( $key ); ?></th>
		<td class="type api-index-item-title"><?php echo wp_kses_post( $item['type'] ); // @todo auto-link? ?></td>
		<td class="description api-index-item-body"><?php

		$this->generate_doc_description( $item['description'] );

		?></td>
	</tr>

<?php endforeach; ?>
</tbody>
</table>
</section>
<?php endforeach; ?>

<?php
		if ( 'unset' !== $original_post ) {
			$GLOBALS['post'] = $original_post;
		}
	}

	function add_http_build_query_to_php_content_example( $matches ) {
		$trimmed_match = ltrim( $matches[0] );
		$pad = substr( $matches[0], 0, -1 * strlen( $trimmed_match ) );
		$pad = ltrim( $pad, ' ' );
		$return = '  ' . str_replace( "\n", "\n  ", $matches[0] );
		return " http_build_query({$return}{$pad})";
	}

	/**
	 * Recursively generates the <dl>'s to document item descriptions.
	 * Echoes HTML.
	 */
	function generate_doc_description( $item ) {
		if ( is_array( $item ) ) : ?>

		<dl>
<?php			foreach ( $item as $description_key => $description_value ) : ?>

			<dt><?php echo wp_kses_post( $description_key . ':' ); ?></dt>
			<dd><?php $this->generate_doc_description( $description_value ); ?></dd>

<?php			endforeach; ?>

		</dl>

<?php
		else :
			echo wp_kses_post( $item );
		endif;
	}

	/**
	 * Auto generates documentation based on description, method, path, path_labels, and query parameters.
	 * Echoes HTML.
	 */
	function generate_documentation() {
		$format       = str_replace( '%d', '%s', $this->path );
		$path_labeled = $format;
		if ( ! empty( $this->path_labels ) ) {
			$path_labeled = vsprintf( $format, array_keys( $this->path_labels ) );
		}
		$boolean_arg  = array( 'false', 'true' );
		$naeloob_arg  = array( 'true', 'false' );

		$doc = array(
			'description'  => $this->description,
			'method'       => $this->method,
			'path_format'  => $this->path,
			'path_labeled' => $path_labeled,
			'group'        => $this->group,
			'request' => array(
				'path'  => array(),
				'query' => array(),
				'body'  => array(),
			),
			'response' => array(
				'body' => array(),
			)
		);

		foreach ( array( 'path_labels' => 'path', 'query' => 'query', 'request_format' => 'body', 'response_format' => 'body' ) as $_property => $doc_item ) {
			foreach ( (array) $this->$_property as $key => $description ) {
				if ( is_array( $description ) ) {
					$description_keys = array_keys( $description );
					if ( $boolean_arg === $description_keys || $naeloob_arg === $description_keys ) {
						$type = '(bool)';
					} else {
						$type = '(string)';
					}

					if ( 'response_format' !== $_property ) {
						// hack - don't show "(default)" in response format
						reset( $description );
						$description_key = key( $description );
						$description[$description_key] = "(default) {$description[$description_key]}";
					}
				} else {
					$types   = $this->parse_types( $description );
					$type    = array();
					$default = '';

					if ( 'none' == $types ) {
						$types = array();
						$types[]['type'] = 'none';
					}

					foreach ( $types as $type_array ) {
						$type[] = $type_array['type'];
						if ( isset( $type_array['default'] ) ) {
							$default = $type_array['default'];
							if ( 'string' === $type_array['type'] ) {
								$default = "'$default'";
							}
						}
					}
					$type = '(' . join( '|', $type ) . ')';
					$noop = ''; // skip an index in list below
					list( $noop, $description ) = explode( ')', $description, 2 );
					$description = trim( $description );
					if ( $default ) {
						$description .= " Default: $default.";
					}
				}

				$item = compact( 'type', 'description' );

				if ( 'response_format' === $_property ) {
					$doc['response'][$doc_item][$key] = $item;
				} else {
					$doc['request'][$doc_item][$key] = $item;
				}
			}
		}

		return $doc;
	}

	function user_can_view_post( $post_id ) {
		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return false;
		}

		if ( 'inherit' === $post->post_status ) {
			$parent_post = get_post( $post->post_parent );
			$post_status_obj = get_post_status_object( $parent_post->post_status );
		} else {
			$post_status_obj = get_post_status_object( $post->post_status );
		}

		if ( !$post_status_obj->public ) {
			if ( is_user_logged_in() ) {
				if ( $post_status_obj->protected ) {
					if ( !current_user_can( 'edit_post', $post->ID ) ) {
						return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
					}
				} elseif ( $post_status_obj->private ) {
					if ( !current_user_can( 'read_post', $post->ID ) ) {
						return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
					}
				} elseif ( 'trash' === $post->post_status ) {
					if ( !current_user_can( 'edit_post', $post->ID ) ) {
						return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
					}
				} elseif ( 'auto-draft' === $post->post_status ) {
					//allow auto-drafts
				} else {
					return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
				}
			} else {
				return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
			}
		}

		if (
			-1 == get_option( 'blog_public' ) &&
			/**
			 * Filter access to a specific post.
			 *
			 * @module json-api
			 *
			 * @since 3.4.0
			 *
			 * @param bool current_user_can( 'read_post', $post->ID ) Can the current user access the post.
			 * @param WP_Post $post Post data.
			 */
			! apply_filters(
				'wpcom_json_api_user_can_view_post',
				current_user_can( 'read_post', $post->ID ),
				$post
			)
		) {
			return new WP_Error( 'unauthorized', 'User cannot view post', array( 'status_code' => 403, 'error' => 'private_blog' ) );
		}

		if ( strlen( $post->post_password ) && !current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view password protected post', array( 'status_code' => 403, 'error' => 'password_protected' ) );
		}

		return true;
	}

	/**
	 * Returns author object.
	 *
	 * @param $author user ID, user row, WP_User object, comment row, post row
	 * @param $show_email output the author's email address?
	 *
	 * @return (object)
	 */
	function get_author( $author, $show_email = false ) {
		if ( isset( $author->comment_author_email ) && !$author->user_id ) {
			$ID          = 0;
			$login       = '';
			$email       = $author->comment_author_email;
			$name        = $author->comment_author;
			$first_name  = '';
			$last_name   = '';
			$URL         = $author->comment_author_url;
			$avatar_URL  = $this->api->get_avatar_url( $author );
			$profile_URL = 'http://en.gravatar.com/' . md5( strtolower( trim( $email ) ) );
			$nice        = '';
			$site_id     = -1;

			// Comment author URLs and Emails are sent through wp_kses() on save, which replaces "&" with "&amp;"
			// "&" is the only email/URL character altered by wp_kses()
			foreach ( array( 'email', 'URL' ) as $field ) {
				$$field = str_replace( '&amp;', '&', $$field );
			}
		} else {
			if ( isset( $author->user_id ) && $author->user_id ) {
				$author = $author->user_id;
			} elseif ( isset( $author->user_email ) ) {
				$author = $author->ID;
			} elseif ( isset( $author->post_author ) ) {
				// then $author is a Post Object.
				if ( 0 == $author->post_author )
					return null;
				/**
				 * Filter whether the current site is a Jetpack site.
				 *
				 * @module json-api
				 *
				 * @since 3.3.0
				 *
				 * @param bool false Is the current site a Jetpack site. Default to false.
				 * @param int get_current_blog_id() Blog ID.
				 */
				$is_jetpack = true === apply_filters( 'is_jetpack_site', false, get_current_blog_id() );
				$post_id = $author->ID;
				if ( $is_jetpack && ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
					$ID         = get_post_meta( $post_id, '_jetpack_post_author_external_id', true );
					$email      = get_post_meta( $post_id, '_jetpack_author_email', true );
					$login      = '';
					$name       = get_post_meta( $post_id, '_jetpack_author', true );
					$first_name = '';
					$last_name  = '';
					$URL        = '';
					$nice       = '';
				} else {
					$author = $author->post_author;
				}
			}

			if ( ! isset( $ID ) ) {
				$user = get_user_by( 'id', $author );
				if ( ! $user || is_wp_error( $user ) ) {
					trigger_error( 'Unknown user', E_USER_WARNING );

					return null;
				}
				$ID         = $user->ID;
				$email      = $user->user_email;
				$login      = $user->user_login;
				$name       = $user->display_name;
				$first_name = $user->first_name;
				$last_name  = $user->last_name;
				$URL        = $user->user_url;
				$nice       = $user->user_nicename;
			}
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM && ! $is_jetpack ) {
				$active_blog = get_active_blog_for_user( $ID );
				$site_id     = $active_blog->blog_id;
				$profile_URL = "http://en.gravatar.com/{$login}";
			} else {
				$profile_URL = 'http://en.gravatar.com/' . md5( strtolower( trim( $email ) ) );
				$site_id     = -1;
			}

			$avatar_URL = $this->api->get_avatar_url( $email );
		}

		$email = $show_email ? (string) $email : false;

		$author = array(
			'ID'          => (int) $ID,
			'login'       => (string) $login,
			'email'       => $email, // (string|bool)
			'name'        => (string) $name,
			'first_name'  => (string) $first_name,
			'last_name'   => (string) $last_name,
			'nice_name'   => (string) $nice,
			'URL'         => (string) esc_url_raw( $URL ),
			'avatar_URL'  => (string) esc_url_raw( $avatar_URL ),
			'profile_URL' => (string) esc_url_raw( $profile_URL ),
		);

		if ($site_id > -1) {
			$author['site_ID'] = (int) $site_id;
		}

		return (object) $author;
	}

	function get_media_item( $media_id ) {
		$media_item = get_post( $media_id );

		if ( !$media_item || is_wp_error( $media_item ) )
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );

		$response = array(
			'id'    => strval( $media_item->ID ),
			'date' =>  (string) $this->format_date( $media_item->post_date_gmt, $media_item->post_date ),
			'parent'           => $media_item->post_parent,
			'link'             => wp_get_attachment_url( $media_item->ID ),
			'title'            => $media_item->post_title,
			'caption'          => $media_item->post_excerpt,
			'description'      => $media_item->post_content,
			'metadata'         => wp_get_attachment_metadata( $media_item->ID ),
		);

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && is_array( $response['metadata'] ) && ! empty( $response['metadata']['file'] ) ) {
			remove_filter( '_wp_relative_upload_path', 'wpcom_wp_relative_upload_path', 10 );
			$response['metadata']['file'] = _wp_relative_upload_path( $response['metadata']['file'] );
			add_filter( '_wp_relative_upload_path', 'wpcom_wp_relative_upload_path', 10, 2 );
		}

		$response['meta'] = (object) array(
			'links' => (object) array(
				'self' => (string) $this->get_media_link( $this->api->get_blog_id_for_output(), $media_id ),
				'help' => (string) $this->get_media_link( $this->api->get_blog_id_for_output(), $media_id, 'help' ),
				'site' => (string) $this->get_site_link( $this->api->get_blog_id_for_output() ),
			),
		);

		return (object) $response;
	}

	function get_media_item_v1_1( $media_id ) {
		$media_item = get_post( $media_id );

		if ( ! $media_item || is_wp_error( $media_item ) )
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );

		$file = basename( wp_get_attachment_url( $media_item->ID ) );
		$file_info = pathinfo( $file );
		$ext  = $file_info['extension'];

		$response = array(
			'ID'           => $media_item->ID,
			'URL'          => wp_get_attachment_url( $media_item->ID ),
			'guid'         => $media_item->guid,
			'date'         => (string) $this->format_date( $media_item->post_date_gmt, $media_item->post_date ),
			'post_ID'      => $media_item->post_parent,
			'author_ID'    => (int) $media_item->post_author,
			'file'         => $file,
			'mime_type'    => $media_item->post_mime_type,
			'extension'    => $ext,
			'title'        => $media_item->post_title,
			'caption'      => $media_item->post_excerpt,
			'description'  => $media_item->post_content,
			'alt'          => get_post_meta( $media_item->ID, '_wp_attachment_image_alt', true ),
			'thumbnails'   => array()
		);

		if ( in_array( $ext, array( 'jpg', 'jpeg', 'png', 'gif' ) ) ) {
			$metadata = wp_get_attachment_metadata( $media_item->ID );
			if ( isset( $metadata['height'], $metadata['width'] ) ) {
				$response['height'] = $metadata['height'];
				$response['width'] = $metadata['width'];
			}

			if ( isset( $metadata['sizes'] ) ) {
				/**
				 * Filter the thumbnail sizes available for each attachment ID.
				 *
				 * @module json-api
				 *
				 * @since 3.9.0
				 *
				 * @param array $metadata['sizes'] Array of thumbnail sizes available for a given attachment ID.
				 * @param string $media_id Attachment ID.
				 */
				$sizes = apply_filters( 'rest_api_thumbnail_sizes', $metadata['sizes'], $media_id );
				if ( is_array( $sizes ) ) {
					foreach ( $sizes as $size => $size_details ) {
						$response['thumbnails'][ $size ] = dirname( $response['URL'] ) . '/' . $size_details['file'];
					}
				}
			}

			if ( isset( $metadata['image_meta'] ) ) {
				$response['exif'] = $metadata['image_meta'];
			}
		}

		if ( in_array( $ext, array( 'mp3', 'm4a', 'wav', 'ogg' ) ) ) {
			$metadata = wp_get_attachment_metadata( $media_item->ID );
			$response['length'] = $metadata['length'];
			$response['exif']   = $metadata;
		}

		if ( in_array( $ext, array( 'ogv', 'mp4', 'mov', 'wmv', 'avi', 'mpg', '3gp', '3g2', 'm4v' ) ) ) {
			$metadata = wp_get_attachment_metadata( $media_item->ID );
			if ( isset( $metadata['height'], $metadata['width'] ) ) {
				$response['height'] = $metadata['height'];
				$response['width']  = $metadata['width'];
			}

			if ( isset( $metadata['length'] ) ) {
				$response['length'] = $metadata['length'];
			}

			// add VideoPress info
			if ( function_exists( 'video_get_info_by_blogpostid' ) ) {
				$info = video_get_info_by_blogpostid( $this->api->get_blog_id_for_output(), $media_id );

				// Thumbnails
				if ( function_exists( 'video_format_done' ) && function_exists( 'video_image_url_by_guid' ) ) {
					$response['thumbnails'] = array( 'fmt_hd' => '', 'fmt_dvd' => '', 'fmt_std' => '' );
					foreach ( $response['thumbnails'] as $size => $thumbnail_url ) {
						if ( video_format_done( $info, $size ) ) {
							$response['thumbnails'][ $size ] = video_image_url_by_guid( $info->guid, $size );
						} else {
							unset( $response['thumbnails'][ $size ] );
						}
					}
				}

				$response['videopress_guid'] = $info->guid;
				$response['videopress_processing_done'] = true;
				if ( '0000-00-00 00:00:00' == $info->finish_date_gmt ) {
					$response['videopress_processing_done'] = false;
				}
			}
		}

		$response['thumbnails'] = (object) $response['thumbnails'];

		$response['meta'] = (object) array(
			'links' => (object) array(
				'self' => (string) $this->get_media_link( $this->api->get_blog_id_for_output(), $media_id ),
				'help' => (string) $this->get_media_link( $this->api->get_blog_id_for_output(), $media_id, 'help' ),
				'site' => (string) $this->get_site_link( $this->api->get_blog_id_for_output() ),
			),
		);

		// add VideoPress link to the meta
		if ( in_array( $ext, array( 'ogv', 'mp4', 'mov', 'wmv', 'avi', 'mpg', '3gp', '3g2', 'm4v' ) ) ) {
			if ( function_exists( 'video_get_info_by_blogpostid' ) ) {
				$response['meta']->links->videopress = (string) $this->get_link( '/videos/%s', $response['videopress_guid'], '' );
			}
		}

		if ( $media_item->post_parent > 0 ) {
			$response['meta']->links->parent = (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $media_item->post_parent );
		}

		return (object) $response;
	}

	function get_taxonomy( $taxonomy_id, $taxonomy_type, $context ) {

		$taxonomy = get_term_by( 'slug', $taxonomy_id, $taxonomy_type );
		/// keep updating this function
		if ( !$taxonomy || is_wp_error( $taxonomy ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		return $this->format_taxonomy( $taxonomy, $taxonomy_type, $context );
	}

	function format_taxonomy( $taxonomy, $taxonomy_type, $context ) {
		// Permissions
		switch ( $context ) {
		case 'edit' :
			$tax = get_taxonomy( $taxonomy_type );
			if ( !current_user_can( $tax->cap->edit_terms ) )
				return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
			break;
		case 'display' :
			if ( -1 == get_option( 'blog_public' ) && ! current_user_can( 'read' ) ) {
				return new WP_Error( 'unauthorized', 'User cannot view taxonomy', 403 );
			}
			break;
		default :
			return new WP_Error( 'invalid_context', 'Invalid API CONTEXT', 400 );
		}

		$response                = array();
		$response['ID']          = (int) $taxonomy->term_id;
		$response['name']        = (string) $taxonomy->name;
		$response['slug']        = (string) $taxonomy->slug;
		$response['description'] = (string) $taxonomy->description;
		$response['post_count']  = (int) $taxonomy->count;

		if ( 'category' === $taxonomy_type )
			$response['parent'] = (int) $taxonomy->parent;

		$response['meta'] = (object) array(
			'links' => (object) array(
				'self' => (string) $this->get_taxonomy_link( $this->api->get_blog_id_for_output(), $taxonomy->slug, $taxonomy_type ),
				'help' => (string) $this->get_taxonomy_link( $this->api->get_blog_id_for_output(), $taxonomy->slug, $taxonomy_type, 'help' ),
				'site' => (string) $this->get_site_link( $this->api->get_blog_id_for_output() ),
			),
		);

		return (object) $response;
	}

	/**
	 * Returns ISO 8601 formatted datetime: 2011-12-08T01:15:36-08:00
	 *
	 * @param $date_gmt (string) GMT datetime string.
	 * @param $date (string) Optional.  Used to calculate the offset from GMT.
	 *
	 * @return string
	 */
	function format_date( $date_gmt, $date = null ) {
		$timestamp_gmt = strtotime( "$date_gmt+0000" );

		if ( null === $date ) {
			$timestamp = $timestamp_gmt;
			$hours     = $minutes = $west = 0;
		} else {
			$date_time = date_create( "$date+0000" );
			if ( $date_time ) {
				$timestamp = date_format(  $date_time, 'U' );
			} else {
				$timestamp = 0;
			}

			// "0000-00-00 00:00:00" == -62169984000
			if ( -62169984000 == $timestamp_gmt ) {
				// WordPress sets post_date=now, post_date_gmt="0000-00-00 00:00:00" for all drafts
				// WordPress sets post_modified=now, post_modified_gmt="0000-00-00 00:00:00" for new drafts

				// Try to guess the correct offset from the blog's options.
				$timezone_string = get_option( 'timezone_string' );

				if ( $timezone_string && $date_time ) {
					$timezone = timezone_open( $timezone_string );
					if ( $timezone ) {
						$offset = $timezone->getOffset( $date_time );
					}
				} else {
					$offset = 3600 * get_option( 'gmt_offset' );
				}
			} else {
				$offset = $timestamp - $timestamp_gmt;
			}

			$west      = $offset < 0;
			$offset    = abs( $offset );
			$hours     = (int) floor( $offset / 3600 );
			$offset   -= $hours * 3600;
			$minutes   = (int) floor( $offset / 60 );
		}

		return (string) gmdate( 'Y-m-d\\TH:i:s', $timestamp ) . sprintf( '%s%02d:%02d', $west ? '-' : '+', $hours, $minutes );
	}

	/**
	 * Parses a date string and returns the local and GMT representations
	 * of that date & time in 'YYYY-MM-DD HH:MM:SS' format without
	 * timezones or offsets. If the parsed datetime was not localized to a
	 * particular timezone or offset we will assume it was given in GMT
	 * relative to now and will convert it to local time using either the
	 * timezone set in the options table for the blog or the GMT offset.
	 *
	 * @param datetime string
	 *
	 * @return array( $local_time_string, $gmt_time_string )
	 */
	function parse_date( $date_string ) {
		$date_string_info = date_parse( $date_string );
		if ( is_array( $date_string_info ) && 0 === $date_string_info['error_count'] ) {
			// Check if it's already localized. Can't just check is_localtime because date_parse('oppossum') returns true; WTF, PHP.
			if ( isset( $date_string_info['zone'] ) && true === $date_string_info['is_localtime'] ) {
				$dt_local = clone $dt_utc = new DateTime( $date_string );
				$dt_utc->setTimezone( new DateTimeZone( 'UTC' ) );
				return array(
					(string) $dt_local->format( 'Y-m-d H:i:s' ),
					(string) $dt_utc->format( 'Y-m-d H:i:s' ),
				);
			}

			// It's parseable but no TZ info so assume UTC
			$dt_local = clone $dt_utc = new DateTime( $date_string, new DateTimeZone( 'UTC' ) );
		} else {
			// Could not parse time, use now in UTC
			$dt_local = clone $dt_utc = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
		}

		// First try to use timezone as it's daylight savings aware.
		$timezone_string = get_option( 'timezone_string' );
		if ( $timezone_string ) {
			$tz = timezone_open( $timezone_string );
			if ( $tz ) {
				$dt_local->setTimezone( $tz );
				return array(
					(string) $dt_local->format( 'Y-m-d H:i:s' ),
					(string) $dt_utc->format( 'Y-m-d H:i:s' ),
				);
			}
		}

		// Fallback to GMT offset (in hours)
		// NOTE: TZ of $dt_local is still UTC, we simply modified the timestamp with an offset.
		$gmt_offset_seconds = intval( get_option( 'gmt_offset' ) * 3600 );
		$dt_local->modify("+{$gmt_offset_seconds} seconds");
		return array(
			(string) $dt_local->format( 'Y-m-d H:i:s' ),
			(string) $dt_utc->format( 'Y-m-d H:i:s' ),
		);
	}

	// Load the functions.php file for the current theme to get its post formats, CPTs, etc.
	function load_theme_functions() {
		// bail if we've done this already (can happen when calling /batch endpoint)
		if ( defined( 'REST_API_THEME_FUNCTIONS_LOADED' ) )
			return;

		// VIP context loading is handled elsewhere, so bail to prevent
		// duplicate loading. See `switch_to_blog_and_validate_user()`
		if ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) {
			return;
		}

		define( 'REST_API_THEME_FUNCTIONS_LOADED', true );

		// the theme info we care about is found either within functions.php or one of the jetpack files.
		$function_files = array( '/functions.php', '/inc/jetpack.compat.php', '/inc/jetpack.php', '/includes/jetpack.compat.php' );

		$copy_dirs = array( get_template_directory() );

		// Is this a child theme? Load the child theme's functions file.
		if ( get_stylesheet_directory() !== get_template_directory() && wpcom_is_child_theme() ) {
			foreach ( $function_files as $function_file ) {
				if ( file_exists( get_stylesheet_directory() . $function_file ) ) {
					require_once(  get_stylesheet_directory() . $function_file );
				}
			}
			$copy_dirs[] = get_stylesheet_directory();
		}

		foreach ( $function_files as $function_file ) {
			if ( file_exists( get_template_directory() . $function_file ) ) {
				require_once(  get_template_directory() . $function_file );
			}
		}

		// add inc/wpcom.php and/or includes/wpcom.php
		wpcom_load_theme_compat_file();

		// since the stuff we care about (CPTS, post formats, are usually on setup or init hooks, we want to load those)
		$this->copy_hooks( 'after_setup_theme', 'restapi_theme_after_setup_theme', $copy_dirs );

		/**
		 * Fires functions hooked onto `after_setup_theme` by the theme for the purpose of the REST API.
		 *
		 * The REST API does not load the theme when processing requests.
		 * To enable theme-based functionality, the API will load the '/functions.php',
		 * '/inc/jetpack.compat.php', '/inc/jetpack.php', '/includes/jetpack.compat.php files
		 * of the theme (parent and child) and copy functions hooked onto 'after_setup_theme' within those files.
		 *
		 * @module json-api
		 *
		 * @since 3.2.0
		 */
		do_action( 'restapi_theme_after_setup_theme' );
		$this->copy_hooks( 'init', 'restapi_theme_init', $copy_dirs );

		/**
		 * Fires functions hooked onto `init` by the theme for the purpose of the REST API.
		 *
		 * The REST API does not load the theme when processing requests.
		 * To enable theme-based functionality, the API will load the '/functions.php',
		 * '/inc/jetpack.compat.php', '/inc/jetpack.php', '/includes/jetpack.compat.php files
		 * of the theme (parent and child) and copy functions hooked onto 'init' within those files.
		 *
		 * @module json-api
		 *
		 * @since 3.2.0
		 */
		do_action( 'restapi_theme_init' );
	}

	function copy_hooks( $from_hook, $to_hook, $base_paths ) {
		global $wp_filter;
		foreach ( $wp_filter as $hook => $actions ) {
			if ( $from_hook <> $hook )
				continue;
			foreach ( (array) $actions as $priority => $callbacks ) {
				foreach( $callbacks as $callback_key => $callback_data ) {
					$callback = $callback_data['function'];
					$reflection = $this->get_reflection( $callback ); // use reflection api to determine filename where function is defined
					if ( false !== $reflection ) {
						$file_name = $reflection->getFileName();
						foreach( $base_paths as $base_path ) {
							if ( 0 === strpos( $file_name, $base_path ) ) { // only copy hooks with functions which are part of the specified files
								$wp_filter[ $to_hook ][ $priority ][ 'cph' . $callback_key ] = $callback_data;
							}
						}
					}
				}
			}
		}
	}

	function get_reflection( $callback ) {
		if ( is_array( $callback ) ) {
			list( $class, $method ) = $callback;
			return new ReflectionMethod( $class, $method );
		}

		if ( is_string( $callback ) && strpos( $callback, "::" ) !== false ) {
			list( $class, $method ) = explode( "::", $callback );
			return new ReflectionMethod( $class, $method );
		}

		if ( version_compare( PHP_VERSION, "5.3.0", ">=" ) && method_exists( $callback, "__invoke" ) ) {
			return new ReflectionMethod( $callback, "__invoke" );
		}

		if ( is_string( $callback ) && strpos( $callback, "::" ) == false && function_exists( $callback ) ) {
			return new ReflectionFunction( $callback );
		}

		return false;
	}

	/**
	 * Try to find the closest supported version of an endpoint to the current endpoint
	 *
	 * For example, if we were looking at the path /animals/panda:
	 * - if the current endpoint is v1.3 and there is a v1.3 of /animals/%s available, we return 1.3
	 * - if the current endpoint is v1.3 and there is no v1.3 of /animals/%s known, we fall back to the
	 *   maximum available version of /animals/%s, e.g. 1.1
	 *
	 * This method is used in get_link() to construct meta links for API responses.
	 *
	 * @param $path string The current endpoint path, relative to the version
	 * @param $method string Request method used to access the endpoint path
	 * @return string The current version, or otherwise the maximum version available
	 */
	function get_closest_version_of_endpoint( $path, $request_method = 'GET' ) {

		$path = untrailingslashit( $path );

		// /help is a special case - always use the current request version
		if ( wp_endswith( $path, '/help' ) ) {
			return $this->api->version;
		}

		static $matches;
		if ( empty( $matches ) ) {
			$matches = array();
		} else {
			// try to match out of saved matches
			foreach( $matches as $match ) {
				$regex = $match->regex;
				if ( preg_match( "#^$regex\$#", $path ) ) {
					return $match->version;
				}
			}
		}

		$endpoint_path_versions = $this->get_endpoint_path_versions();
		$last_path_segment = $this->get_last_segment_of_relative_path( $path );
		$max_version_found = null;

		foreach ( $endpoint_path_versions as $endpoint_last_path_segment => $endpoints ) {

			// Does the last part of the path match the path key? (e.g. 'posts')
			// If the last part contains a placeholder (e.g. %s), we want to carry on
			if ( $last_path_segment != $endpoint_last_path_segment && ! strstr( $endpoint_last_path_segment, '%' ) ) {
				continue;
			}

			foreach ( $endpoints as $endpoint ) {
				// Does the request method match?
				if ( ! in_array( $request_method, $endpoint['request_methods'] ) ) {
					continue;
				}

				$endpoint_path = untrailingslashit( $endpoint['path'] );
				$endpoint_path_regex = str_replace( array( '%s', '%d' ), array( '([^/?&]+)', '(\d+)' ), $endpoint_path );

				if ( ! preg_match( "#^$endpoint_path_regex\$#", $path ) ) {
					continue;
				}

				// Make sure the endpoint exists at the same version
				if ( version_compare( $this->api->version, $endpoint['min_version'], '>=') &&
					 version_compare( $this->api->version, $endpoint['max_version'], '<=') ) {
					array_push( $matches, (object) array( 'version' => $this->api->version, 'regex' => $endpoint_path_regex ) );
					return $this->api->version;
				}

				// If the endpoint doesn't exist at the same version, record the max version we found
				if ( empty( $max_version_found ) || version_compare( $max_version_found['version'], $endpoint['max_version'], '<' ) ) {
					$max_version_found = array( 'version' => $endpoint['max_version'], 'regex' => $endpoint_path_regex );
				}
			}
		}

		// If the endpoint version is less than the requested endpoint version, return the max version found
		if ( ! empty( $max_version_found ) ) {
			array_push( $matches, (object) $max_version_found );
			return $max_version_found['version'];
		}

		// Otherwise, use the API version of the current request
		return $this->api->version;
	}

	/**
	 * Get an array of endpoint paths with their associated versions
	 *
	 * The result is cached for 30 minutes.
	 *
	 * @return array Array of endpoint paths, min_versions and max_versions, keyed by last segment of path
	 **/
	protected function get_endpoint_path_versions() {

		static $cache_result;

		if ( ! empty ( $cache_result ) ) {
			return $cache_result;
		}

		/*
		 * Create a map of endpoints and their min/max versions keyed by the last segment of the path (e.g. 'posts')
		 * This reduces the search space when finding endpoint matches in get_closest_version_of_endpoint()
		 */
		$endpoint_path_versions = array();

		foreach ( $this->api->endpoints as $key => $endpoint_objects ) {

			// The key contains a serialized path, min_version and max_version
			list( $path, $min_version, $max_version ) = unserialize( $key );

			// Grab the last component of the relative path to use as the top-level key
			$last_path_segment = $this->get_last_segment_of_relative_path( $path );

			$endpoint_path_versions[ $last_path_segment ][] = array(
				'path' => $path,
				'min_version' => $min_version,
				'max_version' => $max_version,
				'request_methods' => array_keys( $endpoint_objects )
			);
		}

		$cache_result = $endpoint_path_versions;

		return $endpoint_path_versions;
	}

	/**
	 * Grab the last segment of a relative path
	 *
	 * @param string $path Path
	 * @return string Last path segment
	 */
	protected function get_last_segment_of_relative_path( $path) {
		$path_parts = array_filter( explode( '/', $path ) );

		if ( empty( $path_parts ) ) {
			return null;
		}

		return end( $path_parts );
	}

	/**
	 * Generate a URL to an endpoint
	 *
	 * Used to construct meta links in API responses
	 *
	 * @param mixed $args Optional arguments to be appended to URL
	 * @return string Endpoint URL
	 **/
	function get_link() {
		$args   = func_get_args();
		$format = array_shift( $args );
		$base = WPCOM_JSON_API__BASE;

		$path = array_pop( $args );

		if ( $path ) {
			$path = '/' . ltrim( $path, '/' );
		}

		$args[] = $path;

		// Escape any % in args before using sprintf
		$escaped_args = array();
		foreach ( $args as $arg_key => $arg_value ) {
			$escaped_args[ $arg_key ] = str_replace( '%', '%%', $arg_value );
		}

		$relative_path = vsprintf( "$format%s", $escaped_args );

		if ( ! wp_startswith( $relative_path, '.' ) ) {
			// Generic version. Match the requested version as best we can
			$api_version = $this->get_closest_version_of_endpoint( $relative_path );
			$base        = substr( $base, 0, - 1 ) . $api_version;
		}

		// escape any % in the relative path before running it through sprintf again
		$relative_path = str_replace( '%', '%%', $relative_path );
		// http, WPCOM_JSON_API__BASE, ...    , path
		// %s  , %s                  , $format, %s
		return esc_url_raw( sprintf( "%s://%s$relative_path", $this->api->public_api_scheme, $base ) );
	}

	function get_me_link( $path = '' ) {
		return $this->get_link( '/me', $path );
	}

	function get_taxonomy_link( $blog_id, $taxonomy_id, $taxonomy_type, $path = '' ) {
		if ( 'category' === $taxonomy_type )
			return $this->get_link( '/sites/%d/categories/slug:%s', $blog_id, $taxonomy_id, $path );
		else
			return $this->get_link( '/sites/%d/tags/slug:%s', $blog_id, $taxonomy_id, $path );
	}

	function get_media_link( $blog_id, $media_id, $path = '' ) {
		return $this->get_link( '/sites/%d/media/%d', $blog_id, $media_id, $path );
	}

	function get_site_link( $blog_id, $path = '' ) {
		return $this->get_link( '/sites/%d', $blog_id, $path );
	}

	function get_post_link( $blog_id, $post_id, $path = '' ) {
		return $this->get_link( '/sites/%d/posts/%d', $blog_id, $post_id, $path );
	}

	function get_comment_link( $blog_id, $comment_id, $path = '' ) {
		return $this->get_link( '/sites/%d/comments/%d', $blog_id, $comment_id, $path );
	}

	function get_publicize_connection_link( $blog_id, $publicize_connection_id, $path = '' ) {
		return $this->get_link( '.1/sites/%d/publicize-connections/%d', $blog_id, $publicize_connection_id, $path );
	}

	function get_publicize_connections_link( $keyring_token_id, $path = '' ) {
		return $this->get_link( '.1/me/publicize-connections/?keyring_connection_ID=%d', $keyring_token_id, $path );
	}

	function get_keyring_connection_link( $keyring_token_id, $path = '' ) {
		return $this->get_link( '.1/me/keyring-connections/%d', $keyring_token_id, $path );
	}

	function get_external_service_link( $external_service, $path = '' ) {
		return $this->get_link( '.1/meta/external-services/%s', $external_service, $path );
	}


	/**
	* Check whether a user can view or edit a post type
	* @param string $post_type              post type to check
	* @param string $context                'display' or 'edit'
	* @return bool
	*/
	function current_user_can_access_post_type( $post_type, $context='display' ) {
		$post_type_object = get_post_type_object( $post_type );
		if ( ! $post_type_object ) {
			return false;
		}

		switch( $context ) {
			case 'edit':
				return current_user_can( $post_type_object->cap->edit_posts );
			case 'display':
				return $post_type_object->public || current_user_can( $post_type_object->cap->read_private_posts );
			default:
				return false;
		}
	}

	function is_post_type_allowed( $post_type ) {
		// if the post type is empty, that's fine, WordPress will default to post
		if ( empty( $post_type ) )
			return true;

		// allow special 'any' type
		if ( 'any' == $post_type )
			return true;

		// check for allowed types
		if ( in_array( $post_type, $this->_get_whitelisted_post_types() ) )
			return true;

		return false;
	}

	/**
	 * Gets the whitelisted post types that JP should allow access to.
	 *
	 * @return array Whitelisted post types.
	 */
	protected function _get_whitelisted_post_types() {
		$allowed_types = array( 'post', 'page', 'revision' );

		/**
		 * Filter the post types Jetpack has access to, and can synchronize with WordPress.com.
		 *
		 * @module json-api
		 *
		 * @since 2.2.3
		 *
		 * @param array $allowed_types Array of whitelisted post types. Default to `array( 'post', 'page', 'revision' )`.
		 */
		$allowed_types = apply_filters( 'rest_api_allowed_post_types', $allowed_types );

		return array_unique( $allowed_types );
	}

	function handle_media_creation_v1_1( $media_files, $media_urls, $media_attrs = array(), $force_parent_id = false ) {

		add_filter( 'upload_mimes', array( $this, 'allow_video_uploads' ) );

		$media_ids = $errors = array();
		$user_can_upload_files = current_user_can( 'upload_files' );
		$media_attrs = array_values( $media_attrs ); // reset the keys
		$i = 0;

		if ( ! empty( $media_files ) ) {
			$this->api->trap_wp_die( 'upload_error' );
			foreach ( $media_files as $media_item ) {
				$_FILES['.api.media.item.'] = $media_item;
				if ( ! $user_can_upload_files ) {
					$media_id = new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
				} else {
					if ( $force_parent_id ) {
						$parent_id = absint( $force_parent_id );
					} elseif ( ! empty( $media_attrs[$i] ) && ! empty( $media_attrs[$i]['parent_id'] ) ) {
						$parent_id = absint( $media_attrs[$i]['parent_id'] );
					} else {
						$parent_id = 0;
					}
					$media_id = media_handle_upload( '.api.media.item.', $parent_id );
				}
				if ( is_wp_error( $media_id ) ) {
					$errors[$i]['file']   = $media_item['name'];
					$errors[$i]['error']   = $media_id->get_error_code();
					$errors[$i]['message'] = $media_id->get_error_message();
				} else {
					$media_ids[$i] = $media_id;
				}

				$i++;
			}
			$this->api->trap_wp_die( null );
			unset( $_FILES['.api.media.item.'] );
		}

		if ( ! empty( $media_urls ) ) {
			foreach ( $media_urls as $url ) {
				if ( ! $user_can_upload_files ) {
					$media_id = new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
				} else {
					if ( $force_parent_id ) {
						$parent_id = absint( $force_parent_id );
					} else if ( ! empty( $media_attrs[$i] ) && ! empty( $media_attrs[$i]['parent_id'] ) ) {
						$parent_id = absint( $media_attrs[$i]['parent_id'] );
					} else {
						$parent_id = 0;
					}
					$media_id = $this->handle_media_sideload( $url, $parent_id );
				}
				if ( is_wp_error( $media_id ) ) {
					$errors[$i] = array(
						'file'    => $url,
						'error'   => $media_id->get_error_code(),
						'message' => $media_id->get_error_message(),
					);
				} elseif ( ! empty( $media_id ) ) {
					$media_ids[$i] = $media_id;
				}

				$i++;
			}
		}

		if ( ! empty( $media_attrs ) ) {
			foreach ( $media_ids as $index => $media_id ) {
				if ( empty( $media_attrs[$index] ) )
					continue;

				$attrs = $media_attrs[$index];
				$insert = array();

				// Attributes: Title, Caption, Description

				if ( isset( $attrs['title'] ) ) {
					$insert['post_title'] = $attrs['title'];
				}

				if ( isset( $attrs['caption'] ) ) {
					$insert['post_excerpt'] = $attrs['caption'];
				}

				if ( isset( $attrs['description'] ) ) {
					$insert['post_content'] = $attrs['description'];
				}

				if ( ! empty( $insert ) ) {
					$insert['ID'] = $media_id;
					wp_update_post( (object) $insert );
				}

				// Attributes: Alt

				if ( isset( $attrs['alt'] ) ) {
					$alt = wp_strip_all_tags( $attrs['alt'], true );
					update_post_meta( $media_id, '_wp_attachment_image_alt', $alt );
				}

				// Attributes: Artist, Album

				$id3_meta = array();

				foreach ( array( 'artist', 'album' ) as $key ) {
					if ( isset( $attrs[ $key ] ) ) {
						$id3_meta[ $key ] = wp_strip_all_tags( $attrs[ $key ], true );
					}
				}

				if ( ! empty( $id3_meta ) ) {
					// Before updating metadata, ensure that the item is audio
					$item = $this->get_media_item_v1_1( $media_id );
					if ( 0 === strpos( $item->mime_type, 'audio/' ) ) {
						wp_update_attachment_metadata( $media_id, $id3_meta );
					}
				}
			}
		}

		return array( 'media_ids' => $media_ids, 'errors' => $errors );

	}

	function handle_media_sideload( $url, $parent_post_id = 0 ) {
		if ( ! function_exists( 'download_url' ) || ! function_exists( 'media_handle_sideload' ) )
			return false;

		// if we didn't get a URL, let's bail
		$parsed = @parse_url( $url );
		if ( empty( $parsed ) )
			return false;

		$tmp = download_url( $url );
		if ( is_wp_error( $tmp ) ) {
			return $tmp;
		}

		if ( ! file_is_displayable_image( $tmp ) ) {
			@unlink( $tmp );
			return false;
		}

		// emulate a $_FILES entry
		$file_array = array(
			'name' => basename( parse_url( $url, PHP_URL_PATH ) ),
			'tmp_name' => $tmp,
		);

		$id = media_handle_sideload( $file_array, $parent_post_id );
		@unlink( $tmp );

		if ( is_wp_error( $id ) ) {
			return $id;
		}

		if ( ! $id || ! is_int( $id ) ) {
			return false;
		}

		return $id;
	}

	function allow_video_uploads( $mimes ) {
		// if we are on Jetpack, bail - Videos are already allowed
		if ( ! defined( 'IS_WPCOM' ) || !IS_WPCOM ) {
			return $mimes;
		}

		// extra check that this filter is only ever applied during REST API requests
		if ( ! defined( 'REST_API_REQUEST' ) || ! REST_API_REQUEST ) {
			return $mimes;
		}

		// bail early if they already have the upgrade..
		if ( get_option( 'video_upgrade' ) == '1' ) {
			return $mimes;
		}

		// lets whitelist to only specific clients right now
		$clients_allowed_video_uploads = array();
		/**
		 * Filter the list of whitelisted video clients.
		 *
		 * @module json-api
		 *
		 * @since 3.2.0
		 *
		 * @param array $clients_allowed_video_uploads Array of whitelisted Video clients.
		 */
		$clients_allowed_video_uploads = apply_filters( 'rest_api_clients_allowed_video_uploads', $clients_allowed_video_uploads );
		if ( !in_array( $this->api->token_details['client_id'], $clients_allowed_video_uploads ) ) {
			return $mimes;
		}

		$mime_list = wp_get_mime_types();

		$video_exts = explode( ' ', get_site_option( 'video_upload_filetypes', false, false ) );
		/**
		 * Filter the video filetypes allowed on the site.
		 *
		 * @module json-api
		 *
		 * @since 3.2.0
		 *
		 * @param array $video_exts Array of video filetypes allowed on the site.
		 */
		$video_exts = apply_filters( 'video_upload_filetypes', $video_exts );
		$video_mimes = array();

		if ( !empty( $video_exts ) ) {
			foreach ( $video_exts as $ext ) {
				foreach ( $mime_list as $ext_pattern => $mime ) {
					if ( $ext != '' && strpos( $ext_pattern, $ext ) !== false )
						$video_mimes[$ext_pattern] = $mime;
				}
			}

			$mimes = array_merge( $mimes, $video_mimes );
		}

		return $mimes;
	}

	function is_current_site_multi_user() {
		$users = wp_cache_get( 'site_user_count', 'WPCOM_JSON_API_Endpoint' );
		if ( false === $users ) {
			$user_query = new WP_User_Query( array(
				'blog_id' => get_current_blog_id(),
				'fields'  => 'ID',
			) );
			$users = (int) $user_query->get_total();
			wp_cache_set( 'site_user_count', $users, 'WPCOM_JSON_API_Endpoint', DAY_IN_SECONDS );
		}
		return $users > 1;
	}

	function allows_cross_origin_requests() {
		return 'GET' == $this->method || $this->allow_cross_origin_request;
	}

	function allows_unauthorized_requests( $origin, $complete_access_origins  ) {
		return 'GET' == $this->method || ( $this->allow_unauthorized_request && in_array( $origin, $complete_access_origins ) );
	}

	/**
	 * Return endpoint response
	 *
	 * @param ... determined by ->$path
	 *
	 * @return
	 * 	falsy: HTTP 500, no response body
	 *	WP_Error( $error_code, $error_message, $http_status_code ): HTTP $status_code, json_encode( array( 'error' => $error_code, 'message' => $error_message ) ) response body
	 *	$data: HTTP 200, json_encode( $data ) response body
	 */
	abstract function callback( $path = '' );


}

require_once( dirname( __FILE__ ) . '/json-endpoints.php' );
