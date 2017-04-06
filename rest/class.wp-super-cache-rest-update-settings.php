<?php

class WP_Super_Cache_Rest_Update_Settings extends WP_REST_Controller {

	/**
	 * Update the cache settings.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$parameters = $request->get_json_params();
		if ( isset( $parameters[ 'easy' ] ) ) {
			$errors = $this->toggle_easy_caching( $parameters[ 'easy' ] );

		} else {
			$errors = $this->update_all_settings( $parameters );
		}

		if ( ! empty( $errors ) ) {
			return rest_ensure_response( $errors );

		} else {
			return rest_ensure_response( array( 'updated' => true ) );
		}
	}

	/**
	 * Update all of the settings that are given in the parameters list.
	 *
	 * @param array $parameters
	 * @return array
	 */
	protected function update_all_settings( $parameters ) {
		global $wp_cache_make_known_anon, $cache_path, $wp_cache_object_cache, $_wp_using_ext_object_cache, $cache_compression, $wp_cache_mod_rewrite;

		$errors = array();

		if ( isset( $parameters[ 'wp_cache_location' ] ) && $parameters[ 'wp_cache_location' ] != '' &&
			( !isset( $cache_path ) || $parameters[ 'wp_cache_location' ] != $cache_path ) ) {
			$dir = realpath( trailingslashit( dirname( $parameters[ 'wp_cache_location' ] ) ) );
			if ( $dir == false )
				$dir = WP_CONTENT_DIR . '/cache/';
			else
				$dir = trailingslashit( $dir ) . trailingslashit( wpsc_deep_replace( array( '..', '\\' ), basename( $parameters[ 'wp_cache_location' ] ) ) );
			$new_cache_path = $dir;
		} else {
			$new_cache_path = WP_CONTENT_DIR . '/cache/';
		}
		if ( $new_cache_path != $cache_path ) {
			if ( file_exists( $new_cache_path ) == false )
				rename( $cache_path, $new_cache_path );
			$cache_path = $new_cache_path;
			wp_cache_setting( 'cache_path', $cache_path );
		}

		if ( isset( $parameters[ 'wp_cache_status' ] ) ) {
			if ( 1 == $parameters[ 'wp_cache_status' ] ) {

				wp_cache_enable();

				if ( isset( $parameters[ 'super_cache_enabled' ] ) ) {
					if ( $parameters[ 'super_cache_enabled' ] == 0 ) {
						wp_cache_enable(); // logged in cache
						wp_super_cache_disable();
					} elseif ( $parameters[ 'super_cache_enabled' ] == 1 ) {
						$wp_cache_mod_rewrite = 1; // we need this because supercached files can be served by PHP too.
					} else { // super_cache_enabled == 2
						$wp_cache_mod_rewrite = 0; // cache files served by PHP
					}
					wp_cache_setting( 'wp_cache_mod_rewrite', $wp_cache_mod_rewrite );
				}
			} else {
				wp_cache_disable();
			}
		}

		if ( defined( 'WPSC_DISABLE_LOCKING' ) ) {
			$parameters[ 'wp_cache_mutex_disabled' ] = 1;
		}

		if ( isset( $parameters[ 'wp_cache_not_logged_in' ] ) ) {
			global $wp_cache_not_logged_in;
			if ( 1 == $parameters[ 'wp_cache_not_logged_in' ] ) {
				if ( 0 == $wp_cache_not_logged_in && function_exists( 'prune_super_cache' ) )
					prune_super_cache ($cache_path, true);
				$wp_cache_not_logged_in = 1;
			} else {
				$wp_cache_not_logged_in = 0;
			}
			wp_cache_setting( 'wp_cache_not_logged_in', $wp_cache_not_logged_in );
		}

		if ( isset( $parameters[ 'wp_cache_make_known_anon' ] ) ) {
			if ( 1 == $parameters[ 'wp_cache_make_known_anon' ] ) {
				if ( $wp_cache_make_known_anon == 0 && function_exists( 'prune_super_cache' ) )
					prune_super_cache ($cache_path, true);
				$wp_cache_make_known_anon = 1;
			} else {
				$wp_cache_make_known_anon = 0;
			}
			wp_cache_setting( 'wp_cache_make_known_anon', $wp_cache_make_known_anon );
		}

		if ( $_wp_using_ext_object_cache && isset( $parameters[ 'wp_cache_object_cache' ] ) ) {
			if ( $wp_cache_object_cache == 0 ) {
				if ( function_exists( 'prune_super_cache' ) )
					prune_super_cache( $cache_path, true );
				$wp_cache_object_cache = 1;
			} else {
				$wp_cache_object_cache = 0;
			}
			wp_cache_setting( 'wp_cache_object_cache', $wp_cache_object_cache );
		}

		$new_cache_compression = 0;
		if ( defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
			$cache_compression = 0;
			wp_cache_setting( 'cache_compression', $cache_compression );
		} else {
			if ( isset( $parameters[ 'cache_compression' ] ) ) {
				if ( 1 == $parameters[ 'cache_compression' ] ) {
					$new_cache_compression = 1;
				} else {
				}
			}
			if ( 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) {
				$errors[] =  __( "<strong>Warning!</strong> You attempted to enable compression but <code>zlib.output_compression</code> is enabled. See #21 in the Troubleshooting section of the readme file.", 'wp-super-cache' );
			} else {
				if ( $new_cache_compression != $cache_compression ) {
					$cache_compression = $new_cache_compression;
					wp_cache_setting( 'cache_compression', $cache_compression );
					if ( function_exists( 'prune_super_cache' ) )
						prune_super_cache( $cache_path, true );
					delete_option( 'super_cache_meta' );
				}
			}
		}
		$settings = array(	'wp_super_cache_late_init', 'wp_cache_disable_utf8',
			'wp_cache_no_cache_for_get', 'wp_supercache_304', 'wp_cache_mfunc_enabled',
			'wp_cache_mobile_enabled', 'wp_cache_front_page_checks', 'wp_supercache_cache_list',
			'wp_cache_hello_world', 'wp_cache_clear_on_post_edit', 'cache_rebuild_files',
			'wp_cache_refresh_single_only', 'wp_cache_mutex_disabled',
		);
		foreach( $settings as $key ) {
			if ( isset( $parameters[ $key ] ) ) {
				global ${$key};
				$$key = (int)$parameters[ $key ];
				wp_cache_setting( $key, (int)$parameters[ $key ] );
			}
		}

		global $valid_nonce;
		$valid_nonce = true;
		$time_settings = array( 'cache_max_time', 'cache_schedule_type', 'cache_scheduled_time', 'cache_schedule_interval', 'cache_time_interval', 'cache_gc_email_me' );
		foreach( $time_settings as $time_setting ) {
			if ( isset( $parameters[ $time_setting ] ) ) {
				$_POST[ $time_setting ] = $parameters[ $time_setting ];
				$_POST[ 'action' ] = 'expirytime';
			}
		}

		if ( isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'expirytime' ) {
			foreach( $time_settings as $time_setting ) {
				global ${$time_setting};
				if ( false == isset( $_POST[ $time_setting ] ) || $$time_setting == $_POST[ $time_setting ] )
					$_POST[ $time_setting ] = $$time_setting; // fill in the potentially missing fields before updating GC settings.
			}
			if ( isset( $parameters[ 'cache_gc_email_me' ] ) && $parameters[ 'cache_gc_email_me' ] == 0 )
				unset( $_POST[ 'cache_gc_email_me' ] );
			wp_cache_time_update();
		}

		if ( isset( $parameters[ 'wp_cache_pages' ] ) ) {
			$_POST[ 'wp_edit_rejected_pages' ] = 1;
			foreach( $parameters[ 'wp_cache_pages' ] as $page => $value ) {
				if ( $value ) {
					$_POST[ 'wp_cache_pages' ][ $page ] = 1;
				}
			}
			wp_cache_update_rejected_pages();
		}

		if ( isset( $parameters[ 'wp_rejected_uri' ] ) ) {
			$_REQUEST[ 'wp_rejected_uri' ] = $parameters[ 'wp_rejected_uri' ];
			wp_cache_update_rejected_strings();
		}

		if ( isset( $parameters[ 'wp_accepted_files' ] ) ) {
			$_REQUEST[ 'wp_accepted_files' ] = $parameters[ 'wp_accepted_files' ];
			wp_cache_update_accepted_strings();
		}

		if ( isset( $parameters[ 'wp_rejected_user_agent' ] ) ) {
			$_POST[ 'wp_rejected_user_agent' ] = $parameters[ 'wp_rejected_user_agent' ];
			wp_cache_update_rejected_ua();
		}

		$update_cdn = false;
		$cdn_settings = array( 'ossdlcdn', 'ossdl_off_cdn_url', 'ossdl_off_include_dirs', 'ossdl_off_exclude', 'ossdl_cname', 'ossdl_https' );
		foreach( $cdn_settings as $key ) {
			if ( isset( $parameters[ $key ] ) ) {
				$_POST[ $key ] = $parameters[ $key ];
				$update_cdn = true;
			}
		}
		if ( $update_cdn ) {
			reset( $cdn_settings );
			foreach( $cdn_settings as $key ) {
				if ( $key != 'ossdlcdn' && $key != 'ossdl_https' && false == isset( $_POST[ $key ] ) )
					$_POST[ $key ] = '';
			}
			$_POST[ 'action' ] = 'update_ossdl_off';
			if ( $_POST[ 'ossdlcdn' ] == 0 )
				unset( $_POST[ 'ossdlcdn' ] );
			scossdl_off_update();
		}

		$update_preload = false;
		$preload_settings = array( 'wp_cache_preload_interval' , 'wp_cache_preload_on', 'wp_cache_preload_taxonomies', 'wp_cache_preload_email_me', 'wp_cache_preload_email_volume', 'wp_cache_preload_posts', 'wp_cache_preload_on' );

		foreach( $preload_settings as $key ) {
			if ( isset( $parameters[ $key ] ) ) {
				$_POST[ $key ] = $parameters[ $key ];
				$update_preload = true;
			}
		}
		if ( $update_preload ) {
			$_POST[ 'action' ] = 'preload';
			reset( $preload_settings );
			foreach( $preload_settings as $key ) {
				if ( false == isset( $parameters[ $key ] ) ) {
					global ${$key};
					$_POST[ $key ] = $$key;
				} elseif( $parameters[ $key ] == 0 ) {
					unset( $_POST[ $key ] );
				}
			}
			wpsc_preload_settings();
		}

		return $errors;
	}

	/**
	 * Easy caching is a mode that allows the user to press one button and
	 * enable a sensible default of settings.
	 *
	 * @param bool $enabled
	 */
	protected function toggle_easy_caching( $enabled = true ) {
		global $cache_path, $wp_cache_shutdown_gc;
		if ( $enabled ) {
			$settings = array( 'wp_cache_mobile_enabled' => 1,
				'wp_cache_status' => 1,
				'super_cache_enabled' => 2,
				'cache_rebuild_files' => 1,
				'cache_compression' => 0,
			);

			// set up garbage collection with some default settings
			if ( ( !isset( $wp_cache_shutdown_gc ) || $wp_cache_shutdown_gc == 0 ) && false == wp_next_scheduled( 'wp_cache_gc' ) ) {
				if ( false == isset( $cache_schedule_type ) ) {
					$cache_schedule_type = 'interval';
					$cache_time_interval = 600;
					$cache_max_time = 1800;
					$cache_schedule_interval = 'hourly';
					$cache_gc_email_me = 0;
					wp_cache_setting( 'cache_schedule_type', $cache_schedule_type );
					wp_cache_setting( 'cache_time_interval', $cache_time_interval );
					wp_cache_setting( 'cache_max_time', $cache_max_time );
					wp_cache_setting( 'cache_schedule_interval', $cache_schedule_interval );
					wp_cache_setting( 'cache_gc_email_me', $cache_gc_email_me );
				}

				wp_schedule_single_event( time() + 600, 'wp_cache_gc' );
			}

		} else {
			$settings = array( 'super_cache_enabled' => 0 );
			wp_clear_scheduled_hook( 'wp_cache_check_site_hook' );
			wp_clear_scheduled_hook( 'wp_cache_gc' );
			wp_clear_scheduled_hook( 'wp_cache_gc_watcher' );
		}

		$parameters = array();

		foreach ( $settings as $key => $value ) {
			global ${$key};
			$$key = $value;
			$parameters[ $key ] = $value;
			if ( $key != 'wp_cache_status' ) {
				wp_cache_setting( $key, $value );
			}
		}

		if ( $cache_path != WP_CONTENT_DIR . '/cache/' ) {
			$parameters['wp_cache_location'] = $cache_path;
		}

		$advanced_settings = array( 'wp_super_cache_late_init', 'wp_cache_disable_utf8', 'wp_cache_no_cache_for_get', 'wp_supercache_304', 'wp_cache_mfunc_enabled', 'wp_cache_mobile_enabled', 'wp_cache_front_page_checks', 'wp_supercache_cache_list', 'wp_cache_hello_world', 'wp_cache_clear_on_post_edit', 'wp_cache_not_logged_in', 'wp_cache_make_known_anon','wp_cache_object_cache', 'wp_cache_refresh_single_only', 'cache_compression', 'wp_cache_mutex_disabled' );
		foreach ( $advanced_settings as $setting ) {
			global ${$setting};
			if ( isset( $$setting ) && $$setting == 1 ) {
				$parameters[ $setting ] = 1;
			} else {
				$parameters[ $setting ] = 0;
			}
		}

		$this->update_all_settings( $parameters );
	}
}
