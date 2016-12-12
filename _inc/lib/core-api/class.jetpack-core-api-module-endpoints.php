<?php
/**
 * This is the base class for every Core API endpoint Jetpack uses.
 *
 */
class Jetpack_Core_API_Module_Toggle_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	/**
	 * Check if the module requires the site to be publicly accessible from WPCOM.
	 * If the site meets this requirement, the module is activated. Otherwise an error is returned.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 *     @type bool   $active should module be activated.
	 * }
	 *
	 * @return WP_REST_Response|WP_Error A REST response if the request was served successfully, otherwise an error.
	 */
	public function process( $data ) {
		if ( $data['active'] ) {
			return $this->activate_module( $data );
		} else {
			return $this->deactivate_module( $data );
		}
	}

	/**
	 * If it's a valid Jetpack module, activate it.
	 *
	 * @since 4.3.0
	 *
	 * @param string|WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function activate_module( $data ) {
		$module_slug = isset( $data['slug'] )
			? $data['slug']
			: $data;

		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( Jetpack::activate_module( $module_slug, false, false ) ) {
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'The requested Jetpack module was activated.', 'jetpack' ),
			) );
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
	 * @param string|WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function deactivate_module( $data ) {
		$module_slug = isset( $data['slug'] )
			? $data['slug']
			: $data;

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
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'The requested Jetpack module was deactivated.', 'jetpack' ),
			) );
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

class Jetpack_Core_API_Module_List_Endpoint {

	/**
	 * A WordPress REST API callback method that accepts a request object and decides what to do with it.
	 *
	 * @param WP_REST_Request $request
	 *
	 * @since 4.3.0
	 *
	 * @return bool|Array|WP_Error a resulting value or object, or an error.
	 */
	public function process( $request ) {
		if ( 'GET' === $request->get_method() ) {
			return $this->get_modules( $request );
		} else {
			return $this->activate_modules( $request );
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
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );

		$modules = Jetpack_Admin::init()->get_modules();
		foreach ( $modules as $slug => $properties ) {
			$modules[ $slug ]['options'] =
				Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $slug );
			if (
				isset( $modules[ $slug ]['requires_connection'] )
				&& $modules[ $slug ]['requires_connection']
				&& Jetpack::is_development_mode()
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
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if modules were activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function activate_modules( $data ) {
		$params = $data->get_json_params();

		if (
			! isset( $params['modules'] )
			|| is_array( $params['modules'] )
		) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		$activated = array();
		$failed = array();

		foreach ( $params['modules'] as $module ) {
			if ( Jetpack::activate_module( $module, false, false ) ) {
				$activated[] = $module;
			} else {
				$failed[] = $module;
			}
		}

		if ( empty( $failed ) ) {
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'All modules activated.', 'jetpack' ),
			) );
		}

		$error = '';

		$activated_count = count( $activated );
		if ( $activated_count > 0 ) {
			$activated_last = array_pop( $activated );
			$activated_text = $activated_count > 1 ? sprintf(
				/* Translators: first variable is a list followed by the last item, which is the second variable. Example: dog, cat and bird. */
				__( '%1$s and %2$s', 'jetpack' ),
				join( ', ', $activated ), $activated_last ) : $activated_last;

			$error = sprintf(
				/* Translators: the variable is a module name. */
				_n( 'The module %s was activated.', 'The modules %s were activated.', $activated_count, 'jetpack' ),
				$activated_text ) . ' ';
		}

		$failed_count = count( $failed );
		if ( count( $failed ) > 0 ) {
			$failed_last = array_pop( $failed );
			$failed_text = $failed_count > 1 ? sprintf(
				/* Translators: first variable is a list followed by the last item, which is the second variable. Example: dog, cat and bird. */
				__( '%1$s and %2$s', 'jetpack' ),
				join( ', ', $failed ), $failed_last ) : $failed_last;

			$error = sprintf(
				/* Translators: the variable is a module name. */
				_n( 'The module %s failed to be activated.', 'The modules %s failed to be activated.', $failed_count, 'jetpack' ),
				$failed_text ) . ' ';
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
	 * @param WP_REST_Request $request
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
 *
 * @since 4.3.0
 * @since 4.4.0 Renamed Jetpack_Core_API_Module_Endpoint from to Jetpack_Core_API_Data.
 *
 * @author Automattic
 */
class Jetpack_Core_API_Data extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	/**
	 * Process request by returning the module or updating it.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data
	 *
	 * @return bool|mixed|void|WP_Error
	 */
	public function process( $data ) {
		if ( 'GET' === $data->get_method() ) {
			return $this->get_module( $data );
		} else {
			return $this->update_data( $data );
		}
	}

	/**
	 * Get information about a specific and valid Jetpack module.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return mixed|void|WP_Error
	 */
	public function get_module( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {

			$module = Jetpack::get_module( $data['slug'] );

			$module['options'] = Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $data['slug'] );

			if (
				isset( $module['requires_connection'] )
				&& $module['requires_connection']
				&& Jetpack::is_development_mode()
			) {
				$module['activated'] = false;
			}

			$i18n = jetpack_get_module_i18n( $data['slug'] );
			if ( isset( $module['name'] ) ) {
				$module['name'] = $i18n['name'];
			}
			if ( isset( $module['description'] ) ) {
				$module['description'] = $i18n['description'];
				$module['short_description'] = $i18n['description'];
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
	 * If it's a valid Jetpack module and configuration parameters have been sent, update it.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was updated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function update_data( $data ) {

		// If it's null, we're trying to update many module options from different modules.
		if ( is_null( $data['slug'] ) ) {

			// Value admitted by Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list that will make it return all module options.
			// It will not be passed. It's just checked in this method to pass that method a string or array.
			$data['slug'] = 'any';
		} else {
			if ( ! Jetpack::is_module( $data['slug'] ) ) {
				return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
			}

			if ( ! Jetpack::is_module_active( $data['slug'] ) ) {
				return new WP_Error( 'inactive', esc_html__( 'The requested Jetpack module is inactive.', 'jetpack' ), array( 'status' => 409 ) );
			}
		}

		// Get parameters to update the module.
		$params = $data->get_json_params();

		// Exit if no parameters were passed.
		if ( ! is_array( $params ) ) {
			return new WP_Error( 'missing_options', esc_html__( 'Missing options.', 'jetpack' ), array( 'status' => 404 ) );
		}

		// Get available module options.
		$options = Jetpack_Core_Json_Api_Endpoints::get_updateable_data_list( 'any' === $data['slug']
			? $params
			: $data['slug']
		);

		// Prepare to toggle module if needed
		$toggle_module = new Jetpack_Core_API_Module_Toggle_Endpoint( new Jetpack_IXR_Client() );

		// Options that are invalid or failed to update.
		$invalid = array_keys( array_diff_key( $params, $options ) );
		$not_updated = array();

		// Remove invalid options
		$params = array_intersect_key( $params, $options );

		// Used if response is successful. The message can be overwritten and additional data can be added here.
		$response = array(
			'code'	  => 'success',
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

					if ( is_wp_error( $toggle_result ) ) {
						$error = $toggle_result->get_error_message();
					} else {
						$updated = true;
					}
				} else {
					$error = Jetpack_Core_Json_Api_Endpoints::$user_permissions_error_msg;
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

				if ( ! Jetpack::is_module_active( $option_attrs['jp_group'] ) ) {
					$not_updated[ $option ] = esc_html__( 'The requested Jetpack module is inactive.', 'jetpack' );
					continue;
				}
			}

			// Properly cast value based on its type defined in endpoint accepted args.
			$value = Jetpack_Core_Json_Api_Endpoints::cast_value( $value, $option_attrs );

			switch ( $option ) {
				case 'monitor_receive_notifications':
					$monitor = new Jetpack_Monitor();

					// If we got true as response, consider it done.
					$updated = true === $monitor->update_option_receive_jetpack_monitor_notification( $value );
					break;

				case 'post_by_email_address':
					if ( 'create' == $value ) {
						$result = $this->_process_post_by_email(
							'jetpack.createPostByEmailAddress',
							esc_html__( 'Unable to create the Post by Email address. Please try again later.', 'jetpack' )
						);
					} elseif ( 'regenerate' == $value ) {
						$result = $this->_process_post_by_email(
							'jetpack.regeneratePostByEmailAddress',
							esc_html__( 'Unable to regenerate the Post by Email address. Please try again later.', 'jetpack' )
						);
					} elseif ( 'delete' == $value ) {
						$result = $this->_process_post_by_email(
							'jetpack.deletePostByEmailAddress',
							esc_html__( 'Unable to delete the Post by Email address. Please try again later.', 'jetpack' )
						);
					} else {
						$result = false;
					}

					// If we got an email address (create or regenerate) or 1 (delete), consider it done.
					if ( preg_match( '/[a-z0-9]+@post.wordpress.com/', $result ) ) {
						$response[$option] = $result;
						$updated           = true;
					} elseif ( 1 == $result ) {
						$updated = true;
					} elseif ( is_array( $result ) && isset( $result['message'] ) ) {
						$error = $result['message'];
					}
					break;

				case 'jetpack_protect_key':
					$protect = Jetpack_Protect_Module::instance();
					if ( 'create' == $value ) {
						$result = $protect->get_protect_key();
					} else {
						$result = false;
					}

					// If we got one of Protect keys, consider it done.
					if ( preg_match( '/[a-z0-9]{40,}/i', $result ) ) {
						$response[$option] = $result;
						$updated           = true;
					}
					break;

				case 'jetpack_protect_global_whitelist':
					$updated = jetpack_protect_save_whitelist( explode( PHP_EOL, str_replace( array( ' ', ',' ), array( '', "\n" ), $value ) ) );
					if ( is_wp_error( $updated ) ) {
						$error = $updated->get_error_message();
					}
					break;

				case 'show_headline':
				case 'show_thumbnails':
					$grouped_options          = $grouped_options_current = (array) Jetpack_Options::get_option( 'relatedposts' );
					$grouped_options[$option] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current != $grouped_options ? Jetpack_Options::update_option( 'relatedposts', $grouped_options ) : true;
					break;

				case 'google':
				case 'bing':
				case 'pinterest':
				case 'yandex':
					$grouped_options          = $grouped_options_current = (array) get_option( 'verification_services_codes' );
					$grouped_options[$option] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current != $grouped_options ? update_option( 'verification_services_codes', $grouped_options ) : true;
					break;

				case 'sharing_services':
					if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
						break;
					}

					$sharer = new Sharing_Service();

					// If option value was the same, consider it done.
					$updated = $value != $sharer->get_blog_services() ? $sharer->set_blog_services( $value['visible'], $value['hidden'] ) : true;
					break;

				case 'button_style':
				case 'sharing_label':
				case 'show':
					if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
						break;
					}

					$sharer = new Sharing_Service();
					$grouped_options = $sharer->get_global_options();
					$grouped_options[ $option ] = $value;
					$updated = $sharer->set_global_options( $grouped_options );
					break;

				case 'custom':
					if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
						break;
					}

					$sharer = new Sharing_Service();
					$updated = $sharer->new_service( stripslashes( $value['sharing_name'] ), stripslashes( $value['sharing_url'] ), stripslashes( $value['sharing_icon'] ) );

					// Return new custom service
					$response[$option] = $updated;
					break;

				case 'sharing_delete_service':
					if ( ! class_exists( 'Sharing_Service' ) && ! @include( JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) ) {
						break;
					}

					$sharer = new Sharing_Service();
					$updated = $sharer->delete_service( $value );
					break;

				case 'jetpack-twitter-cards-site-tag':
					$value   = trim( ltrim( strip_tags( $value ), '@' ) );
					$updated = get_option( $option ) !== $value ? update_option( $option, $value ) : true;
					break;

				case 'onpublish':
				case 'onupdate':
				case 'Bias Language':
				case 'Cliches':
				case 'Complex Expression':
				case 'Diacritical Marks':
				case 'Double Negative':
				case 'Hidden Verbs':
				case 'Jargon Language':
				case 'Passive voice':
				case 'Phrases to Avoid':
				case 'Redundant Expression':
				case 'guess_lang':
					if ( in_array( $option, array( 'onpublish', 'onupdate' ) ) ) {
						$atd_option = 'AtD_check_when';
					} elseif ( 'guess_lang' == $option ) {
						$atd_option = 'AtD_guess_lang';
						$option     = 'true';
					} else {
						$atd_option = 'AtD_options';
					}
					$user_id                 = get_current_user_id();
					$grouped_options_current = AtD_get_options( $user_id, $atd_option );
					unset( $grouped_options_current['name'] );
					$grouped_options = $grouped_options_current;
					if ( $value && ! isset( $grouped_options [$option] ) ) {
						$grouped_options [$option] = $value;
					} elseif ( ! $value && isset( $grouped_options [$option] ) ) {
						unset( $grouped_options [$option] );
					}
					// If option value was the same, consider it done, otherwise try to update it.
					$options_to_save = implode( ',', array_keys( $grouped_options ) );
					$updated         = $grouped_options != $grouped_options_current ? AtD_update_setting( $user_id, $atd_option, $options_to_save ) : true;
					break;

				case 'ignored_phrases':
				case 'unignore_phrase':
					$user_id         = get_current_user_id();
					$atd_option      = 'AtD_ignored_phrases';
					$grouped_options = $grouped_options_current = explode( ',', AtD_get_setting( $user_id, $atd_option ) );
					if ( 'ignored_phrases' == $option ) {
						$grouped_options = explode( ',', $value );
					} else {
						$index = array_search( $value, $grouped_options );
						if ( false !== $index ) {
							unset( $grouped_options[$index] );
							$grouped_options = array_values( $grouped_options );
						}
					}
					$ignored_phrases = implode( ',', array_filter( array_map( 'strip_tags', $grouped_options ) ) );
					$updated         = $grouped_options != $grouped_options_current ? AtD_update_setting( $user_id, $atd_option, $ignored_phrases ) : true;
					break;

				case 'admin_bar':
				case 'roles':
				case 'count_roles':
				case 'blog_id':
				case 'do_not_track':
				case 'hide_smile':
				case 'version':
					$grouped_options          = $grouped_options_current = (array) get_option( 'stats_options' );
					$grouped_options[$option] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current != $grouped_options ? update_option( 'stats_options', $grouped_options ) : true;
					break;

				case Jetpack_Core_Json_Api_Endpoints::holiday_snow_option_name():
					$updated = get_option( $option ) != $value ? update_option( $option, (bool) $value ? 'letitsnow' : '' ) : true;
					break;

				case 'wp_mobile_featured_images':
				case 'wp_mobile_excerpt':
					$value = ( 'enabled' === $value ) ? '1' : '0';
				// break intentionally omitted
				default:
					// If option value was the same, consider it done.
					$updated = get_option( $option ) != $value ? update_option( $option, $value ) : true;
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
			$invalid_count = count( $invalid );
			$not_updated_count = count( $not_updated );
			$error = '';
			if ( $invalid_count > 0 ) {
				$error = sprintf(
				/* Translators: the plural variable is a comma-separated list. Example: dog, cat, bird. */
					_n( 'Invalid option: %s.', 'Invalid options: %s.', $invalid_count, 'jetpack' ),
					join( ', ', $invalid )
				);
			}
			if ( $not_updated_count > 0 ) {
				$not_updated_messages = array();
				foreach ( $not_updated as $not_updated_option => $not_updated_message ) {
					if ( ! empty( $not_updated_message ) ) {
						$not_updated_messages[] = sprintf(
						/* Translators: the first variable is a module option or slug, or setting. The second is the error message . */
							__( 'Extra info for %1$s: %2$s', 'jetpack' ),
							$not_updated_option, $not_updated_message );
					}
				}
				if ( ! empty( $error ) ) {
					$error .= ' ';
				}
				$error .= sprintf(
				/* Translators: the plural variable is a comma-separated list. Example: dog, cat, bird. */
					_n( 'Option not updated: %s.', 'Options not updated: %s.', $not_updated_count, 'jetpack' ),
					join( ', ', array_keys( $not_updated ) ) );
				if ( ! empty( $not_updated_messages ) ) {
					$error .= ' ' . join( '. ', $not_updated_messages );
				}

			}
			// There was an error because some options were updated but others were invalid or failed to update.
			return new WP_Error( 'some_updated', esc_html( $error ), array( 'status' => 400 ) );
		}

	}

	/**
	 * Calls WPCOM through authenticated request to create, regenerate or delete the Post by Email address.
	 * @todo: When all settings are updated to use endpoints, move this to the Post by Email module and replace __process_ajax_proxy_request.
	 *
	 * @since 4.3.0
	 *
	 * @param string $endpoint Process to call on WPCOM to create, regenerate or delete the Post by Email address.
	 * @param string $error	   Error message to return.
	 *
	 * @return array
	 */
	private function _process_post_by_email( $endpoint, $error ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return array( 'message' => $error );
		}

		$this->xmlrpc->query( $endpoint );

		if ( $this->xmlrpc->isError() ) {
			return array( 'message' => $error );
		}

		$response = $this->xmlrpc->getResponse();
		if ( empty( $response ) ) {
			return array( 'message' => $error );
		}

		// Used only in Jetpack_Core_Json_Api_Endpoints::get_remote_value.
		update_option( 'post_by_email_address' . get_current_user_id(), $response );

		return $response;
	}

	/**
	 * Check if user is allowed to perform the update.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function can_request( $request ) {
		if ( 'GET' === $request->get_method() ) {
			return current_user_can( 'jetpack_admin_page' );
		} else {
			$module = Jetpack_Core_Json_Api_Endpoints::get_module_requested();
			// User is trying to create, regenerate or delete its PbE || ATD settings.
			if ( 'post-by-email' === $module || 'after-the-deadline' === $module ) {
				return current_user_can( 'edit_posts' ) && current_user_can( 'jetpack_admin_page' );
			}
			return current_user_can( 'jetpack_configure_modules' );
		}
	}
}

class Jetpack_Core_API_Module_Data_Endpoint {

	public function process( $request ) {
		switch( $request['slug'] ) {
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
	 * Get number of blocked intrusion attempts.
	 *
	 * @since 4.3.0
	 *
	 * @return mixed|WP_Error Number of blocked attempts if protection is enabled. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function get_protect_data() {
		if ( Jetpack::is_module_active( 'protect' ) ) {
			return get_site_option( 'jetpack_protect_blocked_attempts' );
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
		if ( ! is_wp_error( $status = $this->akismet_is_active_and_registered() ) ) {
			return rest_ensure_response( Akismet_Admin::get_stats( Akismet::get_api_key() ) );
		} else {
			return $status->get_error_code();
		}
	}

	/**
	 * Is Akismet registered and active?
	 *
	 * @since 4.3.0
	 *
	 * @return bool|WP_Error True if Akismet is active and registered. Otherwise, a WP_Error instance with the corresponding error.
	 */
	private function akismet_is_active_and_registered() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/akismet/class.akismet.php' ) ) {
			return new WP_Error( 'not_installed', esc_html__( 'Please install Akismet.', 'jetpack' ), array( 'status' => 400 ) );
		}

		if ( ! class_exists( 'Akismet' ) ) {
			return new WP_Error( 'not_active', esc_html__( 'Please activate Akismet.', 'jetpack' ), array( 'status' => 400 ) );
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
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $date Date range to restrict results to.
	 * }
	 *
	 * @return int|string Number of spam blocked by Akismet. Otherwise, an error message.
	 */
	public function get_stats_data( WP_REST_Request $data ) {
		// Get parameters to fetch Stats data.
		$range = $data->get_param( 'range' );

		// If no parameters were passed.
		if (
			empty ( $range )
			|| ! in_array( $range, array( 'day', 'week', 'month' ), true )
		) {
			$range = 'day';
		}

		if ( ! function_exists( 'stats_get_from_restapi' ) ) {
			require_once( JETPACK__PLUGIN_DIR . 'modules/stats.php' );
		}

		switch ( $range ) {

			// This is always called first on page load
			case 'day':
				$initial_stats = stats_get_from_restapi();
				return rest_ensure_response( array(
					'general' => $initial_stats,

					// Build data for 'day' as if it was stats_get_from_restapi( array(), 'visits?unit=day&quantity=30' );
					'day' => isset( $initial_stats->visits )
						? $initial_stats->visits
						: array(),
				) );
			case 'week':
				return rest_ensure_response( array(
					'week' => stats_get_from_restapi( array(), 'visits?unit=week&quantity=14' ),
				) );
			case 'month':
				return rest_ensure_response( array(
					'month' => stats_get_from_restapi( array(), 'visits?unit=month&quantity=12&' ),
				) );
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
		} else if ( false === strtotime( $last_downtime ) ) {
			return rest_ensure_response( array(
				'code' => 'success',
				'date' => null,
			) );
		} else {
			return rest_ensure_response( array(
				'code' => 'success',
				'date' => human_time_diff( strtotime( $last_downtime ), strtotime( 'now' ) ),
			) );
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
			$last = count( $copy_services ) - 1;
			$last_service = $copy_services[ $last ];
			unset( $copy_services[ $last ] );
			$message = esc_html(
				sprintf(
					/* translators: %1$s is a comma separated list of services, and %2$s is a single service name like Google, Bing, Pinterest, etc. */
					__( 'Your site is verified with %1$s and %2$s.', 'jetpack' ),
					join( ', ', $copy_services ),
					$last_service
				)
			);
		}

		return rest_ensure_response( array(
			'code'     => 'success',
			'message'  => $message,
			'services' => $services,
		) );
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
			return rest_ensure_response( array(
				'code'    => 'not_registered',
				'message' => esc_html__( 'You need to register for VaultPress.', 'jetpack' )
			) );
		}

		$data = json_decode( base64_decode( $vaultpress->contact_service( 'plugin_data' ) ) );
		if ( is_wp_error( $data ) || ! isset( $data->backups->last_backup ) ) {
			return $data;
		} else if ( empty( $data->backups->last_backup ) ) {
			return rest_ensure_response( array(
				'code'    => 'success',
				'message' => esc_html__( 'VaultPress is active and will back up your site soon.', 'jetpack' ),
				'data'    => $data,
			) );
		} else {
			return rest_ensure_response( array(
				'code'    => 'success',
				'message' => esc_html(
					sprintf(
						__( 'Your site was successfully backed-up %s ago.', 'jetpack' ),
						human_time_diff(
							$data->backups->last_backup,
							current_time( 'timestamp' )
						)
					)
				),
				'data'    => $data,
			) );
		}
	}

	/**
	 * A WordPress REST API permission callback method that accepts a request object and
	 * decides if the current user has enough privileges to act.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool does a current user have enough privileges.
	 */
	public function can_request() {
		return current_user_can( 'jetpack_admin_page' );
	}
}

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
