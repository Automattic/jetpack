<?php
/**
 * Upgrader API: Language_Pack_Upgrader_Skin class
 *
 * @package WordPress
 * @subpackage Upgrader
 * @since 4.6.0
 */

/**
 * Translation Upgrader Skin for WordPress Translation Upgrades.
 *
 * @since 3.7.0
 * @since 4.6.0 Moved to its own file from wp-admin/includes/class-wp-upgrader-skins.php.
 *
 * @see WP_Upgrader_Skin
 */
class Language_Pack_Upgrader_Skin extends WP_Upgrader_Skin {
	public $language_update        = null;
	public $done_header            = false;
	public $done_footer            = false;
	public $display_footer_actions = true;

	/**
	 * @param array $args
	 */
	public function __construct( $args = array() ) {
		$defaults = array(
			'url'                => '',
			'nonce'              => '',
			'title'              => __( 'Update Translations' ),
			'skip_header_footer' => false,
		);
		$args     = wp_parse_args( $args, $defaults );
		if ( $args['skip_header_footer'] ) {
			$this->done_header            = true;
			$this->done_footer            = true;
			$this->display_footer_actions = false;
		}
		parent::__construct( $args );
	}

	/**
	 */
	public function before() {
		$name = $this->upgrader->get_name_for_update( $this->language_update );

		echo '<div class="update-messages lp-show-latest">';

		/* translators: 1: Project name (plugin, theme, or WordPress), 2: Language. */
		printf( '<h2>' . __( 'Updating translations for %1$s (%2$s)&#8230;' ) . '</h2>', $name, $this->language_update->language );
	}

	/**
	 * @since 5.9.0 Renamed `$error` to `$errors` for PHP 8 named parameter support.
	 *
	 * @param string|WP_Error $errors Errors.
	 */
	public function error( $errors ) {
		echo '<div class="lp-error">';
		parent::error( $errors );
		echo '</div>';
	}

	/**
	 */
	public function after() {
		echo '</div>';
	}

	/**
	 */
	public function bulk_footer() {
		$this->decrement_update_count( 'translation' );

		$update_actions = array(
			'updates_page' => sprintf(
				'<a href="%s" target="_parent">%s</a>',
				self_admin_url( 'update-core.php' ),
				__( 'Go to WordPress Updates page' )
			),
		);

		/**
		 * Filters the list of action links available following a translations update.
		 *
		 * @since 3.7.0
		 *
		 * @param string[] $update_actions Array of translations update links.
		 */
		$update_actions = apply_filters( 'update_translations_complete_actions', $update_actions );

		if ( $update_actions && $this->display_footer_actions ) {
			$this->feedback( implode( ' | ', $update_actions ) );
		}
	}
}
