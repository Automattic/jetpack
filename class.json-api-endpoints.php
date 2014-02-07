<?php

// Endpoint
abstract class WPCOM_JSON_API_Endpoint {
	// The API Object
	var $api;

	var $pass_wpcom_user_details = false;
	var $can_use_user_details_instead_of_blog_membership = false;

	// One liner.
	var $description;

	// Object Grouping For Documentation (Users, Posts, Comments)
	var $group;

	// Stats extra value to bump
	var $stat;

	// HTTP Method
	var $method = 'GET';

	// Path at which to serve this endpoint: sprintf() format.
	var $path = '';

	// Identifiers to fill sprintf() formatted $path
	var $path_labels = array();

	// Accepted query parameters
	var $query = array(
		// Parameter name
		'context' => array(
			// Default value => description
			'display' => 'Formats the output as HTML for display.  Shortcodes are parsed, paragraph tags are added, etc..',
			// Other possible values => description
			'edit'    => 'Formats the output for editing.  Shortcodes are left unparsed, significant whitespace is kept, etc..',
		),
		'http_envelope' => array(
			'false' => '',
			'true'  => 'Some environments (like in-browser Javascript or Flash) block or divert responses with a non-200 HTTP status code.  Setting this parameter will force the HTTP status code to always be 200.  The JSON response is wrapped in an "envelope" containing the "real" HTTP status code and headers.',
		),
		'pretty' => array(
			'false' => '',
			'true'  => 'Output pretty JSON',
		),
		'meta' => "(string) Optional. Loads data from the endpoints found in the 'meta' part of the response. Comma separated list. Example: meta=site,likes",
		// Parameter name => description (default value is empty)
		'callback' => '(string) An optional JSONP callback function.',
	);

	// Response format
	var $response_format = array();

	// Request format
	var $request_format = array();

	// Is this endpoint still in testing phase?  If so, not available to the public.
	var $in_testing = false;

	/**
	 * @var string Version of the API
	 */
	var $version = '';

	/**
	 * @var string Example request to make
	 */
	var $example_request = '';

	/**
	 * @var string Example request data (for POST methods)
	 */
	var $example_request_data = '';

	/**
	 * @var string Example response from $example_request
	 */
	var $example_response = '';

	function __construct( $args ) {
		$defaults = array(
			'in_testing'           => false,
			'description'          => '',
			'group'	               => '',
			'method'               => 'GET',
			'path'                 => '/',
			'force'	               => '',
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
			'can_use_user_details_instead_of_blog_membership' => false,
		);

		$args = wp_parse_args( $args, $defaults );

		$this->in_testing  = $args['in_testing'];

		$this->description = $args['description'];
		$this->group       = $args['group'];
		$this->stat        = $args['stat'];
		$this->force	   = $args['force'];
		$this->jp_disabled = $args['jp_disabled'];

		$this->method      = $args['method'];
		$this->path        = $args['path'];
		$this->path_labels = $args['path_labels'];

		$this->pass_wpcom_user_details = $args['pass_wpcom_user_details'];
		$this->can_use_user_details_instead_of_blog_membership = $args['can_use_user_details_instead_of_blog_membership'];

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
		switch ( $this->api->content_type ) {
		case 'application/json; charset=utf-8' :
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
		case 'application/x-www-form-urlencoded; charset=UTF-8' :
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
				if ( isset( $data[$key] ) && isset( $description[$data[$key]] ) ) {
					$return[$key] = (string) $data[$key];
				} elseif ( $return_default_values ) {
					$return[$key] = (string) current( $whitelist );
				} else {
					continue;
				}

				// Truthiness
				if ( $whitelist === $boolean_arg || $whitelist === $naeloob_arg ) {
					$return[$key] = (bool) WPCOM_JSON_API::is_truthy( $return[$key] );
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
	 * Currently, only handles fallback between string <-> array (two way), from string -> false (one way), and from object -> false (one way)
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
			// Fallback string -> array
			if ( is_array( $value ) ) {
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
		case 'media' :
			if ( is_array( $value ) ) {
				if ( isset( $value['name'] ) ) {
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
				}
				break;
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
				'name'        => '(string)',
				'slug'        => '(string)',
				'description' => '(HTML)',
				'post_count'  => '(int)',
				'meta'        => '(object)',
			);
			if ( 'category' === $type ) {
				$docs['parent'] = '(int)';
			}
			$return[$key] = (object) $this->cast_and_filter( $value, $docs, false, $for_output );
			break;
		case 'post_reference' :
		case 'comment_reference' :
			$docs = array(
				'ID'   => '(int)',
				'type' => '(string)',
				'link' => '(URL)',
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
				'ID'          => '(int)',
				'email'       => '(string|false)',
				'name'        => '(string)',
				'URL'         => '(URL)',
				'avatar_URL'  => '(URL)',
				'profile_URL' => '(URL)',
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
			$return[$key] = (object) $this->cast_and_filter( $value, apply_filters( 'wpcom_json_api_attachment_cast_and_filter', $docs ), false, $for_output );
			break;
		case 'metadata' :
			$docs = array(
				'id'       => '(int)',
				'key'       => '(string)',
				'value'     => '(string|false|float|int|array|object)',
				'previous_value' => '(string)',
				'operation'  => '(string)',
			);
			$return[$key] = (object) $this->cast_and_filter( $value, apply_filters( 'wpcom_json_api_attachment_cast_and_filter', $docs ), false, $for_output );
			break;
		default :
			trigger_error( "Unknown API casting type {$type['type']}", E_USER_WARNING );
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
	 * Auto generates documentation based on description, method, path, path_labels, and query parameters.
	 * Echoes HTML.
	 */
	function document( $show_description = true ) {
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

<section class="resource-url">
	<h2 id="apidoc-resource-url">Resource URL</h2>
	<table class="api-doc api-doc-resource-parameters api-doc-resource">
		<thead>
			<tr>
				<th class="api-index-title" scope="column">Type</th>
				<th class="api-index-title" scope="column">URL and Format</th>
			</tr>
		</thead>
		<tbody>
			<tr class="api-index-item">
				<th scope="row" class="parameter api-index-item-title"><?php echo wp_kses_post( $doc['method'] ); ?></th>
				<td class="type api-index-item-title" style="white-space: nowrap;">https://public-api.wordpress.com/rest/v1<?php echo wp_kses_post( $doc['path_labeled'] ); ?></td>
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
		// If no example was hardcoded in the doc, try to get some
		if ( empty( $this->example_response ) ) {

			// Examples for endpoint documentation response
			$response_key = 'dev_response_' . $this->version . '_' . $this->method . '_' . sanitize_title( $this->path );
			$response     = wp_cache_get( $response_key );

			// Response doesn't exist, so run the request
			if ( false === $response ) {

				// Only trust GET request
				if ( 'GET' === $this->method ) {
					$response      = wp_remote_get( $this->example_request );
					$response_body = wp_remote_retrieve_body( $response );

					// Only cache if there's a result
					if ( strlen( $response_body ) ) {
						wp_cache_set( $response_key, $response );
					} else {
						wp_cache_delete( $response_key );
					}
				}
			}

		// Example response was passed into the constructor via params
		} else {
			$response = $this->example_response;
		}

		// Wrap the response in a sourcecode shortcode
		if ( !empty( $response ) ) {
			$response = '[sourcecode language="php" wraplines="false" light="true" autolink="false" htmlscript="false"]' . $response . '[/sourcecode]';
			$response = apply_filters( 'the_content', $response );
			$this->example_response = $response;
		}

		$curl = 'curl';

		$php_opts = array( 'ignore_errors' => true );

		if ( 'GET' !== $this->method ) {
			$php_opts['method'] = $this->method;
		}

		if ( $this->example_request_data ) {
			if ( isset( $this->example_request_data['headers'] ) && is_array( $this->example_request_data['headers'] ) ) {
				$php_opts['header'] = array();
				foreach ( $this->example_request_data['headers'] as $header => $value ) {
					$curl .= " \\\n -H " . escapeshellarg( "$header: $value" );
					$php_opts['header'][] = "$header: $value";
				}
			}

			if ( isset( $this->example_request_data['body'] ) && is_array( $this->example_request_data['body'] ) ) {
				$php_opts['content'] = $this->example_request_data['body'];
				$php_opts['header'][] = 'Content-Type: application/x-www-form-urlencoded';
				foreach ( $this->example_request_data['body'] as $key => $value ) {
					$curl .= " \\\n --data-urlencode " . escapeshellarg( "$key=$value" );
				}
			}
		}

		if ( $php_opts ) {
			$php_opts_exported = var_export( array( 'http' => $php_opts ), true );
			if ( !empty( $php_opts['content'] ) ) {
				$content_exported = preg_quote( var_export( $php_opts['content'], true ), '/' );
				$content_exported = '\\s*' . str_replace( "\n", "\n\\s*", $content_exported ) . '\\s*';
				$php_opts_exported = preg_replace_callback( "/$content_exported/", array( $this, 'add_http_build_query_to_php_content_example' ), $php_opts_exported );
			}
			$php = <<<EOPHP
<?php

\$options  = $php_opts_exported;

\$context  = stream_context_create( \$options );
\$response = file_get_contents(
  '$this->example_request',
  false,
  \$context
);
\$response = json_decode( \$response );

?>
EOPHP;
		} else {
			$php = <<<EOPHP
<?php

\$response = file_get_contents( '$this->example_request' );
\$response = json_decode( \$response );

?>
EOPHP;
		}

		if ( false !== strpos( $curl, "\n" ) ) {
			$curl .= " \\\n";
		}

		$curl .= ' ' . escapeshellarg( $this->example_request );

		$curl = '[sourcecode language="bash" wraplines="false" light="true" autolink="false" htmlscript="false"]' . $curl . '[/sourcecode]';
		$curl = apply_filters( 'the_content', $curl );

		$php = '[sourcecode language="php" wraplines="false" light="true" autolink="false" htmlscript="false"]' . $php . '[/sourcecode]';
		$php = apply_filters( 'the_content', $php );
?>

<?php if ( ! empty( $this->example_request ) || ! empty( $this->example_request_data ) || ! empty( $this->example_response ) ) : ?>

	<section class="example-response">
		<h2 id="apidoc-example">Example</h2>

		<section>
			<h3>cURL</h3>
			<?php echo wp_kses_post( $curl ); ?>
		</section>

		<section>
			<h3>PHP</h3>
			<?php echo wp_kses_post( $php ); ?>
		</section>

		<?php if ( ! empty( $this->example_response ) ) : ?>

			<section>
				<h3>Response Body</h3>
				<?php echo $this->example_response; ?>
			</section>

		<?php endif; ?>

	</section>

<?php endif; ?>

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
		$path_labeled = vsprintf( $format, array_keys( $this->path_labels ) );
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
			foreach ( $this->$_property as $key => $description ) {
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
				} else {
					return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
				}
			} else {
				return new WP_Error( 'unauthorized', 'User cannot view post', 403 );
			}
		}

		if ( -1 == get_option( 'blog_public' ) && !current_user_can( 'read_post', $post->ID ) ) {
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
			$email       = $author->comment_author_email;
			$name        = $author->comment_author;
			$URL         = $author->comment_author_url;
			$profile_URL = 'http://en.gravatar.com/' . md5( strtolower( trim( $email ) ) );
			$nice        = '';
			$site_id     = -1;
		} else {
			if ( isset( $author->post_author ) ) {
				if ( 0 == $author->post_author )
					return null;

				$author = $author->post_author;
			} elseif ( isset( $author->user_id ) && $author->user_id ) {
				$author = $author->user_id;
			} elseif ( isset( $author->user_email ) ) {
				$author = $author->ID;
			}

			$user = get_user_by( 'id', $author );
			if ( !$user || is_wp_error( $user ) ) {
				trigger_error( 'Unknown user', E_USER_WARNING );
				return null;
			}

			$ID    = $user->ID;
			$email = $user->user_email;
			$name  = $user->display_name;
			$URL   = $user->user_url;
			$nice  = $user->user_nicename;
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$active_blog = get_active_blog_for_user( $ID );
				$site_id     = $active_blog->blog_id;
				$profile_URL = "http://en.gravatar.com/{$user->user_login}";
			} else {
				$profile_URL = 'http://en.gravatar.com/' . md5( strtolower( trim( $email ) ) );
				$site_id     = -1;
			}
		}

		$avatar_URL = $this->api->get_avatar_url( $email );

		$email = $show_email ? (string) $email : false;

		$author = array(
			'ID'          => (int) $ID,
			'email'       => $email, // (string|bool)
			'name'        => (string) $name,
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

	function get_taxonomy( $taxonomy_id, $taxonomy_type, $context ) {

		$taxonomy = get_term_by( 'slug', $taxonomy_id, $taxonomy_type );
		/// keep updating this function
		if ( !$taxonomy || is_wp_error( $taxonomy ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		// Permissions
		switch ( $context ) {
		case 'edit' :
			$tax = get_taxonomy( $taxonomy_type );
			if ( !current_user_can( $tax->cap->edit_terms ) )
				return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
			break;
		case 'display' :
			if ( -1 == get_option( 'blog_public' ) ) {
				return new WP_Error( 'unauthorized', 'User cannot view taxonomy', 403 );
			}
			break;
		default :
			return new WP_Error( 'invalid_context', 'Invalid API CONTEXT', 400 );
		}

		$response                = array();
		$response['name']        = (string) $taxonomy->name;
		$response['slug']        = (string) $taxonomy_id;
		$response['description'] = (string) $taxonomy->description;
		$response['post_count']  = (int) $taxonomy->count;

		if ( 'category' === $taxonomy_type )
			$response['parent'] = (int) $taxonomy->parent;

		$response['meta'] = (object) array(
			'links' => (object) array(
				'self' => (string) $this->get_taxonomy_link( $this->api->get_blog_id_for_output(), $taxonomy_id, $taxonomy_type ),
				'help' => (string) $this->get_taxonomy_link( $this->api->get_blog_id_for_output(), $taxonomy_id, $taxonomy_type, 'help' ),
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
			$timestamp = strtotime( "$date+0000" );
			$offset    = $timestamp - $timestamp_gmt;
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

	function get_link() {
		$args   = func_get_args();
		$format = array_shift( $args );
		array_unshift( $args, $this->api->public_api_scheme, WPCOM_JSON_API__BASE );
		$path = array_pop( $args );
		if ( $path ) {
			$path = '/' . ltrim( $path, '/' );
		}
		$args[] = $path;

		// http, WPCOM_JSON_API__BASE, ...    , path
		// %s  , %s                  , $format, %s
		return esc_url_raw( vsprintf( "%s://%s$format%s", $args ) );
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

	function get_site_link( $blog_id, $path = '' ) {
		return $this->get_link( '/sites/%d', $blog_id, $path );
	}

	function get_post_link( $blog_id, $post_id, $path = '' ) {
		return $this->get_link( '/sites/%d/posts/%d', $blog_id, $post_id, $path );
	}

	function get_comment_link( $blog_id, $comment_id, $path = '' ) {
		return $this->get_link( '/sites/%d/comments/%d', $blog_id, $comment_id, $path );
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

abstract class WPCOM_JSON_API_Post_Endpoint extends WPCOM_JSON_API_Endpoint {
	var $post_object_format = array(
		// explicitly document and cast all output
		'ID'        => '(int) The post ID.',
		'site_ID'		=> '(int) The site ID.',
		'author'    => '(object>author) The author of the post.',
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'modified'  => "(ISO 8601 datetime) The post's most recent update time.",
		'title'     => '(HTML) <code>context</code> dependent.',
		'URL'       => '(URL) The full permalink URL to the post.',
		'short_URL' => '(URL) The wp.me short URL.',
		'content'   => '(HTML) <code>context</code> dependent.',
		'excerpt'   => '(HTML) <code>context</code> dependent.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'guid'      => '(string) The GUID for the post.',
		'status'    => array(
			'publish' => 'The post is published.',
			'draft'   => 'The post is saved as a draft.',
			'pending' => 'The post is pending editorial approval.',
			'future'  => 'The post is scheduled for future publishing.',
			'trash'   => 'The post is in the trash.',
		),
		'password' => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'   => "(object>post_reference|false) A reference to the post's parent, if it has one.",
		'type'     => "(string) The post's post_type. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'comments_open'  => '(bool) Is the post open for comments?',
		'pings_open'     => '(bool) Is the post open for pingbacks, trackbacks?',
		'comment_count'  => '(int) The number of comments for this post.',
		'like_count'     => '(int) The number of likes for this post.',
		'i_like'         => '(bool) Does the current user like this post?',
		'is_reblogged'   => '(bool) Did the current user reblog this post?',
		'is_following'   => '(bool) Is the current user following this blog?',
		'global_ID'      => '(string) A unique WordPress.com-wide representation of a post.',
		'featured_image' => '(URL) The URL to the featured image for this post if it has one.',
		'format'         => array(), // see constructor
		'geo'            => '(object>geo|false)',
		'publicize_URLs' => '(array:URL) Array of Twitter and Facebook URLs published by this post.',
		'tags'           => '(object:tag) Hash of tags (keyed by tag name) applied to the post.',
		'categories'     => '(object:category) Hash of categories (keyed by category name) applied to the post.',
		'attachments'	 => '(object:attachment) Hash of post attachments (keyed by attachment ID).',
		'metadata'	     => '(array) Array of post metadata keys and values. All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with access. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.',
		'meta'           => '(object) API result meta data',
	);

	// var $response_format =& $this->post_object_format;

	function __construct( $args ) {
		if ( is_array( $this->post_object_format ) && isset( $this->post_object_format['format'] ) ) {
			$this->post_object_format['format'] = get_post_format_strings();
		}
		if ( !$this->response_format ) {
			$this->response_format =& $this->post_object_format;
		}
		parent::__construct( $args );
	}

	function is_post_type_allowed( $post_type ) {

		// if the post type is empty, that's fine, WordPress will default to post
		if ( empty( $post_type ) )
			return true;

		// whitelist of post types that can be accessed
 		if ( in_array( $post_type, apply_filters( 'rest_api_allowed_post_types', array( 'post', 'page', 'any' ) ) ) )
			return true;

 		return false;
 	}

	function is_metadata_public( $key ) {
		if ( empty( $key ) )
			return false;

		// Default whitelisted meta keys.
		$whitelisted_meta = array( '_thumbnail_id' );

		// whitelist of metadata that can be accessed
 		if ( in_array( $key, apply_filters( 'rest_api_allowed_public_metadata', $whitelisted_meta ) ) )
			return true;

 		return false;
 	}

	function the_password_form() {
		return __( 'This post is password protected.', 'jetpack' );
	}

	function get_post_by( $field, $post_id, $context = 'display' ) {
		global $blog_id;

		if ( defined( 'GEO_LOCATION__CLASS' ) && class_exists( GEO_LOCATION__CLASS ) ) {
			$geo = call_user_func( array( GEO_LOCATION__CLASS, 'init' ) );
		} else {
			$geo = false;
		}

		if ( 'display' === $context ) {
			$args = $this->query_args();
			if ( isset( $args['content_width'] ) && $args['content_width'] ) {
				$GLOBALS['content_width'] = (int) $args['content_width'];
			}
		}

		if ( strpos( $_SERVER['HTTP_USER_AGENT'], 'wp-windows8' ) ) {
			remove_shortcode( 'gallery', 'gallery_shortcode' );
			add_shortcode( 'gallery', array( &$this, 'win8_gallery_shortcode' ) );
		}

		switch ( $field ) {
		case 'name' :
			$post_id = sanitize_title( $post_id );
			if ( !$post_id ) {
				return new WP_Error( 'invalid_post', 'Invalid post', 400 );
			}

			$posts = get_posts( array( 'name' => $post_id ) );
			if ( !$posts || !isset( $posts[0]->ID ) || !$posts[0]->ID ) {
				$page = get_page_by_path( $post_id );
				if ( !$page )
					return new WP_Error( 'unknown_post', 'Unknown post', 404 );
				$post_id = $page->ID;
			} else {
				$post_id = (int) $posts[0]->ID;
			}
			break;
		default :
			$post_id = (int) $post_id;
			break;
		}

		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		if ( ! $this->is_post_type_allowed( $post->post_type ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		// Permissions
		switch ( $context ) {
		case 'edit' :
			if ( !current_user_can( 'edit_post', $post->ID ) ) {
				return new WP_Error( 'unauthorized', 'User cannot edit post', 403 );
			}
			break;
		case 'display' :
			break;
		default :
			return new WP_Error( 'invalid_context', 'Invalid API CONTEXT', 400 );
		}

		$can_view = $this->user_can_view_post( $post->ID );
		if ( !$can_view || is_wp_error( $can_view ) ) {
			return $can_view;
		}

		// Re-get post according to the correct $context
		$post            = get_post( $post->ID, OBJECT, $context );
		$GLOBALS['post'] = $post;

		if ( 'display' === $context ) {
			setup_postdata( $post );
		}

		$response = array();
		foreach ( array_keys( $this->post_object_format ) as $key ) {
			switch ( $key ) {
			case 'ID' :
				// explicitly cast all output
				$response[$key] = (int) $post->ID;
				break;
			case 'site_ID' :
				$response[$key] = (int) $blog_id;
				break;
			case 'author' :
				$response[$key] = (object) $this->get_author( $post, 'edit' === $context && current_user_can( 'edit_post', $post->ID ) );
				break;
			case 'date' :
				$response[$key] = (string) $this->format_date( $post->post_date_gmt, $post->post_date );
				break;
			case 'modified' :
				$response[$key] = (string) $this->format_date( $post->post_modified_gmt, $post->post_modified );
				break;
			case 'title' :
				if ( 'display' === $context ) {
					$response[$key] = (string) get_the_title( $post->ID );
				} else {
					$response[$key] = (string) $post->post_title;
				}
				break;
			case 'URL' :
				$response[$key] = (string) esc_url_raw( get_permalink( $post->ID ) );
				break;
			case 'short_URL' :
				$response[$key] = (string) esc_url_raw( wp_get_shortlink( $post->ID ) );
				break;
			case 'content' :
				if ( 'display' === $context ) {
					add_filter( 'the_password_form', array( $this, 'the_password_form' ) );
					$response[$key] = (string) $this->get_the_post_content_for_display();
					remove_filter( 'the_password_form', array( $this, 'the_password_form' ) );
				} else {
					$response[$key] = (string) $post->post_content;
				}
				break;
			case 'excerpt' :
				if ( 'display' === $context ) {
					add_filter( 'the_password_form', array( $this, 'the_password_form' ) );
					ob_start();
					the_excerpt();
					$response[$key] = (string) ob_get_clean();
					remove_filter( 'the_password_form', array( $this, 'the_password_form' ) );
				} else {
					$response[$key] = (string) $post->post_excerpt;
				}
				break;
			case 'status' :
				$response[$key] = (string) get_post_status( $post->ID );
				break;
			case 'slug' :
				$response[$key] = (string) $post->post_name;
				break;
			case 'guid' :
				$response[$key] = (string) $post->guid;
				break;
			case 'password' :
				$response[$key] = (string) $post->post_password;
				break;
			case 'parent' : // (object|false)
				if ( $post->post_parent ) {
					$parent         = get_post( $post->post_parent );
					$response[$key] = (object) array(
						'ID'   => (int) $parent->ID,
						'type' => (string) $parent->post_type,
						'link' => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $parent->ID ),
					);
				} else {
					$response[$key] = false;
				}
				break;
			case 'type' :
				$response[$key] = (string) $post->post_type;
				break;
			case 'comments_open' :
				$response[$key] = (bool) comments_open( $post->ID );
				break;
			case 'pings_open' :
				$response[$key] = (bool) pings_open( $post->ID );
				break;
			case 'comment_count' :
				$response[$key] = (int) $post->comment_count;
				break;
			case 'like_count' :
				$response[$key] = (int) $this->api->post_like_count( $blog_id, $post->ID );
				break;
			case 'i_like'     :
				$response[$key] = (int) $this->api->is_liked( $blog_id, $post->ID );
				break;
			case 'is_reblogged':
				$response[$key] = (int) $this->api->is_reblogged( $blog_id, $post->ID );
				break;
			case 'is_following':
				$response[$key] = (int) $this->api->is_following( $blog_id );
				break;
			case 'global_ID':
				$response[$key] = (string) $this->api->add_global_ID( $blog_id, $post->ID );
				break;
			case 'featured_image' :
				$image_attributes = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full' );
				if ( is_array( $image_attributes ) && isset( $image_attributes[0] ) )
					$response[$key] = (string) $image_attributes[0];
				else
					$response[$key] = '';
				break;
			case 'format' :
				$response[$key] = (string) get_post_format( $post->ID );
				if ( !$response[$key] ) {
					$response[$key] = 'standard';
				}
				break;
			case 'geo' : // (object|false)
				if ( !$geo ) {
					$response[$key] = false;
				} else {
					$geo_data       = $geo->get_geo( 'post', $post->ID );
					$response[$key] = false;
					if ( $geo_data ) {
						$geo_data = array_intersect_key( $geo_data, array( 'latitude' => true, 'longitude' => true, 'address' => true, 'public' => true ) );
						if ( $geo_data ) {
							$response[$key] = (object) array(
								'latitude'  => isset( $geo_data['latitude']  ) ? (float)  $geo_data['latitude']  : 0,
								'longitude' => isset( $geo_data['longitude'] ) ? (float)  $geo_data['longitude'] : 0,
								'address'   => isset( $geo_data['address'] )   ? (string) $geo_data['address']   : '',
							);
						} else {
							$response[$key] = false;
						}
						// Private
						if ( !isset( $geo_data['public'] ) || !$geo_data['public'] ) {
							if ( 'edit' !== $context || !current_user_can( 'edit_post', $post->ID ) ) {
								// user can't access
								$response[$key] = false;
							}
						}
					}
				}
				break;
			case 'publicize_URLs' :
				$publicize_URLs = array();
				$publicize      = get_post_meta( $post->ID, 'publicize_results', true );
				if ( $publicize ) {
					foreach ( $publicize as $service => $data ) {
						switch ( $service ) {
						case 'twitter' :
							foreach ( $data as $datum ) {
								$publicize_URLs[] = esc_url_raw( "https://twitter.com/{$datum['user_id']}/status/{$datum['post_id']}" );
							}
							break;
						case 'fb' :
							foreach ( $data as $datum ) {
								$publicize_URLs[] = esc_url_raw( "https://www.facebook.com/permalink.php?story_fbid={$datum['post_id']}&id={$datum['user_id']}" );
							}
							break;
						}
					}
				}
				$response[$key] = (array) $publicize_URLs;
				break;
			case 'tags' :
				$response[$key] = array();
				$terms = wp_get_post_tags( $post->ID );
				foreach ( $terms as $term ) {
					if ( !empty( $term->name ) ) {
						$response[$key][$term->name] = $this->get_taxonomy( $term->slug, 'post_tag', $context );
					}
				}
				$response[$key] = (object) $response[$key];
				break;
			case 'categories':
				$response[$key] = array();
				$terms = wp_get_post_categories( $post->ID );
				foreach ( $terms as $term ) {
					$category = $taxonomy = get_term_by( 'id', $term, 'category' );
					if ( !empty( $category->name ) ) {
						$response[$key][$category->name] = $this->get_taxonomy( $category->slug, 'category', $context );
					}
				}
				$response[$key] = (object) $response[$key];
				break;
			case 'attachments':
				$response[$key] = array();
				$_attachments = get_posts( array( 'post_parent' => $post->ID, 'post_status' => 'inherit', 'post_type' => 'attachment' ) );
				foreach ( $_attachments as $attachment ) {
					$response[$key][$attachment->ID] = $this->get_attachment( $attachment );
				}
				$response[$key] = (object) $response[$key];
				break;
			case 'metadata' : // (array|false)
				$metadata = array();
				foreach ( (array) has_meta( $post_id ) as $meta ) {
					// Don't expose protected fields.
					$show = false;
					if ( $this->is_metadata_public( $meta['meta_key'] ) )
						$show = true;
					if ( current_user_can( 'edit_post_meta', $post_id , $meta['meta_key'] ) )
						$show = true;

					if ( !$show )
						continue;

					$metadata[] = array(
						'id'    => $meta['meta_id'],
						'key'   => $meta['meta_key'],
						'value' => maybe_unserialize( $meta['meta_value'] ),
					);
				}

				if ( ! empty( $metadata ) ) {
					$response[$key] = $metadata;
				} else {
					$response[$key] = false;
				}
				break;
			case 'meta' :
				$response[$key] = (object) array(
					'links' => (object) array(
						'self'    => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $post->ID ),
						'help'    => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $post->ID, 'help' ),
						'site'    => (string) $this->get_site_link( $this->api->get_blog_id_for_output() ),
//						'author'  => (string) $this->get_user_link( $post->post_author ),
//						'via'     => (string) $this->get_post_link( $reblog_origin_blog_id, $reblog_origin_post_id ),
						'replies' => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $post->ID, 'replies/' ),
						'likes'   => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $post->ID, 'likes/' ),
					),
				);
				break;
			}
		}

		// WPCOM_JSON_API_Post_Endpoint::find_featured_worthy_media( $post );
		$response['featured_media'] = self::find_featured_media( $post );

		unset( $GLOBALS['post'] );
		return $response;
	}

	// No Blog ID parameter.  No Post ID parameter.  Depends on globals.
	// Expects setup_postdata() to already have been run
	function get_the_post_content_for_display() {
		global $pages, $page;

		$old_pages = $pages;
		$old_page  = $page;

		$content = join( "\n\n", $pages );
		$content = preg_replace( '/<!--more(.*?)?-->/', '', $content );
		$pages   = array( $content );
		$page    = 1;

		ob_start();
		the_content();
		$return = ob_get_clean();

		$pages = $old_pages;
		$page  = $old_page;

		return $return;
	}

	function get_blog_post( $blog_id, $post_id, $context = 'display' ) {
		$blog_id = $this->api->get_blog_id( $blog_id );
		if ( !$blog_id || is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		switch_to_blog( $blog_id );
		$post = $this->get_post_by( 'ID', $post_id, $context );
		restore_current_blog();
		return $post;
	}

	/**
	 * Supporting featured media in post endpoints. Currently on for wpcom blogs
	 * since it's calling WPCOM_JSON_API_Read_Endpoint methods which presently
	 * rely on wpcom specific functionality.
	 *
	 * @param WP_Post $post
	 * @return object list of featured media
	 */
	public static function find_featured_media( &$post ) {

		if ( class_exists( 'WPCOM_JSON_API_Read_Endpoint' ) ) {
			return WPCOM_JSON_API_Read_Endpoint::find_featured_worthy_media( (array) $post );
		} else {
			return (object) array();
		}

	}



	function win8_gallery_shortcode( $attr ) {
		global $post;

		static $instance = 0;
		$instance++;

		$output = '';

		// We're trusting author input, so let's at least make sure it looks like a valid orderby statement
		if ( isset( $attr['orderby'] ) ) {
			$attr['orderby'] = sanitize_sql_orderby( $attr['orderby'] );
			if ( !$attr['orderby'] )
				unset( $attr['orderby'] );
		}

		extract( shortcode_atts( array(
			'order'     => 'ASC',
			'orderby'   => 'menu_order ID',
			'id'        => $post->ID,
			'include'   => '',
			'exclude'   => '',
			'slideshow' => false
		), $attr ) );

		// Custom image size and always use it
		add_image_size( 'win8app-column', 480 );
		$size = 'win8app-column';

		$id = intval( $id );
		if ( 'RAND' === $order )
			$orderby = 'none';

		if ( !empty( $include ) ) {
			$include      = preg_replace( '/[^0-9,]+/', '', $include );
			$_attachments = get_posts( array( 'include' => $include, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby ) );
			$attachments  = array();
			foreach ( $_attachments as $key => $val ) {
				$attachments[$val->ID] = $_attachments[$key];
			}
		} elseif ( !empty( $exclude ) ) {
			$exclude     = preg_replace( '/[^0-9,]+/', '', $exclude );
			$attachments = get_children( array( 'post_parent' => $id, 'exclude' => $exclude, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby ) );
		} else {
			$attachments = get_children( array( 'post_parent' => $id, 'post_status' => 'inherit', 'post_type' => 'attachment', 'post_mime_type' => 'image', 'order' => $order, 'orderby' => $orderby ) );
		}

		if ( ! empty( $attachments ) ) {
			foreach ( $attachments as $id => $attachment ) {
				$link = isset( $attr['link'] ) && 'file' === $attr['link'] ? wp_get_attachment_link( $id, $size, false, false ) : wp_get_attachment_link( $id, $size, true, false );

				if ( $captiontag && trim($attachment->post_excerpt) ) {
					$output .= "<div class='wp-caption aligncenter'>$link
						<p class='wp-caption-text'>" . wptexturize($attachment->post_excerpt) . "</p>
						</div>";
				} else {
					$output .= $link . ' ';
				}
			}
		}
	}

	/**
	 * Returns attachment object.
	 *
	 * @param $attachment attachment row
	 *
	 * @return (object)
	 */
	function get_attachment( $attachment ) {
		$metadata = wp_get_attachment_metadata( $attachment->ID );

		$result = array(
			'ID'		=> (int) $attachment->ID,
			'URL'           => (string) wp_get_attachment_url( $attachment->ID ),
			'guid'		=> (string) $attachment->guid,
			'mime_type'	=> (string) $attachment->post_mime_type,
			'width'		=> (int) isset( $metadata['width']  ) ? $metadata['width']  : 0,
			'height'	=> (int) isset( $metadata['height'] ) ? $metadata['height'] : 0,
		);

		if ( isset( $metadata['duration'] ) ) {
			$result['duration'] = (int) $metadata['duration'];
		}

		return (object) apply_filters( 'get_attachment', $result );
	}
}

class WPCOM_JSON_API_Get_Post_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	// /sites/%s/posts/%d      -> $blog_id, $post_id
	// /sites/%s/posts/name:%s -> $blog_id, $post_id // not documented
	// /sites/%s/posts/slug:%s -> $blog_id, $post_id
	function callback( $path = '', $blog_id = 0, $post_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		if ( false === strpos( $path, '/posts/slug:' ) && false === strpos( $path, '/posts/name:' ) ) {
			$get_by = 'ID';
		} else {
			$get_by = 'name';
		}

		$return = $this->get_post_by( $get_by, $post_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'posts' );

		return $return;
	}
}

class WPCOM_JSON_API_List_Posts_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	var $date_range = array();

	var $response_format = array(
		'found'    => '(int) The total number of posts found that match the request (ignoring limits, offsets, and pagination).',
		'posts'    => '(array:post) An array of post objects.',
	);

	// /sites/%s/posts/ -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		if ( $args['number'] < 1 ) {
			$args['number'] = 20;
		} elseif ( 100 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 100.', 400 );
		}

		if ( ! $this->is_post_type_allowed( $args['type'] ) ) {
			return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
		}

		$query = array(
			'posts_per_page' => $args['number'],
			'order'          => $args['order'],
			'orderby'        => $args['order_by'],
			'post_type'      => ( 'any' == $args['type'] ) ? array( 'post', 'page' ) : $args['type'],
			'post_status'    => $args['status'],
			'author'         => isset( $args['author'] ) && 0 < $args['author'] ? $args['author'] : null,
			's'              => isset( $args['search'] ) ? $args['search'] : null,
		);

		if ( isset( $args['meta_key'] ) ) {
			$show = false;
			if ( $this->is_metadata_public( $args['meta_key'] ) )
				$show = true;
			if ( current_user_can( 'edit_post_meta', $query['post_type'], $args['meta_key'] ) )
				$show = true;

			if ( is_protected_meta( $args['meta_key'], 'post' ) && ! $show )
				return new WP_Error( 'invalid_meta_key', 'Invalid meta key', 404 );

			$meta = array( 'key' => $args['meta_key'] );
			if ( isset( $args['meta_value'] ) )
				$meta['value'] = $args['meta_value'];

			$query['meta_query'] = array( $meta );
		}

		if (
			isset( $args['sticky'] )
		&&
			( $sticky = get_option( 'sticky_posts' ) )
		&&
			is_array( $sticky )
		) {
			if ( $args['sticky'] ) {
				$query['post__in'] = $sticky;
			} else {
				$query['post__not_in'] = $sticky;
				$query['ignore_sticky_posts'] = 1;
			}
		}

		if ( isset( $args['category'] ) ) {
			$category = get_term_by( 'slug', $args['category'], 'category' );
			if ( $category === false) {
				$query['category_name'] = $args['category'];
			} else {
				$query['cat'] = $category->term_id;
			}
		}

		if ( isset( $args['tag'] ) ) {
			$query['tag'] = $args['tag'];
		}

		if ( isset( $args['page'] ) ) {
			if ( $args['page'] < 1 ) {
				$args['page'] = 1;
			}

			$query['paged'] = $args['page'];
		} else {
			if ( $args['offset'] < 0 ) {
				$args['offset'] = 0;
			}

			$query['offset'] = $args['offset'];
		}

		if ( isset( $args['before'] ) ) {
			$this->date_range['before'] = $args['before'];
		}
		if ( isset( $args['after'] ) ) {
			$this->date_range['after'] = $args['after'];
		}

		if ( $this->date_range ) {
			add_filter( 'posts_where', array( $this, 'handle_date_range' ) );
		}
		$wp_query = new WP_Query( $query );
		if ( $this->date_range ) {
			remove_filter( 'posts_where', array( $this, 'handle_date_range' ) );
			$this->date_range = array();
		}

		$return = array();
		foreach ( array_keys( $this->response_format ) as $key ) {
			switch ( $key ) {
			case 'found' :
				$return[$key] = (int) $wp_query->found_posts;
				break;
			case 'posts' :
				$posts = array();
				foreach ( $wp_query->posts as $post ) {
					$the_post = $this->get_post_by( 'ID', $post->ID, $args['context'] );
					if ( $the_post && !is_wp_error( $the_post ) ) {
						$posts[] = $the_post;
					}
				}

				if ( $posts ) {
					do_action( 'wpcom_json_api_objects', 'posts', count( $posts ) );
				}

				$return[$key] = $posts;
				break;
			}
		}

		return $return;
	}

	function handle_date_range( $where ) {
		global $wpdb;

		switch ( count( $this->date_range ) ) {
		case 2 :
			$where .= $wpdb->prepare(
				" AND `$wpdb->posts`.post_date BETWEEN CAST( %s AS DATETIME ) AND CAST( %s AS DATETIME ) ",
				$this->date_range['after'],
				$this->date_range['before']
			);
			break;
		case 1 :
			if ( isset( $this->date_range['before'] ) ) {
				$where .= $wpdb->prepare(
					" AND `$wpdb->posts`.post_date <= CAST( %s AS DATETIME ) ",
					$this->date_range['before']
				);
			} else {
				$where .= $wpdb->prepare(
					" AND `$wpdb->posts`.post_date >= CAST( %s AS DATETIME ) ",
					$this->date_range['after']
				);
			}
			break;
		}

		return $where;
	}
}

class WPCOM_JSON_API_Update_Post_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	function __construct( $args ) {
		parent::__construct( $args );
		if ( $this->api->ends_with( $this->path, '/delete' ) ) {
			$this->post_object_format['status']['deleted'] = 'The post has been deleted permanently.';
		}
	}

	// /sites/%s/posts/new       -> $blog_id
	// /sites/%s/posts/%d        -> $blog_id, $post_id
	// /sites/%s/posts/%d/delete -> $blog_id, $post_id
	function callback( $path = '', $blog_id = 0, $post_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_post( $path, $blog_id, $post_id );
		} else {
			return $this->write_post( $path, $blog_id, $post_id );
		}
	}

	// /sites/%s/posts/new       -> $blog_id
	// /sites/%s/posts/%d        -> $blog_id, $post_id
	function write_post( $path, $blog_id, $post_id ) {
		$new  = $this->api->ends_with( $path, '/new' );
		$args = $this->query_args();

		if ( $new ) {
			$input = $this->input( true );

			if ( !isset( $input['title'] ) && !isset( $input['content'] ) && !isset( $input['excerpt'] ) ) {
				return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
			}

			// default to post
			if ( empty( $input['type'] ) )
				$input['type'] = 'post';

			$post_type = get_post_type_object( $input['type'] );

			if ( ! $this->is_post_type_allowed( $input['type'] ) ) {
				return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
			}

			if ( 'publish' === $input['status'] ) {
				if ( !current_user_can( $post_type->cap->publish_posts ) ) {
					if ( current_user_can( $post_type->cap->edit_posts ) ) {
						$input['status'] = 'pending';
					} else {
						return new WP_Error( 'unauthorized', 'User cannot publish posts', 403 );
					}
				}
			} else {
				if ( !current_user_can( $post_type->cap->edit_posts ) ) {
					return new WP_Error( 'unauthorized', 'User cannot edit posts', 403 );
				}
			}
		} else {
			$input = $this->input( false );

			if ( !is_array( $input ) || !$input ) {
				return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
			}

			$post = get_post( $post_id );
			if ( !$post || is_wp_error( $post ) ) {
				return new WP_Error( 'unknown_post', 'Unknown post', 404 );
			}

			if ( !current_user_can( 'edit_post', $post->ID ) ) {
				return new WP_Error( 'unauthorized', 'User cannot edit post', 403 );
			}

			if ( 'publish' === $input['status'] && 'publish' !== $post->post_status && !current_user_can( 'publish_post', $post->ID ) ) {
				$input['status'] = 'pending';
			}
			$last_status = $post->post_status;
			$new_status = $input['status'];

			$post_type = get_post_type_object( $post->post_type );
		}

		if ( !is_post_type_hierarchical( $post_type->name ) ) {
			unset( $input['parent'] );
		}

		$categories = null;
		$tags       = null;

		if ( !empty( $input['categories'] )) {
			if ( is_array( $input['categories'] ) ) {
				$_categories = $input['categories'];
			} else {
				foreach ( explode( ',', $input['categories'] ) as $category ) {
					$_categories[] = $category;
				}
 			}
			foreach ( $_categories as $category ) {
				if ( !$category_info = term_exists( $category, 'category' ) ) {
					if ( is_int( $category ) )
						continue;
					$category_info = wp_insert_term( $category, 'category' );
				}
				if ( !is_wp_error( $category_info ) )
					$categories[] = (int) $category_info['term_id'];
			}
		}

		if ( !empty( $input['tags'] ) ) {
			if ( is_array( $input['tags'] ) ) {
				$tags = $input['tags'];
			} else {
				foreach ( explode( ',', $input['tags'] ) as $tag ) {
					$tags[] = $tag;
				}
 			}
			$tags_string = implode( ',', $tags );
 		}

		unset( $input['tags'], $input['categories'] );

		$insert = array();

		if ( !empty( $input['slug'] ) ) {
			$insert['post_name'] = $input['slug'];
			unset( $input['slug'] );
		}

		if ( true === $input['comments_open'] )
			$insert['comment_status'] = 'open';
		else if ( false === $input['comments_open'] )
			$insert['comment_status'] = 'closed';

		if ( true === $input['pings_open'] )
			$insert['ping_status'] = 'open';
		else if ( false === $input['pings_open'] )
			$insert['ping_status'] = 'closed';

		unset( $input['comments_open'], $input['pings_open'] );

		$publicize = $input['publicize'];
		$publicize_custom_message = $input['publicize_message'];
		unset( $input['publicize'], $input['publicize_message'] );

		$metadata = $input['metadata'];
		unset( $input['metadata'] );

		foreach ( $input as $key => $value ) {
			$insert["post_$key"] = $value;
		}

		if ( !empty( $tags ) )
			$insert["tax_input"]["post_tag"] = $tags;
		if ( !empty( $categories ) )
			$insert["tax_input"]["category"] = $categories;

		$has_media = isset( $input['media'] ) && $input['media'] ? count( $input['media'] ) : false;

		if ( $new ) {
			if ( false === strpos( $input['content'], '[gallery' ) && $has_media ) {
				switch ( $has_media ) {
				case 0 :
					// No images - do nothing.
					break;
				case 1 :
					// 1 image - make it big
					$insert['post_content'] = $input['content'] = "[gallery size=full columns=1]\n\n" . $input['content'];
					break;
				default :
					// Several images - 3 column gallery
					$insert['post_content'] = $input['content'] = "[gallery]\n\n" . $input['content'];
					break;
				}
			}

			$post_id = wp_insert_post( add_magic_quotes( $insert ), true );

			if ( $has_media ) {
				$this->api->trap_wp_die( 'upload_error' );
				foreach ( $input['media'] as $media_item ) {
					$_FILES['.api.media.item.'] = $media_item;
					// check for WP_Error if we ever actually need $media_id
					$media_id = media_handle_upload( '.api.media.item.', $post_id );
				}
				$this->api->trap_wp_die( null );

				unset( $_FILES['.api.media.item.'] );
			}
		} else {
			$insert['ID'] = $post->ID;
			$post_id = wp_update_post( (object) $insert );
		}

		if ( !$post_id || is_wp_error( $post_id ) ) {
			return $post_id;
		}

		// WPCOM Specific (Jetpack's will get bumped elsewhere
		// Tracks how many posts are published and sets meta so we can track some other cool stats (like likes & comments on posts published)
		if ( ( $new && 'publish' == $input['status'] ) || ( !$new && isset( $last_status ) && 'publish' != $last_status && isset( $new_status ) && 'publish' == $new_status ) ) {
			if ( function_exists( 'bump_stats_extras' ) ) {
				bump_stats_extras( 'api-insights-posts', $this->api->token_details['client_id'] );
				update_post_meta( $post_id, '_rest_api_published', 1 );
				update_post_meta( $post_id, '_rest_api_client_id', $this->api->token_details['client_id'] );
			}
		}

		if ( $publicize === false ) {
			foreach ( $GLOBALS['publicize_ui']->publicize->get_services( 'all' ) as $name => $service ) {
				update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $name, 1 );
			}
		} else if ( is_array( $publicize ) && ( count ( $publicize ) > 0 ) ) {
			foreach ( $GLOBALS['publicize_ui']->publicize->get_services( 'all' ) as $name => $service ) {
				if ( !in_array( $name, $publicize ) ) {
					update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $name, 1 );
				}
			}
		}

		if ( !empty( $publicize_custom_message ) )
			update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_MESS, trim( $publicize_custom_message ) );

		set_post_format( $post_id, $insert['post_format'] );

		if ( ! empty( $metadata ) ) {
			foreach ( (array) $metadata as $meta ) {

				$meta = (object) $meta;

				$existing_meta_item = new stdClass;

				if ( empty( $meta->operation ) )
					$meta->operation = 'update';

				if ( ! empty( $meta->value ) ) {
					if ( 'true' == $meta->value )
						$meta->value = true;
					if ( 'false' == $meta->value )
						$meta->value = false;
				}

				if ( ! empty( $meta->id ) ) {
					$meta->id = absint( $meta->id );
					$existing_meta_item = get_metadata_by_mid( 'post', $meta->id );
				}

				$unslashed_meta_key = wp_unslash( $meta->key ); // should match what the final key will be
				$meta->key = wp_slash( $meta->key );
				$unslashed_existing_meta_key = wp_unslash( $existing_meta_item->meta_key );
				$existing_meta_item->meta_key = wp_slash( $existing_meta_item->meta_key );

				switch ( $meta->operation ) {
					case 'delete':

						if ( ! empty( $meta->id ) && ! empty( $existing_meta_item->meta_key ) && current_user_can( 'delete_post_meta', $post_id, $unslashed_existing_meta_key ) ) {
							delete_metadata_by_mid( 'post', $meta->id );
						} elseif ( ! empty( $meta->key ) && ! empty( $meta->previous_value ) && current_user_can( 'delete_post_meta', $post_id, $unslashed_meta_key ) ) {
							delete_post_meta( $post_id, $meta->key, $meta->previous_value );
						} elseif ( ! empty( $meta->key ) && current_user_can( 'delete_post_meta', $post_id, $unslashed_meta_key ) ) {
							delete_post_meta( $post_id, $meta->key );
						}

						break;
					case 'add':

						if ( ! empty( $meta->id ) || ! empty( $meta->previous_value ) ) {
							continue;
						} elseif ( ! empty( $meta->key ) && ! empty( $meta->value ) && ( current_user_can( 'add_post_meta', $post_id, $unslashed_meta_key ) ) || $this->is_metadata_public( $meta->key ) ) {
							add_post_meta( $post_id, $meta->key, $meta->value );
						}

						break;
					case 'update':

						if ( ! isset( $meta->value ) ) {
							continue;
						} elseif ( ! empty( $meta->id ) && ! empty( $existing_meta_item->meta_key ) && ( current_user_can( 'edit_post_meta', $post_id, $unslashed_existing_meta_key ) || $this->is_metadata_public( $meta->key ) ) ) {
							update_metadata_by_mid( 'post', $meta->id, $meta->value );
						} elseif ( ! empty( $meta->key ) && ! empty( $meta->previous_value ) && ( current_user_can( 'edit_post_meta', $post_id, $unslashed_meta_key ) || $this->is_metadata_public( $meta->key ) ) ) {
							update_post_meta( $post_id, $meta->key,$meta->value, $meta->previous_value );
						} elseif ( ! empty( $meta->key ) && ( current_user_can( 'edit_post_meta', $post_id, $unslashed_meta_key ) || $this->is_metadata_public( $meta->key ) ) ) {
							update_post_meta( $post_id, $meta->key, $meta->value );
						}

						break;
				}

			}
		}

		do_action( 'rest_api_inserted_post', $post_id, $insert, $new );

		$return = $this->get_post_by( 'ID', $post_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'posts' );

		return $return;
	}

	// /sites/%s/posts/%d/delete -> $blog_id, $post_id
	function delete_post( $path, $blog_id, $post_id ) {
		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		if ( ! $this->is_post_type_allowed( $post->post_type ) ) {
			return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
		}

		if ( !current_user_can( 'delete_post', $post->ID ) ) {
			return new WP_Error( 'unauthorized', 'User cannot delete posts', 403 );
		}

		$args  = $this->query_args();
		$return = $this->get_post_by( 'ID', $post->ID, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'posts' );

		wp_delete_post( $post->ID );

		$status = get_post_status( $post->ID );
		if ( false === $status ) {
			$return['status'] = 'deleted';
			return $return;
		}

		return $this->get_post_by( 'ID', $post->ID, $args['context'] );
	}
}

abstract class WPCOM_JSON_API_Taxonomy_Endpoint extends WPCOM_JSON_API_Endpoint {
	var $category_object_format = array(
		'ID'          => '(int) The category ID.',
		'name'        => "(string) The name of the category.",
		'slug'        => "(string) The slug of the category.",
		'description' => '(string) The description of the category.',
		'post_count'  => "(int) The number of posts using this category.",
		'parent'	  => "(int) The parent ID for the category.",
		'meta'        => '(object) Meta data',
	);

	var $tag_object_format = array(
		'ID'          => '(int) The tag ID.',
		'name'        => "(string) The name of the tag.",
		'slug'        => "(string) The slug of the tag.",
		'description' => '(string) The description of the tag.',
		'post_count'  => "(int) The number of posts using this t.",
		'meta'        => '(object) Meta data',
	);

	function __construct( $args ) {
		parent::__construct( $args );
		if ( preg_match( '#/tags/#i', $this->path ) )
			$this->response_format =& $this->tag_object_format;
		else
			$this->response_format =& $this->category_object_format;
	}
}


class WPCOM_JSON_API_Get_Taxonomy_Endpoint extends WPCOM_JSON_API_Taxonomy_Endpoint {
	// /sites/%s/tags/slug:%s       -> $blog_id, $tag_id
	// /sites/%s/categories/slug:%s -> $blog_id, $tag_id
	function callback( $path = '', $blog_id = 0, $taxonomy_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();
		if ( preg_match( '#/tags/#i', $path ) ) {
			$taxonomy_type = "post_tag";
		} else {
			$taxonomy_type = "category";
		}

		$return = $this->get_taxonomy( $taxonomy_id, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );

		return $return;
	}
}


class WPCOM_JSON_API_Update_Taxonomy_Endpoint extends WPCOM_JSON_API_Taxonomy_Endpoint {
	// /sites/%s/tags|categories/new    -> $blog_id
	// /sites/%s/tags|categories/slug:%s -> $blog_id, $taxonomy_id
	// /sites/%s/tags|categories/slug:%s/delete -> $blog_id, $taxonomy_id
	function callback( $path = '', $blog_id = 0, $object_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( preg_match( '#/tags/#i', $path ) ) {
			$taxonomy_type = "post_tag";
		} else {
			$taxonomy_type = "category";
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_taxonomy( $path, $blog_id, $object_id, $taxonomy_type );
		} elseif ( $this->api->ends_with( $path, '/new' ) ) {
			return $this->new_taxonomy( $path, $blog_id, $taxonomy_type );
		}

		return $this->update_taxonomy( $path, $blog_id, $object_id, $taxonomy_type );
	}

	// /sites/%s/tags|categories/new    -> $blog_id
	function new_taxonomy( $path, $blog_id, $taxonomy_type ) {
		$args  = $this->query_args();
		$input = $this->input();
		if ( !is_array( $input ) || !$input || !strlen( $input['name'] ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown data passed', 404 );
		}

		$user = wp_get_current_user();
		if ( !$user || is_wp_error( $user ) || !$user->ID ) {
			return new WP_Error( 'authorization_required', 'An active access token must be used to manage taxonomies.', 403 );
		}

		$tax = get_taxonomy( $taxonomy_type );
		if ( !current_user_can( $tax->cap->edit_terms ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
		}

		if ( term_exists( $input['name'], $taxonomy_type ) ) {
			return new WP_Error( 'unknown_taxonomy', 'A taxonomy with that name already exists', 404 );
		}

		if ( 'category' !== $taxonomy_type )
			$input['parent'] = 0;

		$data = wp_insert_term( addslashes( $input['name'] ), $taxonomy_type,
			array(
		  		'description' => addslashes( $input['description'] ),
		  		'parent'      => $input['parent']
			)
		);

		if ( is_wp_error( $data ) )
			return $data;

		$taxonomy = get_term_by( 'id', $data['term_id'], $taxonomy_type );

		$return   = $this->get_taxonomy( $taxonomy->slug, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );
		return $return;
	}

	// /sites/%s/tags|categories/slug:%s -> $blog_id, $taxonomy_id
	function update_taxonomy( $path, $blog_id, $object_id, $taxonomy_type ) {
		$taxonomy = get_term_by( 'slug', $object_id, $taxonomy_type );
		$tax      = get_taxonomy( $taxonomy_type );
		if ( !current_user_can( $tax->cap->edit_terms ) )
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );

		if ( !$taxonomy || is_wp_error( $taxonomy ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		if ( false === term_exists( $object_id, $taxonomy_type ) ) {
			return new WP_Error( 'unknown_taxonomy', 'That taxonomy does not exist', 404 );
		}

		$args  = $this->query_args();
		$input = $this->input( false );
		if ( !is_array( $input ) || !$input ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$update = array();
		if ( 'category' === $taxonomy_type && !empty( $input['parent'] ) )
			$update['parent'] = $input['parent'];

		if ( !empty( $input['description'] ) )
			$update['description'] = addslashes( $input['description'] );

		if ( !empty( $input['name'] ) )
			$update['name'] = addslashes( $input['name'] );


		$data     = wp_update_term( $taxonomy->term_id, $taxonomy_type, $update );
		$taxonomy = get_term_by( 'id', $data['term_id'], $taxonomy_type );

		$return   = $this->get_taxonomy( $taxonomy->slug, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );
		return $return;
	}

	// /sites/%s/tags|categories/%s/delete -> $blog_id, $taxonomy_id
	function delete_taxonomy( $path, $blog_id, $object_id, $taxonomy_type ) {
		$taxonomy = get_term_by( 'slug', $object_id, $taxonomy_type );
		$tax      = get_taxonomy( $taxonomy_type );
		if ( !current_user_can( $tax->cap->delete_terms ) )
			return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );

		if ( !$taxonomy || is_wp_error( $taxonomy ) ) {
			return new WP_Error( 'unknown_taxonomy', 'Unknown taxonomy', 404 );
		}

		if ( false === term_exists( $object_id, $taxonomy_type ) ) {
			return new WP_Error( 'unknown_taxonomy', 'That taxonomy does not exist', 404 );
		}

		$args  = $this->query_args();
		$return = $this->get_taxonomy( $taxonomy->slug, $taxonomy_type, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'taxonomies' );

		wp_delete_term( $taxonomy->term_id, $taxonomy_type );

		return array(
			'slug'    => (string) $taxonomy->slug,
			'success' => 'true',
		);
	}
}

abstract class WPCOM_JSON_API_Comment_Endpoint extends WPCOM_JSON_API_Endpoint {
	var $comment_object_format = array(
		// explicitly document and cast all output
		'ID'        => '(int) The comment ID.',
		'post'      => "(object>post_reference) A reference to the comment's post.",
		'author'    => '(object>author) The author of the comment.',
		'date'      => "(ISO 8601 datetime) The comment's creation time.",
		'URL'       => '(URL) The full permalink URL to the comment.',
		'short_URL' => '(URL) The wp.me short URL.',
		'content'   => '(HTML) <code>context</code> dependent.',
		'status'    => array(
			'approved'   => 'The comment has been approved.',
			'unapproved' => 'The comment has been held for review in the moderation queue.',
			'spam'       => 'The comment has been marked as spam.',
			'trash'      => 'The comment is in the trash.',
		),
		'parent' => "(object>comment_reference|false) A reference to the comment's parent, if it has one.",
		'type'   => array(
			'comment'   => 'The comment is a regular comment.',
			'trackback' => 'The comment is a trackback.',
			'pingback'  => 'The comment is a pingback.',
		),
		'meta' => '(object) Meta data',
	);

	// var $response_format =& $this->comment_object_format;

	function __construct( $args ) {
		if ( !$this->response_format ) {
			$this->response_format =& $this->comment_object_format;
		}
		parent::__construct( $args );
	}

	function get_comment( $comment_id, $context ) {
		global $blog_id;

		$comment = get_comment( $comment_id );
		if ( !$comment || is_wp_error( $comment ) ) {
			return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
		}

		$types = array( '', 'comment', 'pingback', 'trackback' );
		if ( !in_array( $comment->comment_type, $types ) ) {
			return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
		}

		$post = get_post( $comment->comment_post_ID );
		if ( !$post || is_wp_error( $post ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		$status = wp_get_comment_status( $comment->comment_ID );

		// Permissions
		switch ( $context ) {
		case 'edit' :
			if ( !current_user_can( 'edit_comment', $comment->comment_ID ) ) {
				return new WP_Error( 'unauthorized', 'User cannot edit comment', 403 );
			}

			$GLOBALS['post'] = $post;
			$comment         = get_comment_to_edit( $comment->comment_ID );
			break;
		case 'display' :
			if ( 'approved' !== $status ) {
				$current_user_id = get_current_user_id();
				$user_can_read_coment = false;
				if ( $current_user_id && $comment->user_id && $current_user_id == $comment->user_id ) {
					$user_can_read_coment = true;
				} elseif (
					$comment->comment_author_email && $comment->comment_author
				&&
					isset( $this->api->token_details['user'] )
				&&
					$this->api->token_details['user']['user_email'] === $comment->comment_author_email
				&&
					$this->api->token_details['user']['display_name'] === $comment->comment_author
				) {
					$user_can_read_coment = true;
				} else {
					$user_can_read_coment = current_user_can( 'edit_comment', $comment->comment_ID );
				}

				if ( !$user_can_read_coment ) {
					return new WP_Error( 'unauthorized', 'User cannot read unapproved comment', 403 );
				}
			}

			$GLOBALS['post'] = $post;
			setup_postdata( $post );
			break;
		default :
			return new WP_Error( 'invalid_context', 'Invalid API CONTEXT', 400 );
		}

		$can_view = $this->user_can_view_post( $post->ID );
		if ( !$can_view || is_wp_error( $can_view ) ) {
			return $can_view;
		}

		$GLOBALS['comment'] = $comment;
		$response           = array();

		foreach ( array_keys( $this->comment_object_format ) as $key ) {
			switch ( $key ) {
			case 'ID' :
				// explicitly cast all output
				$response[$key] = (int) $comment->comment_ID;
				break;
			case 'post' :
				$response[$key] = (object) array(
					'ID'   => (int) $post->ID,
					'type' => (string) $post->post_type,
					'link' => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $post->ID ),
				);
				break;
			case 'author' :
				$response[$key] = (object) $this->get_author( $comment, 'edit' === $context && current_user_can( 'edit_comment', $comment->comment_ID ) );
				break;
			case 'date' :
				$response[$key] = (string) $this->format_date( $comment->comment_date_gmt, $comment->comment_date );
				break;
			case 'URL' :
				$response[$key] = (string) esc_url_raw( get_comment_link( $comment->comment_ID ) );
				break;
			case 'short_URL' :
				// @todo - pagination
				$response[$key] = (string) esc_url_raw( wp_get_shortlink( $post->ID ) . "%23comment-{$comment->comment_ID}" );
				break;
			case 'content' :
				if ( 'display' === $context ) {
					ob_start();
					comment_text();
					$response[$key] = (string) ob_get_clean();
				} else {
					$response[$key] = (string) $comment->comment_content;
				}
				break;
			case 'status' :
				$response[$key] = (string) $status;
				break;
			case 'parent' : // (object|false)
				if ( $comment->comment_parent ) {
					$parent = get_comment( $comment->comment_parent );
					$response[$key] = (object) array(
						'ID'   => (int) $parent->comment_ID,
						'type' => (string) ( $parent->comment_type ? $parent->comment_type : 'comment' ),
						'link' => (string) $this->get_comment_link( $blog_id, $parent->comment_ID ),
					);
				} else {
					$response[$key] = false;
				}
				break;
			case 'type' :
				$response[$key] = (string) ( $comment->comment_type ? $comment->comment_type : 'comment' );
				break;
			case 'meta' :
				$response[$key] = (object) array(
					'links' => (object) array(
						'self'    => (string) $this->get_comment_link( $this->api->get_blog_id_for_output(), $comment->comment_ID ),
						'help'    => (string) $this->get_comment_link( $this->api->get_blog_id_for_output(), $comment->comment_ID, 'help' ),
						'site'    => (string) $this->get_site_link( $this->api->get_blog_id_for_output() ),
						'post'    => (string) $this->get_post_link( $this->api->get_blog_id_for_output(), $comment->comment_post_ID ),
						'replies' => (string) $this->get_comment_link( $this->api->get_blog_id_for_output(), $comment->comment_ID, 'replies/' ),
//						'author'  => (string) $this->get_user_link( $comment->user_id ),
//						'via'     => (string) $this->get_post_link( $ping_origin_blog_id, $ping_origin_post_id ), // Ping/trackbacks
					),
				);
				break;
			}
		}

		unset( $GLOBALS['comment'], $GLOBALS['post'] );
		return $response;
	}
}

class WPCOM_JSON_API_Get_Comment_Endpoint extends WPCOM_JSON_API_Comment_Endpoint {
	// /sites/%s/comments/%d -> $blog_id, $comment_id
	function callback( $path = '', $blog_id = 0, $comment_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		$return = $this->get_comment( $comment_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );

		return $return;
	}
}

// @todo permissions
class WPCOM_JSON_API_List_Comments_Endpoint extends WPCOM_JSON_API_Comment_Endpoint {
	var $date_range = array();

	var $response_format = array(
		'found'    => '(int) The total number of comments found that match the request (ignoring limits, offsets, and pagination).',
		'comments' => '(array:comment) An array of comment objects.',
	);

	function __construct( $args ) {
		parent::__construct( $args );
		$this->query = array_merge( $this->query, array(
			'number'   => '(int=20) The number of comments to return.  Limit: 100.',
			'offset'   => '(int=0) 0-indexed offset.',
			'page'     => '(int) Return the Nth 1-indexed page of comments.  Takes precedence over the <code>offset</code> parameter.',
			'order'    => array(
				'DESC' => 'Return comments in descending order from newest to oldest.',
				'ASC'  => 'Return comments in ascending order from oldest to newest.',
			),
			'after'    => '(ISO 8601 datetime) Return comments dated on or after the specified datetime.',
			'before'   => '(ISO 8601 datetime) Return comments dated on or before the specified datetime.',
			'type'     => array(
				'any'       => 'Return all comments regardless of type.',
				'comment'   => 'Return only regular comments.',
				'trackback' => 'Return only trackbacks.',
				'pingback'  => 'Return only pingbacks.',
				'pings'     => 'Return both trackbacks and pingbacks.',
			),
			'status'   => array(
				'approved'   => 'Return only approved comments.',
				'unapproved' => 'Return only comments in the moderation queue.',
				'spam'       => 'Return only comments marked as spam.',
				'trash'      => 'Return only comments in the trash.',
			),
		) );
	}

	// /sites/%s/comments/            -> $blog_id
	// /sites/%s/posts/%d/replies/    -> $blog_id, $post_id
	// /sites/%s/comments/%d/replies/ -> $blog_id, $comment_id
	function callback( $path = '', $blog_id = 0, $object_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		if ( $args['number'] < 1 ) {
			$args['number'] = 20;
		} elseif ( 100 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 100.', 400 );
		}

		if ( false !== strpos( $path, '/posts/' ) ) {
			// We're looking for comments of a particular post
			$post_id = $object_id;
			$comment_id = 0;
		} else {
			// We're looking for comments for the whole blog, or replies to a single comment
			$comment_id = $object_id;
			$post_id = 0;
		}

		// We can't efficiently get the number of replies to a single comment
		$count = false;
		$found = -1;

		if ( !$comment_id ) {
			// We can get comment counts for the whole site or for a single post, but only for certain queries
			if ( 'any' === $args['type'] && !isset( $args['after'] ) && !isset( $args['before'] ) ) {
				$count = wp_count_comments( $post_id );
			}
		}

		switch ( $args['status'] ) {
		case 'approved' :
			$status = 'approve';
			if ( $count ) {
				$found = $count->approved;
			}
			break;
		default :
			if ( !current_user_can( 'moderate_comments' ) ) {
				return new WP_Error( 'unauthorized', 'User cannot read non-approved comments', 403 );
			}
			if ( 'unapproved' === $args['status'] ) {
				$status = 'hold';
				$count_status = 'moderated';
			} else {
				$status = $count_status = $args['status'];
			}
			if ( $count ) {
				$found = $count->$count_status;
			}
		}

		$query = array(
			'number' => $args['number'],
			'order'  => $args['order'],
			'type'   => 'any' === $args['type'] ? false : $args['type'],
			'status' => $status,
		);

		if ( $post_id ) {
			$post = get_post( $post_id );
			if ( !$post || is_wp_error( $post ) ) {
				return new WP_Error( 'unknown_post', 'Unknown post', 404 );
			}
			$query['post_id'] = $post->ID;
			if ( $this->api->ends_with( $this->path, '/replies' ) ) {
				$query['parent'] = 0;
			}
		} elseif ( $comment_id ) {
			$comment = get_comment( $comment_id );
			if ( !$comment || is_wp_error( $comment ) ) {
				return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
			}
			$query['parent'] = $comment_id;
		}

		if ( isset( $args['page'] ) ) {
			if ( $args['page'] < 1 ) {
				$args['page'] = 1;
			}

			$query['offset'] = ( $args['page'] - 1 ) * $args['number'];
		} else {
			if ( $args['offset'] < 0 ) {
				$args['offset'] = 0;
			}

			$query['offset'] = $args['offset'];
		}

		if ( isset( $args['before_gmt'] ) ) {
			$this->date_range['before_gmt'] = $args['before_gmt'];
		}
		if ( isset( $args['after_gmt'] ) ) {
			$this->date_range['after_gmt'] = $args['after_gmt'];
		}

		if ( $this->date_range ) {
			add_filter( 'comments_clauses', array( $this, 'handle_date_range' ) );
		}
		$comments = get_comments( $query );
		if ( $this->date_range ) {
			remove_filter( 'comments_clauses', array( $this, 'handle_date_range' ) );
			$this->date_range = array();
		}

		$return = array();

		foreach ( array_keys( $this->response_format ) as $key ) {
			switch ( $key ) {
			case 'found' :
				$return[$key] = (int) $found;
				break;
			case 'comments' :
				$return_comments = array();
				foreach ( $comments as $comment ) {
					$the_comment = $this->get_comment( $comment->comment_ID, $args['context'] );
					if ( $the_comment && !is_wp_error( $the_comment ) ) {
						$return_comments[] = $the_comment;
					}
				}

				if ( $return_comments ) {
					do_action( 'wpcom_json_api_objects', 'comments', count( $return_comments ) );
				}

				$return[$key] = $return_comments;
				break;
			}
		}

		return $return;
	}

	function handle_date_range( $clauses ) {
		global $wpdb;

		switch ( count( $this->date_range ) ) {
		case 2 :
			$clauses['where'] .= $wpdb->prepare(
				" AND `$wpdb->comments`.comment_date_gmt BETWEEN CAST( %s AS DATETIME ) AND CAST( %s AS DATETIME ) ",
				$this->date_range['after_gmt'],
				$this->date_range['before_gmt']
			);
			break;
		case 1 :
			if ( isset( $this->date_range['before_gmt'] ) ) {
				$clauses['where'] .= $wpdb->prepare(
					" AND `$wpdb->comments`.comment_date_gmt <= CAST( %s AS DATETIME ) ",
					$this->date_range['before_gmt']
				);
			} else {
				$clauses['where'] .= $wpdb->prepare(
					" AND `$wpdb->comments`.comment_date_gmt >= CAST( %s AS DATETIME ) ",
					$this->date_range['after_gmt']
				);
			}
			break;
		}

		return $clauses;
	}
}

class WPCOM_JSON_API_Update_Comment_Endpoint extends WPCOM_JSON_API_Comment_Endpoint {
	function __construct( $args ) {
		parent::__construct( $args );
		if ( $this->api->ends_with( $this->path, '/delete' ) ) {
			$this->comment_object_format['status']['deleted'] = 'The comment has been deleted permanently.';
		}
	}

	// /sites/%s/posts/%d/replies/new    -> $blog_id, $post_id
	// /sites/%s/comments/%d/replies/new -> $blog_id, $comment_id
	// /sites/%s/comments/%d             -> $blog_id, $comment_id
	// /sites/%s/comments/%d/delete      -> $blog_id, $comment_id
	function callback( $path = '', $blog_id = 0, $object_id = 0 ) {
		if ( $this->api->ends_with( $path, '/new' ) )
			$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );
		else
			$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_comment( $path, $blog_id, $object_id );
		} elseif ( $this->api->ends_with( $path, '/new' ) ) {
			if ( false !== strpos( $path, '/posts/' ) ) {
				return $this->new_comment( $path, $blog_id, $object_id, 0 );
			} else {
				return $this->new_comment( $path, $blog_id, 0, $object_id );
			}
		}

		return $this->update_comment( $path, $blog_id, $object_id );
	}

	// /sites/%s/posts/%d/replies/new    -> $blog_id, $post_id
	// /sites/%s/comments/%d/replies/new -> $blog_id, $comment_id
	function new_comment( $path, $blog_id, $post_id, $comment_parent_id ) {
		if ( !$post_id ) {
			$comment_parent = get_comment( $comment_parent_id );
			if ( !$comment_parent_id || !$comment_parent || is_wp_error( $comment_parent ) ) {
				return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
			}

			$post_id = $comment_parent->comment_post_ID;
		}

		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		if ( -1 == get_option( 'blog_public' ) && ! is_user_member_of_blog() && ! is_super_admin() ) {
			return new WP_Error( 'unauthorized', 'User cannot create comments', 403 );
		}

		if ( !comments_open( $post->ID ) ) {
			return new WP_Error( 'unauthorized', 'Comments on this post are closed', 403 );
		}

		$can_view = $this->user_can_view_post( $post->ID );
		if ( !$can_view || is_wp_error( $can_view ) ) {
			return $can_view;
		}

		$post_status = get_post_status_object( $post->post_status );
		if ( !$post_status->public && !$post_status->private ) {
			return new WP_Error( 'unauthorized', 'Comments on drafts are not allowed', 403 );
		}

		$args  = $this->query_args();
		$input = $this->input();
		if ( !is_array( $input ) || !$input || !strlen( $input['content'] ) ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$user = wp_get_current_user();
		if ( !$user || is_wp_error( $user ) || !$user->ID ) {
			$auth_required = false;
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				$auth_required = true;
			} elseif ( isset( $this->api->token_details['user'] ) ) {
				$user = (object) $this->api->token_details['user'];
				foreach ( array( 'display_name', 'user_email', 'user_url' ) as $user_datum ) {
					if ( !isset( $user->$user_datum ) ) {
						$auth_required = true;
					}
				}
				if ( !isset( $user->ID ) ) {
					$user->ID = 0;
				}
			} else {
				$auth_required = true;
			}

			if ( $auth_required ) {
				return new WP_Error( 'authorization_required', 'An active access token must be used to comment.', 403 );
			}
		}

		$insert = array(
			'comment_post_ID'      => $post->ID,
			'user_ID'              => $user->ID,
			'comment_author'       => $user->display_name,
			'comment_author_email' => $user->user_email,
			'comment_author_url'   => $user->user_url,
			'comment_content'      => $input['content'],
			'comment_parent'       => $comment_parent_id,
			'comment_type'         => '',
		);

		$this->api->trap_wp_die( 'comment_failure' );
		$comment_id = wp_new_comment( add_magic_quotes( $insert ) );
		$this->api->trap_wp_die( null );

		$return = $this->get_comment( $comment_id, $args['context'] );
		if ( !$return ) {
			return new WP_Error( 400, __( 'Comment cache problem?', 'jetpack' ) );
		}
		if ( is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );
		return $return;
	}

	// /sites/%s/comments/%d -> $blog_id, $comment_id
	function update_comment( $path, $blog_id, $comment_id ) {
		$comment = get_comment( $comment_id );
		if ( !$comment || is_wp_error( $comment ) ) {
			return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
		}

		if ( !current_user_can( 'edit_comment', $comment->comment_ID ) ) {
			return new WP_Error( 'unauthorized', 'User cannot edit comment', 403 );
		}

		$args  = $this->query_args();
		$input = $this->input( false );
		if ( !is_array( $input ) || !$input ) {
			return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
		}

		$update = array();
		foreach ( $input as $key => $value ) {
			$update["comment_$key"] = $value;
		}

		$comment_status = wp_get_comment_status( $comment->comment_ID );
		if ( $comment_status !== $update['status'] && !current_user_can( 'moderate_comments' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot moderate comments', 403 );
		}

		if ( isset( $update['comment_status'] ) ) {
			if ( count( $update ) === 1 ) {
				// We are only here to update the comment status so let's respond ASAP
				add_action( 'wp_set_comment_status', array( $this, 'output_comment' ), 0, 1 );
			}
			switch ( $update['comment_status'] ) {
				case 'approved' :
					if ( 'approve' !== $comment_status ) {
						wp_set_comment_status( $comment->comment_ID, 'approve' );
					}
					break;
				case 'unapproved' :
					if ( 'hold' !== $comment_status ) {
						wp_set_comment_status( $comment->comment_ID, 'hold' );
					}
					break;
				case 'spam' :
					if ( 'spam' !== $comment_status ) {
						wp_spam_comment( $comment->comment_ID );
					}
					break;
				case 'unspam' :
					if ( 'spam' === $comment_status ) {
						wp_unspam_comment( $comment->comment_ID );
					}
					break;
				case 'trash' :
					if ( ! EMPTY_TRASH_DAYS ) {
						return new WP_Error( 'trash_disabled', 'Cannot trash comment', 403 );
					}

					if ( 'trash' !== $comment_status ) {
 						wp_trash_comment( $comment_id );
 					}
 					break;
				case 'untrash' :
					if ( 'trash' === $comment_status ) {
						wp_untrash_comment( $comment->comment_ID );
					}
					break;
				default:
					$update['comment_approved'] = 1;
					break;
			}
			unset( $update['comment_status'] );
		}

		if ( ! empty( $update ) ) {
			$update['comment_ID'] = $comment->comment_ID;
			wp_update_comment( add_magic_quotes( $update ) );
		}

		$return = $this->get_comment( $comment->comment_ID, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );
		return $return;
	}

	// /sites/%s/comments/%d/delete -> $blog_id, $comment_id
	function delete_comment( $path, $blog_id, $comment_id ) {
		$comment = get_comment( $comment_id );
		if ( !$comment || is_wp_error( $comment ) ) {
			return new WP_Error( 'unknown_comment', 'Unknown comment', 404 );
		}

		if ( !current_user_can( 'edit_comment', $comment->comment_ID ) ) { // [sic] There is no delete_comment cap
			return new WP_Error( 'unauthorized', 'User cannot delete comment', 403 );
		}

		$args  = $this->query_args();
		$return = $this->get_comment( $comment->comment_ID, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );

		wp_delete_comment( $comment->comment_ID );
		$status = wp_get_comment_status( $comment->comment_ID );
		if ( false === $status ) {
			$return['status'] = 'deleted';
			return $return;
		}

		return $this->get_comment( $comment->comment_ID, $args['context'] );
	}

	function output_comment( $comment_id ) {
		$args  = $this->query_args();
		$output = $this->get_comment( $comment_id, $args['context'] );
		$this->api->output_early( 200, $output );
	}
}

class WPCOM_JSON_API_GET_Site_Endpoint extends WPCOM_JSON_API_Endpoint {

	public static $site_format = array(
 		'ID'                => '(int) Site ID',
 		'name'              => '(string) Title of site',
 		'description'       => '(string) Tagline or description of site',
 		'URL'               => '(string) Full URL to the site',
 		'jetpack'           => '(bool)  Whether the site is a Jetpack site or not',
 		'post_count'        => '(int) The number of posts the site has',
        'subscribers_count' => '(int) The number of subscribers the site has',
		'lang'              => '(string) Primary language code of the site',
		'visible'           => '(bool) If this site is visible in the user\'s site list',
		'is_private'        => '(bool) If the site is a private site or not',
		'is_following'      => '(bool) If the current user is subscribed to this site in the reader',
		'meta'              => '(object) Meta data',
	);

	// /sites/mine
	// /sites/%s -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		global $wpdb;
		if ( 'mine' === $blog_id ) {
			$api = WPCOM_JSON_API::init();
			if ( !$api->token_details || empty( $api->token_details['blog_id'] ) ) {
				return new WP_Error( 'authorization_required', 'An active access token must be used to query information about the current blog.', 403 );
			}
			$blog_id = $api->token_details['blog_id'];
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = $this->build_current_site_response();

		do_action( 'wpcom_json_api_objects', 'sites' );

		return $response;
	}

	/**
	 * Collects the necessary information to return for a site's response.
	 *
	 * @return (array)
	 */
	public function build_current_site_response( ) {

		global $wpdb;

		$response_format = self::$site_format;

		$is_user_logged_in = is_user_logged_in();

		$visible = array();

		if ( $is_user_logged_in ) {
			$current_user = wp_get_current_user();
			$visible = get_user_meta( $current_user->ID, 'blog_visibility', true );

			if ( !is_array( $visible ) )
				$visible = array();

		}

		$blog_id = (int) $this->api->get_blog_id_for_output();

		foreach ( array_keys( $response_format ) as $key ) {
			switch ( $key ) {
			case 'ID' :
				$response[$key] = $blog_id;
				break;
			case 'name' :
				$response[$key] = (string) get_bloginfo( 'name' );
				break;
			case 'description' :
				$response[$key] = (string) get_bloginfo( 'description' );
				break;
			case 'URL' :
				$response[$key] = (string) home_url();
				break;
			case 'jetpack' :
				$response[$key] = false; // magic
				break;
			case 'is_private' :
				if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
					$public_setting = get_option( 'blog_public' );
					if ( -1 == $public_setting )
						$response[$key] = true;
					else
						$response[$key] = false;
				} else {
					$response[$key] = false; // magic
				}
				break;
			case 'visible' :
				if ( $is_user_logged_in ){
					$is_visible = true;
					if ( isset( $visible[$blog_id] ) ) {
						$is_visible = $visible[$blog_id];
					}
					// null and true are visible
					$response[$key] = $is_visible;
				}
				break;
			case 'post_count' :
				if ( $is_user_logged_in )
					$response[$key] = (int) $wpdb->get_var("SELECT COUNT(*) FROM $wpdb->posts WHERE post_status = 'publish'");
				break;
			case 'lang' :
				if ( $is_user_logged_in )
					$response[$key] = (string) get_bloginfo( 'language' );
				break;
            case 'subscribers_count' :
				if ( function_exists( 'wpcom_subs_total_wpcom_subscribers' ) ) {
					$total_wpcom_subs = wpcom_subs_total_wpcom_subscribers(
						array(
							'blog_id' => $blog_id,
						)
					);
					$response[$key] = $total_wpcom_subs;
				} else {
					$response[$key] = 0; // magic
				}
                break;
			case 'is_following':
				$response[$key] = (int) $this->api->is_following( $blog_id );
				break;
			case 'meta' :
				$response[$key] = (object) array(
					'links' => (object) array(
						'self'     => (string) $this->get_site_link( $blog_id ),
						'help'     => (string) $this->get_site_link( $blog_id, 'help'      ),
						'posts'    => (string) $this->get_site_link( $blog_id, 'posts/'    ),
						'comments' => (string) $this->get_site_link( $blog_id, 'comments/' ),
					),
				);
				break;
			}
		}

		return $response;

	}

}

/*
 * Set up endpoints
 */



/*
 * Site endpoints
 */
new WPCOM_JSON_API_GET_Site_Endpoint( array(
	'description' => 'Information about a site ID/domain',
	'group'	      => 'sites',
	'stat'        => 'sites:X',

	'method'      => 'GET',
	'path'        => '/sites/%s',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => WPCOM_JSON_API_GET_Site_Endpoint::$site_format,

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/?pretty=1',
) );

/*
 * Post endpoints
 */
new WPCOM_JSON_API_List_Posts_Endpoint( array(
	'description' => 'Return matching Posts',
	'group'       => 'posts',
	'stat'        => 'posts',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'query_parameters' => array(
		'number'   => '(int=20) The number of posts to return.  Limit: 100.',
		'offset'   => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of posts.  Takes precedence over the <code>offset</code> parameter.',
		'order'    => array(
			'DESC' => 'Return posts in descending order.  For dates, that means newest to oldest.',
			'ASC'  => 'Return posts in ascending order.  For dates, that means oldest to newest.',
		),
		'order_by' => array(
			'date'          => 'Order by the created time of each post.',
			'modified'      => 'Order by the modified time of each post.',
			'title'         => "Order lexicographically by the posts' titles.",
			'comment_count' => 'Order by the number of comments for each post.',
			'ID'            => 'Order by post ID.',
		),
		'after'    => '(ISO 8601 datetime) Return posts dated on or after the specified datetime.',
		'before'   => '(ISO 8601 datetime) Return posts dated on or before the specified datetime.',
		'tag'      => '(string) Specify the tag name or slug.',
		'category' => '(string) Specify the category name or slug.',
		'type'     => "(string) Specify the post type. Defaults to 'post', use 'any' to query for both posts and pages. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'status'   => array(
			'publish' => 'Return only published posts.',
			'private' => 'Return only private posts.',
			'draft'   => 'Return only draft posts.',
			'pending' => 'Return only posts pending editorial approval.',
			'future'  => 'Return only posts scheduled for future publishing.',
			'trash'   => 'Return only posts in the trash.',
			'any'     => 'Return all posts regardless of status.',
		),
		'sticky'   => '(bool) Specify the stickiness.',
		'author'   => "(int) Author's user ID",
		'search'   => '(string) Search query',
		'meta_key'   => '(string) Metadata key that the post should contain',
		'meta_value'   => '(string) Metadata value that the post should contain. Will only be applied if a `meta_key` is also given',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/?number=5&pretty=1'
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Return a single Post (by ID)',
	'group'       => 'posts',
	'stat'        => 'posts:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/7/?pretty=1'
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Return a single Post (by name)',
	'group'       => '__do_not_document',
	'stat'        => 'posts:name',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/name:%s',
	'path_labels' => array(
		'$site'      => '(int|string) The site ID, The site domain',
		'$post_name' => '(string) The post name (a.k.a. slug)',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/name:blogging-and-stuff?pretty=1',
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Return a single Post (by slug)',
	'group'       => 'posts',
	'stat'        => 'posts:slug',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/slug:%s',
	'path_labels' => array(
		'$site'      => '(int|string) The site ID, The site domain',
		'$post_slug' => '(string) The post slug (a.k.a. sanitized name)',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/slug:blogging-and-stuff?pretty=1',
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Create a Post',
	'group'       => 'posts',
	'stat'        => 'posts:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'request_format' => array(
		// explicitly document all input
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'pending' => 'Mark the post as pending editorial approval.',
		),
		'password'  => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'    => "(int) The post ID of the new post's parent.",
		'type'      => "(string) The post type. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'categories' => "(array|string) Comma separated list or array of categories (name or id)",
		'tags'       => "(array|string) Comma separated list or array of tags (name or id)",
		'format'     => get_post_format_strings(),
		'media'      => "(media) An array of images to attach to the post. To upload media, the entire request should be multipart/form-data encoded.  Multiple media items will be displayed in a gallery.  Accepts images (image/gif, image/jpeg, image/png) only.<br /><br /><strong>Example</strong>:<br />" .
				"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are avaiable for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
		'comments_open' => "(bool) Should the post be open to comments?  Defaults to the blog's preference.",
		'pings_open'    => "(bool) Should the post be open to comments?  Defaults to the blog's preference.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/new/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World',
			'content'    => 'Hello. I am a test post. I was created by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	),

	'example_response'     => '
{
	"ID": 1270,
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T19:42:44+00:00",
	"modified": "2012-04-11T19:42:44+00:00",
	"title": "Hello World",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-3\/",
	"short_URL": "http:\/\/wp.me\/p23HjV-ku",
	"content": "<p>Hello. I am a test post. I was created by the API<\/p>\n",
	"excerpt": "<p>Hello. I am a test post. I was created by the API<\/p>\n",
	"status": "publish",
	"password": "",
	"parent": false,
	"type": "post",
	"comments_open": true,
	"pings_open": true,
	"comment_count": 0,
	"like_count": 0,
	"i_like": false,
	"is_reblogged": false,
	"is_following": false,
	"featured_image": "",
	"format": "standard",
	"geo": false,
	"publicize_URLs": [

	],
	"tags": {
		"tests": {
			"name": "tests",
			"slug": "tests",
			"description": "",
			"post_count": 1,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"categories": {
		"API": {
			"name": "API",
			"slug": "api",
			"description": "",
			"post_count": 1,
			"parent": 0,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"metadata {
		{
			"id" : 123,
			"key" : "test_meta_key",
			"value" : "test_value",
		}
	},
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270\/replies\/",
			"likes": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270\/likes\/"
		}
	}
}'
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Edit a Post',
	'group'       => 'posts',
	'stat'        => 'posts:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'request_format' => array(
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'pending' => 'Mark the post as pending editorial approval.',
		),
		'password'   => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'     => "(int) The post ID of the new post's parent.",
		'categories' => "(string) Comma separated list of categories (name or id)",
		'tags'       => "(string) Comma separated list of tags (name or id)",
		'format'     => get_post_format_strings(),
		'comments_open' => '(bool) Should the post be open to comments?',
		'pings_open'    => '(bool) Should the post be open to comments?',
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/1222/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World (Again)',
			'content'    => 'Hello. I am an edited post. I was edited by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	),

	'example_response'     => '
{
	"ID": 1222,
	"author": {
		"ID": 422,
		"email": false,
		"name": "Justin Shreve",
		"URL": "http:\/\/justin.wordpress.com",
		"avatar_URL": "http:\/\/1.gravatar.com\/avatar\/9ea5b460afb2859968095ad3afe4804b?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/justin"
	},
	"date": "2012-04-11T15:53:52+00:00",
	"modified": "2012-04-11T19:44:35+00:00",
	"title": "Hello World (Again)",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-2\/",
	"short_URL": "http:\/\/wp.me\/p23HjV-jI",
	"content": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"excerpt": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"status": "publish",
	"password": "",
	"parent": false,
	"type": "post",
	"comments_open": true,
	"pings_open": true,
	"comment_count": 5,
	"like_count": 0,
	"i_like": false,
	"is_reblogged": false,
	"is_following": false,
	"featured_image": "",
	"format": "standard",
	"geo": false,
	"publicize_URLs": [

	],
	"tags": {
		"tests": {
			"name": "tests",
			"slug": "tests",
			"description": "",
			"post_count": 2,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"categories": {
		"API": {
			"name": "API",
			"slug": "api",
			"description": "",
			"post_count": 2,
			"parent": 0,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"metadata {
		{
			"id" : 123,
			"key" : "test_meta_key",
			"value" : "test_value",
		}
	},
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/replies\/",
			"likes": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/likes\/"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Delete a Post. Note: If the post object is of type post or page and the trash is enabled, this request will send the post to the trash. A second request will permanently delete the post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/delete',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/1222/delete/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	),

	'example_response'     => '
{
	"ID": 1222,
	"author": {
		"ID": 422,
		"email": false,
		"name": "Justin Shreve",
		"URL": "http:\/\/justin.wordpress.com",
		"avatar_URL": "http:\/\/1.gravatar.com\/avatar\/9ea5b460afb2859968095ad3afe4804b?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/justin"
	},
	"date": "2012-04-11T15:53:52+00:00",
	"modified": "2012-04-11T19:49:42+00:00",
	"title": "Hello World (Again)",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-2\/",
	"short_URL": "http:\/\/wp.me\/p23HjV-jI",
	"content": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"excerpt": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"status": "trash",
	"password": "",
	"parent": false,
	"type": "post",
	"comments_open": true,
	"pings_open": true,
	"comment_count": 5,
	"like_count": 0,
	"i_like": false,
	"is_reblogged": false,
	"is_following": false,
	"featured_image": "",
	"format": "standard",
	"geo": false,
	"publicize_URLs": [

	],
	"tags": {
		"tests": {
			"name": "tests",
			"slug": "tests",
			"description": "",
			"post_count": 1,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"metadata {
		{
			"id" : 123,
			"key" : "test_meta_key",
			"value" : "test_value",
		}
	},
	"categories": {
		"API": {
			"name": "API",
			"slug": "api",
			"description": "",
			"post_count": 1,
			"parent": 0,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/replies\/",
			"likes": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/likes\/"
		}
	}
}'

) );

/*
 * Comment endpoints
 */
new WPCOM_JSON_API_List_Comments_Endpoint( array(
	'description' => 'Return recent Comments',
	'group'       => 'comments',
	'stat'        => 'comments',

	'method'      => 'GET',
	'path'        => '/sites/%s/comments/',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comments/?number=5&pretty=1'
) );

new WPCOM_JSON_API_List_Comments_Endpoint( array(
	'description' => 'Return recent Comments for a Post',
	'group'       => 'comments',
	'stat'        => 'posts:1:replies',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d/replies/',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/7/replies/?number=5&pretty=1'
) );

new WPCOM_JSON_API_Get_Comment_Endpoint( array(
	'description' => 'Return a single Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/comments/%d',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comments/11/?pretty=1'
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Create a Comment on a Post',
	'group'       => 'comments',
	'stat'        => 'posts:1:replies:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/replies/new',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID'
	),

	'request_format' => array(
		// explicitly document all input
		'content'   => '(HTML) The comment text.',
//		@todo Should we open this up to unauthenticated requests too?
//		'author'    => '(author object) The author of the comment.',
	),

	'pass_wpcom_user_details' => true,
	'can_use_user_details_instead_of_blog_membership' => true,

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/1222/replies/new/',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'Your reply is very interesting. This is a reply.'
		)
	),

	'example_response'     => '
{
	"ID": 9,
	"post": {
		"ID": 1222,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T18:09:41+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-2\/#comment-9",
	"short_URL": "http:\/\/wp.me\/p23HjV-jI%23comment-9",
	"content": "<p>Your reply is very interesting. This is a reply.<\/p>\n",
	"status": "approved",
	"parent": {
		"ID":8,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/8"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/9",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/9\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/9\/replies\/"
		}
	}
}',
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Create a Comment as a reply to another Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1:replies:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d/replies/new',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'request_format' => array(
		'content'   => '(HTML) The comment text.',
//		@todo Should we open this up to unauthenticated requests too?
//		'author'    => '(author object) The author of the comment.',
	),

	'pass_wpcom_user_details' => true,
	'can_use_user_details_instead_of_blog_membership' => true,

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/comments/8/replies/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'This reply is very interesting. This is editing a comment reply via the API.',
		)
	),
	'example_response'     => '
{
	"ID": 13,
	"post": {
		"ID": 1,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T20:16:28+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2011\/12\/13\/hello-world\/#comment-13",
	"short_URL": "http:\/\/wp.me\/p23HjV-1%23comment-13",
	"content": "<p>This reply is very interesting. This is editing a comment reply via the API.<\/p>\n",
	"status": "approved",
	"parent": {
		"ID": 1,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/1"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/replies\/"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Edit a Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'request_format' => array(
		'date'    => "(ISO 8601 datetime) The comment's creation time.",
		'content' => '(HTML) The comment text.',
		'status'  => array(
			'approved'   => 'Approve the comment.',
			'unapproved' => 'Remove the comment from public view and send it to the moderation queue.',
			'spam'       => 'Mark the comment as spam.',
			'unspam'     => 'Unmark the comment as spam. Will attempt to set it to the previous status.',
			'trash'      => 'Send a comment to the trash if trashing is enabled (see constant: EMPTY_TRASH_DAYS).',
			'untrash'    => 'Untrash a comment. Only works when the comment is in the trash.',
		),
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/comments/8/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'This reply is now edited via the API.',
			'status'  => 'approved',
		)
	),
	'example_response'     => '
{
	"ID": 13,
	"post": {
		"ID": 1,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T20:16:28+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2011\/12\/13\/hello-world\/#comment-13",
	"short_URL": "http:\/\/wp.me\/p23HjV-1%23comment-13",
	"content": "<p>This reply is very interesting. This is editing a comment reply via the API.<\/p>\n",
	"status": "approved",
	"parent": {
		"ID": 1,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/1"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/replies\/"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Delete a Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d/delete',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/comments/8/delete/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	),

	'example_response'     => '
{
	"ID": 13,
	"post": {
		"ID": 1,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T20:16:28+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2011\/12\/13\/hello-world\/#comment-13",
	"short_URL": "http:\/\/wp.me\/p23HjV-1%23comment-13",
	"content": "<p>This reply is very interesting. This is editing a comment reply via the API.<\/p>\n",
	"status": "deleted",
	"parent": {
		"ID": 1,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/1"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/replies\/"
		}
	}
}'

) );

/**
 * Taxonomy Management Endpoints
 */
new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
	'description' => 'Returns information on a single Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/categories/slug:%s',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain',
		'$category' => '(string) The category slug'
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories/slug:community?pretty=1'
) );

new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
	'description' => 'Returns information on a single Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/tags/slug:%s',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
		'$tag'  => '(string) The tag slug'
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/tags/slug:wordpresscom?pretty=1'
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Create a new Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'request_format' => array(
		'name'        => '(string) Name of the category',
		'description' => '(string) A description of the category',
		'parent'      => '(id) ID of the parent category',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/categories/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name' => 'Puppies',
		)
	),
	'example_response'     => '
{
	"name": "Puppies",
	"slug": "puppies",
	"description": "",
	"post_count": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/puppies",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/puppies\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Create a new Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'request_format' => array(
		'name'        => '(string) Name of the tag',
		'description' => '(string) A description of the tag',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/tags/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name' => 'Kitties'
		)
	),
	'example_response'     => '
{
	"name": "Kitties",
	"slug": "kitties",
	"description": "",
	"post_count": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/kitties",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/kitties\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Edit a Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/slug:%s',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
		'$tag'  => '(string) The tag slug',
	),

	'request_format' => array(
		'name'        => '(string) Name of the tag',
		'description' => '(string) A description of the tag',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/tags/slug:testing-tag',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'description' => 'Kitties are awesome!'
		)
	),
	'example_response'     => '
{
	"name": "testing tag",
	"slug": "testing-tag",
	"description": "Kitties are awesome!",
	"post_count": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/testing-tag",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/testing-tag\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Edit a Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/slug:%s',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain',
		'$category' => '(string) The category slug',
	),

	'request_format' => array(
		'name'        => '(string) Name of the category',
		'description' => '(string) A description of the category',
		'parent'      => '(id) ID of the parent category',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/categories/slug:testing-category',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'description' => 'Puppies are great!'
		)
	),
	'example_response'     => '
{
	"name": "testing category",
	"slug": "testing-category",
	"description": "Puppies are great!",
	"post_count": 0,
	"parent": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/testing-category",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/testing-category\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Delete a Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/slug:%s/delete',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain',
		'$category' => '(string) The category slug',
	),
	'response_format' => array(
		'slug'    => '(string) The slug of the deleted category',
		'success' => '(bool) Was the operation successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/categories/slug:some-category-name/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
	"slug": "some-category-name",
	"success": "true"
}'
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Delete a Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/slug:%s/delete',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
		'$tag'  => '(string) The tag slug',
	),
	'response_format' => array(
		'slug'    => '(string) The slug of the deleted tag',
		'success' => '(bool) Was the operation successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/tags/slug:some-tag-name/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
	"slug": "some-tag-name",
	"success": "true"
}'
) );
