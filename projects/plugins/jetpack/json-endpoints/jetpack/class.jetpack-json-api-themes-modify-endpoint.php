<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// POST  /sites/%s/themes/%s
	// POST  /sites/%s/themes

	protected $needed_capabilities = 'update_themes';
	protected $action              = 'default_action';
	protected $expected_actions    = array( 'update', 'update_translations' );

	public function default_action() {
		$args = $this->input();
		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) ) {
			if ( $args['autoupdate'] ) {
				$this->autoupdate_on();
			} else {
				$this->autoupdate_off();
			}
		}
		if ( isset( $args['autoupdate_translations'] ) && is_bool( $args['autoupdate_translations'] ) ) {
			if ( $args['autoupdate_translations'] ) {
				$this->autoupdate_translations_on();
			} else {
				$this->autoupdate_translations_off();
			}
		}

		return true;
	}

	function autoupdate_on() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		$autoupdate_themes = array_unique( array_merge( $autoupdate_themes, $this->themes ) );
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );
	}

	function autoupdate_off() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		$autoupdate_themes = array_diff( $autoupdate_themes, $this->themes );
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );
	}

	function autoupdate_translations_on() {
		$autoupdate_themes_translations = Jetpack_Options::get_option( 'autoupdate_themes_translations', array() );
		$autoupdate_themes_translations = array_unique( array_merge( $autoupdate_themes_translations, $this->themes ) );
		Jetpack_Options::update_option( 'autoupdate_themes_translations', $autoupdate_themes_translations );
	}

	function autoupdate_translations_off() {
		$autoupdate_themes_translations = Jetpack_Options::get_option( 'autoupdate_themes_translations', array() );
		$autoupdate_themes_translations = array_diff( $autoupdate_themes_translations, $this->themes );
		Jetpack_Options::update_option( 'autoupdate_themes_translations', $autoupdate_themes_translations );
	}

	function update() {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Clear the cache.
		wp_update_themes();

		foreach ( $this->themes as $theme ) {
			/**
			 * Pre-upgrade action
			 * 
			 * @since 3.9.3
			 * 
			 * @param object $theme WP_Theme object
			 * @param array $themes Array of theme objects
			 */
			do_action('jetpack_pre_theme_upgrade', $theme, $this->themes);
			// Objects created inside the for loop to clean the messages for each theme
			$skin = new Automatic_Upgrader_Skin();
			$upgrader = new Theme_Upgrader( $skin );
			$upgrader->init();
			$result   = $upgrader->upgrade( $theme );
			$this->log[ $theme ][] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && ! $result ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your theme', 'jetpack' ), 400 );
		}

		return true;
	}

	function update_translations() {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Clear the cache.
		wp_update_themes();
	
		$available_themes_updates = get_site_transient( 'update_themes' );
		
		if ( ! isset( $available_themes_updates->translations ) || empty( $available_themes_updates->translations ) ) {
			return new WP_Error( 'nothing_to_translate' );
		}

		foreach( $available_themes_updates->translations as $translation ) {
			$theme = $translation['slug'] ;
			if ( ! in_array( $translation['slug'], $this->themes )  ) {
				$this->log[ $theme ][] = __( 'No update needed', 'jetpack' );
				continue;
			}

			/**
			 * Pre-upgrade action
			 *
			 * @since 4.4.0
			 *
			 * @param object $theme WP_Theme object
			 * @param array $themes Array of theme objects
			 */
			do_action( 'jetpack_pre_theme_upgrade_translations', $theme, $this->themes );
			// Objects created inside the for loop to clean the messages for each theme
			$skin = new Automatic_Upgrader_Skin();
			$upgrader = new Language_Pack_Upgrader( $skin );
			$upgrader->init();

			$result   = $upgrader->upgrade( (object) $translation );
			$this->log[ $theme ] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && ! $result ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your theme', 'jetpack' ), 400 );
		}

		return true;
	}

}
