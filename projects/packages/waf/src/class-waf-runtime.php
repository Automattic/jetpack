<?php
/**
 * Runtime for Jetpack Waf
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

require_once __DIR__ . '/functions.php';

// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This class is all about sanitizing input.

/**
 * The environment variable that defined the WAF running mode.
 *
 * @var string JETPACK_WAF_MODE
 */

/**
 * Waf_Runtime class
 */
class Waf_Runtime {

	/**
	 * Last rule.
	 *
	 * @var string
	 */
	public $last_rule = '';
	/**
	 * Matched vars.
	 *
	 * @var array
	 */
	public $matched_vars = array();
	/**
	 * Matched var.
	 *
	 * @var string
	 */
	public $matched_var = '';
	/**
	 * Matched var names.
	 *
	 * @var array
	 */
	public $matched_var_names = array();
	/**
	 * Matched var name.
	 *
	 * @var string
	 */
	public $matched_var_name = '';

	/**
	 * State.
	 *
	 * @var array
	 */
	private $state = array();
	/**
	 * Metadata.
	 *
	 * @var array
	 */
	private $metadata = array();

	/**
	 * Transforms.
	 *
	 * @var Waf_Transforms[]
	 */
	private $transforms;
	/**
	 * Operators.
	 *
	 * @var Waf_Operators[]
	 */
	private $operators;

	/**
	 * Rules to remove.
	 *
	 * @var array[]
	 */
	private $rules_to_remove = array(
		'id'  => array(),
		'tag' => array(),
	);

	/**
	 * Targets to remove.
	 *
	 * @var array[]
	 */
	private $targets_to_remove = array(
		'id'  => array(),
		'tag' => array(),
	);

	/**
	 * Constructor method.
	 *
	 * @param Waf_Transforms $transforms Transforms.
	 * @param Waf_Operators  $operators Operators.
	 */
	public function __construct( $transforms, $operators ) {
		$this->transforms = $transforms;
		$this->operators  = $operators;
	}

	/**
	 * Rule removed method.
	 *
	 * @param string   $id Ids.
	 * @param string[] $tags Tags.
	 */
	public function rule_removed( $id, $tags ) {
		if ( isset( $this->rules_to_remove['id'][ $id ] ) ) {
			return true;
		}
		foreach ( $tags as $tag ) {
			if ( isset( $this->rules_to_remove['tag'][ $tag ] ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Update Targets.
	 *
	 * @param array    $targets Targets.
	 * @param string   $rule_id Rule id.
	 * @param string[] $rule_tags Rule tags.
	 */
	public function update_targets( $targets, $rule_id, $rule_tags ) {
		$updates = array();
		// look for target updates based on the rule's ID.
		if ( isset( $this->targets_to_remove['id'][ $rule_id ] ) ) {
			foreach ( $this->targets_to_remove['id'][ $rule_id ] as $name => $props ) {
				$updates[] = array( $name, $props );
			}
		}
		// look for target updates based on the rule's tags.
		foreach ( $rule_tags as $tag ) {
			if ( isset( $this->targets_to_remove['tag'][ $tag ] ) ) {
				foreach ( $this->targets_to_remove['tag'][ $tag ] as $name => $props ) {
					$updates[] = array( $name, $props );
				}
			}
		}
		// apply any found target updates.

		foreach ( $updates as list( $name, $props ) ) {
			if ( isset( $targets[ $name ] ) ) {
				// we only need to remove targets that exist.
				if ( true === $props ) {
					// if the entire target is being removed, remove it.
					unset( $targets[ $name ] );
				} else {
					// otherwise just mark single props to ignore.
					$targets[ $name ]['except'] = array_merge(
						isset( $targets[ $name ]['except'] ) ? $targets[ $name ]['except'] : array(),
						$props
					);
				}
			}
		}
		return $targets;
	}

	/**
	 * Return TRUE if at least one of the targets matches the rule.
	 *
	 * @param string[] $transforms One of the transform methods defined in the Jetpack Waf_Transforms class.
	 * @param mixed    $targets Targets.
	 * @param string   $match_operator Match operator.
	 * @param mixed    $match_value Match value.
	 * @param bool     $match_not Match not.
	 * @param bool     $capture Capture.
	 * @return bool
	 */
	public function match_targets( $transforms, $targets, $match_operator, $match_value, $match_not, $capture = false ) {
		$this->matched_vars      = array();
		$this->matched_var_names = array();
		$this->matched_var       = '';
		$this->matched_var_name  = '';
		$match_found             = false;

		// get values.
		$values = $this->normalize_targets( $targets );

		// apply transforms.
		foreach ( $transforms as $t ) {
			foreach ( $values as &$v ) {
				$v['value'] = $this->transforms->$t( $v['value'] );
			}
		}

		// pass each target value to the operator to find any that match.
		$matched  = array();
		$captures = array();
		foreach ( $values as $v ) {
			$match     = $this->operators->{$match_operator}( $v['value'], $match_value );
			$did_match = false !== $match;
			if ( $match_not !== $did_match ) {
				// If either:
				// - rule is negated ("not" flag set) and the target was not matched
				// - rule not negated and the target was matched
				// then this is considered a match.
				$match_found               = true;
				$this->matched_var_names[] = $v['source'];
				$this->matched_vars[]      = $v['value'];
				$this->matched_var_name    = end( $this->matched_var_names );
				$this->matched_var         = end( $this->matched_vars );
				$matched[]                 = array( $v, $match );
				// Set any captured matches into state if the rule has the "capture" flag.
				if ( $capture ) {
					$captures = is_array( $match ) ? $match : array( $match );
					foreach ( array_slice( $captures, 0, 10 )  as $i => $c ) {
						$this->set_var( "tx.$i", $c );
					}
				}
			}
		}

		return $match_found;
	}

	/**
	 * Block.
	 *
	 * @param string $action Action.
	 * @param string $rule_id Rule id.
	 * @param string $reason Block reason.
	 * @param int    $status_code Http status code.
	 */
	public function block( $action, $rule_id, $reason, $status_code = 403 ) {
		if ( ! $reason ) {
			$reason = "rule $rule_id";
		}

		$this->write_blocklog( $rule_id, $reason );
		error_log( "Jetpack WAF Blocked Request\t$action\t$rule_id\t$status_code\t$reason" );
		header( "X-JetpackWAF-Blocked: $status_code $reason" );
		if ( defined( 'JETPACK_WAF_MODE' ) && 'normal' === JETPACK_WAF_MODE ) {
			$protocol = isset( $_SERVER['SERVER_PROTOCOL'] ) ? wp_unslash( $_SERVER['SERVER_PROTOCOL'] ) : 'HTTP';
			header( $protocol . ' 403 Forbidden', true, $status_code );
			die( "rule $rule_id" );
		}
	}

	/**
	 * Write block logs. We won't write to the file if it exceeds 100 mb.
	 *
	 * @param string $rule_id Rule id.
	 * @param string $reason Block reason.
	 */
	public function write_blocklog( $rule_id, $reason ) {
		$log_data              = array();
		$log_data['rule_id']   = $rule_id;
		$log_data['reason']    = $reason;
		$log_data['timestamp'] = gmdate( 'Y-m-d H:i:s' );

		$file_path   = JETPACK_WAF_DIR . '/waf-blocklog';
		$file_exists = file_exists( $file_path );

		if ( ! $file_exists || filesize( $file_path ) < ( 100 * 1024 * 1024 ) ) {
			$fp = fopen( $file_path, 'a+' );

			if ( $fp ) {
				try {
					fwrite( $fp, json_encode( $log_data ) . "\n" );
				} finally {
					fclose( $fp );
				}
			}
		}

		$this->write_blocklog_row( $log_data );
	}

	/**
	 * Write block logs to database.
	 *
	 * @param array $log_data Log data.
	 */
	private function write_blocklog_row( $log_data ) {
		$conn = $this->connect_to_wordpress_db();

		if ( ! $conn ) {
			return;
		}

		global $table_prefix;

		$statement = $conn->prepare( "INSERT INTO {$table_prefix}jetpack_waf_blocklog(reason,rule_id, timestamp) VALUES (?, ?, ?)" );
		if ( false !== $statement ) {
			$statement->bind_param( 'sis', $log_data['reason'], $log_data['rule_id'], $log_data['timestamp'] );

			if ( $conn->insert_id > 100 ) {
				$conn->query( "DELETE FROM {$table_prefix}jetpack_waf_blocklog ORDER BY log_id LIMIT 1" );
			}
		}
	}

	/**
	 * Connect to WordPress database.
	 */
	private function connect_to_wordpress_db() {
		if ( ! file_exists( JETPACK_WAF_WPCONFIG ) ) {
			return;
		}

		require_once JETPACK_WAF_WPCONFIG;
		$conn = new \mysqli( DB_HOST, DB_USER, DB_PASSWORD, DB_NAME ); // phpcs:ignore WordPress.DB.RestrictedClasses.mysql__mysqli

		if ( $conn->connect_error ) {
			error_log( 'Could not connect to the database:' . $conn->connect_error );
			return null;
		}

		return $conn;
	}

	/**
	 * Redirect.
	 *
	 * @param string $rule_id Rule id.
	 * @param string $url Url.
	 */
	public function redirect( $rule_id, $url ) {
		error_log( "Jetpack WAF Redirected Request.\tRule:$rule_id\t$url" );
		header( "Location: $url" );
		exit;
	}

	/**
	 * Flag rule for removal.
	 *
	 * @param string $prop Prop.
	 * @param string $value Value.
	 */
	public function flag_rule_for_removal( $prop, $value ) {
		if ( 'id' === $prop ) {
			$this->rules_to_remove['id'][ $value ] = true;
		} else {
			$this->rules_to_remove['tag'][ $value ] = true;
		}
	}

	/**
	 * Flag target for removal.
	 *
	 * @param string $id_or_tag Id or tag.
	 * @param string $id_or_tag_value Id or tag value.
	 * @param string $name Name.
	 * @param string $prop Prop.
	 */
	public function flag_target_for_removal( $id_or_tag, $id_or_tag_value, $name, $prop = null ) {
		if ( null === $prop ) {
			$this->targets_to_remove[ $id_or_tag ][ $id_or_tag_value ][ $name ] = true;
		} else {
			if (
				! isset( $this->targets_to_remove[ $id_or_tag ][ $id_or_tag_value ][ $name ] )
				// if the entire target is already being removed then it would be redundant to remove a single property.
				|| true !== $this->targets_to_remove[ $id_or_tag ][ $id_or_tag_value ][ $name ]
			) {
				$this->targets_to_remove[ $id_or_tag ][ $id_or_tag_value ][ $name ][] = $prop;
			}
		}
	}

	/**
	 * Get variable value.
	 *
	 * @param string $key Key.
	 */
	public function get_var( $key ) {
		return isset( $this->state[ $key ] )
			? $this->state[ $key ]
			: '';
	}

	/**
	 * Set variable value.
	 *
	 * @param string $key Key.
	 * @param string $value Value.
	 */
	public function set_var( $key, $value ) {
		$this->state[ $key ] = $value;
	}

	/**
	 * Increment variable.
	 *
	 * @param string $key Key.
	 * @param mixed  $value Value.
	 */
	public function inc_var( $key, $value ) {
		if ( ! isset( $this->state[ $key ] ) ) {
			$this->state[ $key ] = 0;
		}
		$this->state[ $key ] += floatval( $value );
	}

	/**
	 * Decrement variable.
	 *
	 * @param string $key Key.
	 * @param mixed  $value Value.
	 */
	public function dec_var( $key, $value ) {
		if ( ! isset( $this->state[ $key ] ) ) {
			$this->state[ $key ] = 0;
		}
		$this->state[ $key ] -= floatval( $value );
	}

	/**
	 * Unset variable.
	 *
	 * @param string $key Key.
	 */
	public function unset_var( $key ) {
		unset( $this->state[ $key ] );
	}

	/**
	 * Meta.
	 *
	 * @param string $key Key.
	 * @param string $prop Prop.
	 */
	public function meta( $key, $prop = false ) {
		if ( ! isset( $this->metadata[ $key ] ) ) {
			$value = null;
			switch ( $key ) {
				case 'headers':
					$value = array();
					foreach ( $_SERVER as $k => $v ) {
						$k = strtolower( $k );
						if ( 'http_' === substr( $k, 0, 5 ) ) {
							$value[ $this->normalize_header_name( substr( $k, 5 ) ) ] = $v;
						} elseif ( 'content_type' === $k ) {
							$value['content-type'] = $v;
						} elseif ( 'content_length' === $k ) {
							$value['content-length'] = $v;
						}
					}
					$value['content-type'] = ( ! isset( $value['content-type'] ) || '' === $value['content-type'] )
						// default Content-Type per RFC 7231 section 3.1.5.5.
						? 'application/octet-stream'
						: $value['content-type'];
					$value['content-length'] = ( isset( $value['content-length'] ) && '' !== $value['content-length'] )
						? $value['content-length']
						// if the content-length header is missing, default it to zero.
						: '0';
					break;
				case 'remote_addr':
					$value = '';
					if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
						$value = wp_unslash( $_SERVER['HTTP_CLIENT_IP'] );
					} elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
						$value = wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] );
					} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
						$value = wp_unslash( $_SERVER['REMOTE_ADDR'] );
					}
					break;
				case 'request_method':
					$value = empty( $_SERVER['REQUEST_METHOD'] )
						? 'GET'
						: wp_unslash( $_SERVER['REQUEST_METHOD'] );
					break;
				case 'request_protocol':
					$value = empty( $_SERVER['SERVER_PROTOCOL'] )
						? ( empty( $_SERVER['HTTPS'] ) ? 'HTTP' : 'HTTPS' )
						: wp_unslash( $_SERVER['SERVER_PROTOCOL'] );
					break;
				case 'request_uri':
					$value = isset( $_SERVER['REQUEST_URI'] )
						? wp_unslash( $_SERVER['REQUEST_URI'] )
						: '';
					break;
				case 'request_uri_raw':
					$value = ( isset( $_SERVER['https'] ) ? 'https://' : 'http://' ) . ( isset( $_SERVER['SERVER_NAME'] ) ? wp_unslash( $_SERVER['SERVER_NAME'] ) : '' ) . $this->meta( 'request_uri' );
					break;
				case 'request_filename':
					$value = strtok(
						isset( $_SERVER['REQUEST_URI'] )
							? wp_unslash( $_SERVER['REQUEST_URI'] )
							: '',
						'?'
					);
					break;
				case 'request_line':
					$value = sprintf(
						'%s %s %s',
						$this->meta( 'request_method' ),
						$this->meta( 'request_uri' ),
						$this->meta( 'request_protocol' )
					);
					break;
				case 'request_basename':
					$value = basename( $this->meta( 'request_filename' ) );
					break;
				case 'request_body':
					$value = file_get_contents( 'php://input' );
					break;
				case 'query_string':
					$value = isset( $_SERVER['QUERY_STRING'] ) ? wp_unslash( $_SERVER['QUERY_STRING'] ) : '';
			}
			$this->metadata[ $key ] = $value;
		}

		return false === $prop
			? $this->metadata[ $key ]
			: ( isset( $this->metadata[ $key ][ $prop ] ) ? $this->metadata[ $key ][ $prop ] : '' );
	}

	/**
	 * State values.
	 *
	 * @param string $prefix Prefix.
	 */
	private function state_values( $prefix ) {
		$output = array();
		$len    = strlen( $prefix );
		foreach ( $this->state as $k => $v ) {
			if ( 0 === stripos( $k, $prefix ) ) {
				$output[ substr( $k, $len ) ] = $v;
			}
		}

		return $output;
	}

	/**
	 * Change a string to all lowercase and replace spaces and underscores with dashes.
	 *
	 * @param string $name Name.
	 * @return string
	 */
	public function normalize_header_name( $name ) {
		return str_replace( array( ' ', '_' ), '-', strtolower( $name ) );
	}

	/**
	 * Normalize targets.
	 *
	 * @param array $targets Targets.
	 */
	public function normalize_targets( $targets ) {
		$return = array();
		foreach ( $targets as $k => $v ) {
			$count_only = isset( $v['count'] );
			$only       = isset( $v['only'] ) ? $v['only'] : array();
			$except     = isset( $v['except'] ) ? $v['except'] : array();
			$_k         = strtolower( $k );
			switch ( $_k ) {
				case 'request_headers':
					$only   = array_map(
						function ( $t ) {
							return '/' === $t[0] ? $t : $this->normalize_header_name( $t );
						},
						$only
					);
					$except = array_map(
						function ( $t ) {
							return '/' === $t[0] ? $t : $this->normalize_header_name( $t );
						},
						$except
					);
					$this->normalize_array_target( $this->meta( 'headers' ), $only, $except, $k, $return, $count_only );
					continue 2;
				case 'request_headers_names':
					$this->normalize_array_target( array_keys( $this->meta( 'headers' ) ), array(), array(), $k, $return, $count_only );
					continue 2;
				case 'request_method':
				case 'request_protocol':
				case 'request_uri':
				case 'request_uri_raw':
				case 'request_filename':
				case 'remote_addr':
				case 'request_basename':
				case 'request_body':
				case 'query_string':
				case 'request_line':
					$v = $this->meta( $_k );
					break;
				case 'tx':
				case 'ip':
					$this->normalize_array_target( $this->state_values( "$k." ), $only, $except, $k, $return, $count_only );
					continue 2;
				case 'request_cookies':
					$this->normalize_array_target( $_COOKIE, $only, $except, $k, $return, $count_only );
					continue 2;
				case 'request_cookies_names':
					$this->normalize_array_target( array_keys( $_COOKIE ), array(), array(), $k, $return, $count_only );
					continue 2;
				case 'args':
					$this->normalize_array_target( $_REQUEST, $only, $except, $k, $return, $count_only );
					continue 2;
				case 'args_names':
					$this->normalize_array_target( array_keys( $_REQUEST ), array(), array(), $k, $return, $count_only );
					continue 2;
				case 'args_get':
					$this->normalize_array_target( $_GET, $only, $except, $k, $return, $count_only );
					continue 2;
				case 'args_get_names':
					$this->normalize_array_target( array_keys( $_GET ), array(), array(), $k, $return, $count_only );
					continue 2;
				case 'args_post':
					$this->normalize_array_target( $_POST, $only, $except, $k, $return, $count_only );
					continue 2;
				case 'args_post_names':
					$this->normalize_array_target( array_keys( $_POST ), array(), array(), $k, $return, $count_only );
					continue 2;
				case 'files':
					$names = array_map(
						function ( $f ) {
							return $f['name'];
						},
						$_FILES
					);
					$this->normalize_array_target( $names, $only, $except, $k, $return, $count_only );
					continue 2;
				case 'files_names':
					$this->normalize_array_target( array_keys( $_FILES ), $only, $except, $k, $return, $count_only );
					continue 2;
				default:
					var_dump( 'Unknown target', $k, $v );
					exit;
			}
			$return[] = array(
				'name'   => $k,
				'value'  => $v,
				'source' => $k,
			);
		}

		return $return;
	}

	/**
	 * Verifies is ip from request is in an array.
	 *
	 * @param array $array Array to verify ip against.
	 */
	public function is_ip_in_array( $array ) {
		$request = new Waf_Request();

		$real_ip = $request->get_real_user_ip_address();

		return in_array( $real_ip, $array, true );
	}

	/**
	 * Normalize array target.
	 *
	 * @param array  $source Source.
	 * @param array  $only Only.
	 * @param array  $excl Excl.
	 * @param string $name Name.
	 * @param array  $results Results.
	 * @param bool   $count_only Count only.
	 */
	private function normalize_array_target( $source, $only, $excl, $name, &$results, $count_only ) {
		$output   = array();
		$has_only = isset( $only[0] );
		$has_excl = isset( $excl[0] );

		if ( $has_only ) {
			foreach ( $only as $prop ) {
				if ( isset( $source[ $prop ] ) && $this->key_matches( $prop, $only ) ) {
					$output[ $prop ] = $source[ $prop ];
				}
			}
		} else {
			$output = $source;
		}

		if ( $has_excl ) {
			foreach ( array_keys( $output ) as $k ) {
				if ( $this->key_matches( $k, $excl ) ) {
					unset( $output[ $k ] );
				}
			}
		}

		if ( $count_only ) {
			$results[] = array(
				'name'   => $name,
				'value'  => count( $output ),
				'source' => '&' . $name,
			);
		} else {
			foreach ( $output as $tk => $tv ) {
				if ( is_array( $tv ) ) {
					// flatten it so we get all the values considered
					$flat_values = $this->array_flatten( $tv );
					foreach ( $flat_values as $fv ) {
						$results[] = array(
							// force names to strings
							// we don't care about the nested keys here, just the overall variable name
							'name'   => '' . $tk,
							'value'  => $fv,
							'source' => "$name:$tk",
						);
					}
				} else {
					$results[] = array(
						// force names to strings
						'name'   => '' . $tk,
						'value'  => $tv,
						'source' => "$name:$tk",
					);
				}
			}
		}

		return $results;
	}

	/**
	 * Basic array flatten with array_merge; no-op on non-array targets.
	 *
	 * @param array $source Array to flatten.
	 * @return array The flattened array.
	 */
	private function array_flatten( $source ) {
		if ( ! is_array( $source ) ) {
			return $source;
		}

		$return = array();

		foreach ( $source as $v ) {
			if ( is_array( $v ) ) {
				$return = array_merge( $return, $this->array_flatten( $v ) );
			} else {
				$return[] = $v;
			}
		}

		return $return;
	}

	/**
	 * Key matches.
	 *
	 * @param string $input Input.
	 * @param array  $patterns Patterns.
	 */
	private function key_matches( $input, $patterns ) {
		foreach ( $patterns as $p ) {
			if ( '/' === $p[0] ) {
				if ( 1 === preg_match( $p, $input ) ) {
					return true;
				}
			} else {
				if ( 0 === strcasecmp( $p, $input ) ) {
					return true;
				}
			}
		}

		return false;
	}
}
