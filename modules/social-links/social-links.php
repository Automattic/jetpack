<?php
/**
 * Social Links.
 *
 * This feature will only be activated for themes that declare their support.
 * This can be done by adding code similar to the following during the
 * 'after_setup_theme' action:
 *
 * add_theme_support( 'social-links', array(
 *     'facebook', 'twitter', 'linkedin', 'tumblr',
 * ) );
 */

class Social_Links {

	/**
	 * A Publicize object.
	 *
	 * @var Publicize
	 */
	private $publicize;

	/**
	 * An array with all services that are supported by both Publicize and the
	 * currently active theme.
	 *
	 * @var array
	 */
	private $services;

	/**
	 * Conditionally hook into WordPress.
	 *
	 * If Publicise is not activated, there is no need to hook into WordPress.
	 * We'll just return early instead.
	 */
	public function __construct() {

		if ( ! class_exists( 'Publicize' ) ) {
			add_action( 'admin_notices', array( $this, 'admin_notice' ) );
			return;
		}

		global $publicize;
		$theme_support = get_theme_support( 'social-links' );

		/* An array of named arguments must be passed as the second parameter
		 * of add_theme_support().
		 */
		if ( ! isset( $theme_support[0] ) || empty( $theme_support[0] ) || ! isset( $publicize ) )
			return;

		$this->publicize = $publicize;

		$this->services  = array_intersect(
			array_keys( $this->publicize->get_services( 'connected' ) ),
			$theme_support[0]
		);

		add_action( 'customize_register', array( $this, 'customize_register' ) );
		add_action( 'switch_theme',       array( $this, 'update_theme_mods'  ) );
	}

	/**
	 * Let the user know about activation Publicize - otherwise the theme lacks
	 * social links.
	 */
	public function admin_notice() {
		add_settings_error( 'jetpack_social_links', 'publicize-not-activated', __( "Your theme supports Jetpack's Social Links. Please activate Publicize to start connecting services.", 'jetpack' ), 'updated' );
		settings_errors( 'jetpack_social_links' );
	}

	/**
	 * Add social link dropdown to the Customizer.
	 *
	 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
	 */
	public function customize_register( $wp_customize ) {
		$wp_customize->add_section( 'jetpack_social_links', array(
			'title'    => __( 'Connect', 'jetpack' ),
			'priority' => 35,
		) );

		foreach ( $this->services as $service ) {
			$wp_customize->add_setting( "jetpack-$service", array(
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
			) );

			$wp_customize->add_control( "jetpack-$service", array(
				'label'   => $this->publicize->get_service_label( $service ),
				'section' => 'jetpack_social_links',
				'type'    => 'select',
				'choices' => $this->get_customize_select( $service ),
			) );
		}
	}

	/**
	 * Transfers user selected social links from theme to theme.
	 */
	public function update_theme_mods() {
		$old_name = get_option( 'theme_switched' );
		$old_mods = (array) get_option( "mods_$old_name" );

		foreach ( array_keys( $this->publicize->get_services() ) as $service )
			if ( isset( $old_mods[ "jetpack-$service" ] ) )
				set_theme_mod( "jetpack-$service", $old_mods[ "jetpack-$service" ] );
	}

	/**
	 * Puts together an array of choices for a specific service.
	 *
	 * @param string $service The social service.
	 * @return array An associative array with profile links and display names.
	 */
	private function get_customize_select( $service ) {
		$choices = array(
			'' => __( '&mdash; Select &mdash;', 'jetpack' )
		);

		$connected_services = $this->publicize->get_services( 'connected' );
		if ( isset( $connected_services[ $service ] ) )
			foreach ( $connected_services[ $service ] as $c )
				$choices[ $this->publicize->get_profile_link( $service, $c ) ] = $this->publicize->get_display_name( $service, $c );

		return $choices;
	}
}

$jetpack_social_links = new Social_Links;
