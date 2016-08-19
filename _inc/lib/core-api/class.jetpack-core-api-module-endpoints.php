<?php
/**
 * This is the base class for every Core API endpoint Jetpack uses.
 *
 */
class Jetpack_Core_API_Module_Toggle_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	private $modules_requiring_public = array(
		'sitemaps',
		'photon',
		'enhanced-distribution',
		'sharedaddy',
		'json-api',
	);

	/**
	 * Toggle module active state.
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
	 * @return array Array of Jetpack modules.
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
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function activate_module( $data ) {
		if ( ! Jetpack::is_module( $data['slug'] ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if (
			in_array( $data['slug'], $this->modules_requiring_public )
			&& ! $this->is_site_public()
		) {
			return new WP_Error(
				'rest_cannot_publish',
				__( 'This module requires your site to be set to publicly accessible.', 'jetpack' ),
				array( 'status' => 424 )
			);
		}

		if ( Jetpack::activate_module( $data['slug'], false, false ) ) {
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
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function deactivate_module( $data ) {
		if ( ! Jetpack::is_module( $data['slug'] ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( ! Jetpack::is_module_active( $data['slug'] ) ) {
			return new WP_Error(
				'already_inactive',
				esc_html__( 'The requested Jetpack module was already inactive.', 'jetpack' ),
				array( 'status' => 409 )
			);
		}

		if ( Jetpack::deactivate_module( $data['slug'] ) ) {
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

	public function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}

class Jetpack_Core_API_Module_List_Endpoint {

	/**
	 * Get a list of all Jetpack modules and their information.
	 *
	 * @since 4.3.0
	 *
	 * @return array Array of Jetpack modules.
	 */
	public function process( $data ) {
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

		return $modules;
	}

	public function can_request() {
		return current_user_can( 'jetpack_admin_page' );
	}
}

class Jetpack_Core_API_Module_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	public function process( $data ) {
		if ( 'GET' === $data->get_method() ) {
			return $this->get_module( $data );
		} else {
			return $this->update_module( $data );
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

			return $module;
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
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was updated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public static function update_module( $data ) {
		if ( ! Jetpack::is_module( $data['slug'] ) ) {
			return new WP_Error( 'not_found', esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ), array( 'status' => 404 ) );
		}

		if ( ! Jetpack::is_module_active( $data['slug'] ) ) {
			return new WP_Error( 'inactive', esc_html__( 'The requested Jetpack module is inactive.', 'jetpack' ), array( 'status' => 409 ) );
		}

		// Get parameters to update the module.
		$params = $data->get_json_params();

		// Exit if no parameters were passed.
		if ( ! is_array( $params ) ) {
			return new WP_Error( 'missing_options', esc_html__( 'Missing options.', 'jetpack' ), array( 'status' => 404 ) );
		}

		// Get available module options.
		$options = Jetpack_Core_Json_Api_Endpoints::get_module_available_options( $data['slug'] );

		// Options that are invalid or failed to update.
		$invalid = array();
		$not_updated = array();

		// Used if response is successful. The message can be overwritten and additional data can be added here.
		$response = array(
			'code'	  => 'success',
			'message' => esc_html__( 'The requested Jetpack module was updated.', 'jetpack' ),
		);

		foreach ( $params as $option => $value ) {
			// If option is invalid, don't go any further.
			if ( ! in_array( $option, array_keys( $options ) ) ) {
				$invalid[] = $option;
				continue;
			}

			// Used if there was an error. Can be overwritten with specific error messages.
			$error = '';

			// Set to true if the option update was successful.
			$updated = false;

			// Properly cast value based on its type defined in endpoint accepted args.
			$value = Jetpack_Core_Json_Api_Endpoints::cast_value( $value, $options[ $option ] );

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
						$response[ $option ] = $result;
						$updated = true;
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
						$response[ $option ] = $result;
						$updated = true;
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
					$grouped_options = $grouped_options_current = (array) Jetpack_Options::get_option( 'relatedposts' );
					$grouped_options[ $option ] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current != $grouped_options ? Jetpack_Options::update_option( 'relatedposts', $grouped_options ) : true;
					break;

				case 'google':
				case 'bing':
				case 'pinterest':
					$grouped_options = $grouped_options_current = (array) get_option( 'verification_services_codes' );
					$grouped_options[ $option ] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current != $grouped_options ? update_option( 'verification_services_codes', $grouped_options ) : true;
					break;

				case 'sharing_services':
					$sharer = new Sharing_Service();

					// If option value was the same, consider it done.
					$updated = $value != $sharer->get_blog_services() ? $sharer->set_blog_services( $value['visible'], $value['hidden'] ) : true;
					break;

				case 'button_style':
				case 'sharing_label':
				case 'show':
					$sharer = new Sharing_Service();
					$grouped_options = $sharer->get_global_options();
					$grouped_options[ $option ] = $value;
					$updated = $sharer->set_global_options( $grouped_options );
					break;

				case 'custom':
					$sharer = new Sharing_Service();
					$updated = $sharer->new_service( stripslashes( $value['sharing_name'] ), stripslashes( $value['sharing_url'] ), stripslashes( $value['sharing_icon'] ) );

					// Return new custom service
					$response[ $option ] = $updated;
					break;

				case 'sharing_delete_service':
					$sharer = new Sharing_Service();
					$updated = $sharer->delete_service( $value );
					break;

				case 'jetpack-twitter-cards-site-tag':
					$value = trim( ltrim( strip_tags( $value ), '@' ) );
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
						$option = 'true';
					} else {
						$atd_option = 'AtD_options';
					}
					$user_id = get_current_user_id();
					$grouped_options_current = AtD_get_options( $user_id, $atd_option );
					unset( $grouped_options_current['name'] );
					$grouped_options = $grouped_options_current;
					if ( $value && ! isset( $grouped_options [ $option ] ) ) {
						$grouped_options [ $option ] = $value;
					} elseif ( ! $value && isset( $grouped_options [ $option ] ) ) {
						unset( $grouped_options [ $option ] );
					}
					// If option value was the same, consider it done, otherwise try to update it.
					$options_to_save = implode( ',', array_keys( $grouped_options ) );
					$updated = $grouped_options != $grouped_options_current ? AtD_update_setting( $user_id, $atd_option, $options_to_save ) : true;
					break;

				case 'ignored_phrases':
				case 'unignore_phrase':
					$user_id = get_current_user_id();
					$atd_option = 'AtD_ignored_phrases';
					$grouped_options = $grouped_options_current = explode( ',', AtD_get_setting( $user_id, $atd_option ) );
					if ( 'ignored_phrases' == $option ) {
						$grouped_options = explode( ',', $value );
					} else {
						$index = array_search( $value, $grouped_options );
						if ( false !== $index ) {
							unset( $grouped_options[ $index ] );
							$grouped_options = array_values( $grouped_options );
						}
					}
					$ignored_phrases = implode( ',', array_filter( array_map( 'strip_tags', $grouped_options ) ) );
					$updated = $grouped_options != $grouped_options_current ? AtD_update_setting( $user_id, $atd_option, $ignored_phrases ) : true;
					break;

				case 'admin_bar':
				case 'roles':
				case 'count_roles':
				case 'blog_id':
				case 'do_not_track':
				case 'hide_smile':
				case 'version':
					$grouped_options = $grouped_options_current = (array) get_option( 'stats_options' );
					$grouped_options[ $option ] = $value;

					// If option value was the same, consider it done.
					$updated = $grouped_options_current != $grouped_options ? update_option( 'stats_options', $grouped_options ) : true;
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
					_n( 'Invalid option for this module: %s.', 'Invalid options for this module: %s.', $invalid_count, 'jetpack' ),
					join( ', ', $invalid )
				);
			}
			if ( $not_updated_count > 0 ) {
				$not_updated_messages = array();
				foreach ( $not_updated as $not_updated_option => $not_updated_message ) {
					if ( ! empty( $not_updated_message ) ) {
						$not_updated_messages[] = sprintf(
							/* Translators: the first variable is a module option name. The second is the error message . */
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
	 * @since 4.1.0
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
		update_option( 'post_by_email_address', $response );

		return $response;
	}

	public function can_request( $request ) {
		if ( 'GET' === $request->get_method() ) {
			return current_user_can( 'jetpack_admin_page' );
		} else {
			return current_user_can( 'jetpack_configure_modules' );
		}
	}
}