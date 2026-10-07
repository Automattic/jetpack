<?php
/**
 * Stands in for the plugin class the settings screen uses opportunistically.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

require_once __DIR__ . '/class-sharing-sources.php';

/**
 * A `Sharing_Service` that records the global options rather than saving them,
 * and offers only the services a test asks for.
 */
class Sharing_Service {

	/**
	 * The translated label `set_global_options()` stores as `false`.
	 *
	 * @var string
	 */
	public $default_sharing_label;

	/**
	 * Translate the default label, as the real one does.
	 */
	public function __construct() {
		$this->default_sharing_label = __( 'Share this:', 'jetpack' ); // phpcs:ignore WordPress.WP.I18n.TextDomainMismatch -- the real class's string, so tests can translate it.
	}

	/**
	 * Record a save.
	 *
	 * @param array<string,mixed> $data Posted data.
	 */
	public function set_global_options( $data ) {
		$GLOBALS['sharing_likes_test_global_options'] = $data;
	}

	/**
	 * Store the enabled services, as the real one does.
	 *
	 * @param array $visible Visible service IDs.
	 * @param array $hidden  Service IDs behind the "More" button.
	 */
	public function set_blog_services( array $visible, array $hidden ) {
		$available = array_keys( $this->get_all_services_blog() );
		$visible   = array_intersect( $visible, $available );
		$hidden    = array_diff( array_intersect( $hidden, $available ), $visible );

		do_action( 'sharing_get_services_state', compact( 'visible', 'hidden' ) );

		return update_option( 'sharing-services', compact( 'visible', 'hidden' ) );
	}

	/**
	 * The stored services, or none: the real class would fall back to its defaults.
	 *
	 * @return array
	 */
	public function get_blog_services() {
		$enabled = get_option( 'sharing-services' );
		$all     = $this->get_all_services_blog();
		$blog    = array(
			'visible' => array(),
			'hidden'  => array(),
		);

		foreach ( array_keys( $blog ) as $area ) {
			foreach ( (array) ( $enabled[ $area ] ?? array() ) as $id ) {
				if ( isset( $all[ $id ] ) ) {
					$blog[ $area ][ $id ] = $all[ $id ];
				}
			}
		}

		$blog['all'] = array_flip( array_merge( array_keys( $blog['visible'] ), array_keys( $blog['hidden'] ) ) );

		return $blog;
	}

	/**
	 * Services the tests opt into through `sharing_likes_test_services`, plus the stored custom ones.
	 *
	 * @return array<string, Sharing_Source>
	 */
	public function get_all_services_blog() {
		$services = array();

		foreach ( $GLOBALS['sharing_likes_test_services'] ?? array() as $id ) {
			$services[ $id ] = new Sharing_Source( $id, array() );
		}

		$options = get_option( 'sharing-options' );

		foreach ( $options['global']['custom'] ?? array() as $id ) {
			$services[ $id ] = new Share_Custom( $id, is_array( $options[ $id ] ?? null ) ? $options[ $id ] : array() );
		}

		return $services;
	}

	/**
	 * Create a custom service, rejecting empty details as the real class does.
	 *
	 * @param string $label Service name.
	 * @param string $url   Sharing URL.
	 * @param string $icon  Icon URL.
	 * @return Share_Custom|false
	 */
	public function new_service( $label, $url, $icon ) {
		$label = trim( wp_html_excerpt( wp_kses( $label, array() ), 30 ) );
		$url   = trim( esc_url_raw( $url ) );
		$icon  = trim( esc_url_raw( $icon ) );

		if ( ! $label || ! $url || ! $icon ) {
			return false;
		}

		$options = get_option( 'sharing-options' );
		if ( ! is_array( $options ) ) {
			$options = array();
		}

		$id = 'custom-' . ( 1000 + count( $options['global']['custom'] ?? array() ) );

		$options['global']['custom'][] = $id;
		update_option( 'sharing-options', $options );

		$service = new Share_Custom(
			$id,
			array(
				'name' => $label,
				'url'  => $url,
				'icon' => $icon,
			)
		);
		$this->set_service( $id, $service );

		return $service;
	}

	/**
	 * Store a service's options.
	 *
	 * @param string                  $id      Service ID.
	 * @param Sharing_Advanced_Source $service Service.
	 */
	public function set_service( $id, Sharing_Advanced_Source $service ) {
		$options        = get_option( 'sharing-options' );
		$options[ $id ] = $service->get_options();
		update_option( 'sharing-options', $options );
	}

	/**
	 * Forget a custom service.
	 *
	 * @param string $service_id Service ID.
	 * @return bool
	 */
	public function delete_service( $service_id ) {
		$options = get_option( 'sharing-options' );
		unset( $options[ $service_id ] );
		$options['global']['custom'] = array_values( array_diff( $options['global']['custom'] ?? array(), array( $service_id ) ) );
		update_option( 'sharing-options', $options );

		return true;
	}

	/**
	 * The stored global options, or the real class's defaults when none are stored.
	 *
	 * The real class also saves those defaults on that first read.
	 *
	 * @return array
	 */
	public function get_global_options() {
		$options = get_option( 'sharing-options' );

		if ( is_array( $options ) && isset( $options['global'] ) && is_array( $options['global'] ) ) {
			$global = $options['global'];
		} else {
			$global = array(
				'button_style'  => 'icon-text',
				'sharing_label' => false,
				'open_links'    => 'same',
				'show'          => array( 'post', 'page' ),
				'custom'        => array(),
			);

			update_option( 'sharing-options', array( 'global' => $global ) );
		}

		if ( ! isset( $global['show'] ) ) {
			$global['show'] = array( 'post', 'page' );
		}

		if ( ! isset( $global['sharing_label'] ) || false === $global['sharing_label'] || 'Share this:' === $global['sharing_label'] ) {
			$global['sharing_label'] = $this->default_sharing_label;
		}

		return $global;
	}
}
