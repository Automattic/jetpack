<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Themes modify endpoint class.
 * POST  /sites/%s/themes/%s
 * POST  /sites/%s/themes
 * POST  /sites/%s/themes/%s/update
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	/**
	 * Needed capabilities.
	 *
	 * @var string
	 */
	protected $needed_capabilities = 'update_themes';

	/**
	 * The action.
	 *
	 * @var string
	 */
	protected $action = 'default_action';

	/**
	 * Expected actions.
	 *
	 * @var array
	 */
	protected $expected_actions = array( 'update', 'update_translations' );

	/**
	 * The default action.
	 *
	 * @return bool
	 */
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

	/**
	 * Turn autoupdate on.
	 *
	 * Writes both WP core's `auto_update_themes` site option, so wp-admin's native
	 * auto-update UI stays in sync, and the legacy Jetpack option, which is still
	 * read by format_theme() and Jetpack_Autoupdate.
	 */
	public function autoupdate_on() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		$autoupdate_themes = array_unique( array_merge( $autoupdate_themes, $this->themes ) );
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );

		$core_autoupdate_themes = (array) get_site_option( 'auto_update_themes', array() );
		$core_autoupdate_themes = array_unique( array_merge( $core_autoupdate_themes, $this->themes ) );
		update_site_option( 'auto_update_themes', $core_autoupdate_themes );
	}

	/**
	 * Turn autoupdate off.
	 *
	 * Clears the themes from both WP core's `auto_update_themes` site option and
	 * the legacy Jetpack option; see autoupdate_on().
	 */
	public function autoupdate_off() {
		$autoupdate_themes = Jetpack_Options::get_option( 'autoupdate_themes', array() );
		$autoupdate_themes = array_diff( $autoupdate_themes, $this->themes );
		Jetpack_Options::update_option( 'autoupdate_themes', $autoupdate_themes );

		$core_autoupdate_themes = (array) get_site_option( 'auto_update_themes', array() );
		$core_autoupdate_themes = array_values( array_diff( $core_autoupdate_themes, $this->themes ) );
		update_site_option( 'auto_update_themes', $core_autoupdate_themes );
	}

	/**
	 * Autoupdate translations on.
	 */
	public function autoupdate_translations_on() {
		$autoupdate_themes_translations = Jetpack_Options::get_option( 'autoupdate_themes_translations', array() );
		$autoupdate_themes_translations = array_unique( array_merge( $autoupdate_themes_translations, $this->themes ) );
		Jetpack_Options::update_option( 'autoupdate_themes_translations', $autoupdate_themes_translations );
	}

	/**
	 * Autoupdate translations off.
	 */
	public function autoupdate_translations_off() {
		$autoupdate_themes_translations = Jetpack_Options::get_option( 'autoupdate_themes_translations', array() );
		$autoupdate_themes_translations = array_diff( $autoupdate_themes_translations, $this->themes );
		Jetpack_Options::update_option( 'autoupdate_themes_translations', $autoupdate_themes_translations );
	}

	/**
	 * Update the theme.
	 *
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	public function update() {
		$query_args = $this->query_args();

		$is_automatic_update = ! empty( $query_args['autoupdate'] );

		wp_clean_themes_cache( false );
		ob_start();
		wp_update_themes(); // Check for Theme updates
		ob_end_clean();

		$update_themes = get_site_transient( 'update_themes' );

		if ( isset( $update_themes->response ) ) {
			$theme_updates_needed = array_keys( $update_themes->response );
		} else {
			$theme_updates_needed = array();
		}

		$update_attempted = false;

		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// unhook this functions that output things before we send our response header.
		remove_action( 'upgrader_process_complete', array( 'Language_Pack_Upgrader', 'async_upgrade' ), 20 );
		remove_action( 'upgrader_process_complete', 'wp_version_check' );
		remove_action( 'upgrader_process_complete', 'wp_update_plugins' );

		// Early return if unable to obtain auto_updater lock.
		// @see https://github.com/WordPress/wordpress-develop/blob/66469efa99e7978c8824e287834135aa9842e84f/src/wp-admin/includes/class-wp-automatic-updater.php#L453.
		if ( $is_automatic_update && ! WP_Upgrader::create_lock( 'auto_updater' ) ) {
			return new WP_Error( 'update_fail', __( 'Updates are already in progress.', 'jetpack' ), 400 );
		}

		$result = false;

		foreach ( $this->themes as $theme ) {

			if ( ! in_array( $theme, $theme_updates_needed, true ) ) {
				$this->log[ $theme ][] = __( 'No update needed', 'jetpack' );
				continue;
			}

			// Rely on WP_Automatic_Updater class to check if a theme item should be updated if it is a Jetpack autoupdate request.
			if ( $is_automatic_update && ! ( new WP_Automatic_Updater() )->should_update( 'theme', (object) $update_themes->response[ $theme ], get_theme_root( $theme ) ) ) {
				continue;
			}

			// Establish per theme lock.
			if ( ! WP_Upgrader::create_lock( 'jetpack_theme_' . $theme ) ) {
				continue;
			}

			/**
			 * Pre-upgrade action
			 *
			 * @since 3.9.3
			 *
			 * @param object $theme WP_Theme object
			 * @param array $themes Array of theme objects
			 */
			do_action( 'jetpack_pre_theme_upgrade', $theme, $this->themes );

			$update_attempted = true;

			// Objects created inside the for loop to clean the messages for each theme
			$skin     = new WP_Ajax_Upgrader_Skin();
			$upgrader = new Theme_Upgrader( $skin );
			$upgrader->init();
			// Using bulk upgrade puts the site into maintenance mode when the active theme is being updated.
			$result              = $upgrader->bulk_upgrade( array( $theme ) );
			$errors              = $skin->get_errors();
			$this->log[ $theme ] = $skin->get_upgrade_messages();

			// release individual theme lock.
			WP_Upgrader::release_lock( 'jetpack_theme_' . $theme );

			if ( is_wp_error( $errors ) && $errors->get_error_code() ) {
				if ( $is_automatic_update ) {
					WP_Upgrader::release_lock( 'auto_updater' );
				}
				return $errors;
			}
		}

		// release auto_updater lock.
		if ( $is_automatic_update ) {
			WP_Upgrader::release_lock( 'auto_updater' );
		}

		if ( ! $this->bulk && ! $result && $update_attempted ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your theme', 'jetpack' ), 400 );
		}

		return $this->default_action();
	}

	/**
	 * Update translations.
	 *
	 * @return bool|WP_Error
	 */
	public function update_translations() {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		// Clear the cache.
		wp_clean_themes_cache( false );
		ob_start();
		wp_update_themes(); // Check for Theme updates
		ob_end_clean();

		$available_themes_updates = get_site_transient( 'update_themes' );

		if ( ! isset( $available_themes_updates->translations ) || empty( $available_themes_updates->translations ) ) {
			return new WP_Error( 'nothing_to_translate' );
		}

		$result = null;
		foreach ( $available_themes_updates->translations as $translation ) {
			$theme = $translation['slug'];
			if ( ! in_array( $translation['slug'], $this->themes, true ) ) {
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
			$skin     = new Automatic_Upgrader_Skin();
			$upgrader = new Language_Pack_Upgrader( $skin );
			$upgrader->init();

			$result              = $upgrader->upgrade( (object) $translation );
			$this->log[ $theme ] = $upgrader->skin->get_upgrade_messages();
		}

		if ( ! $this->bulk && ! $result ) {
			return new WP_Error( 'update_fail', __( 'There was an error updating your theme', 'jetpack' ), 400 );
		}

		return true;
	}
}
