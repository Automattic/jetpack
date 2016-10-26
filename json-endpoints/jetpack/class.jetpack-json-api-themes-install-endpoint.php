<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

class Jetpack_JSON_API_Themes_Install_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST  /sites/%s/themes/%s/install
	protected $needed_capabilities = 'install_themes';
	protected $action              = 'install';
	protected $download_links      = array();

	protected function install() {

		foreach ( $this->themes as $theme ) {

			$skin      = new Automatic_Upgrader_Skin();
			$upgrader  = new Theme_Upgrader( $skin );

			$link = $this->download_links[ $theme ];
			$result = $upgrader->install( $link );

			if ( file_exists( $link ) ) {
			// Delete if link was tmp local file
				 error_log( 'deleting' );
				 error_log( unlink( $link ) );
			}

			if ( ! $this->bulk && is_wp_error( $result ) ) {
				return $result;
			}

			if ( ! $result ) {
				$error = $this->log[ $theme ]['error'] = __( 'An unknown error occurred during installation', 'jetpack' );
			}

			elseif ( ! self::is_installed_theme( $theme ) ) {
				$error = $this->log[ $theme ]['error'] = __( 'There was an error installing your theme', 'jetpack' );
			}

			else {
				$this->log[ $theme ][] = $upgrader->skin->get_upgrade_messages();
			}
		}

		if ( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'install_error', $error, 400 );
		}

		return true;
	}

	protected function validate_themes() {
		if ( empty( $this->themes ) || ! is_array( $this->themes ) ) {
			return new WP_Error( 'missing_themes', __( 'No themes found.', 'jetpack' ) );
		}
		foreach( $this->themes as $index => $theme ) {
			if ( wp_endswith( $theme, '-wpcom' ) ) {
				// install from wpcom
				$wpcom_theme_slug = preg_replace( '/-wpcom$/', '', $theme );

				if ( self::is_installed_theme( $wpcom_theme_slug ) ) {
					return new WP_Error( 'theme_already_installed', __( 'The theme is already installed', 'jetpack' ) );
				}

				$file = self::download_wpcom_theme_to_file( $wpcom_theme_slug );
				if ( is_wp_error( $file ) ) {
					return $file;
				}

				$this->download_links[ $theme ] = $file;
				continue;
			}

			if ( self::is_installed_theme( $theme ) ) {
				return new WP_Error( 'theme_already_installed', __( 'The theme is already installed', 'jetpack' ) );
			}

			$params = (object) array( 'slug' => $theme );
			$url = 'https://api.wordpress.org/themes/info/1.0/';
			$args = array(
				'body' => array(
					'action' => 'theme_information',
					'request' => serialize( $params ),
				)
			);
			$response = wp_remote_post( $url, $args );
			$theme_data = unserialize( $response['body'] );
			if ( is_wp_error( $theme_data ) ) {
				return $theme_data;
			}
			$this->download_links[ $theme ] = $theme_data->download_link;

		}
		return true;
	}

	protected static function is_installed_theme( $theme ) {
		$wp_theme = wp_get_theme( $theme );
		return $wp_theme->exists();
	}

	protected static function download_wpcom_theme_to_file( $theme ) {
		$url = "themes/download/$theme.zip";
		$result = Jetpack_Client::wpcom_json_api_request_as_blog( $url );

		$file = tempnam( sys_get_temp_dir(), 'theme' );
		if ( ! $file ) {
			return new WP_Error( 'problem_creating_theme_file', __( 'Problem creating file for theme download', 'jetpack' ) );
		}

		$handle = fopen( $file, 'wb' );
		if ( ! $handle ) {
			return new WP_Error( 'problem_opening_theme_file', __( 'Problem opening file for theme download', 'jetpack' ) );
		}

		if ( ! fwrite( $handle, $result[ "body" ] ) ) {
			return new WP_Error( 'problem_writing_theme_file', __( 'Problem downloading theme', 'jetpack' ) );
		}

		fclose( $handle );
		return $file;
	}
}
