<?php
/**
 * Unifies admin color scheme selection across WP.com sites.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status\Host;

/**
 * Unifies admin color scheme selection across WP.com sites.
 *
 * @phan-constructor-used-for-side-effects
 */
class Admin_Color_Schemes {

	/**
	 * A list of core color schemes to override.
	 *
	 * @var array
	 */
	const CORE_COLOR_SCHEMES = array( 'blue', 'coffee', 'ectoplasm', 'fresh', 'light', 'midnight', 'modern', 'ocean', 'sunrise' );

	/**
	 * A list of WP.com color schemes that are now deprecated.
	 *
	 * @var array
	 */
	const WPCOM_COLOR_SCHEMES = array( 'aquatic', 'classic-blue', 'classic-bright', 'classic-dark', 'contrast', 'nightfall', 'powder-snow', 'sakura', 'sunset' );

	/**
	 * Admin_Color_Schemes constructor.
	 */
	public function __construct() {
		// We want to register the admin color schemes across all environments.
		add_action( 'admin_init', array( $this, 'register_admin_color_schemes' ) );
		add_action( 'admin_notices', array( $this, 'show_deprecated_admin_color_scheme_notice' ) );
		add_action( 'admin_color_scheme_picker', array( $this, 'move_admin_color_schemes_last' ), 11 );
		// We don't want to make the admin_color available in users REST API endpoint for Simple sites.
		if ( false === ( new Host() )->is_wpcom_simple() ) {
			add_action( 'rest_api_init', array( $this, 'register_admin_color_meta' ) );
		}

		if ( ( new Host() )->is_wpcom_platform() ) { // Simple and Atomic sites.
			add_filter( 'css_do_concat', array( $this, 'disable_css_concat_for_color_schemes' ), 10, 2 );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_color_scheme_for_sidebar_notice' ) );
		}
	}

	/**
	 * Makes admin_color available in users REST API endpoint.
	 */
	public function register_admin_color_meta() {
		register_meta(
			'user',
			'admin_color',
			array(
				'auth_callback' => array( $this, 'update_admin_color_permissions_check' ),
				'description'   => __( 'Slug of the admin color scheme.', 'jetpack-masterbar' ),
				'single'        => true,
				'show_in_rest'  => array(
					'schema' => array( 'default' => 'fresh' ),
				),
				'type'          => 'string',
			)
		);
	}

	/**
	 * Permission callback to edit the `admin_color` user meta.
	 *
	 * @param bool   $allowed   Whether the given user is allowed to edit this meta value.
	 * @param string $meta_key  Meta key. In this case `admin_color`.
	 * @param int    $object_id Queried user ID.
	 * @return bool
	 */
	public function update_admin_color_permissions_check( $allowed, $meta_key, $object_id ) {
		return current_user_can( 'edit_user', $object_id );
	}

	/**
	 * Get the admin color scheme URL based on the environment
	 *
	 * @param string $color_scheme  The color scheme to get the URL for.
	 * @param string $file          The file name (optional, default: colors.css).
	 * @return string
	 */
	public function get_admin_color_scheme_url( $color_scheme, $file = 'colors.css' ) {
		return plugins_url( '../../dist/admin-color-schemes/colors/' . $color_scheme . '/' . $file, __FILE__ );
	}

	/**
	 * Gets the translated names of the color schemes, keyed by slug.
	 *
	 * @return array
	 */
	private function get_admin_color_scheme_names() {
		return array(
			'aquatic'        => __( 'Aquatic', 'jetpack-masterbar' ),
			'classic-blue'   => __( 'Classic Blue', 'jetpack-masterbar' ),
			'classic-bright' => __( 'Classic Bright', 'jetpack-masterbar' ),
			'classic-dark'   => __( 'Classic Dark', 'jetpack-masterbar' ),
			'contrast'       => __( 'Contrast', 'jetpack-masterbar' ),
			'nightfall'      => __( 'Nightfall', 'jetpack-masterbar' ),
			'powder-snow'    => __( 'Powder Snow', 'jetpack-masterbar' ),
			'sakura'         => __( 'Sakura', 'jetpack-masterbar' ),
			'sunset'         => __( 'Sunset', 'jetpack-masterbar' ),
		);
	}

	/**
	 * Gets a color scheme's name, marked as deprecated.
	 *
	 * @param string $color_scheme The color scheme slug.
	 * @return string
	 */
	private function get_admin_color_scheme_name( $color_scheme ) {
		/* translators: %s: Admin color scheme name, e.g. "Aquatic". */
		return sprintf( __( '%s (Deprecated)', 'jetpack-masterbar' ), $this->get_admin_color_scheme_names()[ $color_scheme ] );
	}

	/**
	 * Registers new admin color schemes
	 */
	public function register_admin_color_schemes() {
		global $_wp_admin_css_colors;

		// Adds custom CSS overrides for Fresh
		if ( isset( $_wp_admin_css_colors['fresh'] ) ) {
			$fresh = $_wp_admin_css_colors['fresh'];
			wp_admin_css_color(
				'fresh',
				$fresh->name,
				$this->get_admin_color_scheme_url( 'fresh' ),
				$fresh->colors,
				$fresh->icon_colors
			);
		}

		wp_admin_css_color(
			'aquatic',
			$this->get_admin_color_scheme_name( 'aquatic' ),
			$this->get_admin_color_scheme_url( 'aquatic' ),
			array( '#135e96', '#007e65', '#043959', '#c5d9ed' ),
			array(
				'base'    => '#c5d9ed',
				'focus'   => '#fff',
				'current' => '#01263a',
			)
		);

		wp_admin_css_color(
			'classic-blue',
			$this->get_admin_color_scheme_name( 'classic-blue' ),
			$this->get_admin_color_scheme_url( 'classic-blue' ),
			array( '#135e96', '#b26200', '#dcdcde', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#2271b1',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'classic-bright',
			$this->get_admin_color_scheme_name( 'classic-bright' ),
			$this->get_admin_color_scheme_url( 'classic-bright' ),
			array( '#135e96', '#c9256e', '#ffffff', '#e9eff5' ),
			array(
				'base'    => '#646970',
				'focus'   => '#1d2327',
				'current' => '#0a4b78',
			)
		);

		wp_admin_css_color(
			'classic-dark',
			$this->get_admin_color_scheme_name( 'classic-dark' ),
			$this->get_admin_color_scheme_url( 'classic-dark' ),
			array( '#101517', '#c9356e', '#32373c', '#0073aa' ),
			array(
				'base'    => '#a2aab2',
				'focus'   => '#00b9eb',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'contrast',
			$this->get_admin_color_scheme_name( 'contrast' ),
			$this->get_admin_color_scheme_url( 'contrast' ),
			array( '#101517', '#ffffff', '#32373c', '#b4b9be' ),
			array(
				'base'    => '#1d2327',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'nightfall',
			$this->get_admin_color_scheme_name( 'nightfall' ),
			$this->get_admin_color_scheme_url( 'nightfall' ),
			array( '#00131c', '#043959', '#2271b1', '#9ec2e6' ),
			array(
				'base'    => '#9ec2e6',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'powder-snow',
			$this->get_admin_color_scheme_name( 'powder-snow' ),
			$this->get_admin_color_scheme_url( 'powder-snow' ),
			array( '#101517', '#2271b1', '#dcdcde', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#135e96',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'sakura',
			$this->get_admin_color_scheme_name( 'sakura' ),
			$this->get_admin_color_scheme_url( 'sakura' ),
			array( '#005042', '#f2ceda', '#2271b1', '#8c1749' ),
			array(
				'base'    => '#8c1749',
				'focus'   => '#4f092a',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'sunset',
			$this->get_admin_color_scheme_name( 'sunset' ),
			$this->get_admin_color_scheme_url( 'sunset' ),
			array( '#691c1c', '#b26200', '#f0c930', '#facfd2' ),
			array(
				'base'    => '#facfd2',
				'focus'   => '#fff',
				'current' => '#4f3500',
			)
		);
	}

	/**
	 * Asks users who still use a deprecated color scheme to switch to another one.
	 */
	public function show_deprecated_admin_color_scheme_notice() {
		$color_scheme = get_user_option( 'admin_color' );
		if ( ! in_array( $color_scheme, static::WPCOM_COLOR_SCHEMES, true ) ) {
			return;
		}

		wp_admin_notice(
			sprintf(
				/* translators: 1: Admin color scheme name, e.g. "Aquatic". 2: URL of the user profile page. */
				__( 'Your current <strong>%1$s</strong> admin color scheme is now deprecated and will be removed soon. <a href="%2$s">Choose a different color scheme</a>.', 'jetpack-masterbar' ),
				esc_html( $this->get_admin_color_scheme_names()[ $color_scheme ] ),
				esc_url( admin_url( 'profile.php#color-picker' ) )
			),
			array(
				'type' => 'warning',
			)
		);
	}

	/**
	 * Moves the admin color schemes to the end of the color scheme picker.
	 */
	public function move_admin_color_schemes_last() {
		wp_print_inline_script_tag(
			sprintf(
				'document.addEventListener( "DOMContentLoaded", function () {
					var picker = document.getElementById( "color-picker" );
					if ( ! picker ) {
						return;
					}
					%s.forEach( function ( slug ) {
						var input = document.getElementById( "admin_color_" + slug );
						if ( input ) {
							picker.appendChild( input.parentNode );
						}
					} );
				} );',
				wp_json_encode( static::WPCOM_COLOR_SCHEMES, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP )
			)
		);
	}

	/**
	 * Enqueues current color-scheme sidebar notice overrides for core color schemes
	 */
	public function enqueue_color_scheme_for_sidebar_notice() {
		$color_scheme = get_user_option( 'admin_color' );
		if ( in_array( $color_scheme, static::CORE_COLOR_SCHEMES, true ) ) {
			wp_enqueue_style(
				'jetpack-core-color-schemes-overrides-sidebar-notice',
				$this->get_admin_color_scheme_url( $color_scheme, 'sidebar-notice.css' ),
				array(),
				Main::PACKAGE_VERSION
			);
		}
	}

	/**
	 * Currently, the selected color scheme CSS (with id = "colors") is concatenated (by Jetpack Boost / Page Optimize),
	 * and is output before the default color scheme CSS, making it lose in specificity.
	 *
	 * To prevent this, we disable CSS concatenation for color schemes.

	 * @param boolean $do_concat  Whether to concat the CSS file.
	 * @param string  $handle     The file handle.
	 * @return boolean
	 */
	public function disable_css_concat_for_color_schemes( $do_concat, $handle ) {
		if ( $handle === 'colors' ) {
			return false;
		}
		return $do_concat;
	}
}
