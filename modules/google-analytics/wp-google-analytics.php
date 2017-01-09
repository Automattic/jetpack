<?php
/*
		Copyright 2006  Aaron D. Campbell  (email : wp_plugins@xavisys.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

/**
 * JetpackGoogleAnalytics is the class that handles ALL of the plugin functionality.
 * It helps us avoid name collisions
 * http://codex.wordpress.org/Writing_a_Plugin#Avoiding_Function_Name_Collisions
 */
class JetpackGoogleAnalytics {

	/**
	 * @var JetpackGoogleAnalytics - Static property to hold our singleton instance
	 */
	static $instance = false;

	var $tokens = array();

	/**
	 * This is our constructor, which is private to force the use of get_instance()
	 *
	 * @return void
	 */
	private function __construct() {
		add_action( 'get_footer',               array( $this, 'insert_code' ) );
		add_action( 'wp_enqueue_scripts',       array( $this, 'track_outgoing' ) );
	}

	/**
	 * Function to instantiate our class and make it a singleton
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	/**
	 * Used to generate a tracking URL
	 *
	 * @param array $track - Must have ['data'] and ['code'].
	 * @return string - Tracking URL
	 */
	private function _get_url( $track ) {
		$site_url = ( is_ssl() ? 'https://':'http://' ) . sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ); // Input var okay.
		foreach ( $track as $k => $value ) {
			if ( strpos( strtolower( $value ), strtolower( $site_url ) ) === 0 ) {
				$track[ $k ] = substr( $track[ $k ], strlen( $site_url ) );
			}
			if ( 'data' === $k ) {
				$track[ $k ] = preg_replace( '/^https?:\/\/|^\/+/i', '', $track[ $k ] );
			}

			// This way we don't lose search data.
			if ( 'data' === $k && 'search' === $track['code'] ) {
				$track[ $k ] = rawurlencode( $track[ $k ] );
			} else {
				$track[ $k ] = preg_replace( '/[^a-z0-9\.\/\+\?=-]+/i', '_', $track[ $k ] );
			}

			$track[ $k ] = trim( $track[ $k ], '_' );
		}
		$char = ( strpos( $track['data'], '?' ) === false ) ? '?' : '&amp;';
		return str_replace( "'", "\'", "/{$track['code']}/{$track['data']}{$char}referer=" . rawurlencode( isset( $_SERVER['HTTP_REFERER'] ) ? $_SERVER['HTTP_REFERER'] : '' ) ); // Input var okay.
	}

	/**
	 * Maybe output or return, depending on the context
	 */
	private function _output_or_return( $val, $maybe ) {
		if ( $maybe ) {
			echo $val . "\r\n";
		} else {
			return $val;
		}
	}

	/**
	 * This injects the Google Analytics code into the footer of the page.
	 *
	 * @param bool[optional] $output - defaults to true, false returns but does NOT echo the code.
	 */
	public function insert_code( $output = true ) {
		// If $output is not a boolean false, set it to true (default).
		$output = ( false !== $output);

		$tracking_id = $this->_get_options( 'code' );
		if ( empty( $tracking_id ) ) {
			return $this->_output_or_return( '<!-- Your Google Analytics Plugin is missing the tracking ID -->', $output );
		}

		// get our plugin options.
		$wga = $this->_get_options();
		// If the user's role has wga_no_track set to true, return without inserting code.
		if ( is_user_logged_in() ) {
			$current_user = wp_get_current_user();
			$role = array_shift( $current_user->roles );
			if ( 'true' === $this->_get_options( 'ignore_role_' . $role ) ) {
				return $this->_output_or_return( '<!-- Google Analytics Plugin is set to ignore your user role -->', $output );
			}
		}

		// If $admin is true (we're in the admin_area), and we've been told to ignore_admin_area, return without inserting code.
		if ( is_admin() && ( ! isset( $wga['ignore_admin_area'] ) || 'false' !== $wga['ignore_admin_area'] ) ) {
			return $this->_output_or_return( '<!-- Your Google Analytics Plugin is set to ignore Admin area -->', $output );
		}

		$custom_vars = array(
			"_gaq.push(['_setAccount', '{$tracking_id}']);",
		);

		$track = array();
		if ( is_404() && ( ! isset( $wga['log_404s'] ) || 'false' !== $wga['log_404s'] ) ) {
			// This is a 404 and we are supposed to track them.
			$custom_vars[] = "_gaq.push( [ '_trackEvent', '404', document.location.href, document.referrer ] );";
		} elseif ( is_search() && ( ! isset( $wga['log_searches'] ) || 'false' !== $wga['log_searches'] ) ) {
			// Set track for searches, if it's a search, and we are supposed to.
			$track['data'] = sanitize_text_field( wp_unslash( $_REQUEST['s'] ) ); // Input var okay.
			$track['code'] = 'search';
		}

		if ( ! empty( $track ) ) {
			$track['url'] = $this->_get_url( $track );
			// adjust the code that we output, account for both types of tracking.
			$track['url'] = esc_js( str_replace( '&', '&amp;', $track['url'] ) );
			$custom_vars[] = "_gaq.push(['_trackPageview','{$track['url']}']);";
		} else {
			$custom_vars[] = "_gaq.push(['_trackPageview']);";
		}

		if ( 'true' === $wga['enable_display_advertising'] ) {
			$async_code = "<script type='text/javascript'>
								var _gaq = _gaq || [];
								%custom_vars%

								(function() {
									var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
									ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
									var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
								})();
							</script>";
		} else {
			$async_code = "<script type='text/javascript'>
								var _gaq = _gaq || [];
								%custom_vars%

								(function() {
									var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
									ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
									var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
								})();
							</script>";
		}

		$custom_vars_string = implode( "\r\n", $custom_vars );
		$async_code = str_replace( '%custom_vars%', $custom_vars_string, $async_code );

		return $this->_output_or_return( $async_code, $output );

	}

	/**
	 * Used to get one or all of our plugin options
	 *
	 * @param string[optional] $option - Name of options you want.  Do not use if you want ALL options.
	 * @param boolean[optiona] $default - Default value.
	 * @return array of options, or option value.
	 */
	private function _get_options( $option = null, $default = false ) {

		$o = get_option( 'jetpack_wga' );

		if ( isset( $option ) ) {
			if ( isset( $o[ $option ] ) ) {
				if ( 'code' === $option ) {
					if ( preg_match( '#UA-[\d-]+#', $o[ $option ], $matches ) ) {
						return $matches[0];
					} else {
						return '';
					}
				} else {
					return $o[ $option ];
				}
			}
		} else {
			return $o;
		}
	}

	/**
	 * If we track outgoing links, this will enqueue our javascript file
	 */
	public function track_outgoing() {
		if ( 'true' === $this->_get_options( 'log_outgoing' ) && ( ! defined( 'XMLRPC_REQUEST' ) || ! XMLRPC_REQUEST ) && ( ! is_admin() || 'false' === $this->_get_options( 'ignore_admin_area' ) ) ) {
			wp_enqueue_script( 'wp-google-analytics', plugin_dir_url( __FILE__ ) . 'wp-google-analytics.js', array( 'jquery' ), '0.0.3' );
		}
	}

	/**
	 * Callback for %the_category% token
	 */
	public function token_the_category() {
		return implode( ', ', wp_list_pluck( (array) get_the_category(), 'name' ) );
	}

	/**
	 * Callback for %context% token
	 */
	public function token_context() {
		if ( is_admin() ) {
			return 'admin';
		} elseif ( is_home() || is_front_page() ) {
			return 'home';
		} elseif ( is_tax() || is_tag() || is_category() ) {
			return get_queried_object()->taxonomy;
		} elseif ( is_author() ) {
			return 'author';
		} elseif ( is_singular() || is_single() || is_page() ) {
			return get_post_type();
		} elseif ( is_search() ) {
			return 'search';
		} elseif ( is_date() ) {
			return 'date';
		} elseif ( is_archive() ) {
			return 'archive';
		} elseif ( is_404() ) {
			return '404';
		}
	}

	/**
	 * Callback for %the_tags% token
	 */
	public function token_the_tags() {
		return implode( ', ', wp_list_pluck( (array) get_the_tags(), 'name' ) );
	}
}

global $wp_google_analytics;
$wp_google_analytics = JetpackGoogleAnalytics::get_instance();
