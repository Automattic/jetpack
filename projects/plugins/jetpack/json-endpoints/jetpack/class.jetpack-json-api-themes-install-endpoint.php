<?php

include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
include_once ABSPATH . 'wp-admin/includes/file.php';

use Automattic\Jetpack\Automatic_Install_Skin;
use Automattic\Jetpack\Connection\Client;

class Jetpack_JSON_API_Themes_Install_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST  /sites/%s/themes/%s/install
	protected $needed_capabilities = 'install_themes';
	protected $action              = 'install';
	protected $download_links      = array();

	protected function install() {

		foreach ( $this->themes as $theme ) {

			/**
			 * Filters whether to use an alternative process for installing a WordPress.com theme.
			 * The alternative process can be executed during the filter.
			 *
			 * The filter can also return an instance of WP_Error; in which case the endpoint response will
			 * contain this error.
			 *
			 * @module json-api
			 *
			 * @since 4.4.2
			 *
			 * @param bool   $use_alternative_install_method Whether to use the alternative method of installing
			 *                                               a WPCom theme.
			 * @param string $theme_slug                     Theme name (slug). If it is a WPCom theme,
			 *                                               it should be suffixed with `-wpcom`.
			 */
			$result = apply_filters( 'jetpack_wpcom_theme_install', false, $theme );

			$skin = null;
			$upgrader = null;
			$link = null;

			// If the alternative install method was not used, use the standard method.
			if ( ! $result ) {
				$skin     = new Automatic_Install_Skin();
				$upgrader = new Theme_Upgrader( $skin );

				$link   = $this->download_links[ $theme ];
				$result = $upgrader->install( $link );
			}

			if ( file_exists( $link ) ) {
				// Delete if link was tmp local file
				unlink( $link );
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

			elseif ( $upgrader ) {
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

			if ( self::is_installed_theme( $theme ) ) {
				return new WP_Error( 'theme_already_installed', __( 'The theme is already installed', 'jetpack' ) );
			}

			/**
			 * Filters whether to skip the standard method of downloading and validating a WordPress.com
			 * theme. An alternative method of WPCom theme download and validation can be
			 * executed during the filter.
			 *
			 * The filter can also return an instance of WP_Error; in which case the endpoint response will
			 * contain this error.
			 *
			 * @module json-api
			 *
			 * @since 4.4.2
			 *
			 * @param bool   $skip_download_filter_result Whether to skip the standard method of downloading
			 *                                            and validating a WPCom theme.
			 * @param string $theme_slug                  Theme name (slug). If it is a WPCom theme,
			 *                                            it should be suffixed with `-wpcom`.
			 */
			$skip_download_filter_result = apply_filters( 'jetpack_wpcom_theme_skip_download', false, $theme );

			if ( is_wp_error( $skip_download_filter_result ) ) {
				return $skip_download_filter_result;
			} elseif ( $skip_download_filter_result ) {
				continue;
			}

			if ( wp_endswith( $theme, '-wpcom' ) ) {
				$file = self::download_wpcom_theme_to_file( $theme );

				if ( is_wp_error( $file ) ) {
					return $file;
				}

				$this->download_links[ $theme ] = $file;
				continue;
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

			if ( ! is_object( $theme_data ) && !isset( $theme_data->download_link ) ) {
				return new WP_Error( 'theme_not_found', __( 'This theme does not exist', 'jetpack' ) , 404 );
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
		$wpcom_theme_slug = preg_replace( '/-wpcom$/', '', $theme );

		$file = wp_tempnam( 'theme' );
		if ( ! $file ) {
			return new WP_Error( 'problem_creating_theme_file', __( 'Problem creating file for theme download', 'jetpack' ) );
		}

		$url = "themes/download/$theme.zip";
		$args = array( 'stream' => true, 'filename' => $file );
		$result = Client::wpcom_json_api_request_as_blog( $url, '1.1', $args );

		$response =  $result[ 'response' ];
		if ( $response[ 'code' ] !== 200 ) {
			unlink( $file );
			return new WP_Error( 'problem_fetching_theme', __( 'Problem downloading theme', 'jetpack' ) );
		}

		return $file;
	}
}
