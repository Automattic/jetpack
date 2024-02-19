<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tools to interact with Jetpack modules via API requests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\Stats_Admin\Main as Stats_Admin_Main;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Shared_Functions;

/**
 * This is the base class for every Core API endpoint Jetpack uses.
 */
class Jetpack_Core_API_Module_Toggle_Endpoint extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	/**
	 * Check if the module requires the site to be publicly accessible from WPCOM.
	 * If the site meets this requirement, the module is activated. Otherwise an error is returned.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 *     @type bool   $active should module be activated.
	 * }
	 *
	 * @return WP_REST_Response|WP_Error A REST response if the request was served successfully, otherwise an error.
	 */
	public function process( $request ) {
		if ( $request['active'] ) {
			return $this->activate_module( $request );
		} else {
			return $this->deactivate_module( $request );
		}
	}

	/**
	 * If it's a valid Jetpack module, activate it.
	 *
	 * @since 4.3.0
	 *
	 * @param string|WP_REST_Request $request It's a WP_REST_Request when called from endpoint /module/<slug>/*
	 *                                        and a string when called from Jetpack_Core_API_Data->update_data.
	 * {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function activate_module( $request ) {
		$module_slug = '';

		if (
			(
				is_array( $request )
				|| is_object( $request )
			)
			&& isset( $request['slug'] )
		) {
			$module_slug = $request['slug'];
		} else {
			$module_slug = $request;
		}

		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( ! Jetpack_Plan::supports( $module_slug ) ) {
			return new WP_Error(
				'not_supported',
				esc_html__( 'The requested Jetpack module is not supported by your plan.', 'jetpack' ),
				array( 'status' => 424 )
			);
		}

		if ( Jetpack::activate_module( $module_slug, false, false ) ) {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'The requested Jetpack module was activated.', 'jetpack' ),
				)
			);
		}

		return new WP_Error(
			'activation_failed',
			esc_html__( 'The requested Jetpack module could not be activated.', 'jetpack' ),
			array( 'status' => 424 )
		);
	}

	/**
	 * If it's a valid Jetpack module, deactivate it.
	 *
	 * @since 4.3.0
	 *
	 * @param string|WP_REST_Request $request It's a WP_REST_Request when called from endpoint /module/<slug>/*
	 *                                        and a string when called from Jetpack_Core_API_Data->update_data.
	 * {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function deactivate_module( $request ) {
		$module_slug = '';

		if (
			(
				is_array( $request )
				|| is_object( $request )
			)
			&& isset( $request['slug'] )
		) {
			$module_slug = $request['slug'];
		} else {
			$module_slug = $request;
		}

		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( ! Jetpack::is_module_active( $module_slug ) ) {
			return new WP_Error(
				'already_inactive',
				esc_html__( 'The requested Jetpack module was already inactive.', 'jetpack' ),
				array( 'status' => 409 )
			);
		}

		if ( Jetpack::deactivate_module( $module_slug ) ) {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'The requested Jetpack module was deactivated.', 'jetpack' ),
				)
			);
		}
		return new WP_Error(
			'deactivation_failed',
			esc_html__( 'The requested Jetpack module could not be deactivated.', 'jetpack' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Check that the current user has permissions to manage Jetpack modules.
	 *
	 * @since 4.3.0
	 *
	 * @return bool
	 */
	public function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}

/**
 * Interact with multiple modules at once (list or activate).
 *
 * // phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */
class Jetpack_Core_API_Module_List_Endpoint {
	// phpcs:enable Generic.Files.OneObjectStructurePerFile.MultipleFound

	/**
	 * A WordPress REST API callback method that accepts a request object and decides what to do with it.
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @since 4.3.0
	 *
	 * @return bool|Array|WP_Error a resulting value or object, or an error.
	 */
	public function process( $request ) {
		if ( 'GET' === $request->get_method() ) {
			return $this->get_modules();
		} else {
			return static::activate_modules( $request );
		}
	}

	/**
	 * Get a list of all Jetpack modules and their information.
	 *
	 * @since 4.3.0
	 *
	 * @return array Array of Jetpack modules.
	 */
	public function get_modules() {
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';

		$modules = Jetpack_Admin::init()->get_modules();
		foreach ( $modules as $slug => $properties ) {
			$modules[ $slug ]['options'] =
				Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $slug );
			if (
				isset( $modules[ $slug ]['requires_connection'] )
				&& $modules[ $slug ]['requires_connection']
				&& ( new Status() )->is_offline_mode()
			) {
				$modules[ $slug ]['activated'] = false;
			}
		}

		$modules = Jetpack::get_translated_modules( $modules );

		return Jetpack_Core_Json_Api_Endpoints::prepare_modules_for_response( $modules );
	}

	/**
	 * Activate a list of valid Jetpack modules.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if modules were activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function activate_modules( $request ) {

		if (
			! isset( $request['modules'] )
			|| ! is_array( $request['modules'] )
		) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$activated = array();
		$failed    = array();

		foreach ( $request['modules'] as $module ) {
			if ( Jetpack::activate_module( $module, false, false ) ) {
				$activated[] = $module;
			} else {
				$failed[] = $module;
			}
		}

		if ( empty( $failed ) ) {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'All modules activated.', 'jetpack' ),
				)
			);
		}

		$error = '';

		$activated_count = count( $activated );
		if ( $activated_count > 0 ) {
			$activated_last = array_pop( $activated );
			$activated_text = $activated_count > 1 ? sprintf(
				/* Translators: first variable is a list followed by the last item, which is the second variable. Example: dog, cat and bird. */
				__( '%1$s and %2$s', 'jetpack' ),
				implode( ', ', $activated ),
				$activated_last
			) : $activated_last;

			$error = sprintf(
				/* Translators: the variable is a module name. */
				_n( 'The module %s was activated.', 'The modules %s were activated.', $activated_count, 'jetpack' ),
				$activated_text
			) . ' ';
		}

		$failed_count = count( $failed );
		if ( count( $failed ) > 0 ) {
			$failed_last = array_pop( $failed );
			$failed_text = $failed_count > 1 ? sprintf(
				/* Translators: first variable is a list followed by the last item, which is the second variable. Example: dog, cat and bird. */
				__( '%1$s and %2$s', 'jetpack' ),
				implode( ', ', $failed ),
				$failed_last
			) : $failed_last;

			$error = sprintf(
				/* Translators: the variable is a module name. */
				_n( 'The module %s failed to be activated.', 'The modules %s failed to be activated.', $failed_count, 'jetpack' ),
				$failed_text
			) . ' ';
		}

		return new WP_Error(
			'activation_failed',
			esc_html( $error ),
			array( 'status' => 424 )
		);
	}

	/**
	 * A WordPress REST API permission callback method that accepts a request object and decides
	 * if the current user has enough privileges to act.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool does the current user have enough privilege.
	 */
	public function can_request( $request ) {
		if ( 'GET' === $request->get_method() ) {
			return current_user_can( 'jetpack_admin_page' );
		} else {
			return current_user_can( 'jetpack_manage_modules' );
		}
	}
}

/**
 * Class that manages updating of Jetpack module options and general Jetpack settings or retrieving module data.
 * If no module is specified, all module settings are retrieved/updated.
 *
 * @since 4.3.0
 * @since 4.4.0 Renamed Jetpack_Core_API_Module_Endpoint from to Jetpack_Core_API_Data.
 *
 * @author Automattic
 *
 * // phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */
class Jetpack_Core_API_Data extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {
	// phpcs:enable Generic.Files.OneObjectStructurePerFile.MultipleFound

	/**
	 * Process request by returning the module or updating it.
	 * If no module is specified, settings for all modules are assumed.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request WP API request.
	 *
	 * @return bool|mixed|void|WP_Error
	 */
	public function process( $request ) {
		if ( 'GET' === $request->get_method() ) {
			if ( isset( $request['slug'] ) ) {
				return $this->get_module( $request );
			}

			return $this->get_all_options();
		} else {
			return $this->update_data( $request );
		}
	}

	/**
	 * Get information about a specific and valid Jetpack module.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return mixed|void|WP_Error
	 */
	public function get_module( $request ) {
		if ( Jetpack::is_module( $request['slug'] ) ) {

			$module = Jetpack::get_module( $request['slug'] );

			$module['options'] = Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $request['slug'] );

			if (
				isset( $module['requires_connection'] )
				&& $module['requires_connection']
				&& ( new Status() )->is_offline_mode()
			) {
				$module['activated'] = false;
			}

			$i18n = jetpack_get_module_i18n( $request['slug'] );
			if ( isset( $module['name'] ) ) {
				$module['name'] = $i18n['name'];
			}
			if ( isset( $module['description'] ) ) {
				$module['description']       = $i18n['description'];
				$module['short_description'] = $i18n['description'];
			}
			if ( isset( $module['module_tags'] ) ) {
				$module['module_tags'] = array_map( 'jetpack_get_module_i18n_tag', $module['module_tags'] );
			}

			return Jetpack_Core_Json_Api_Endpoints::prepare_modules_for_response( $module );
		}

		return new WP_Error(
			'not_found',
			esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Get information about all Jetpack module options and settings.
	 *
	 * @since 4.6.0
	 *
	 * @return WP_REST_Response $response
	 */
	public function get_all_options() {
		$response = array();

		$modules = Jetpack::get_available_modules();
		if ( is_array( $modules ) && ! empty( $modules ) ) {
			foreach ( $modules as $module ) {
				// Add all module options.
				$options = Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $module );
				foreach ( $options as $option_name => $option ) {
					$response[ $option_name ] = $option['current_value'];
				}

				// Add the module activation state.
				$response[ $module ] = Jetpack::is_module_active( $module );
			}
		}

		$settings = Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list( 'settings' );

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		foreach ( $settings as $setting => $properties ) {
			switch ( $setting ) {
				case 'lang_id':
					if ( ! current_user_can( 'install_languages' ) ) {
						// The user doesn't have caps to install language packs, so warn the client.
						$response[ $setting ] = 'error_cap';
						break;
					}

					$value = get_option( 'WPLANG', '' );
					if ( empty( $value ) && defined( 'WPLANG' ) ) {
						$value = WPLANG;
					}
					$response[ $setting ] = empty( $value ) ? 'en_US' : $value;
					break;

				case 'wordpress_api_key':
					// When field is clear, return empty. Otherwise it would return "false".
					if ( '' === get_option( 'wordpress_api_key', '' ) ) {
						$response[ $setting ] = '';
					} else {
						if ( ! class_exists( 'Akismet' ) ) {
							if ( is_readable( WP_PLUGIN_DIR . '/akismet/class.akismet.php' ) ) {
								require_once WP_PLUGIN_DIR . '/akismet/class.akismet.php';
							}
						}
						$response[ $setting ] = class_exists( 'Akismet' ) ? Akismet::get_api_key() : '';
					}
					break;

				case 'onboarding':
					$business_address = get_option( 'jpo_business_address' );
					$business_address = is_array( $business_address ) ? array_map( array( $this, 'decode_special_characters' ), $business_address ) : $business_address;

					$response[ $setting ] = array(
						'siteTitle'          => $this->decode_special_characters( get_option( 'blogname' ) ),
						'siteDescription'    => $this->decode_special_characters( get_option( 'blogdescription' ) ),
						'siteType'           => get_option( 'jpo_site_type' ),
						'homepageFormat'     => get_option( 'jpo_homepage_format' ),
						'addContactForm'     => (int) get_option( 'jpo_contact_page' ),
						'businessAddress'    => $business_address,
						'installWooCommerce' => is_plugin_active( 'woocommerce/woocommerce.php' ),
						'stats'              => Jetpack::is_connection_ready() && Jetpack::is_module_active( 'stats' ),
					);
					break;

				case 'search_auto_config':
					// Only writable.
					$response[ $setting ] = 1;
					break;

				default:
					$default              = isset( $settings[ $setting ]['default'] ) ? $settings[ $setting ]['default'] : false;
					$response[ $setting ] = Jetpack_Core_Json_Api_Endpoints::cast_value( get_option( $setting, $default ), $settings[ $setting ] );
					break;
			}
		}

		$response['akismet'] = is_plugin_active( 'akismet/akismet.php' );

		return rest_ensure_response( $response );
	}

	/**
	 * Decode the special HTML characters in a certain value.
	 *
	 * @since 5.8
	 *
	 * @param string $value Value to decode.
	 *
	 * @return string Value with decoded HTML characters.
	 */
	private function decode_special_characters( $value ) {
		return (string) htmlspecialchars_decode( $value, ENT_QUOTES );
	}

	/**
	 * If it's a valid Jetpack module and configuration parameters have been sent, update it.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was updated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function update_data( $request ) {

		// If it's null, we're trying to update many module options from different modules.
		if ( $request['slug'] === null ) {

			// Value admitted by Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list that will make it return all module options.
			// It will not be passed. It's just checked in this method to pass that method a string or array.
			$request['slug'] = 'any';
		} else {
			if ( ! Jetpack::is_module( $request['slug'] ) ) {
				return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
			}

			if ( ! Jetpack::is_module_active( $request['slug'] ) ) {
				return new WP_Error( 'inactive', esc_html__( 'The requested Jetpack module is inactive.', 'jetpack' ), array( 'status' => 409 ) );
			}
		}

		/*
		 * Get parameters to update the module.
		 * We can not simply use $request->get_params() because when we registered this route,
		 * we are adding the entire output of Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list()
		 * to the current request object's params. We are interested in body of the actual request.
		 * This may be JSON:
		 */
		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			// Or it may be standard POST key-value pairs.
			$params = $request->get_body_params();
		}

		// Exit if no parameters were passed.
		if ( ! is_array( $params ) ) {
			return new WP_Error( 'missing_options', esc_html__( 'Missing options.', 'jetpack' ), array( 'status' => 404 ) );
		}

		// If $params was set via `get_body_params()` there may be some additional variables in the request that can
		// cause validation to fail. This method verifies that each param was in fact updated and will throw a `some_updated`
		// error if unused variables are included in the request.
		foreach ( array_keys( $params ) as $key ) {
			if ( is_int( $key ) || 'slug' === $key || 'context' === $key ) {
				unset( $params[ $key ] );
			}
		}

		// Get available module options.
		$options = Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list(
			'any' === $request['slug']
			? $params
			: $request['slug']
		);

		// Prepare to toggle module if needed.
		$toggle_module = new Jetpack_Core_API_Module_Toggle_Endpoint( new Jetpack_IXR_Client() );

		// Options that are invalid or failed to update.
		$invalid     = array_keys( array_diff_key( $params, $options ) );
		$not_updated = array();

		// Remove invalid options.
		$params = array_intersect_key( $params, $options );

		// Used if response is successful. The message can be overwritten and additional data can be added here.
		$response = array(
			'code'    => 'success',
			'message' => esc_html__( 'The requested Jetpack data updates were successful.', 'jetpack' ),
		);

		// If there are modules to activate, activate them first so they're ready when their options are set.
		foreach ( $params as $option => $value ) {
			if ( 'modules' === $options[ $option ]['jp_group'] ) {

				// Used if there was an error. Can be overwritten with specific error messages.
				$error = '';

				// Set to true if the module toggling was successful.
				$updated = false;

				// Check if user can toggle the module.
				if ( $toggle_module->can_request() ) {

					// Activate or deactivate the module according to the value passed.
					$toggle_result = $value
						? $toggle_module->activate_module( $option )
						: $toggle_module->deactivate_module( $option );

					if (
						is_wp_error( $toggle_result )
						&& 'already_inactive' === $toggle_result->get_error_code()
					) {

						// If the module is already inactive, we don't fail.
						$updated = true;
					} elseif ( is_wp_error( $toggle_result ) ) {
						$error = $toggle_result->get_error_message();
					} else {
						$updated = true;
					}
				} else {
					$error = REST_Connector::get_user_permissions_error_msg();
				}

				// The module was not toggled.
				if ( ! $updated ) {
					$not_updated[ $option ] = $error;
				}

				// Remove module from list so we don't go through it again.
				unset( $params[ $option ] );
			}
		}

		foreach ( $params as $option => $value ) {

			// Used if there was an error. Can be overwritten with specific error messages.
			$error = '';

			// Set to true if the option update was successful.
			$updated = false;

			// Get option attributes, including the group it belongs to.
			$option_attrs = $options[ $option ];

			// If this is a module option and the related module isn't active for any reason, continue with the next one.
			if ( 'settings' !== $option_attrs['jp_group'] ) {
				if ( ! Jetpack::is_module( $option_attrs['jp_group'] ) ) {
					$not_updated[ $option ] = esc_html__( 'The requested Jetpack module was not found.', 'jetpack' );
					continue;
				}

				if (
					'any' !== $request['slug']
					&& ! Jetpack::is_module_active( $option_attrs['jp_group'] )
				) {

					// We only take note of skipped options when updating one module.
					$not_updated[ $option ] = esc_html__( 'The requested Jetpack module is inactive.', 'jetpack' );
					continue;
				}
			}

			// Properly cast value based on its type defined in endpoint accepted args.
			$value = Jetpack_Core_Json_Api_Endpoints::cast_value( $value, $option_attrs );

			switch ( $option ) {
				case 'lang_id':
					if ( ! current_user_can( 'install_languages' ) ) {
						// We can't affect this setting.
						$updated = false;
						break;
					}

					if ( 'en_US' === $value || empty( $value ) ) {
						return delete_option( 'WPLANG' );
					}

					if ( ! function_exists( 'request_filesystem_credentials' ) ) {
						require_once ABSPATH . 'wp-admin/includes/file.php';
					}

					if ( ! function_exists( 'wp_download_language_pack' ) ) {
						require_once ABSPATH . 'wp-admin/includes/translation-install.php';
					}

					// `wp_download_language_pack` only tries to download packs if they're not already available.
					$language = wp_download_language_pack( $value );
					if ( false === $language ) {
						// The language pack download failed.
						$updated = false;
						break;
					}
					$updated = get_option( 'WPLANG' ) === $language ? true : update_option( 'WPLANG', $language );
					break;

				case 'monitor_receive_notifications':
					$monitor = new Jetpack_Monitor();

					// If we got true as response, consider it done.
					$updated = true === $monitor->update_option_receive_jetpack_monitor_notification( $value );
					break;

				case 'post_by_email_address':
					$result = Jetpack_Post_By_Email::init()->process_api_request( $value );

					// If we got an email address (create or regenerate) or 1 (delete), consider it done.
					if ( is_string( $result ) && preg_match( '/[a-z0-9]+@post.wordpress.com/', $result ) ) {
						$response[ $option ] = $result;
						$updated             = true;
					} elseif ( 1 == $result ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
						$updated = true;
					} elseif ( is_array( $result ) && isset( $result['message'] ) ) {
						$error = $result['message'];
					}
					break;

				case 'jetpack_protect_key':
					$brute_force_protection = Brute_Force_Protection::instance();
					if ( 'create' === $value ) {
						$result = $brute_force_protection->get_protect_key();
					} else {
						$result = false;
					}

					// If we got one of Protect keys, consider it done.
					if ( preg_match( '/[a-z0-9]{40,}/i', $result ) ) {
						$response[ $option ] = $result;
						$updated             = true;
					}
					break;

				case 'jetpack_protect_global_whitelist':
					$updated = Brute_Force_Protection_Shared_Functions::save_allow_list( explode( PHP_EOL, str_replace( array( ' ', ',' ), array( '', "\n" ), $value ) ) );

					if ( is_wp_error( $updated ) ) {
						$error = $updated->get_error_message();
					}
					break;

				case 'show_headline':
				case 'show_thumbnails':
					$grouped_options_current    = (array) Jetpack_Options::get_option( 'relatedposts' );
					$grouped_options            = $grouped_options_current;
					$grouped_options[ $option ] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current !== $grouped_options ? Jetpack_Options::update_option( 'relatedposts', $grouped_options ) : true;
					break;

				case 'search_auto_config':
					if ( ! $value ) {
						// Skip execution if no value is specified.
						$updated = true;
					} else {
						$plan = new Automattic\Jetpack\Search\Plan();
						if ( ! $plan->supports_instant_search() ) {
							$updated = new WP_Error( 'instant_search_not_supported', 'Instant Search is not supported by this site', array( 'status' => 400 ) );
							$error   = $updated->get_error_message();
						} elseif ( ! Automattic\Jetpack\Search\Options::is_instant_enabled() ) {
							$updated = new WP_Error( 'instant_search_disabled', 'Instant Search is disabled', array( 'status' => 400 ) );
							$error   = $updated->get_error_message();
						} else {
							$blog_id  = Automattic\Jetpack\Search\Helper::get_wpcom_site_id();
							$instance = Automattic\Jetpack\Search\Instant_Search::instance( $blog_id );
							$instance->auto_config_search();
							$updated = true;
						}
					}
					break;

				case 'google':
				case 'bing':
				case 'pinterest':
				case 'yandex':
				case 'facebook':
					$grouped_options_current = (array) get_option( 'verification_services_codes' );
					$grouped_options         = $grouped_options_current;

					// Extracts the content attribute from the HTML meta tag if needed.
					if ( preg_match( '#.*<meta name="(?:[^"]+)" content="([^"]+)" />.*#i', $value, $matches ) ) {
						$grouped_options[ $option ] = $matches[1];
					} else {
						$grouped_options[ $option ] = $value;
					}

					// If option value was the same, consider it done.
					$updated = $grouped_options_current !== $grouped_options
						? update_option( 'verification_services_codes', $grouped_options )
						: true;
					break;

				case 'sharing_services':
					if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
						break;
					}

					$sharer = new Sharing_Service();

					// If option value was the same, consider it done.
					$updated = $value !== $sharer->get_blog_services()
						? $sharer->set_blog_services( $value['visible'], $value['hidden'] )
						: true;
					break;

				case 'button_style':
				case 'sharing_label':
				case 'show':
					if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
						break;
					}

					$sharer                     = new Sharing_Service();
					$grouped_options            = $sharer->get_global_options();
					$grouped_options[ $option ] = $value;
					$updated                    = $sharer->set_global_options( $grouped_options );
					break;

				case 'custom':
					if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
						break;
					}

					$sharer  = new Sharing_Service();
					$updated = $sharer->new_service( stripslashes( $value['sharing_name'] ), stripslashes( $value['sharing_url'] ), stripslashes( $value['sharing_icon'] ) );

					// Return new custom service.
					$response[ $option ] = $updated;
					break;

				case 'sharing_delete_service':
					if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
						break;
					}

					$sharer  = new Sharing_Service();
					$updated = $sharer->delete_service( $value );
					break;

				case 'jetpack-twitter-cards-site-tag':
					$value   = trim( ltrim( wp_strip_all_tags( $value ), '@' ) );
					$updated = get_option( $option ) !== $value ? update_option( $option, $value ) : true;
					break;

				case 'admin_bar':
				case 'roles':
				case 'count_roles':
				case 'blog_id':
				case 'do_not_track':
				case 'version':
				case 'collapse_nudges':
					$grouped_options_current    = (array) get_option( 'stats_options' );
					$grouped_options            = $grouped_options_current;
					$grouped_options[ $option ] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current !== $grouped_options
						? update_option( 'stats_options', $grouped_options )
						: true;
					break;

				case 'enable_odyssey_stats':
					$updated = Stats_Admin_Main::update_new_stats_status( $value );

					break;

				case 'akismet_show_user_comments_approved':
					// Save Akismet option '1' or '0' like it's done in akismet/class.akismet-admin.php.
					$updated = get_option( $option ) != $value // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
						? update_option( $option, $value ? '1' : '0' )
						: true;
					break;

				case 'wordpress_api_key':
					if ( ! file_exists( WP_PLUGIN_DIR . '/akismet/class.akismet.php' ) ) {
						$error   = esc_html__( 'Please install Akismet.', 'jetpack' );
						$updated = false;
						break;
					}

					if ( ! defined( 'AKISMET_VERSION' ) ) {
						$error   = esc_html__( 'Please activate Akismet.', 'jetpack' );
						$updated = false;
						break;
					}

					// Allow to clear the API key field.
					if ( '' === $value ) {
						$updated = get_option( $option ) !== $value
							? update_option( $option, $value )
							: true;
						break;
					}

					require_once WP_PLUGIN_DIR . '/akismet/class.akismet.php';
					require_once WP_PLUGIN_DIR . '/akismet/class.akismet-admin.php';

					if ( class_exists( 'Akismet_Admin' ) && method_exists( 'Akismet_Admin', 'save_key' ) ) {
						if ( Akismet::verify_key( $value ) === 'valid' ) {
							$akismet_user = Akismet_Admin::get_akismet_user( $value );
							if ( $akismet_user ) {
								if ( in_array( $akismet_user->status, array( 'active', 'active-dunning', 'no-sub' ), true ) ) {
									$updated = get_option( $option ) !== $value
										? update_option( $option, $value )
										: true;
									break;
								} else {
									$error = esc_html__( "Akismet user status doesn't allow to update the key", 'jetpack' );
								}
							} else {
								$error = esc_html__( 'Invalid Akismet user', 'jetpack' );
							}
						} else {
							$error = esc_html__( 'Invalid Akismet key', 'jetpack' );
						}
					} else {
						$error = esc_html__( 'Akismet is not installed or active', 'jetpack' );
					}
					$updated = false;
					break;

				case 'google_analytics_tracking_id':
					$grouped_options_current = (array) get_option( 'jetpack_wga' );
					$grouped_options         = $grouped_options_current;
					$grouped_options['code'] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current !== $grouped_options
						? update_option( 'jetpack_wga', $grouped_options )
						: true;
					break;

				case 'dismiss_empty_stats_card':
				case 'dismiss_dash_backup_getting_started':
				case 'dismiss_dash_agencies_learn_more':
					// If option value was the same, consider it done.
					$updated = get_option( $option ) != $value // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual -- ensure we support bools or strings saved by update_option.
						? update_option( $option, (bool) $value )
						: true;
					break;

				case 'onboarding':
					require_once JETPACK__PLUGIN_DIR . '_inc/lib/widgets.php';
					// Break apart and set Jetpack onboarding options.
					$result = $this->process_onboarding( (array) $value );
					if ( empty( $result ) ) {
						$updated = true;
					} else {
						$error = sprintf(
							/* Translators: placeholder is a list of error codes. */
							esc_html__( 'Onboarding failed to process: %s', 'jetpack' ),
							$result
						);
						$updated = false;
					}
					break;

				case 'stb_enabled':
				case 'stc_enabled':
				case 'sm_enabled':
					// Convert the false value to 0. This allows the option to be updated if it doesn't exist yet.
					$sub_value = $value ? $value : 0;
					$updated   = (string) get_option( $option ) !== (string) $sub_value ? update_option( $option, $sub_value ) : true;
					break;

				case 'jetpack_blocks_disabled':
					$updated = (bool) get_option( $option ) !== (bool) $value ? update_option( $option, (bool) $value ) : true;
					break;

				case 'subscription_options':
					if ( ! is_array( $value ) ) {
						break;
					}

					$allowed_keys   = array( 'invitation', 'comment_follow', 'welcome' );
					$filtered_value = array_filter(
						$value,
						function ( $key ) use ( $allowed_keys ) {
							return in_array( $key, $allowed_keys, true );
						},
						ARRAY_FILTER_USE_KEY
					);

					if ( empty( $filtered_value ) ) {
						break;
					}

					array_walk_recursive(
						$filtered_value,
						function ( &$value ) {
							$value = wp_kses(
								$value,
								array(
									'a' => array(
										'href' => array(),
									),
								)
							);
						}
					);

					$old_subscription_options = get_option( 'subscription_options' );
					if ( ! is_array( $old_subscription_options ) ) {
						$old_subscription_options = array();
					}
					$new_subscription_options = array_merge( $old_subscription_options, $filtered_value );

					if ( update_option( $option, $new_subscription_options ) ) {
						$updated[ $option ] = true;
					}
					break;

				default:
					// Boolean values are stored as 1 or 0.
					if ( isset( $options[ $option ]['type'] ) && 'boolean' === $options[ $option ]['type'] ) {
						$value = (int) $value;
					}

					// If option value was the same as it's current value, or it's default, consider it done.
					$default = isset( $options[ $option ]['default'] ) ? $options[ $option ]['default'] : false;
					$updated = get_option( $option, $default ) != $value // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual -- ensure we support scalars or strings saved by update_option.
						? update_option( $option, $value )
						: true;
					break;
			}

			// The option was not updated.
			if ( ! $updated ) {
				$not_updated[ $option ] = $error;
			}
		}

		if ( empty( $invalid ) && empty( $not_updated ) ) {
			// The option was updated.
			return rest_ensure_response( $response );
		} else {
			$invalid_count     = count( $invalid );
			$not_updated_count = count( $not_updated );
			$error             = '';
			if ( $invalid_count > 0 ) {
				$error = sprintf(
				/* Translators: the plural variable is a comma-separated list. Example: dog, cat, bird. */
					_n( 'Invalid option: %s.', 'Invalid options: %s.', $invalid_count, 'jetpack' ),
					implode( ', ', $invalid )
				);
			}
			if ( $not_updated_count > 0 ) {
				$not_updated_messages = array();
				foreach ( $not_updated as $not_updated_option => $not_updated_message ) {
					if ( ! empty( $not_updated_message ) ) {
						$not_updated_messages[] = sprintf(
							/* Translators: the first variable is a module option or slug, or setting. The second is the error message . */
							__( '%1$s: %2$s', 'jetpack' ),
							$not_updated_option,
							$not_updated_message
						);
					}
				}
				if ( ! empty( $error ) ) {
					$error .= ' ';
				}
				if ( ! empty( $not_updated_messages ) ) {
					$error .= ' ' . implode( '. ', $not_updated_messages );
				}
			}
			// There was an error because some options were updated but others were invalid or failed to update.
			return new WP_Error( 'some_updated', esc_html( $error ), array( 'status' => 400 ) );
		}
	}

	/**
	 * Perform tasks in the site based on onboarding choices.
	 *
	 * @since 5.4.0
	 *
	 * @param array $data Onboarding choices made by user.
	 *
	 * @return string Result of onboarding processing and, if there is one, an error message.
	 */
	private function process_onboarding( $data ) {
		if ( isset( $data['end'] ) && $data['end'] ) {
			return Jetpack::invalidate_onboarding_token()
				? ''
				: esc_html__( "The onboarding token couldn't be deleted.", 'jetpack' );
		}

		$error = array();

		if ( ! empty( $data['siteTitle'] ) ) {
			// If option value was the same, consider it done.
			if ( ! (
				update_option( 'blogname', $data['siteTitle'] )
				|| get_option( 'blogname' ) === $data['siteTitle']
			) ) {
				$error[] = 'siteTitle';
			}
		}

		if ( isset( $data['siteDescription'] ) ) {
			// If option value was the same, consider it done.
			if ( ! (
				update_option( 'blogdescription', $data['siteDescription'] )
				|| get_option( 'blogdescription' ) === $data['siteDescription']
			) ) {
				$error[] = 'siteDescription';
			}
		}

		$site_title = get_option( 'blogname' );
		$author     = get_current_user_id() || 1;

		if ( ! empty( $data['siteType'] ) ) {
			if ( ! (
				update_option( 'jpo_site_type', $data['siteType'] )
				|| get_option( 'jpo_site_type' ) === $data['siteType']
			) ) {
				$error[] = 'siteType';
			}
		}

		if ( isset( $data['homepageFormat'] ) ) {
			/*
			 * If $data['homepageFormat'] is 'posts',
			 * we have nothing to do since it's WordPress' default
			 * if it exists, just update
			 */
			$homepage_format = get_option( 'jpo_homepage_format' );
			if ( ! $homepage_format || $homepage_format !== $data['homepageFormat'] ) {
				if ( 'page' === $data['homepageFormat'] ) {
					if ( ! (
						update_option( 'show_on_front', 'page' )
						|| get_option( 'show_on_front' ) === 'page'
					) ) {
						$error[] = 'homepageFormat';
					}

					$home = wp_insert_post(
						array(
							'post_type'    => 'page',
							/* translators: this references the home page of a site, also called front page. */
							'post_title'   => esc_html_x( 'Home Page', 'The home page of a website.', 'jetpack' ),
							'post_content' => sprintf(
								/* Translators: placeholder is the site title. */
								esc_html__( 'Welcome to %s.', 'jetpack' ),
								$site_title
							),
							'post_status'  => 'publish',
							'post_author'  => $author,
						)
					);
					if ( 0 === $home ) {
						$error[] = 'home insert: 0';
					} elseif ( is_wp_error( $home ) ) {
						$error[] = 'home creation: ' . $home->get_error_message();
					}
					if ( ! (
						update_option( 'page_on_front', $home )
						|| get_option( 'page_on_front' ) === $home
					) ) {

						$error[] = 'home set';
					}

					$blog = wp_insert_post(
						array(
							'post_type'    => 'page',
							/* translators: this references the page where blog posts are listed. */
							'post_title'   => esc_html_x( 'Blog', 'The blog of a website.', 'jetpack' ),
							'post_content' => sprintf(
								/* Translators: placeholder is the site title. */
								esc_html__( 'These are the latest posts in %s.', 'jetpack' ),
								$site_title
							),
							'post_status'  => 'publish',
							'post_author'  => $author,
						)
					);
					if ( 0 === $blog ) {
						$error[] = 'blog insert: 0';
					} elseif ( is_wp_error( $blog ) ) {
						$error[] = 'blog creation: ' . $blog->get_error_message();
					}
					if ( ! (
						update_option( 'page_for_posts', $blog )
						|| get_option( 'page_for_posts' ) === $blog
					) ) {
						$error[] = 'blog set';
					}
				} else {
					$front_page = get_option( 'page_on_front' );
					$posts_page = get_option( 'page_for_posts' );
					if ( $posts_page && get_post( $posts_page ) ) {
						wp_delete_post( $posts_page );
					}
					if ( $front_page && get_post( $front_page ) ) {
						wp_delete_post( $front_page );
					}
					update_option( 'show_on_front', 'posts' );
				}
			}
			update_option( 'jpo_homepage_format', $data['homepageFormat'] );
		}

		// Setup contact page and add a form and/or business info.
		$contact_page = '';
		if ( ! empty( $data['addContactForm'] ) && ! get_option( 'jpo_contact_page' ) ) {
			$contact_form_module_active = Jetpack::is_module_active( 'contact-form' );
			if ( ! $contact_form_module_active ) {
				$contact_form_module_active = Jetpack::activate_module( 'contact-form', false, false );
			}

			if ( $contact_form_module_active ) {
				$contact_page = '[contact-form][contact-field label="' . esc_html__( 'Name', 'jetpack' ) . '" type="name" required="true" /][contact-field label="' . esc_html__( 'Email', 'jetpack' ) . '" type="email" required="true" /][contact-field label="' . esc_html__( 'Website', 'jetpack' ) . '" type="url" /][contact-field label="' . esc_html__( 'Message', 'jetpack' ) . '" type="textarea" /][/contact-form]';
			} else {
				$error[] = 'contact-form activate';
			}
		}

		if ( isset( $data['businessPersonal'] ) && 'business' === $data['businessPersonal'] ) {
			$contact_page .= "\n" . implode( "\n", $data['businessInfo'] );
		}

		if ( ! empty( $contact_page ) ) {
			$form = wp_insert_post(
				array(
					'post_type'    => 'page',
					/* translators: this references a page with contact details and possibly a form. */
					'post_title'   => esc_html_x( 'Contact us', 'Contact page for your website.', 'jetpack' ),
					'post_content' => esc_html__( 'Send us a message!', 'jetpack' ) . "\n" . $contact_page,
					'post_status'  => 'publish',
					'post_author'  => $author,
				)
			);
			if ( 0 === $form ) {
				$error[] = 'form insert: 0';
			} elseif ( is_wp_error( $form ) ) {
				$error[] = 'form creation: ' . $form->get_error_message();
			} else {
				update_option( 'jpo_contact_page', $form );
			}
		}

		if ( isset( $data['businessAddress'] ) ) {
			$handled_business_address = self::handle_business_address( $data['businessAddress'] );
			if ( is_wp_error( $handled_business_address ) ) {
				$error[] = 'BusinessAddress';
			}
		}

		if ( ! empty( $data['installWooCommerce'] ) ) {
			$wc_install_result = Plugins_Installer::install_and_activate_plugin( 'woocommerce' );
			delete_transient( '_wc_activation_redirect' ); // Redirecting to WC setup would kill our users' flow.
			if ( is_wp_error( $wc_install_result ) ) {
				$error[] = 'woocommerce installation';
			}
		}

		if ( ! empty( $data['stats'] ) ) {
			if ( Jetpack::is_connection_ready() ) {
				$stats_module_active = Jetpack::is_module_active( 'stats' );
				if ( ! $stats_module_active ) {
					$stats_module_active = Jetpack::activate_module( 'stats', false, false );
				}

				if ( ! $stats_module_active ) {
					$error[] = 'stats activate';
				}
			} else {
				$error[] = 'stats not connected';
			}
		}

		return empty( $error )
			? ''
			: implode( ', ', $error );
	}

	/**
	 * Add or update Business Address widget.
	 *
	 * @param array $address Array of business address fields.
	 *
	 * @return WP_Error|true True if the data was saved correctly.
	 */
	private static function handle_business_address( $address ) {
		$first_sidebar = Jetpack_Widgets::get_first_sidebar();

		$widgets_module_active = Jetpack::is_module_active( 'widgets' );
		if ( ! $widgets_module_active ) {
			$widgets_module_active = Jetpack::activate_module( 'widgets', false, false );
		}
		if ( ! $widgets_module_active ) {
			return new WP_Error( 'module_activation_failed', 'Failed to activate the widgets module.', 400 );
		}

		if ( $first_sidebar ) {
			$title   = isset( $address['name'] ) ? sanitize_text_field( $address['name'] ) : '';
			$street  = isset( $address['street'] ) ? sanitize_text_field( $address['street'] ) : '';
			$city    = isset( $address['city'] ) ? sanitize_text_field( $address['city'] ) : '';
			$state   = isset( $address['state'] ) ? sanitize_text_field( $address['state'] ) : '';
			$zip     = isset( $address['zip'] ) ? sanitize_text_field( $address['zip'] ) : '';
			$country = isset( $address['country'] ) ? sanitize_text_field( $address['country'] ) : '';

			$full_address = implode( ' ', array_filter( array( $street, $city, $state, $zip, $country ) ) );

			$widget_options = array(
				'title'   => $title,
				'address' => $full_address,
				'phone'   => '',
				'hours'   => '',
				'showmap' => false,
				'email'   => '',
			);

			$widget_updated = '';
			if ( ! self::has_business_address_widget( $first_sidebar ) ) {
				$widget_updated = Jetpack_Widgets::insert_widget_in_sidebar( 'widget_contact_info', $widget_options, $first_sidebar );
			} else {
				$widget_updated = Jetpack_Widgets::update_widget_in_sidebar( 'widget_contact_info', $widget_options, $first_sidebar );
			}
			if ( is_wp_error( $widget_updated ) ) {
				return new WP_Error( 'widget_update_failed', 'Widget could not be updated.', 400 );
			}

			$address_save = array(
				'name'    => $title,
				'street'  => $street,
				'city'    => $city,
				'state'   => $state,
				'zip'     => $zip,
				'country' => $country,
			);
			update_option( 'jpo_business_address', $address_save );
			return true;
		}

		// No sidebar to place the widget.
		return new WP_Error( 'sidebar_not_found', 'No sidebar.', 400 );
	}

	/**
	 * Check whether "Contact Info & Map" widget is present in a given sidebar.
	 *
	 * @param string $sidebar ID of the sidebar to which the widget will be added.
	 *
	 * @return bool Whether the widget is present in a given sidebar.
	 */
	private static function has_business_address_widget( $sidebar ) {
		$sidebars_widgets = get_option( 'sidebars_widgets', array() );
		if ( ! isset( $sidebars_widgets[ $sidebar ] ) ) {
			return false;
		}
		foreach ( $sidebars_widgets[ $sidebar ] as $widget ) {
			if ( str_contains( $widget, 'widget_contact_info' ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if user is allowed to perform the update.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return bool
	 */
	public function can_request( $request ) {
		$req_params = $request->get_params();
		if ( ! empty( $req_params['onboarding']['token'] ) && isset( $req_params['rest_route'] ) ) {
			return Jetpack::validate_onboarding_token_action( $req_params['onboarding']['token'], $req_params['rest_route'] );
		}

		if ( 'GET' === $request->get_method() ) {
			return current_user_can( 'jetpack_admin_page' );
		} else {
			$module = Jetpack_Core_Json_Api_Endpoints::get_module_requested();
			if ( empty( $module ) ) {
				$params = $request->get_json_params();
				if ( ! is_array( $params ) ) {
					$params = $request->get_body_params();
				}
				$options = Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list( $params );
				foreach ( $options as $option => $definition ) {
					if ( in_array( $options[ $option ]['jp_group'], array( 'post-by-email' ), true ) ) {
						$module = $options[ $option ]['jp_group'];
						break;
					}
				}
			}
			// User is trying to create, regenerate or delete its PbE.
			if ( 'post-by-email' === $module ) {
				return current_user_can( 'edit_posts' ) && current_user_can( 'jetpack_admin_page' );
			}
			return current_user_can( 'jetpack_configure_modules' );
		}
	}
}

/**
 * Get detailed data from a specific module.
 *
 * phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */
class Jetpack_Core_API_Module_Data_Endpoint {
	// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound

	/**
	 * Process request and return different data based on the module we are interested in.
	 *
	 * @param WP_REST_Request $request WP API request.
	 *
	 * @return WP_REST_Response|WP_Error A REST response if the request was served successfully, otherwise an error.
	 */
	public function process( $request ) {
		switch ( $request['slug'] ) {
			case 'protect':
				return $this->get_protect_data();
			case 'stats':
				return $this->get_stats_data( $request );
			case 'akismet':
				return $this->get_akismet_data();
			case 'monitor':
				return $this->get_monitor_data();
			case 'verification-tools':
				return $this->get_verification_tools_data();
			case 'vaultpress':
				return $this->get_vaultpress_data();
		}
	}

	/**
	 * Decide against which service to check the key.
	 *
	 * @since 4.8.0
	 *
	 * @param WP_REST_Request $request WP API request.
	 *
	 * @return bool
	 */
	public function key_check( $request ) {
		switch ( $request['service'] ) {
			case 'akismet':
				$params = $request->get_json_params();
				if ( isset( $params['api_key'] ) && ! empty( $params['api_key'] ) ) {
					return $this->check_akismet_key( $params['api_key'] );
				}
				return $this->check_akismet_key();
		}
		return false;
	}

	/**
	 * Get number of blocked intrusion attempts.
	 *
	 * @since 4.3.0
	 *
	 * @return mixed|WP_Error Number of blocked attempts if protection is enabled. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function get_protect_data() {
		if ( Jetpack::is_module_active( 'protect' ) ) {
			return (int) get_site_option( 'jetpack_protect_blocked_attempts', 0 );
		}

		return new WP_Error(
			'not_active',
			esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Get number of spam messages blocked by Akismet.
	 *
	 * @since 4.3.0
	 *
	 * @return int|string Number of spam blocked by Akismet. Otherwise, an error message.
	 */
	public function get_akismet_data() {
		$akismet_status = $this->akismet_is_active_and_registered();
		if ( ! is_wp_error( $akismet_status ) ) {
			return (int) get_option( 'akismet_spam_count', 0 );
		} else {
			return $akismet_status->get_error_code();
		}
	}

	/**
	 * Verify the Akismet API key.
	 *
	 * @since 4.8.0
	 *
	 * @param string $api_key Optional API key to check.
	 *
	 * @return array Information about the key. 'validKey' is true if key is valid, false otherwise.
	 */
	public function check_akismet_key( $api_key = '' ) {
		$akismet_status = $this->akismet_class_exists();
		if ( is_wp_error( $akismet_status ) ) {
			return rest_ensure_response(
				array(
					'validKey'          => false,
					'invalidKeyCode'    => $akismet_status->get_error_code(),
					'invalidKeyMessage' => $akismet_status->get_error_message(),
				)
			);
		}

		$key_status = Akismet::check_key_status( empty( $api_key ) ? Akismet::get_api_key() : $api_key );

		if ( ! $key_status || 'invalid' === $key_status || 'failed' === $key_status ) {
			return rest_ensure_response(
				array(
					'validKey'          => false,
					'invalidKeyCode'    => 'invalid_key',
					'invalidKeyMessage' => esc_html__( 'Invalid Akismet key. Please contact support.', 'jetpack' ),
				)
			);
		}

		return rest_ensure_response(
			array(
				'validKey' => isset( $key_status[1] ) && 'valid' === $key_status[1],
			)
		);
	}

	/**
	 * Check if Akismet class file exists and if class is loaded.
	 *
	 * @since 4.8.0
	 *
	 * @return bool|WP_Error Returns true if class file exists and class is loaded, WP_Error otherwise.
	 */
	private function akismet_class_exists() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/akismet/class.akismet.php' ) ) {
			return new WP_Error( 'not_installed', esc_html__( 'Please install Akismet.', 'jetpack' ), array( 'status' => 400 ) );
		}

		if ( ! class_exists( 'Akismet' ) ) {
			return new WP_Error( 'not_active', esc_html__( 'Please activate Akismet.', 'jetpack' ), array( 'status' => 400 ) );
		}

		return true;
	}

	/**
	 * Is Akismet registered and active?
	 *
	 * @since 4.3.0
	 *
	 * @return bool|WP_Error True if Akismet is active and registered. Otherwise, a WP_Error instance with the corresponding error.
	 */
	private function akismet_is_active_and_registered() {
		$akismet_exists = $this->akismet_class_exists();
		if ( is_wp_error( $akismet_exists ) ) {
			return $akismet_exists;
		}

		// What about if Akismet is put in a sub-directory or maybe in mu-plugins?
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet.php';
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet-admin.php';
		$akismet_key = Akismet::verify_key( Akismet::get_api_key() );

		if ( ! $akismet_key || 'invalid' === $akismet_key || 'failed' === $akismet_key ) {
			return new WP_Error( 'invalid_key', esc_html__( 'Invalid Akismet key. Please contact support.', 'jetpack' ), array( 'status' => 400 ) );
		}

		return true;
	}

	/**
	 * Get stats data for this site
	 *
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $request {
	 *     Array of parameters received by request.
	 *
	 *     @type string $date Date range to restrict results to.
	 * }
	 *
	 * @return WP_Error|WP_HTTP_Response|WP_REST_Response Stats information relayed from WordPress.com.
	 */
	public function get_stats_data( WP_REST_Request $request ) {
		// Get parameters to fetch Stats data.
		$range = $request->get_param( 'range' );

		// If no parameters were passed.
		if (
			empty( $range )
			|| ! in_array( $range, array( 'day', 'week', 'month' ), true )
		) {
			$range = 'day';
		}

		if ( ! function_exists( 'convert_stats_array_to_object' ) ) {
			require_once JETPACK__PLUGIN_DIR . 'modules/stats.php';
		}

		$wpcom_stats = new WPCOM_Stats();
		switch ( $range ) {

			// This is always called first on page load.
			case 'day':
				$initial_stats = convert_stats_array_to_object( $wpcom_stats->get_stats() );
				return rest_ensure_response(
					array(
						'general' => $initial_stats,

						// Build data for 'day' as if it was $wpcom_stats ->get_visits( array( 'unit' => 'day, 'quantity' => 30).
						'day'     => isset( $initial_stats->visits )
							? $initial_stats->visits
							: array(),
					)
				);
			case 'week':
				return rest_ensure_response(
					array(
						'week' => convert_stats_array_to_object(
							$wpcom_stats->get_visits(
								array(
									'unit'     => 'week',
									'quantity' => 14,
								)
							)
						),
					)
				);
			case 'month':
				return rest_ensure_response(
					array(
						'month' => convert_stats_array_to_object(
							$wpcom_stats->get_visits(
								array(
									'unit'     => 'month',
									'quantity' => 12,
								)
							)
						),
					)
				);
		}
	}

	/**
	 * Get date of last downtime.
	 *
	 * @since 4.3.0
	 *
	 * @return mixed|WP_Error Number of days since last downtime. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function get_monitor_data() {
		if ( ! Jetpack::is_module_active( 'monitor' ) ) {
			return new WP_Error(
				'not_active',
				esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$monitor       = new Jetpack_Monitor();
		$last_downtime = $monitor->monitor_get_last_downtime();
		if ( is_wp_error( $last_downtime ) ) {
			return $last_downtime;
		} elseif ( false === strtotime( $last_downtime ) ) {
			return rest_ensure_response(
				array(
					'code' => 'success',
					'date' => null,
				)
			);
		} else {
			return rest_ensure_response(
				array(
					'code' => 'success',
					'date' => human_time_diff( strtotime( $last_downtime ), strtotime( 'now' ) ),
				)
			);
		}
	}

	/**
	 * Get services that this site is verified with.
	 *
	 * @since 4.3.0
	 *
	 * @return mixed|WP_Error List of services that verified this site. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function get_verification_tools_data() {
		if ( ! Jetpack::is_module_active( 'verification-tools' ) ) {
			return new WP_Error(
				'not_active',
				esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$verification_services_codes = get_option( 'verification_services_codes' );
		if (
			! is_array( $verification_services_codes )
			|| empty( $verification_services_codes )
		) {
			return new WP_Error(
				'empty',
				esc_html__( 'Site not verified with any service.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$services = array();
		foreach ( jetpack_verification_services() as $name => $service ) {
			if ( is_array( $service ) && ! empty( $verification_services_codes[ $name ] ) ) {
				switch ( $name ) {
					case 'google':
						$services[] = 'Google';
						break;
					case 'bing':
						$services[] = 'Bing';
						break;
					case 'pinterest':
						$services[] = 'Pinterest';
						break;
					case 'yandex':
						$services[] = 'Yandex';
						break;
					case 'facebook':
						$services[] = 'Facebook';
						break;
				}
			}
		}

		if ( empty( $services ) ) {
			return new WP_Error(
				'empty',
				esc_html__( 'Site not verified with any service.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( 2 > count( $services ) ) {
			$message = esc_html(
				sprintf(
					/* translators: %s is a service name like Google, Bing, Pinterest, etc. */
					__( 'Your site is verified with %s.', 'jetpack' ),
					$services[0]
				)
			);
		} else {
			$copy_services = $services;
			$last          = count( $copy_services ) - 1;
			$last_service  = $copy_services[ $last ];
			unset( $copy_services[ $last ] );
			$message = esc_html(
				sprintf(
					/* translators: %1$s is a comma separated list of services, and %2$s is a single service name like Google, Bing, Pinterest, etc. */
					__( 'Your site is verified with %1$s and %2$s.', 'jetpack' ),
					implode( ', ', $copy_services ),
					$last_service
				)
			);
		}

		return rest_ensure_response(
			array(
				'code'     => 'success',
				'message'  => $message,
				'services' => $services,
			)
		);
	}

	/**
	 * Get VaultPress site data including, among other things, the date of the last backup if it was completed.
	 *
	 * @since 4.3.0
	 *
	 * @return mixed|WP_Error VaultPress site data. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function get_vaultpress_data() {
		if ( ! class_exists( 'VaultPress' ) ) {
			return new WP_Error(
				'not_active',
				esc_html__( 'The requested Jetpack module is not active.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$vaultpress = new VaultPress();
		if ( ! $vaultpress->is_registered() ) {
			return rest_ensure_response(
				array(
					'code'    => 'not_registered',
					'message' => esc_html__( 'You need to register for VaultPress.', 'jetpack' ),
				)
			);
		}

		$data = json_decode( base64_decode( $vaultpress->contact_service( 'plugin_data' ) ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		if ( false === $data ) {
			return rest_ensure_response(
				array(
					'code'    => 'not_registered',
					'message' => esc_html__( 'Could not connect to VaultPress.', 'jetpack' ),
				)
			);
		} elseif ( is_wp_error( $data ) || ! isset( $data->backups->last_backup ) ) {
			return $data;
		} elseif ( empty( $data->backups->last_backup ) ) {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'VaultPress is active and will back up your site soon.', 'jetpack' ),
					'data'    => $data,
				)
			);
		} else {
			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html(
						sprintf(
							/* translators: placeholder is a unit of time (1 hour, 5 days, ...) */
							esc_html__( 'Your site was successfully backed up %s ago.', 'jetpack' ),
							human_time_diff(
								$data->backups->last_backup,
								current_time( 'timestamp' ) // phpcs:ignore WordPress.DateTime.CurrentTimeTimestamp.Requested -- We cannot switch to time() or another "unix" timestamp option as long as $data->backups->last_backup uses WP timestamps.
							)
						)
					),
					'data'    => $data,
				)
			);
		}
	}

	/**
	 * A WordPress REST API permission callback method that accepts a request object and
	 * decides if the current user has enough privileges to act.
	 *
	 * @since 4.3.0
	 *
	 * @return bool does a current user have enough privileges.
	 */
	public function can_request() {
		return current_user_can( 'jetpack_admin_page' );
	}
}

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move these functions to some other file.

/**
 * Actions performed only when Gravatar Hovercards is activated through the endpoint call.
 *
 * @since 4.3.1
 */
function jetpack_do_after_gravatar_hovercards_activation() {

	// When Gravatar Hovercards is activated, enable them automatically.
	update_option( 'gravatar_disable_hovercards', 'enabled' );
}
add_action( 'jetpack_activate_module_gravatar-hovercards', 'jetpack_do_after_gravatar_hovercards_activation' );

/**
 * Actions performed only when Gravatar Hovercards is activated through the endpoint call.
 *
 * @since 4.3.1
 */
function jetpack_do_after_gravatar_hovercards_deactivation() {

	// When Gravatar Hovercards is deactivated, disable them automatically.
	update_option( 'gravatar_disable_hovercards', 'disabled' );
}
add_action( 'jetpack_deactivate_module_gravatar-hovercards', 'jetpack_do_after_gravatar_hovercards_deactivation' );

/**
 * Actions performed only when Markdown is activated through the endpoint call.
 *
 * @since 4.7.0
 */
function jetpack_do_after_markdown_activation() {

	// When Markdown is activated, enable support for post editing automatically.
	update_option( 'wpcom_publish_posts_with_markdown', true );
}
add_action( 'jetpack_activate_module_markdown', 'jetpack_do_after_markdown_activation' );
