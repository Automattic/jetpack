<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Theme Tools: Social Links.
 *
 * This feature will only be activated for themes that declare their support.
 * This can be done by adding code similar to the following during the
 * 'after_setup_theme' action:
 *
 * add_theme_support( 'social-links', array(
 *     'facebook', 'twitter', 'linkedin', 'tumblr',
 * ) );
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack\Classic_Theme_Helper;

use Automattic\Jetpack\Publicize\Publicize;
use Jetpack_Options;
use WP_Customize_Manager;

if ( ! class_exists( __NAMESPACE__ . '\Social_Links' ) ) {

	/**
	 * Social_Links main class.
	 */
	class Social_Links {

		/**
		 * The links the user set for each service.
		 *
		 * @var array
		 */
		private static $links;

		/**
		 * A Publicize object.
		 *
		 * @var Publicize
		 */
		private static $publicize;

		/**
		 * An array with all services that are supported by both Publicize and the
		 * currently active theme.
		 *
		 * @var array
		 */
		private static $services = array();

		/**
		 * An array of the services the theme supports
		 *
		 * @var array
		 */
		private static $theme_supported_services = array();

		/**
		 * Instantiate.
		 *
		 * All custom functionality will be hooked into the "init" action.
		 */
		public static function setup() {
			add_action( 'init', array( __CLASS__, 'init' ), 30 );
		}

		/**
		 * Conditionally hook into WordPress.
		 *
		 * Themes must declare that they support this module by adding
		 * add_theme_support( 'social-links' ); during after_setup_theme.
		 *
		 * If no theme support is found there is no need to hook into WordPress. We'll
		 * just return early instead.
		 */
		public static function init() {
			if ( ! ( ! wp_is_block_theme() && current_theme_supports( 'social-links' ) && function_exists( 'publicize_init' ) ) ) {
				return;
			}
			$theme_support = get_theme_support( 'social-links' );

			/*
			An array of named arguments must be passed as the second parameter
			 * of add_theme_support().
			 */
			if ( empty( $theme_support[0] ) ) {
				return;
			}

			self::$theme_supported_services = $theme_support[0];
			self::$links                    = class_exists( Jetpack_Options::class ) ? Jetpack_Options::get_option( 'social_links', array() ) : '';

			self::admin_setup();

			add_filter( 'jetpack_has_social_links', array( __CLASS__, 'has_social_links' ) );
			add_filter( 'jetpack_get_social_links', array( __CLASS__, 'get_social_links' ) );

			foreach ( $theme_support[0] as $service ) {
				add_filter( "pre_option_jetpack-$service", array( __CLASS__, 'get_social_link_filter' ) ); // - `get_option( 'jetpack-service' );`
				add_filter( "theme_mod_jetpack-$service", array( __CLASS__, 'get_social_link_filter' ) ); // - `get_theme_mod( 'jetpack-service' );`
			}
		}

		/**
		 * Init the admin setup.
		 */
		public static function admin_setup() {
			if ( ! current_user_can( 'manage_options' ) ) {
				return;
			}

			if ( ! is_admin() && ! self::is_customize_preview() ) {
				return;
			}

			// @phan-suppress-next-line PhanUndeclaredFunction -- Function checked with function_exists - see https://github.com/phan/phan/issues/1204.
			self::$publicize    = function_exists( 'publicize_init' ) ? publicize_init() : null;
			$publicize_services = self::$publicize->get_services( 'connected' );
			self::$services     = array_intersect( array_keys( $publicize_services ), self::$theme_supported_services );

			add_action( 'publicize_connected', array( __CLASS__, 'check_links' ), 20 );
			add_action( 'publicize_disconnected', array( __CLASS__, 'check_links' ), 20 );
			add_action( 'customize_register', array( __CLASS__, 'customize_register' ) );
			add_filter( 'sanitize_option_jetpack_options', array( __CLASS__, 'sanitize_link' ) );
		}

		/**
		 * Compares the currently saved links with the connected services and removes
		 * links from services that are no longer connected.
		 *
		 * @return void
		 */
		public static function check_links() {
			$active_links = array_intersect_key( self::$links, array_flip( self::$services ) );

			if ( $active_links !== self::$links ) {
				self::$links = $active_links;
				if ( class_exists( Jetpack_Options::class ) ) {
					Jetpack_Options::update_option( 'social_links', $active_links );
				}
			}
		}

		/**
		 * Add social link dropdown to the Customizer.
		 *
		 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
		 */
		public static function customize_register( $wp_customize ) {
			$wp_customize->add_section(
				'jetpack_social_links',
				array(
					'title'    => esc_html__( 'Connect', 'jetpack-classic-theme-helper' ),
					'priority' => 35,
				)
			);

			if ( class_exists( Publicize::class ) ) {
				foreach ( array_keys( self::$publicize->get_services( 'all' ) ) as $service ) {
					$choices = self::get_customize_select( $service );

					if ( empty( $choices ) ) {
						continue;
					}

					$wp_customize->add_setting(
						"jetpack_options[social_links][$service]",
						array(
							'type'    => 'option',
							'default' => '',
						)
					);

					$wp_customize->add_control(
						"jetpack-$service",
						array(
							'label'    => self::$publicize->get_service_label( $service ),
							'section'  => 'jetpack_social_links',
							'settings' => "jetpack_options[social_links][$service]",
							'type'     => 'select',
							'choices'  => $choices,
						)
					);
				}
			}
		}

		/**
		 * Sanitizes social links.
		 *
		 * @param array $option The incoming values to be sanitized.
		 * @return array
		 */
		public static function sanitize_link( $option ) {
			foreach ( self::$services as $service ) {
				if ( ! empty( $option['social_links'][ $service ] ) ) {
					$option['social_links'][ $service ] = esc_url_raw( $option['social_links'][ $service ] );
				} else {
					unset( $option['social_links'][ $service ] );
				}
			}

			return $option;
		}

		/**
		 * Returns whether there are any social links set.
		 *
		 * @return bool
		 */
		public static function has_social_links() {
			return ! empty( self::$links );
		}

		/**
		 * Return available social links.
		 *
		 * @return array
		 */
		public static function get_social_links() {
			return self::$links;
		}

		/**
		 * Short-circuits get_option and get_theme_mod calls.
		 *
		 * @param string $link The incoming value to be replaced.
		 * @return string $link The social link that we've got.
		 */
		public static function get_social_link_filter( $link ) {
			if ( preg_match( '/_jetpack-(.+)$/i', current_filter(), $matches ) && ! empty( self::$links[ $matches[1] ] ) ) {
				return self::$links[ $matches[1] ];
			}

			return $link;
		}

		/**
		 * Puts together an array of choices for a specific service.
		 *
		 * @param string $service The social service.
		 * @return array An associative array with profile links and display names.
		 */
		private static function get_customize_select( $service ) {
			$choices = array(
				'' => __( '&mdash; Select &mdash;', 'jetpack-classic-theme-helper' ),
			);

			if ( isset( self::$links[ $service ] ) ) {
				$choices[ self::$links[ $service ] ] = self::$links[ $service ];
			}

			if ( class_exists( Publicize::class ) ) {
				$connected_services = self::$publicize->get_services( 'connected' );
				if ( isset( $connected_services[ $service ] ) ) {
					foreach ( $connected_services[ $service ] as $c ) {
						$profile_link = self::$publicize->get_profile_link( $service, $c );

						if ( false === $profile_link ) {
							continue;
						}

						$choices[ $profile_link ] = self::$publicize->get_display_name( $service, $c );
					}
				}
			}

			if ( 1 === count( $choices ) ) {
				return array();
			}

			return $choices;
		}

		/**
		 * Back-compat function for versions prior to 4.0.
		 */
		private static function is_customize_preview() {
			global $wp_customize;
			return is_a( $wp_customize, 'WP_Customize_Manager' ) && $wp_customize->is_preview();
		}
	}

} // - end if ( ! class_exists( 'Social_Links' )
