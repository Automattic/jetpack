<?php

class A8C_WPCOM_Masterbar {
	private $site_slug = '';

	function __construct() {
		$this->site_slug = $this->get_site_slug();

		add_action( 'wp_before_admin_bar_render', array( $this, 'replace_core_masterbar' ), 99999 );
		add_action( 'wp_head', array( $this, 'add_styles' ) );
		add_action( 'admin_head', array( $this, 'add_styles' ) );
	}

	public function add_styles() {
		wp_register_style( 'a8c_wpcom_masterbar', plugins_url( 'masterbar.css', __FILE__ ) );
		wp_enqueue_style( 'a8c_wpcom_masterbar');
	}

	public function get_site_slug() {
		$url = get_site_url();
		$url = parse_url( $url );
		$url = $url['host'] . untrailingslashit( $url['path'] );

		return str_replace( '/', '::', $url );
	}

	public function replace_core_masterbar() {
		$this->clear_core_masterbar();
		$this->build_masterbar();
	}

	// Remove all existing toolbar entries from core Masterbar
	public function clear_core_masterbar() {
		global $wp_admin_bar;

		foreach ( $wp_admin_bar->get_nodes() as $node ) {
			$wp_admin_bar->remove_node( $node->id );
		}
	}

	public function build_masterbar() {
		global $wp_admin_bar;

		// Left
		$wp_admin_bar->add_group( array( 'id' => 'mb-primary' ) );

		// My Sites
		$wp_admin_bar->add_node( array(
			'id' => 'mb-my-sites',
			'title' => __( 'My Sites', 'jetpack' ),
			'href' => 'https://wordpress.com/stats/' . $this->site_slug,
			'parent' => 'mb-primary'
		) );

		// Reader
		$wp_admin_bar->add_node( array(
			'id' => 'mb-reader',
			'title' => __( 'Reader', 'jetpack' ),
			'href' => 'https://wordpress.com/',
			'parent' => 'mb-primary'
		) );

		// Right
		$wp_admin_bar->add_group( array( 'id' => 'mb-secondary' ) );

		// Write
		$wp_admin_bar->add_node( array(
			'id' => 'mb-write',
			'title' => __( 'Write', 'jetpack' ),
			'href' => 'https://wordpress.com/post/' . $this->site_slug,
			'parent' => 'mb-secondary'
		) );

		// Me
		$wp_admin_bar->add_node( array(
			'id' => 'mb-me',
			'title' => get_avatar( wp_get_current_user(), 36, 'mm' ),
			'href' => 'https://wordpress.com/me/',
			'parent' => 'mb-secondary'
		) );

		// Notifications
		$wpcom_locale = get_locale();

		if ( !class_exists( 'GP_Locales' ) ) {
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			}
		}

		if ( class_exists( 'GP_Locales' ) ) {
			$wpcom_locale_object = GP_Locales::by_field( 'wp_locale', get_locale() );
			if ( $wpcom_locale_object instanceof GP_Locale ) {
				$wpcom_locale = $wpcom_locale_object->slug;
			}
		}

		$wp_admin_bar->add_node( array(
			'id'     => 'notes',
			'title'  => '<span id="wpnt-notes-unread-count" class="wpnt-loading wpn-read">
							<span class="noticon noticon-bell"></span>
						</span>',
			'meta'   => array(
				'html'  => '<div id="wpnt-notes-panel2" style="display:none" lang="'. esc_attr( $wpcom_locale ) . '" dir="' . ( is_rtl() ? 'rtl' : 'ltr' ) . '">' .
				            '<div class="wpnt-notes-panel-header">' .
				                '<span class="wpnt-notes-header">' .
				                    __( 'Notifications', 'jetpack' ) .
				                '</span>' .
				                '<span class="wpnt-notes-panel-link">' .
				                '</span>' .
				            '</div>' .
				           '</div>',
				'class' => 'menupop',
			),
			'parent' => 'mb-secondary',
		) );
	}
}
