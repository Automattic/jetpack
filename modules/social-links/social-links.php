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

		foreach ( $this->services as $service ) {
			// Enable the `get_option( 'jetpack-service' );` shortcut
			add_filter( "pre_option_jetpack-{$service}", array( $this, 'get_social_link_filter' ) );
			// Enable the `get_theme_mod( 'jetpack-service' );` shortcut
			add_filter( "theme_mod_jetpack-{$service}", array( $this, 'get_social_link_filter' ) );
		}
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
			$wp_customize->add_setting( "jetpack_options[social_links][$service]", array(
				'type'              => 'option',
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
			) );

			$wp_customize->add_control( "jetpack-$service", array(
				'label'    => $this->publicize->get_service_label( $service ),
				'section'  => 'jetpack_social_links',
				'settings' => "jetpack_options[social_links][$service]",
				'type'     => 'select',
				'choices'  => $this->get_customize_select( $service ),
			) );
		}
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

	/**
	 * Short-circuits get_option and get_theme_mod calls.
	 * add_filter( "pre_option_jetpack-{$service}", array( $this, 'get_social_link_filter' ) );
	 * add_filter( "theme_mod_jetpack-{$service}", array( $this, 'get_social_link_filter' ) );
	 *
	 * @param $link The incoming value to be replaced.
	 * @returns $link The social link that we've got.
	 */
	public function get_social_link_filter( $link ) {
		if ( preg_match( '/_jetpack-(.+)$/i', current_filter(), $matches ) ) {
			$service = $matches[1];
			if ( in_array( $service, $this->services ) ) {
				$link = $this->get_link( $service );
			}
		}
		return $link;
	}

	/**
	 * Just a shortcut to the serialized Jetpack options.
	 *
	 * @param string $service The name of the service that we're looking for.
	 * @param string $default The data to return if we've not got anything on file.
	 * @returns string $link The social link that we've got, or the default if not.
	 */
	private function get_link( $service, $default = '' ) {
		$links = Jetpack::get_option( 'social_links', array() );
		if( ! empty( $links[ $service ] ) )
			return $links[ $service ];

		return $default;
	}

}

$jetpack_social_links = new Social_Links;
