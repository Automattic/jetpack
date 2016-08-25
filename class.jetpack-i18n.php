<?php

/**
 * Jetpack i18n handler.
 *
 * Takes care of things that are not yet taken care of by the WordPress.org i18n
 * infrastructure, like JavaScript language packs.
 */

defined( 'ABSPATH' ) or die( 'No direct access.' );

// If the i18n directory and url aren't defined by config, use the default.
if ( ! defined( 'JETPACK_I18N_DIR' ) ) {
	define( 'JETPACK_I18N_DIR', WP_CONTENT_DIR . '/jetpack-i18n' );
}
if ( ! defined( 'JETPACK_I18N_URL' ) ) {
	define( 'JETPACK_I18N_URL', WP_CONTENT_URL . '/jetpack-i18n' );
}

class Jetpack_I18n {

	public static function activate() {
		if ( ! file_exists( JETPACK_I18N_DIR ) ) {
			wp_mkdir_p( JETPACK_I18N_DIR, 0660 );
		} else if ( ! is_dir( JETPACK_I18N_DIR ) ) {
			error_log( 'Expected ' . JETPACK_I18N_DIR . ' to be a directory.' );
		}
	}

	public static function deactivate() {
		if ( is_dir( JETPACK_I18N_DIR ) ) {

			// Delete the i18n files.
			$file_mask = 'jetpack-*.js';
			$files = glob( trailingslashit( JETPACK_I18N_DIR ) . $file_mask );
			foreach ( $files as $file ) {
				unlink( $file );
			}

			// Remove the directory.
			rmdir( JETPACK_I18N_DIR );
		}
	}

	/**
	 * Queues PO to JSON conversion when needed.
	 */
	public function maybe_generate_translation_files() {
		$next_event = wp_next_scheduled(
			'jetpack_generate_translation_files',
			array( get_locale() )
		);
		$po_file    = $this->get_po_file_path( get_locale() );

		// We can only do conversion if the PO file exists
		// and we don't want to queue this up twice.
		if ( file_exists( $po_file ) && ( ! $next_event || $next_event < time() ) ) {
			$translation_info = wp_get_pomo_file_data( $po_file );
			$revision         = strtotime( $translation_info['PO-Revision-Date'] );
			$js_file        = $this->get_i18n_js_file_path( get_locale() );

			/**
			 * There are 2 case where we'd want to do a conversion;
			 *  - if the JSON file does not exist
			 *  - if the JSON file is out of date
			 */
			if (
				! file_exists( $js_file )
				|| $revision > get_option( 'jetpack_i18n_revision_' . get_locale(), 0 )
			) {
				wp_schedule_single_event(
					time() + 10,
					'jetpack_generate_translation_files',
					array( get_locale() )
				);
			}
		}
	}

	/**
	 * Generates the translation files for a locale.
	 * @param  string $locale
	 */
	public function generate_translation_files( $locale = '' ) {
		$locale           = $locale ? $locale : get_locale();
		$po_file          = $this->get_po_file_path( $locale );
		$js_file          = $this->get_i18n_js_file_path( $locale );
		$translation_info = wp_get_pomo_file_data( $po_file );
		$revision         = strtotime( $translation_info['PO-Revision-Date'] );

		// Parse PO file
		$po_data   = $this->parse_po_file( $po_file );

		// Convert entries to JSON
		$json      = $this->po2json(
			$po_data['headers'],
			$po_data['entries'],
			'jetpack'
		);

		// Write to file
		$this->create_js_language_file( $json, $js_file );

		// Record the revision and locale
		update_option( 'jetpack_i18n_revision_' . $locale, $revision );
		wp_clear_scheduled_hook(
			'jetpack_generate_translation_files',
			array( $locale )
		);
	}
}