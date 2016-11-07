<?php
/**
 * Plugin Name: WP Google Analytics
 * Plugin URI: http://bluedogwebservices.com/wordpress-plugin/wp-google-analytics/
 * Description: Lets you use <a href="http://analytics.google.com">Google Analytics</a> to track your WordPress site statistics
 * Version: 1.4.0
 * Author: Aaron D. Campbell
 * Author URI: http://ran.ge/
 * License: GPLv2 or later
 * Text Domain: wp-google-analytics
 */

define('WGA_VERSION', '1.4.0');

/*  Copyright 2006  Aaron D. Campbell  (email : wp_plugins@xavisys.com)

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
 * wpGoogleAnalytics is the class that handles ALL of the plugin functionality.
 * It helps us avoid name collisions
 * http://codex.wordpress.org/Writing_a_Plugin#Avoiding_Function_Name_Collisions
 */
class wpGoogleAnalytics {

	/**
	 * @var wpGoogleAnalytics - Static property to hold our singleton instance
	 */
	static $instance = false;

	static $page_slug = 'wp-google-analytics';

	var $tokens = array();

	/**
	 * This is our constructor, which is private to force the use of get_instance()
	 * @return void
	 */
	private function __construct() {
		add_filter( 'init',                     array( $this, 'init' ) );
		add_action( 'admin_init',               array( $this, 'admin_init' ) );
		add_action( 'admin_menu',               array( $this, 'admin_menu' ) );
		add_action( 'get_footer',               array( $this, 'insert_code' ) );
		add_action( 'wp_enqueue_scripts',       array( $this, 'track_outgoing' ) );
		add_filter( 'plugin_action_links',      array( $this, 'add_plugin_page_links' ), 10, 2 );
	}

 	/**
	 * Function to instantiate our class and make it a singleton
	 */
	public static function get_instance() {
		if ( !self::$instance )
			self::$instance = new self;

		return self::$instance;
	}

	public function init() {
		load_plugin_textdomain( 'wp-google-analytics', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );

		$this->tokens = array(
				array(
						'token'            => '%the_author%',
						'callback'         => 'get_the_author',
						'callback_returns' => 'string',
						'description'      => __( 'Post author for current view', 'wp-google-analytics' ),
						'retval'           => __( "Post author's display name", 'wp-google-analytics' ),
						'ignore_when'      => array(
								'is_home',
								'is_front_page',
								'is_post_type_archive',
								'is_page',
								'is_date',
								'is_category',
								'is_tag',
							),
					),
				array(
						'token'            => '%the_category%',
						'callback'         => array( $this, 'token_the_category' ),
						'callback_returns' => 'string',
						'description'      => __( 'Categories assigned to a post', 'wp-google-analytics' ),
						'retval'           => __( "Category names in a commma-separated list", 'wp-google-analytics' ),
						'ignore_when'      => array(
								'is_home',
								'is_front_page',
								'is_page',
								'is_post_type_archive',
								'is_author',
								'is_tag',
							),
					),
				array(
						'token'            => '%context%',
						'callback'         => array( $this, 'token_context' ),
						'callback_returns' => 'string',
						'description'      => __( 'Which view the visitor is on', 'wp-google-analytics' ),
						'retval'           => __( "Samples: 'home', 'category', 'post', 'author'" ),
					),
				array(
						'token'            => '%the_date%',
						'callback'         => 'get_the_date',
						'callback_returns' => 'string',
						'description'      => __( 'Publication date for the current view', 'wp-google-analytics' ),
						'retval'           => __( "Format specified by 'Date Format' in Settings -> General", 'wp-google-analytics' ),
						'ignore_when'      => array(
								'is_home',
								'is_front_page',
								'is_post_type_archive',
								'is_page',
								'is_author',
								'is_category',
								'is_tag',
							),
					),
				array(
						'token'            => '%the_tags%',
						'callback'         => array( $this, 'token_the_tags' ),
						'callback_returns' => 'string',
						'description'      => __( 'Tags assigned to a post', 'wp-google-analytics' ),
						'retval'           => __( "Tag names in a commma-separated list", 'wp-google-analytics' ),
						'ignore_when'      => array(
								'is_home',
								'is_front_page',
								'is_page',
								'is_post_type_archive',
								'is_date',
								'is_category',
								'is_author',
							),
					),
				array(
						'token'            => '%is_user_logged_in%',
						'callback'         => 'is_user_logged_in',
						'callback_returns' => 'bool',
						'description'      => __( 'Whether or not the viewer is logged in', 'wp-google-analytics' ),
						'retval'           => __( "'true' or 'false'", 'wp-google-analytics' ),
					),
			);

		$this->tokens = apply_filters( 'wga_tokens', $this->tokens );
	}

	/**
	 * This adds the options page for this plugin to the Options page
	 */
	public function admin_menu() {
		add_options_page(__('Google Analytics', 'wp-google-analytics'), __('Google Analytics', 'wp-google-analytics'), 'manage_options', self::$page_slug, array( $this, 'settings_view' ) );
	}

	/**
	 * Register our settings
	 */
	public function admin_init() {

		register_setting( 'wga', 'wga', array( $this, 'sanitize_general_options' ) );

		add_settings_section( 'wga_general', false, '__return_false', 'wga' );
		add_settings_field( 'code', __( 'Google Analytics tracking ID:', 'wp-google-analytics' ), array( $this, 'field_code' ), 'wga', 'wga_general' );
		add_settings_field( 'additional_items', __( 'Additional items to log:', 'wp-google-analytics' ), array( $this, 'field_additional_items' ), 'wga', 'wga_general' );
		add_settings_field( 'do_not_track', __( 'Visits to ignore:', 'wp-google-analytics' ), array( $this, 'field_do_not_track' ), 'wga', 'wga_general' );
		add_settings_field( 'other_options', __( 'Other options:', 'wp-google-analytics' ), array( $this, 'field_other_options' ), 'wga', 'wga_general' );
		add_settings_field( 'custom_vars', __( 'Custom variables:', 'wp-google-analytics' ), array( $this, 'field_custom_variables' ), 'wga', 'wga_general' );
	}

	/**
	 * Where the user adds their Google Analytics code
	 */
	public function field_code() {
		// Display the tokens in the right column of the page
		echo '<div id="tokens-description" style="position:absolute;margin-left:600px;margin-right:50px;">';
		echo '<span>' . __( 'Use tokens in your custom variables to make your fields dynamic based on context. Here are some of the tokens you can use:' ) . '</span>';
		echo '<table style="text-align:left;">';
		echo '<thead><tr><td>' . __( 'Token', 'wp-google-analytics' ) . '</td><td>' . __( 'Description', 'wp-google-analytics' ) . '</td><td>' . __( 'Return value', 'wp-google-analytics' ) . '</td></tr></thead>';
		echo '<tbody>';
		foreach( $this->tokens as $token ) {
			echo '<tr>';
			echo '<td>' . esc_html( $token['token'] ) . '</td>';
			echo '<td>' . esc_html( $token['description'] ) . '</td>';
			echo '<td>' . esc_html( $token['retval'] ) . '</td>';
			echo '</tr>';
		}
		echo '</tbody>';
		echo '</table>';
		echo '</div>';

		echo '<input name="wga[code]" id="wga-code" type="text" value="' . esc_attr( $this->_get_options( 'code' ) ) . '" />';
		echo '<p class="description">' . __( 'Paste your Google Analytics tracking ID (e.g. "UA-XXXXXX-X") into the field.', 'wp-google-analytics' ) . '</p>';
	}

	/**
	 * Option to log additional items
	 */
	public function field_additional_items() {
		$addtl_items = array(
				'log_404s'       => __( 'Log 404 errors as events', 'wp-google-analytics' ),
				'log_searches'   => sprintf( __( 'Log searches as /search/{search}?referrer={referrer} (<a href="%s">deprecated</a>)', 'wp-google-analytics' ), 'http://wordpress.org/extend/plugins/wp-google-analytics/faq/' ),
				'log_outgoing'   => __( 'Log outgoing links as events', 'wp-google-analytics' ),
			);
		foreach( $addtl_items as $id => $label ) {
			echo '<label for="wga_' . $id . '">';
			echo '<input id="wga_' . $id . '" type="checkbox" name="wga[' . $id . ']" value="true" ' . checked( 'true', $this->_get_options( $id ), false ) . ' />';
			echo '&nbsp;&nbsp;' . $label;
			echo '</label><br />';
		}
	}

	/**
	 * Define custom variables to be included in your tracking code
	 */
	public function field_custom_variables() {

		$custom_vars = $this->_get_options( 'custom_vars' );

		$scope_options = array(
				0 => __( 'Default', 'wp-google-analytics' ),
				1 => __( 'Visitor', 'wp-google-analytics' ),
				2 => __( 'Session', 'wp-google-analytics' ),
				3 => __( 'Page', 'wp-google-analytics' ),
			);
		for ( $i = 1; $i <= 5; $i++ ) {
			$name = ( isset( $custom_vars[$i]['name'] ) ) ? $custom_vars[$i]['name'] : '';
			$value = ( isset( $custom_vars[$i]['value'] ) ) ? $custom_vars[$i]['value'] : '';
			$scope = ( isset( $custom_vars[$i]['scope'] ) ) ? $custom_vars[$i]['scope'] : 0;
			echo '<label for="wga_custom_var_' . $i . '_name"><strong>' . $i . ')</strong>&nbsp;' . __( 'Name', 'wp-google-analytics' ) . '&nbsp;';
			echo '<input id="wga_custom_var_' . $i . '" type="text" name="wga[custom_vars][' . $i . '][name]" value="' . esc_attr( $name ) . '" />';
			echo '</label>&nbsp;&nbsp;';
			echo '<label for="wga_custom_var_' . $i . '_value">' . __( 'Value', 'wp-google-analytics' ) . '&nbsp;';
			echo '<input id="wga_custom_var_' . $i . '" type="text" name="wga[custom_vars][' . $i . '][value]" value="' . esc_attr( $value ) . '" />';
			echo '</label>&nbsp;&nbsp;';
			echo '<label for="wga_custom_var_' . $i . '_scope">' . __( 'Scope', 'wp-google-analytics' ) . '&nbsp;';
			echo '<select id="wga_custom_var_' . $i . '_scope" name="wga[custom_vars][' . $i . '][scope]">';
			foreach( $scope_options as $key => $label ) {
				echo '<option value="' . $key . '" ' . selected( $scope, $key, false ) . '>';
				echo $label . '</option>';
			}
			echo '</select>';
			echo '</label><br />';
		}

	}

	public function field_do_not_track() {
		$do_not_track = array(
				'ignore_admin_area'       => __( 'Do not log anything in the admin area', 'wp-google-analytics' ),
			);
		global $wp_roles;
		foreach( $wp_roles->roles as $role => $role_info ) {
			$do_not_track['ignore_role_' . $role] = sprintf( __( 'Do not log %s when logged in', 'wp-google-analytics' ), rtrim( $role_info['name'], 's' ) );
		}
		foreach( $do_not_track as $id => $label ) {
			echo '<label for="wga_' . $id . '">';
			echo '<input id="wga_' . $id . '" type="checkbox" name="wga[' . $id . ']" value="true" ' . checked( 'true', $this->_get_options( $id ), false ) . ' />';
			echo '&nbsp;&nbsp;' . $label;
			echo '</label><br />';
		}
	}
	
	/**
	 * Options that don't belong anywhere else.
	 */
	public function field_other_options() {
		$other_options = array(
			'enable_display_advertising'	=> sprintf( __( 'Enable <a href="%s">Display Advertising</a>', 'wp-google-analytics' ), 'https://support.google.com/analytics/answer/2444872?hl=en&utm_id=ad' ),
			);
			
		foreach( $other_options as $id => $label ) {
			echo '<label for="wga_' . $id . '">';
			echo '<input id="wga_' . $id . '" type="checkbox" name="wga[' . $id . ']" value="true" ' . checked( 'true', $this->_get_options( $id ), false ) . ' />';
			echo '&nbsp;&nbsp;' . $label;
			echo '</label><br />';
		}
	}

	/**
	 * Sanitize all of the options associated with the plugin
	 */
	public function sanitize_general_options( $in ) {

		$out = array();

		// The actual tracking ID
		if ( preg_match( '#UA-[\d-]+#', $in['code'], $matches ) )
			$out['code'] = $matches[0];
		else
			$out['code'] = '';

		$checkbox_items = array(
				// Additional items you can track
				'log_404s',
				'log_searches',
				'log_outgoing',
				'enable_display_advertising',
				// Things to ignore
				'ignore_admin_area',
			);
		global $wp_roles;
		foreach( $wp_roles->roles as $role => $role_info ) {
			$checkbox_items[] = 'ignore_role_' . $role;
		}
		foreach( $checkbox_items as $checkbox_item ) {
			if ( isset( $in[$checkbox_item] ) && 'true' == $in[$checkbox_item] )
				$out[$checkbox_item] = 'true';
			else
				$out[$checkbox_item] = 'false';
		}

		// Custom variables
		for( $i = 1; $i <= 5; $i++ ) {
			foreach( array( 'name', 'value', 'scope' ) as $key ) {
				if ( isset( $in['custom_vars'][$i][$key] ) )
					$out['custom_vars'][$i][$key] = sanitize_text_field( $in['custom_vars'][$i][$key] );
				else
					$out['custom_vars'][$i][$key] = '';
			}
		}

		return $out;
	}

	/**
	 * This is used to display the options page for this plugin
	 */
	public function settings_view() {
?>
		<div class="wrap">
			<h2><?php _e('Google Analytics Options', 'wp-google-analytics') ?></h2>
			<form action="options.php" method="post" id="wp_google_analytics">
				<?php
					settings_fields( 'wga' );
					do_settings_sections( 'wga' );
					submit_button( __( 'Update Options', 'wp-google-analytics' ) );
				?>
			</form>
		</div>
<?php
	}

	/**
	 * Used to generate a tracking URL
	 *
	 * @param array $track - Must have ['data'] and ['code']
	 * @return string - Tracking URL
	 */
	private function _get_url($track) {
		$site_url = ( is_ssl() ? 'https://':'http://' ).$_SERVER['HTTP_HOST'];
		foreach ($track as $k=>$value) {
			if (strpos(strtolower($value), strtolower($site_url)) === 0) {
				$track[$k] = substr($track[$k], strlen($site_url));
			}
			if ($k == 'data') {
				$track[$k] = preg_replace("/^https?:\/\/|^\/+/i", "", $track[$k]);
			}

			//This way we don't lose search data.
			if ($k == 'data' && $track['code'] == 'search') {
				$track[$k] = urlencode($track[$k]);
			} else {
				$track[$k] = preg_replace("/[^a-z0-9\.\/\+\?=-]+/i", "_", $track[$k]);
			}

			$track[$k] = trim($track[$k], '_');
		}
		$char = (strpos($track['data'], '?') === false)? '?':'&amp;';
		return str_replace("'", "\'", "/{$track['code']}/{$track['data']}{$char}referer=" . urlencode( isset( $_SERVER['HTTP_REFERER'] ) ? $_SERVER['HTTP_REFERER'] : '' ) );
	}

	/**
	 * Maybe output or return, depending on the context
	 */
	private function _output_or_return( $val, $maybe ) {
		if ( $maybe )
			echo $val . "\r\n";
		else
			return $val;
	}

	/**
	 * This injects the Google Analytics code into the footer of the page.
	 *
	 * @param bool[optional] $output - defaults to true, false returns but does NOT echo the code
	 */
	public function insert_code( $output = true ) {
		//If $output is not a boolean false, set it to true (default)
		$output = ($output !== false);

		$tracking_id = $this->_get_options( 'code' );
		if ( empty( $tracking_id ) )
			return $this->_output_or_return( '<!-- Your Google Analytics Plugin is missing the tracking ID -->', $output );

		//get our plugin options
		$wga = $this->_get_options();
		//If the user's role has wga_no_track set to true, return without inserting code
		if ( is_user_logged_in() ) {
			$current_user = wp_get_current_user();
			$role = array_shift( $current_user->roles );
			if ( 'true' == $this->_get_options( 'ignore_role_' . $role ) )
				return $this->_output_or_return( "<!-- Google Analytics Plugin is set to ignore your user role -->", $output );
		}

		//If $admin is true (we're in the admin_area), and we've been told to ignore_admin_area, return without inserting code
		if (is_admin() && (!isset($wga['ignore_admin_area']) || $wga['ignore_admin_area'] != 'false'))
			return $this->_output_or_return( "<!-- Your Google Analytics Plugin is set to ignore Admin area -->", $output );

		$custom_vars = array(
			"_gaq.push(['_setAccount', '{$tracking_id}']);",
		);

		// Add custom variables specified by the user
		foreach( $this->_get_options( 'custom_vars', array() ) as $i => $custom_var ) {
			if ( empty( $custom_var['name'] ) || empty( $custom_var['value'] ) )
				continue;

			// Check whether a token was used with this custom var, and replace with value if so
			$all_tokens = wp_list_pluck( $this->tokens, 'token' );
			if ( in_array( $custom_var['value'], $all_tokens ) ) {
				$token = array_pop( wp_filter_object_list( $this->tokens, array( 'token' => $custom_var['value'] ) ) );

				// Allow tokens to return empty values for specific contexts
				$ignore = false;
				if ( ! empty( $token['ignore_when'] ) ) {
					foreach( (array)$token['ignore_when'] as $conditional ) {
						if ( is_callable( $conditional ) ) {
							$ignore = call_user_func( $conditional );
							if ( $ignore )
								break;
						}
					}
				}

				// If we aren't set to ignore this context, possibly execute the callback
				if ( ! $ignore && ! empty( $token['callback'] ) && is_callable( $token['callback'] ) )
					$replace = call_user_func( $token['callback'] );
				else
					$replace = '';

				if ( ! empty( $token['callback_returns'] ) && 'bool' == $token['callback_returns'] )
					$replace = ( $replace ) ? 'true' : 'false';

				// Replace our token with the value
				$custom_var['value'] = str_replace( $custom_var['value'], $replace, $custom_var['value'] );
			}

			$atts = array(
					"'_setCustomVar'",
					intval( $i ),
					"'" . esc_js( $custom_var['name'] ) . "'",
					"'" . esc_js( $custom_var['value'] ) . "'",
				);
			if ( $custom_var['scope'] )
				$atts[] = intval( $custom_var['scope'] );
			$custom_vars[] = "_gaq.push([" . implode( ', ', $atts ) . "]);";
		}

		$track = array();
		if (is_404() && (!isset($wga['log_404s']) || $wga['log_404s'] != 'false')) {
			// This is a 404 and we are supposed to track them
			$custom_vars[] = "_gaq.push( [ '_trackEvent', '404', document.location.href, document.referrer ] );";
		} elseif (is_search() && (!isset($wga['log_searches']) || $wga['log_searches'] != 'false')) {
			//Set track for searches, if it's a search, and we are supposed to
			$track['data'] = $_REQUEST['s'];
			$track['code'] = "search";
		}

		if ( ! empty( $track ) ) {
			$track['url'] = $this->_get_url( $track );
			//adjust the code that we output, account for both types of tracking
			$track['url'] = esc_js( str_replace( '&', '&amp;', $track['url'] ) );
			$custom_vars[] = "_gaq.push(['_trackPageview','{$track['url']}']);";
		} else {
			$custom_vars[] = "_gaq.push(['_trackPageview']);";
		}

		if ($wga['enable_display_advertising'] == 'true' ) {
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
	 * @param string[optional] $option - Name of options you want.  Do not use if you want ALL options
	 * @return array of options, or option value
	 */
	private function _get_options( $option = null, $default = false ) {

		$o = get_option('wga');

		if (isset($option)) {

			if (isset($o[$option])) {
				if ( 'code' == $option ) {
					if ( preg_match( '#UA-[\d-]+#', $o[$option], $matches ) )
						return $matches[0];
					else
						return '';
				} else
					return $o[$option];
			} else {
				if ( 'ignore_role_' == substr( $option, 0, 12 ) ) {
					global $wp_roles;
					// Backwards compat for when the tracking information was stored as a cap
					$maybe_role = str_replace( 'ignore_role_', '', $option );
					if ( isset( $wp_roles->roles[$maybe_role] ) ) {
						if ( isset( $wp_roles->roles[$maybe_role]['capabilities']['wga_no_track'] ) && $wp_roles->roles[$maybe_role]['capabilities']['wga_no_track'] )
							return 'true';
					}
					return false;
				}
				return $default;
			}
		} else {
			return $o;
		}
	}

	/**
	 * If we track outgoing links, this will enqueue our javascript file
	 */
	public function track_outgoing() {
		if ( 'true' == $this->_get_options( 'log_outgoing' ) && (!defined('XMLRPC_REQUEST') || !XMLRPC_REQUEST) && ( ! is_admin() || 'false' == $this->_get_options( 'ignore_admin_area' ) ) )
			wp_enqueue_script( 'wp-google-analytics', plugin_dir_url( __FILE__ ) . 'wp-google-analytics.js', array( 'jquery' ), '0.0.3' );
	}

	/**
	 * Callback for %the_category% token
	 */
	public function token_the_category() {
		return implode( ', ', wp_list_pluck( (array)get_the_category(), 'name' ) );
	}

	/**
	 * Callback for %context% token
	 */
	public function token_context() {
		if ( is_admin() ) {
			return 'admin';
		} else if ( is_home() || is_front_page() ) {
			return 'home';
		} else if ( is_tax() || is_tag() || is_category() ) {
			return get_queried_object()->taxonomy;
		} else if ( is_author() ) {
			return 'author';
		} else if ( is_singular() || is_single() || is_page() ) {
			return get_post_type();
		} else if ( is_search() ) {
			return 'search';
		} else if ( is_date() ) {
			return 'date';
		} else if ( is_archive() ) {
			return 'archive';
		} else if ( is_404() ) {
			return '404';
		}
	}

	/**
	 * Callback for %the_tags% token
	 */
	public function token_the_tags() {
		return implode( ', ', wp_list_pluck( (array)get_the_tags(), 'name' ) );
	}

	public function add_plugin_page_links( $links, $file ){
		if ( plugin_basename( __FILE__ ) == $file ) {
			$link = '<a href="' . admin_url( 'options-general.php?page=' . self::$page_slug ) . '">' . __( 'Settings', 'wp-google-analytics' ) . '</a>';
			array_unshift( $links, $link );
		}
		return $links;
	}

}

global $wp_google_analytics;
$wp_google_analytics = wpGoogleAnalytics::get_instance();
