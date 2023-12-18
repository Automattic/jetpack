<?php
/**
 * Site Integrity Checker file.
 *
 * @package wpcomsh
 */

namespace Imports;

require_once __DIR__ . '/../utils/class-filerestorer.php';
require_once __DIR__ . '/../class-backup-import-action.php';

use Imports\Utils\FileRestorer;

/**
 * Class Playground_Site_Integrity_Check
 *
 * The Playground_Site_Integrity_Check class provides a mechanism for checking the integrity of the site.
 */
class Playground_Site_Integrity_Check extends \Imports\Backup_Import_Action {
	/**
	 * Performs a check to verify the integrity of the site.
	 *
	 * This method calls the check_active_theme method to ensure that the currently active theme is installed.
	 *
	 * @return bool Always returns true.
	 */
	public function check() {
		$this->check_active_theme();
		return true;
	}

	/**
	 * Checks if the currently active theme is installed and installs it if it's not.
	 *
	 * @return bool Always returns true.
	 */
	private function check_active_theme() {
		$current_theme_slug = get_stylesheet();
		$this->log( 'Current active theme found:' . $current_theme_slug );
		$theme = wp_get_theme( $current_theme_slug );
		if ( ! $theme->exists() ) {
			// The theme is not installed
			$this->log( 'Current theme' . $current_theme_slug . ' is not installed. Installing it now.' );
			$result = FileRestorer::install_theme( $current_theme_slug );
			$this->log( 'Install theme result: ' . $result );
		}

		return true;
	}
}
