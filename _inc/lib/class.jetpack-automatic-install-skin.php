<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

/**
 * Allows us to capture that the site doesn't have proper file system access.
 * In order to update the plugin.
 */
class Jetpack_Automatic_Install_Skin extends Automatic_Upgrader_Skin {
	/**
	 * Stores the last error key;
	 **/
	protected $main_error_code = 'install_error';

	/**
	 * Stores the last error message.
	 **/
	protected $main_error_message = 'An unknown error occurred during installation';

	/**
	 * Overwrites the set_upgrader to be able to tell if we e ven have the ability to write to the files.
	 *
	 * @param WP_Upgrader $upgrader
	 *
	 */
	public function set_upgrader( &$upgrader ) {
		parent::set_upgrader( $upgrader );

		// Check if we even have permission to.
		$result = $upgrader->fs_connect( array( WP_CONTENT_DIR, WP_PLUGIN_DIR ) );
		if ( ! $result ) {
			// set the string here since they are not available just yet
			$upgrader->generic_strings();
			$this->feedback( 'fs_unavailable' );
		}
	}

	/**
	 * Overwrites the error function
	 */
	public function error( $error ) {
		if ( is_wp_error( $error ) ) {
			$this->feedback( $error );
		}
	}

	private function set_main_error_code( $code ) {
		// Don't set the process_failed as code since it is not that helpful unless we don't have one already set.
		$this->main_error_code = ( $code === 'process_failed' && $this->main_error_code ? $this->main_error_code : $code );
	}

	private function set_main_error_message( $message, $code ) {
		// Don't set the process_failed as message since it is not that helpful unless we don't have one already set.
		$this->main_error_message = ( $code === 'process_failed' && $this->main_error_code ? $this->main_error_code : $message );
	}

	public function get_main_error_code() {
		return $this->main_error_code;
	}

	public function get_main_error_message() {
		return $this->main_error_message;
	}

	/**
	 * Overwrites the feedback function
	 */
	public function feedback( $data ) {

		$current_error = null;
		if ( is_wp_error( $data ) ) {
			$this->set_main_error_code( $data->get_error_code() );
			$string = $data->get_error_message();
		} elseif ( is_array( $data ) ) {
			return;
		} else {
			$string = $data;
		}

		if ( ! empty( $this->upgrader->strings[$string] ) ) {
			$this->set_main_error_code( $string );

			$current_error = $string;
			$string        = $this->upgrader->strings[$string];
		}

		if ( strpos( $string, '%' ) !== false ) {
			// phpcs:ignore PHPCompatibility.FunctionUse.ArgumentFunctionsReportCurrentValue.NeedsInspection
			$args = func_get_args();
			$args = array_splice( $args, 1 );
			if ( ! empty( $args ) ) {
				$string = vsprintf( $string, $args );
			}
		}

		$string = trim( $string );
		$string = wp_kses(
			$string, array(
			'a'      => array(
				'href' => true
			),
			'br'     => true,
			'em'     => true,
			'strong' => true,
		)
		);

		$this->set_main_error_message( $string, $current_error );
		$this->messages[] = $string;
	}
}
