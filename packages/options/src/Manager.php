<?php
/**
 * The Jetpack Options manager class file.
 *
 * @package jetpack-options
 */

namespace Automattic\Jetpack\Options;

/**
 * The Jetpack Options Manager class that is used as a single gateway between WordPress options API
 * and Jetpack.
 */
abstract class Manager {

	/**
	 * An array that maps a grouped option type to an option name.
	 *
	 * @var array
	 */
	protected $grouped_options = array(
		'compact' => 'jetpack_options',
		'private' => 'jetpack_private_options',
	);

	/**
	 * Returns an array of option names for a given type.
	 *
	 * @param string $type The type of option to return. Defaults to 'compact'.
	 *
	 * @return array
	 */
	abstract public function get_option_names( $type );

	/**
	 * Returns the requested option.  Looks in jetpack_options or jetpack_$name as appropriate.
	 *
	 * @param string $name Option name. It must come _without_ `jetpack_%` prefix. The method will prefix the option name.
	 * @param mixed  $default (optional) the default value.
	 *
	 * @return mixed
	 */
	public function get_option( $name, $default = false ) {
		if ( $this->is_valid( $name, 'non_compact' ) ) {
			if ( $this->is_network_option( $name ) ) {
				return get_site_option( "jetpack_$name", $default );
			}

			return get_option( "jetpack_$name", $default );
		}

		foreach ( array_keys( $this->grouped_options ) as $group ) {
			if ( $this->is_valid( $name, $group ) ) {
				return $this->get_grouped_option( $group, $name, $default );
			}
		}

		// TODO: throw an exception here?

		return $default;
	}

	/**
	 * Returns a single value from a grouped option.
	 *
	 * @param String $group   name of the group, i.e., 'private'.
	 * @param String $name    the name of the option to return.
	 * @param Mixed  $default a default value in case the option is not found.
	 * @return Mixed the option value or default if not found.
	 */
	protected function get_grouped_option( $group, $name, $default ) {
		$options = get_option( $this->grouped_options[ $group ] );
		if ( is_array( $options ) && isset( $options[ $name ] ) ) {
			return $options[ $name ];
		}

		return $default;
	}

	/**
	 * Updates the single given option.  Updates jetpack_options or jetpack_$name as appropriate.
	 *
	 * @param string $name Option name. It must come _without_ `jetpack_%` prefix. The method will prefix the option name.
	 * @param mixed  $value Option value.
	 * @param string $autoload If not compact option, allows specifying whether to autoload or not.
	 *
	 * @return bool Was the option successfully updated?
	 */
	public function update_option( $name, $value, $autoload = null ) {
		/**
		 * Fires before Jetpack updates a specific option.
		 *
		 * @since 3.0.0
		 *
		 * @param str $name The name of the option being updated.
		 * @param mixed $value The new value of the option.
		 */
		do_action( 'pre_update_jetpack_option_' . $name, $name, $value );
		if ( $this->is_valid( $name, 'non_compact' ) ) {
			if ( $this->is_network_option( $name ) ) {
				return update_site_option( "jetpack_$name", $value );
			}

			return update_option( "jetpack_$name", $value, $autoload );

		}

		foreach ( array_keys( $this->grouped_options ) as $group ) {
			if ( $this->is_valid( $name, $group ) ) {
				return $this->update_grouped_option( $group, $name, $value );
			}
		}

		// TODO: throw an exception here?

		return false;
	}

	/**
	 * Updates a single value from a grouped option.
	 *
	 * @param String $group name of the group, i.e., 'private'.
	 * @param String $name  the name of the option to update.
	 * @param Mixed  $value the to update the option with.
	 * @return Boolean was the update successful?
	 */
	protected function update_grouped_option( $group, $name, $value ) {
		$options = get_option( $this->grouped_options[ $group ] );
		if ( ! is_array( $options ) ) {
			$options = array();
		}
		$options[ $name ] = $value;

		return update_option( $this->grouped_options[ $group ], $options );
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
	 *
	 * @param string|array $names Option names. They must come _without_ `jetpack_%` prefix. The method will prefix the option names.
	 *
	 * @return bool Was the option successfully deleted?
	 */
	public function delete_option( $names ) {
		$result = true;
		$names  = (array) $names;

		if ( ! $this->is_valid( $names ) ) {
			// TODO: issue a warning here?
			return false;
		}

		foreach ( array_intersect( $names, $this->get_option_names( 'non_compact' ) ) as $name ) {
			if ( $this->is_network_option( $name ) ) {
				$result = delete_site_option( "jetpack_$name" );
			} else {
				$result = delete_option( "jetpack_$name" );
			}
		}

		foreach ( array_keys( $this->grouped_options ) as $group ) {
			if ( ! $this->delete_grouped_option( $group, $names ) ) {
				$result = false;
			}
		}

		return $result;
	}

	/**
	 * Deletes a single value from a grouped option.
	 *
	 * @param String $group   name of the group, i.e., 'private'.
	 * @param Array  $names   the names of the option to delete.
	 * @return Mixed the option value or default if not found.
	 */
	protected function delete_grouped_option( $group, $names ) {
		$options = get_option( $this->grouped_options[ $group ], array() );

		$to_delete = array_intersect( $names, $this->get_option_names( $group ), array_keys( $options ) );
		if ( $to_delete ) {
			foreach ( $to_delete as $name ) {
				unset( $options[ $name ] );
			}

			return update_option( $this->grouped_options[ $group ], $options );
		}

		return true;
	}

	/**
	 * Is the option name valid?
	 *
	 * @param string      $name  The name of the option.
	 * @param string|null $group The name of the group that the option is in. Default to null, which will search non_compact.
	 *
	 * @return bool Is the option name valid?
	 */
	public function is_valid( $name, $group = null ) {
		if ( is_array( $name ) ) {
			$compact_names = array();
			foreach ( array_keys( $this->grouped_options ) as $_group ) {
				$compact_names = array_merge( $compact_names, $this->get_option_names( $_group ) );
			}

			$result = array_diff( $name, $this->get_option_names( 'non_compact' ), $compact_names );

			return empty( $result );
		}

		if ( is_null( $group ) || 'non_compact' === $group ) {
			if ( in_array( $name, $this->get_option_names( $group ), true ) ) {
				return true;
			}
		}

		foreach ( array_keys( $this->grouped_options ) as $_group ) {
			if ( is_null( $group ) || $group === $_group ) {
				if ( in_array( $name, $this->get_option_names( $_group ), true ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Checks if an option must be saved for the whole network in WP Multisite
	 *
	 * @param string $option_name Option name. It must come _without_ `jetpack_%` prefix. The method will prefix the option name.
	 *
	 * @return bool
	 */
	public function is_network_option( $option_name ) {
		if ( ! is_multisite() ) {
			return false;
		}
		return in_array( $option_name, $this->get_option_names( 'network' ), true );
	}

	/**
	 * Gets an option via $wpdb query.
	 *
	 * @since 5.4.0
	 *
	 * @param string $name Option name.
	 * @param mixed  $default Default option value if option is not found.
	 *
	 * @return mixed Option value, or null if option is not found and default is not specified.
	 */
	function get_raw_option( $name, $default = null ) {
		if ( $this->bypass_raw_option( $name ) ) {
			return get_option( $name, $default );
		}
		global $wpdb;
		$value = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1",
				$name
			)
		);
		$value = maybe_unserialize( $value );
		if ( $value === null && $default !== null ) {
			return $default;
		}
		return $value;
	}
	/**
	 * This function checks for a constant that, if present, will disable direct DB queries Jetpack uses to manage certain options and force Jetpack to always use Options API instead.
	 * Options can be selectively managed via a blacklist by filtering option names via the jetpack_disabled_raw_option filter.
	 *
	 * @param $name Option name
	 *
	 * @return bool
	 */
	function bypass_raw_option( $name ) {
		if ( \Jetpack_Constants::get_constant( 'JETPACK_DISABLE_RAW_OPTIONS' ) ) {
			return true;
		}
		/**
		 * Allows to disable particular raw options.
		 *
		 * @since 5.5.0
		 *
		 * @param array $disabled_raw_options An array of option names that you can selectively blacklist from being managed via direct database queries.
		 */
		$disabled_raw_options = apply_filters( 'jetpack_disabled_raw_options', array() );
		return isset( $disabled_raw_options[ $name ] );
	}
}
