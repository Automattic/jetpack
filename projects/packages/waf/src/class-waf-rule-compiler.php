<?php
/**
 * Rule compiler for Jetpack Waf.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * WafRuntime class
 */
class WafRuleCompiler {
	/**
	 * Maybe will change.
	 *
	 * @var array
	 */
	private $maybe_will_change = array();
	/**
	 * Marker map.
	 *
	 * @var array
	 */
	private $marker_map = array();
	/**
	 * Php.
	 *
	 * @var array
	 */
	private $php = array(
		'<?php',
	);

	/**
	 * Compile method.
	 *
	 * @param string $rules_json Rules in json format.
	 */
	public function compile( $rules_json ) {
		foreach ( $rules_json as $rule ) {
			if ( isset( $rule['expression'] ) ) {
				// this is a normal rule
				// add basic rule info.
				$this->php[] = sprintf(
					"\$rule = (object) array( 'id' => %s, 'reason' => %s, 'tags' => %s );",
					var_export( $rule['id'], true ),
					isset( $rule['reason'] ) ? $this->expand_macro( $rule['reason'] ) : "''",
					var_export( isset( $rule['tags'] ) ? array_map( 'strtolower', $rule['tags'] ) : array(), true )
				);
				$rule_php    = $this->compile_rule( $rule );
				$this->add_rule( $rule['id'], isset( $rule['tags'] ) ? $rule['tags'] : array(), $rule_php );
			} elseif ( isset( $rule['actions'] ) ) {
				// this is an actions-only rule.
				$rule_php = $this->compile_actions( $rule['actions'] );
				$this->add_rule( $rule['id'], isset( $rule['tags'] ) ? $rule['tags'] : array(), $rule_php );
			} elseif ( isset( $rule['marker'] ) ) {
				// this is a marker.
				$this->add_marker( $rule['marker'] );
			} else {
				var_dump( 'UNKNOWN RULE:', $rule );
				exit;
			}
		}
		// check to see if there are any leftover markers.
		if ( ! empty( $this->marker_map ) ) {
			var_dump( 'Marker Map Is Not Empty!', $this->marker_map );
			exit;
		}
	}

	/**
	 * Write rules to file.
	 *
	 * @param string $filepath File path.
	 * @throws \Exception If file writing fails.
	 */
	public function write_to_file( $filepath ) {
		$php_code = implode( PHP_EOL, $this->php );

		$wp_filesystem = jpwaf_init_filesystem();
		if ( ! $wp_filesystem ) {
			throw new \Exception( 'No filesystem available' );
		}
		// ensure the folder exists.
		if ( ! $wp_filesystem->is_writable( dirname( $filepath ) ) ) {
			$wp_filesystem->mkdir( dirname( $filepath ) );
		}
		if ( ! $wp_filesystem->put_contents( $filepath, $php_code ) ) {
			throw new \Exception( "Failed writing to: $filepath" );
		}

		return true;
	}

	/**
	 * Add rule.
	 *
	 * @param string $rule_id Rule id.
	 * @param array  $rule_tags Rule tags.
	 * @param array  $rule_php Rule php.
	 */
	private function add_rule( $rule_id, $rule_tags, $rule_php ) {
		// wrap in a "if rule removed" check (only if a previous rule might be removing this rule).
		if ( $this->check_if_maybe_will_change_at_runtime( 'rule', $rule_id, $rule_tags ) ) {
			array_unshift( $rule_php, 'if(!$waf->rule_removed($rule->id, $rule->tags)) {' );
			$rule_php[] = '}';
		}
		$this->php = array_merge( $this->php, $rule_php );
		// add a marker in case another rules wants to skipAfter this rule.
		$this->add_marker( $rule_id );
	}

	/**
	 * Add marker.
	 *
	 * @param string $label Label.
	 */
	private function add_marker( $label ) {
		if ( isset( $this->marker_map[ $label ] ) ) {
			$this->php[] = $this->marker_map[ $label ] . ": // $label";
			unset( $this->marker_map[ $label ] );
		}
	}

	/**
	 * Compile actions.
	 *
	 * @param array $actions Actions.
	 */
	private function compile_actions( $actions ) {
		return array_map(
			function ( $act ) {
				switch ( $act['name'] ) {
					case 'set_var':
						// key, op, value.
						$k = $this->expand_macro( strtolower( $act['key'] ) );
						if ( 'x' === $act['op'] ) {
							return sprintf(
								'$waf->unset_var(%s);',
								$k
							);
						} else {
							$v  = $this->expand_macro( $act['value'] );
							$fn = 'set_var';
							if ( '+' === $act['op'] ) {
								$fn = 'inc_var';
							} elseif ( '-' === $act['op'] ) {
								$fn = 'dec_var';
							}
							return sprintf(
								'$waf->%s(%s,%s);',
								$fn,
								$k,
								$v
							);
						}
					case 'remove_target':
						// make a note (for compiler use) other rules'
						// targets may be updated based on ID or tag.
						$this->maybe_will_change_at_runtime(
							'target',
							$act['prop'],
							$act['value']
						);
						// add a runtime line.
						return sprintf(
							'$waf->flag_target_for_removal(%s,%s,%s,%s);',
							var_export( $act['prop'], true ),
							var_export( strtolower( $act['value'] ), true ),
							var_export( strtolower( $act['targetName'] ), true ),
							var_export( $act['targetProp'], true )
						);
					case 'remove_rule':
						// make a note (for compiler use) other rules
						// may be removed based on ID or tag.
						$this->maybe_will_change_at_runtime( 'rule', $act['prop'], $act['value'] );
						// add a runtime line.
						return sprintf(
							'$waf->flag_rule_for_removal(%s,%s);',
							var_export( $act['prop'], true ),
							var_export( $act['value'], true )
						);
					case 'set_reason':
						return sprintf(
							'$rule->reason = %s;',
							$this->expand_macro( $act['reason'] )
						);
					default:
						var_dump( $act );
						exit;
				}
			},
			$actions
		);
	}

	/**
	 * Compile rule.
	 *
	 * @param array $rule Rule.
	 */
	private function compile_rule( $rule ) {
		// compile the the disruptive action.
		$disruptive_action = '';
		if ( $rule['action'] ) {
			switch ( $rule['action']['name'] ) {
				case 'block':
				case 'deny':
				case 'drop':
					$disruptive_action = sprintf(
						'return $waf->block(%s,$rule->id,$rule->reason,%s);',
						var_export( $rule['action']['name'], true ),
						var_export( $rule['action']['status'], true )
					);
					break;
				case 'allow':
					$disruptive_action = 'return;';
					break;
				case 'redirect':
					$disruptive_action = sprintf(
						'return $waf->redirect($rule->id,%s);',
						var_export( $rule['action']['url'], true )
					);
					break;
				case 'skipAfter':
					$disruptive_action = sprintf(
						'goto %s;',
						$this->get_marker_label( $rule['action']['target'] )
					);
					break;
			}
		}
		// compile the expressions.
		return $this->compile_expression(
			$rule['expression'],
			$rule['id'],
			isset( $rule['tags'] ) ? $rule['tags'] : array(),
			$disruptive_action ? array( $disruptive_action ) : array(),
			$rule
		);
	}

	/**
	 * Add marker.
	 *
	 * @param array  $expression Expression.
	 * @param string $rule_id Rule id.
	 * @param array  $rule_tags Rule tags.
	 * @param array  $other_actions Other actions.
	 * @param array  $rule Rule.
	 */
	private function compile_expression( $expression, $rule_id, $rule_tags, $other_actions, $rule ) {
		$php_lines = array();
		if ( 'and' === $expression['operator'] ) {
			$php_lines = array_reduce(
				array_reverse( $expression['expressions'] ),
				function ( $lines, $expr ) use ( $rule_id, $rule_tags, $rule ) {
					return $this->compile_expression( $expr, $rule_id, $rule_tags, $lines, $rule );
				},
				$other_actions
			);
		} elseif ( 'or' === $expression['operator'] ) {
			die( 'or!' );
		} else {
			// Simple Expression
			// prepare the targets.
			$targets = array();
			foreach ( $expression['targets'] as $t ) {
				$t2 = $t;
				if ( isset( $t2['only'] ) ) {
					foreach ( $t2['only'] as $k => $v ) {
						$t2['only'][ $k ] = '/' === $v[0]
							? $v
							: strtolower( $v );
					}
				}
				if ( isset( $t2['except'] ) ) {
					foreach ( $t2['except'] as $k => $v ) {
						$t2['except'][ $k ] = '/' === $v[0]
							? $v
							: strtolower( $v );
					}
				}
				unset( $t2['name'] );
				$targets[ strtolower( $t['name'] ) ] = $t2;
			}
			$targets = var_export( $targets, true );
			// if the targets for this rule may have been changed, then pass the targets
			// to a method to update them at runtime.
			if ( $this->check_if_maybe_will_change_at_runtime( 'target', $rule_id, $rule_tags ) ) {
				$targets = sprintf(
					'$waf->update_targets(%s, $rule->id, $rule->tags)',
					$targets
				);
			}
			// prepare the operation.
			$op_name  = strtolower( $expression['operator'] );
			$op_value = $expression['value'];
			// these operators support macro expansion, which we can do some of ahead of time.
			// the rest have their values directly printed out in PHP.
			$expand_macro_operators = array(
				'beginswith',
				'contains',
				'containsword',
				'endswith',
				'eq',
				'ge',
				'gt',
				'le',
				'lt',
				'rsub',
				'streq',
				'within',
				'',
			);
			if ( in_array( $op_name, $expand_macro_operators, true ) ) {
				$op_value = $this->expand_macro( $op_value );
			} else {
				if ( 'validatebyterange' === $op_name ) {
					$op_value = self::parse_byte_range( $op_value );
				}
				$op_value = var_export( $op_value, true );
			}
			// write the condition.
			$php_lines[] = sprintf(
				'if($waf->match_targets(%s,%s,%s,%s,%s,%s)) {',
				var_export( isset( $rule['transforms'] ) ? $rule['transforms'] : array(), true ),
				$targets,
				var_export( $op_name, true ),
				$op_value,
				$expression['not'] ? 'true' : 'false',
				$expression['capture'] ? 'true' : 'false'
			);

			// add the actions.
			$php_lines = array_merge(
				$php_lines,
				$this->compile_actions(
					isset( $expression['actions'] )
					? $expression['actions']
					: array()
				),
				$other_actions
			);
			// close the condition block.
			$php_lines[] = '}';
		}

		return $php_lines;
	}

	/**
	 * Expand macro.
	 *
	 * @param string $v Value.
	 */
	private function expand_macro( $v ) {
		if ( '' === $v ) {
			return "''";
		}
		$matched  = array();
		$replaced = preg_replace_callback(
			'/%\{[\w\.\-]+\}/',
			function ( $m ) use ( &$matched ) {
				$k = strtolower( substr( $m[0], 2, -1 ) );
				if ( 1 === preg_match( '/^(tx|ip)\./', $k ) ) {
					$matched[] = '$waf->get_var(' . var_export( $k, true ) . ')';
				} elseif ( strpos( $k, 'request_headers.' ) === 0 ) {
					$matched[] = "\$waf->meta('headers', " . var_export( substr( $k, 16 ), true ) . ')';
				} else {
					switch ( $k ) {
						case 'matched_var':
							$matched[] = '$waf->matched_var';
							break;
						case 'matched_var_name':
							$matched[] = '$waf->matched_var_name';
							break;
						case 'remote_addr':
						case 'request_line':
							$matched[] = '$waf->meta(\'' . $k . '\')';
							break;
						case 'rule.msg':
						case 'rule.reason':
							$matched[] = '$rule->reason';
							break;
						case 'reqbody_error_msg':
							$matched[] = '';
							// these are unsupported macros from modsecurity.
							break;
						default:
							$matched[] = '';
							var_dump( 'Unknown macro:', $m );
					}
				}
				return "\r\f\r";
			},
			$v
		);
		$parts    = array_filter(
			preg_split( '/\r+/', $replaced ),
			function ( $s ) {
				return '' !== $s; }
		);
		$parts    = array_map(
			function ( $s ) use ( &$matched ) {
				return "\f" === $s
					? array_shift( $matched )
					: var_export( $s, true );
			},
			$parts
		);
		$parts    = array_filter(
			$parts,
			function ( $s ) {
				return '' !== $s;
			}
		);
		$string   = implode( '.', $parts );
		if ( preg_match( '/\.$/', $string ) ) {
			var_dump(
				$v,
				$parts,
				array_filter(
					$parts,
					function ( $p ) {
						return null !== $p;
					}
				),
				$string
			);
			exit;
		}

		return $string;
	}

	/**
	 * Maybe will change at runtime.
	 *
	 * @param string $type Type.
	 * @param string $prop Prop.
	 * @param string $value Value.
	 */
	private function maybe_will_change_at_runtime( $type, $prop, $value ) {
		$key                             = strtolower( "$type/$prop/$value" );
		$this->maybe_will_change[ $key ] = true;
	}

	/**
	 * Check if maybe will change at runtime.
	 *
	 * @param string $type Type.
	 * @param string $rule_id Rule id.
	 * @param array  $rule_tags Rule tags.
	 */
	private function check_if_maybe_will_change_at_runtime( $type, $rule_id, $rule_tags ) {
		// check to see if the rule ID might be targeted by a runtime action.
		if ( isset( $this->maybe_will_change[ "$type/id/$rule_id" ] ) ) {
			return true;
		}
		// check to see if one of the tags might be targeted by a runtime action.
		foreach ( $rule_tags as $tag ) {
			if ( isset( $this->maybe_will_change[ "$type/tag/$tag" ] ) ) {
				return true;
			}
		}
		// None of the rule's attributes are being targeted.
		return false;
	}

	/**
	 * Get marker label.
	 *
	 * @param string $name Name.
	 */
	private function get_marker_label( $name ) {
		if ( ! isset( $this->marker_map[ $name ] ) ) {
			$this->marker_map[ $name ] = preg_replace( '/\W/', '_', uniqid( 'marker_', true ) );
		}
		return $this->marker_map[ $name ];
	}

	/**
	 * Given an array of byte numbers and/or ranges of numbers, compile into a data structure that will
	 * be easier to evaluate at runtime.
	 *
	 * @param mixed $ranges Ranges.
	 * @return array
	 */
	public static function parse_byte_range( $ranges ) {
		$range = array();
		$min   = PHP_INT_MAX;
		$max   = 0;
		foreach ( $ranges as $b ) {
			if ( false === strpos( $b, '-' ) ) {
				$b       = intval( $b );
				$min     = min( $b, $min );
				$max     = max( $b, $max );
				$range[] = $b;
			} else {
				list( $b0, $b1 ) = preg_split( '/\s*-\s*/', $b );
				$b0              = intval( $b0 );
				$b1              = intval( $b1 );
				$min             = min( $b0, $min );
				$max             = max( $b1, $max );
				$range[]         = array( $b0, $b1 );
			}
		}

		return array(
			'min'   => $min,
			'max'   => $max,
			'range' => $range,
		);
	}
}
