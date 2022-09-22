<?php
/**
 * Stats Options
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Constants;
use Jetpack_Options;

/**
 * Stats Options class.
 */
class Options {

	/**
	 * Option name.
	 *
	 * @var string $option_name The 'stats' option name
	 */
	public static $option_name = 'stats_options';

	/**
	 * Stats Options.
	 *
	 * @var array $options An array of associated Stats options (default empty)
	 */
	protected static $options = array();

	/**
	 * Stats Get Options.
	 *
	 * @return array.
	 */
	public static function get_options() {
		// Make sure we only get options from the database once per connection.
		if ( count( self::$options ) > 0 ) {
			return self::$options;
		}

		self::$options = get_option( self::$option_name, array() );

		if ( ! isset( self::$options['version'] ) || self::$options['version'] < Constants::get_constant( 'STATS_VERSION' ) ) {
			self::upgrade_options( self::$options );
		}

		return self::$options;
	}

	/**
	 * Get Stats Option..
	 *
	 * @param string $option Option name.
	 * @return mixed|null.
	 */
	public static function get_option( $option ) {
		$options = self::get_options();

		// Why??
		if ( 'blog_id' === $option ) {
			return Jetpack_Options::get_option( 'id' );
		}

		if ( isset( $options[ $option ] ) ) {
			return $options[ $option ];
		}

		return null;
	}

	/**
	 * Stats Set Option.
	 *
	 * @param string $option The option name.
	 * @param mixed  $value The option Value.
	 * @return bool.
	 */
	public static function set_option( $option, $value ) {
		$options = self::get_options();

		$options[ $option ] = $value;

		return self::set_options( $options );
	}

	/**
	 * Stats Set Options.
	 *
	 * @access public
	 * @param array $options Options.
	 * @return bool
	 */
	public static function set_options( $options ) {
		if ( ! is_array( $options ) ) {
			return false;
		}
		$success = update_option( 'stats_options', $options );

		if ( true === $success ) {
			self::$options = $options;
		}

		return $success;
	}

	/**
	 * Stats Upgrade Options.
	 *
	 * @access public
	 * @param array $options The stats options.
	 * @return array|bool
	 */
	public static function upgrade_options( $options ) {
		$defaults = array(
			'admin_bar'    => true,
			'roles'        => array( 'administrator' ),
			'count_roles'  => array(),
			'blog_id'      => Jetpack_Options::get_option( 'id' ),
			'do_not_track' => true, // @todo
		);

		if ( isset( $options['reg_users'] ) ) {
			if ( ! function_exists( 'get_editable_roles' ) ) {
				require_once ABSPATH . 'wp-admin/includes/user.php';
			}
			if ( $options['reg_users'] ) {
				$options['count_roles'] = array_keys( get_editable_roles() );
			}
			unset( $options['reg_users'] );
		}

		if ( is_array( $options ) && ! empty( $options ) ) {
			$new_options = array_merge( $defaults, $options );
		} else {
			$new_options = $defaults;
		}

		$new_options['version'] = Constants::get_constant( 'STATS_VERSION' );

		if ( ! self::set_options( $new_options ) ) {
			return false;
		}

		return $new_options;
	}

}
