<?php
class WPCOM_JSON_API_Update_Post_v1_2_Endpoint extends WPCOM_JSON_API_Update_Post_v1_1_Endpoint {

	// /sites/%s/posts/new       -> $blog_id
	// /sites/%s/posts/%d        -> $blog_id, $post_id
	function write_post( $path, $blog_id, $post_id ) {
		$new  = $this->api->ends_with( $path, '/new' );
		$args = $this->query_args();

		// unhook publicize, it's hooked again later -- without this, skipping services is impossible
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			remove_action( 'save_post', array( $GLOBALS['publicize_ui']->publicize, 'async_publicize_post' ), 100, 2 );
			add_action( 'rest_api_inserted_post', array( $GLOBALS['publicize_ui']->publicize, 'async_publicize_post' ) );
		}

		// 'future' is an alias for 'publish' for now
		if ( isset( $input['status'] ) && 'future' === $input['status'] ) {
			$input['status'] = 'publish';
		}

		if ( $new ) {
			$input = $this->input( true );

			if ( 'revision' === $input['type'] ) {
				if ( ! isset( $input['parent'] ) ) {
					return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
				}
				$input['status'] = 'inherit'; // force inherit for revision type
				$input['slug'] = $input['parent'] . '-autosave-v1';
			}
			elseif ( !isset( $input['title'] ) && !isset( $input['content'] ) && !isset( $input['excerpt'] ) ) {
				return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
			}

			// default to post
			if ( empty( $input['type'] ) )
				$input['type'] = 'post';

			$post_type = get_post_type_object( $input['type'] );

			if ( ! $this->is_post_type_allowed( $input['type'] ) ) {
				return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
			}

			if ( ! empty( $input['author'] ) ) {
				$author_id = parent::parse_and_set_author( $input['author'], $input['type'] );
				unset( $input['author'] );
				if ( is_wp_error( $author_id ) )
					return $author_id;
			}

			if ( 'publish' === $input['status'] ) {
				if ( ! current_user_can( $post_type->cap->publish_posts ) ) {
					if ( current_user_can( $post_type->cap->edit_posts ) ) {
						$input['status'] = 'pending';
					} else {
						return new WP_Error( 'unauthorized', 'User cannot publish posts', 403 );
					}
				}
			} else {
				if ( !current_user_can( $post_type->cap->edit_posts ) ) {
					return new WP_Error( 'unauthorized', 'User cannot edit posts', 403 );
				}
			}
		} else {
			$input = $this->input( false );

			if ( !is_array( $input ) || !$input ) {
				return new WP_Error( 'invalid_input', 'Invalid request input', 400 );
			}

			$post = get_post( $post_id );
			$_post_type = ( ! empty( $input['type'] ) ) ? $input['type'] : $post->post_type;
			$post_type = get_post_type_object( $_post_type );
			if ( !$post || is_wp_error( $post ) ) {
				return new WP_Error( 'unknown_post', 'Unknown post', 404 );
			}

			if ( !current_user_can( 'edit_post', $post->ID ) ) {
				return new WP_Error( 'unauthorized', 'User cannot edit post', 403 );
			}

			if ( ! empty( $input['author'] ) ) {
				$author_id = parent::parse_and_set_author( $input['author'], $_post_type );
				unset( $input['author'] );
				if ( is_wp_error( $author_id ) )
					return $author_id;
			}

			if ( ( isset( $input['status'] ) && 'publish' === $input['status'] ) && 'publish' !== $post->post_status && !current_user_can( 'publish_post', $post->ID ) ) {
				$input['status'] = 'pending';
			}
			$last_status = $post->post_status;
			$new_status = isset( $input['status'] ) ? $input['status'] : $last_status;

			// Make sure that drafts get the current date when transitioning to publish if not supplied in the post.
			$date_in_past = ( strtotime($post->post_date_gmt) < time() );
			if ( 'publish' === $new_status && 'draft' === $last_status && ! isset( $input['date_gmt'] ) && $date_in_past ) {
				$input['date_gmt'] = gmdate( 'Y-m-d H:i:s' );
			}
		}

		// If date is set, $this->input will set date_gmt, date still needs to be adjusted for the blog's offset
		if ( isset( $input['date_gmt'] ) ) {
			$gmt_offset = get_option( 'gmt_offset' );
			$time_with_offset = strtotime( $input['date_gmt'] ) + $gmt_offset * HOUR_IN_SECONDS;
			$input['date'] = date( 'Y-m-d H:i:s', $time_with_offset );
		}

		if ( ! empty( $author_id ) && get_current_user_id() != $author_id ) {
			if ( ! current_user_can( $post_type->cap->edit_others_posts ) ) {
				return new WP_Error( 'unauthorized', "User is not allowed to publish others' posts.", 403 );
			} elseif ( ! user_can( $author_id, $post_type->cap->edit_posts ) ) {
				return new WP_Error( 'unauthorized', 'Assigned author cannot publish post.', 403 );
			}
		}

		if ( !is_post_type_hierarchical( $post_type->name ) && 'revision' !== $post_type->name ) {
			unset( $input['parent'] );
		}

		/* add taxonomies by name */
		$tax_input = array();
		foreach ( array( 'categories' => 'category', 'tags' => 'post_tag' ) as $key => $taxonomy ) {
			if ( ! isset( $input[ $key ] ) ) {
				continue;
			}

			$tax_input[ $taxonomy ] = array();

			$is_hierarchical = is_taxonomy_hierarchical( $taxonomy );

			if ( is_array( $input[$key] ) ) {
				$terms = $input[$key];
			} else {
				$terms = explode( ',', $input[$key] );
			}

			foreach ( $terms as $term ) {
				/**
				 * We assume these are names, not IDs, even if they are numeric.
				 * Note: A category named "0" will not work right.
				 * https://core.trac.wordpress.org/ticket/9059
				 */
				$term_info = get_term_by( 'name', $term, $taxonomy, ARRAY_A );

				if ( ! $term_info ) {
					// only add a new tag/cat if the user has access to
					$tax = get_taxonomy( $taxonomy );

					// see https://core.trac.wordpress.org/ticket/26409
					if ( 'category' === $taxonomy && ! current_user_can( $tax->cap->edit_terms ) ) {
						continue;
					} else if ( ! current_user_can( $tax->cap->assign_terms ) ) {
						continue;
					}

					$term_info = wp_insert_term( $term, $taxonomy );
				}

				if ( ! is_wp_error( $term_info ) ) {
					if ( $is_hierarchical ) {
						// Categories must be added by ID
						$tax_input[$taxonomy][] = (int) $term_info['term_id'];
					} else {
						// Tags must be added by name
						$tax_input[$taxonomy][] = $term;
					}
				}
			}
		}

		/* add taxonomies by ID */
		foreach ( array( 'categories_by_id' => 'category', 'tags_by_id' => 'post_tag' ) as $key => $taxonomy ) {
			if ( ! isset( $input[ $key ] ) ) {
				continue;
			}

			// combine with any previous selections
			if ( ! isset( $tax_input[ $taxonomy ] ) || ! is_array( $tax_input[ $taxonomy ] ) ) {
				$tax_input[ $taxonomy ] = array();
			}

			$is_hierarchical = is_taxonomy_hierarchical( $taxonomy );

			if ( is_array( $input[$key] ) ) {
				$terms = $input[$key];
			} else {
				$terms = explode( ',', $input[$key] );
			}

			foreach ( $terms as $term ) {
				if ( ! ctype_digit( $term ) ) {
					// skip anything that doesn't look like an ID
					continue;
				}
				$term = (int) $term;
				$term_info = get_term_by( 'id', $term, $taxonomy, ARRAY_A );

				if ( $term_info && ! is_wp_error( $term_info ) ) {
					if ( $is_hierarchical ) {
						// Categories must be added by ID
						$tax_input[$taxonomy][] = $term;
					} else {
						// Tags must be added by name
						$tax_input[$taxonomy][] = $term_info['name'];
					}
				}
			}
		}

		if ( ( isset( $input['categories'] ) || isset( $input['categories_by_id'] ) )
			&& empty( $tax_input['category'] ) && 'revision' !== $post_type->name ) {
			$tax_input['category'][] = get_option( 'default_category' );
		}

		unset( $input['tags'], $input['categories'], $input['tags_by_id'], $input['categories_by_id'] );

		$insert = array();

		if ( !empty( $input['slug'] ) ) {
			$insert['post_name'] = $input['slug'];
			unset( $input['slug'] );
		}

		if ( isset( $input['discussion'] ) ) {
			$discussion = (array) $input['discussion'];
			foreach ( array( 'comment', 'ping' ) as $discussion_type ) {
				$discussion_open = sprintf( '%ss_open', $discussion_type );
				$discussion_status = sprintf( '%s_status', $discussion_type );

				if ( isset( $discussion[ $discussion_open ] ) ) {
					$is_open = WPCOM_JSON_API::is_truthy( $discussion[ $discussion_open ] );
 					$discussion[ $discussion_status ] = $is_open ? 'open' : 'closed';
				}

				if ( in_array( $discussion[ $discussion_status ], array( 'open', 'closed' ) ) ) {
					$insert[ $discussion_status ] = $discussion[ $discussion_status ];
				}
			}
		}

		unset( $input['discussion'] );

		if ( isset( $input['menu_order'] ) ) {
			$insert['menu_order'] = $input['menu_order'];
			unset( $input['menu_order'] );
		}

		$publicize = isset( $input['publicize'] ) ? $input['publicize'] : null;
		unset( $input['publicize'] );

		$publicize_custom_message = isset( $input['publicize_message'] ) ? $input['publicize_message'] : null;
		unset( $input['publicize_message'] );

		if ( isset( $input['featured_image'] ) ) {
			$featured_image = trim( $input['featured_image'] );
			$delete_featured_image = empty( $featured_image );
			unset( $input['featured_image'] );
		}

		$metadata = isset( $input['metadata'] ) ? $input['metadata'] : null;
		unset( $input['metadata'] );

		$likes = isset( $input['likes_enabled'] ) ? $input['likes_enabled'] : null;
		unset( $input['likes_enabled'] );

		$sharing = isset( $input['sharing_enabled'] ) ? $input['sharing_enabled'] : null;
		unset( $input['sharing_enabled'] );

		$sticky = isset( $input['sticky'] ) ? $input['sticky'] : null;
		unset( $input['sticky'] );

		foreach ( $input as $key => $value ) {
			$insert["post_$key"] = $value;
		}

		if ( ! empty( $author_id ) ) {
			$insert['post_author'] = absint( $author_id );
		}

		if ( ! empty( $tax_input ) ) {
			$insert['tax_input'] = $tax_input;
		}

		$has_media = ! empty( $input['media'] ) ? count( $input['media'] ) : false;
		$has_media_by_url = ! empty( $input['media_urls'] ) ? count( $input['media_urls'] ) : false;

		if ( $new ) {

			if ( isset( $input['content'] ) && ! has_shortcode( $input['content'], 'gallery' ) && ( $has_media || $has_media_by_url ) ) {
				switch ( ( $has_media + $has_media_by_url ) ) {
				case 0 :
					// No images - do nothing.
					break;
				case 1 :
					// 1 image - make it big
					$insert['post_content'] = $input['content'] = "[gallery size=full columns=1]\n\n" . $input['content'];
					break;
				default :
					// Several images - 3 column gallery
					$insert['post_content'] = $input['content'] = "[gallery]\n\n" . $input['content'];
					break;
				}
			}

			$post_id = wp_insert_post( add_magic_quotes( $insert ), true );
		} else {
			$insert['ID'] = $post->ID;

			// wp_update_post ignores date unless edit_date is set
			// See: http://codex.wordpress.org/Function_Reference/wp_update_post#Scheduling_posts
			// See: https://core.trac.wordpress.org/browser/tags/3.9.2/src/wp-includes/post.php#L3302
			if ( isset( $input['date_gmt'] ) || isset( $input['date'] ) ) {
				$insert['edit_date'] = true;
			}

			$post_id = wp_update_post( (object) $insert );
		}


		if ( !$post_id || is_wp_error( $post_id ) ) {
			return $post_id;
		}

		// make sure this post actually exists and is not an error of some kind (ie, trying to load media in the posts endpoint)
		$post_check = $this->get_post_by( 'ID', $post_id, $args['context'] );
		if ( is_wp_error( $post_check ) ) {
			return $post_check;
		}

		if ( $has_media || $has_media_by_url ) {
			$media_files = ! empty( $input['media'] ) ? $input['media'] : array();
			$media_urls = ! empty( $input['media_urls'] ) ? $input['media_urls'] : array();
			$media_attrs = ! empty( $input['media_attrs'] ) ? $input['media_attrs'] : array();
			$force_parent_id = $post_id;
			$media_results = $this->handle_media_creation_v1_1( $media_files, $media_urls, $media_attrs, $force_parent_id );
		}

		// set page template for this post..
		if ( isset( $input['page_template'] ) && 'page' == $post_type->name ) {
			$page_template = $input['page_template'];
			$page_templates = wp_get_theme()->get_page_templates( get_post( $post_id ) );
			if ( empty( $page_template ) || 'default' == $page_template || isset( $page_templates[ $page_template ] ) ) {
				update_post_meta( $post_id, '_wp_page_template', $page_template );
			}
		}

		// Set like status for the post
		/** This filter is documented in modules/likes.php */
		$sitewide_likes_enabled = (bool) apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) );
		if ( $new ) {
			if ( $sitewide_likes_enabled ) {
				if ( false === $likes ) {
					update_post_meta( $post_id, 'switch_like_status', 1 );
				} else {
					delete_post_meta( $post_id, 'switch_like_status' );
				}
			} else {
				if ( $likes ) {
					update_post_meta( $post_id, 'switch_like_status', 1 );
				} else {
					delete_post_meta( $post_id, 'switch_like_status' );
				}
			}
		} else {
			if ( isset( $likes ) ) {
				if ( $sitewide_likes_enabled ) {
					if ( false === $likes ) {
						update_post_meta( $post_id, 'switch_like_status', 1 );
					} else {
						delete_post_meta( $post_id, 'switch_like_status' );
					}
				} else {
					if ( true === $likes ) {
						update_post_meta( $post_id, 'switch_like_status', 1 );
					} else {
						delete_post_meta( $post_id, 'switch_like_status' );
					}
				}
			}
		}

		// Set sharing status of the post
		if ( $new ) {
			$sharing_enabled = isset( $sharing ) ? (bool) $sharing : true;
			if ( false === $sharing_enabled ) {
				update_post_meta( $post_id, 'sharing_disabled', 1 );
			}
		}
		else {
			if ( isset( $sharing ) && true === $sharing ) {
				delete_post_meta( $post_id, 'sharing_disabled' );
			} else if ( isset( $sharing ) && false == $sharing ) {
				update_post_meta( $post_id, 'sharing_disabled', 1 );
			}
		}

		if ( isset( $sticky ) ) {
			if ( true === $sticky ) {
				stick_post( $post_id );
			} else {
				unstick_post( $post_id );
			}
		}

		// WPCOM Specific (Jetpack's will get bumped elsewhere
		// Tracks how many posts are published and sets meta
		// so we can track some other cool stats (like likes & comments on posts published)
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if (
				( $new && 'publish' == $input['status'] )
				|| (
					!$new && isset( $last_status )
					&& 'publish' != $last_status
					&& isset( $new_status )
					&& 'publish' == $new_status
				)
			) {
				/** This action is documented in modules/widgets/social-media-icons.php */
				do_action( 'jetpack_bump_stats_extras', 'api-insights-posts', $this->api->token_details['client_id'] );
				update_post_meta( $post_id, '_rest_api_published', 1 );
				update_post_meta( $post_id, '_rest_api_client_id', $this->api->token_details['client_id'] );
			}
		}


		// We ask the user/dev to pass Publicize services he/she wants activated for the post, but Publicize expects us
		// to instead flag the ones we don't want to be skipped. proceed with said logic.
		// any posts coming from Path (client ID 25952) should also not publicize
		if ( $publicize === false || ( isset( $this->api->token_details['client_id'] ) && 25952 == $this->api->token_details['client_id'] ) ) {
			// No publicize at all, skip all by ID
			foreach ( $GLOBALS['publicize_ui']->publicize->get_services( 'all' ) as $name => $service ) {
				delete_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $name );
				$service_connections   = $GLOBALS['publicize_ui']->publicize->get_connections( $name );
				if ( ! $service_connections ) {
					continue;
				}
				foreach ( $service_connections as $service_connection ) {
					update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $service_connection->unique_id, 1 );
				}
			}
		} else if ( is_array( $publicize ) && ( count ( $publicize ) > 0 ) ) {
			foreach ( $GLOBALS['publicize_ui']->publicize->get_services( 'all' ) as $name => $service ) {
				/*
				 * We support both indexed and associative arrays:
				 * * indexed are to pass entire services
				 * * associative are to pass specific connections per service
				 *
				 * We do support mixed arrays: mixed integer and string keys (see 3rd example below).
				 *
				 * EG: array( 'twitter', 'facebook') will only publicize to those, ignoring the other available services
				 * 		Form data: publicize[]=twitter&publicize[]=facebook
				 * EG: array( 'twitter' => '(int) $pub_conn_id_0, (int) $pub_conn_id_3', 'facebook' => (int) $pub_conn_id_7 ) will publicize to two Twitter accounts, and one Facebook connection, of potentially many.
				 * 		Form data: publicize[twitter]=$pub_conn_id_0,$pub_conn_id_3&publicize[facebook]=$pub_conn_id_7
				 * EG: array( 'twitter', 'facebook' => '(int) $pub_conn_id_0, (int) $pub_conn_id_3' ) will publicize to all available Twitter accounts, but only 2 of potentially many Facebook connections
				 * 		Form data: publicize[]=twitter&publicize[facebook]=$pub_conn_id_0,$pub_conn_id_3
				 */

				// Delete any stale SKIP value for the service by name. We'll add it back by ID.
				delete_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $name );

				// Get the user's connections
				$service_connections = $GLOBALS['publicize_ui']->publicize->get_connections( $name );

				// if the user doesn't have any connections for this service, move on
				if ( ! $service_connections ) {
					continue;
				}

				if ( !in_array( $name, $publicize ) && !array_key_exists( $name, $publicize ) ) {
					// Skip the whole service by adding each connection ID
					foreach ( $service_connections as $service_connection ) {
						update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $service_connection->unique_id, 1 );
					}
				} else if ( !empty( $publicize[ $name ] ) ) {
					// Seems we're being asked to only push to [a] specific connection[s].
					// Explode the list on commas, which will also support a single passed ID
					$requested_connections = explode( ',', ( preg_replace( '/[\s]*/', '', $publicize[ $name ] ) ) );

					// Flag the connections we can't match with the requested list to be skipped.
					foreach ( $service_connections as $service_connection ) {
						if ( !in_array( $service_connection->meta['connection_data']->id, $requested_connections ) ) {
							update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $service_connection->unique_id, 1 );
						} else {
							delete_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $service_connection->unique_id );
						}
					}
				} else {
					// delete all SKIP values; it's okay to publish to all connected IDs for this service
					foreach ( $service_connections as $service_connection ) {
						delete_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $service_connection->unique_id );
					}
				}
			}
		}

		if ( ! is_null( $publicize_custom_message ) ) {
			if ( empty( $publicize_custom_message ) ) {
				delete_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_MESS );
			} else {
				update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_MESS, trim( $publicize_custom_message ) );
			}
		}

		if ( ! empty( $insert['post_format'] ) ) {
			if ( 'default' !== strtolower( $insert['post_format'] ) ) {
				set_post_format( $post_id, $insert['post_format'] );
			}
			else {
				set_post_format( $post_id, get_option( 'default_post_format' ) );
			}
		}

		if ( isset( $featured_image ) ) {
			parent::parse_and_set_featured_image( $post_id, $delete_featured_image, $featured_image );
		}

		if ( ! empty( $metadata ) ) {
			foreach ( (array) $metadata as $meta ) {

				$meta = (object) $meta;

				$existing_meta_item = new stdClass;

				if ( empty( $meta->operation ) )
					$meta->operation = 'update';

				if ( ! empty( $meta->value ) ) {
					if ( 'true' == $meta->value )
						$meta->value = true;
					if ( 'false' == $meta->value )
						$meta->value = false;
				}

				if ( ! empty( $meta->id ) ) {
					$meta->id = absint( $meta->id );
					$existing_meta_item = get_metadata_by_mid( 'post', $meta->id );
				}

				$unslashed_meta_key = wp_unslash( $meta->key ); // should match what the final key will be
				$meta->key = wp_slash( $meta->key );
				$unslashed_existing_meta_key = wp_unslash( $existing_meta_item->meta_key );
				$existing_meta_item->meta_key = wp_slash( $existing_meta_item->meta_key );

				// make sure that the meta id passed matches the existing meta key
				if ( ! empty( $meta->id ) && ! empty( $meta->key ) ) {
					$meta_by_id = get_metadata_by_mid( 'post', $meta->id );
					if ( $meta_by_id->meta_key !== $meta->key ) {
						continue; // skip this meta
					}
				}

				switch ( $meta->operation ) {
					case 'delete':

						if ( ! empty( $meta->id ) && ! empty( $existing_meta_item->meta_key ) && current_user_can( 'delete_post_meta', $post_id, $unslashed_existing_meta_key ) ) {
							delete_metadata_by_mid( 'post', $meta->id );
						} elseif ( ! empty( $meta->key ) && ! empty( $meta->previous_value ) && current_user_can( 'delete_post_meta', $post_id, $unslashed_meta_key ) ) {
							delete_post_meta( $post_id, $meta->key, $meta->previous_value );
						} elseif ( ! empty( $meta->key ) && current_user_can( 'delete_post_meta', $post_id, $unslashed_meta_key ) ) {
							delete_post_meta( $post_id, $meta->key );
						}

						break;
					case 'add':

						if ( ! empty( $meta->id ) || ! empty( $meta->previous_value ) ) {
							continue;
						} elseif ( ! empty( $meta->key ) && ! empty( $meta->value ) && ( current_user_can( 'add_post_meta', $post_id, $unslashed_meta_key ) ) || $this->is_metadata_public( $meta->key ) ) {
							add_post_meta( $post_id, $meta->key, $meta->value );
						}

						break;
					case 'update':

						if ( ! isset( $meta->value ) ) {
							continue;
						} elseif ( ! empty( $meta->id ) && ! empty( $existing_meta_item->meta_key ) && ( current_user_can( 'edit_post_meta', $post_id, $unslashed_existing_meta_key ) || $this->is_metadata_public( $meta->key ) ) ) {
							update_metadata_by_mid( 'post', $meta->id, $meta->value );
						} elseif ( ! empty( $meta->key ) && ! empty( $meta->previous_value ) && ( current_user_can( 'edit_post_meta', $post_id, $unslashed_meta_key ) || $this->is_metadata_public( $meta->key ) ) ) {
							update_post_meta( $post_id, $meta->key,$meta->value, $meta->previous_value );
						} elseif ( ! empty( $meta->key ) && ( current_user_can( 'edit_post_meta', $post_id, $unslashed_meta_key ) || $this->is_metadata_public( $meta->key ) ) ) {
							update_post_meta( $post_id, $meta->key, $meta->value );
						}

						break;
				}

			}
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-update-post-endpoint.php */
		do_action( 'rest_api_inserted_post', $post_id, $insert, $new );

		$return = $this->get_post_by( 'ID', $post_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		if ( isset( $input['type'] ) && 'revision' === $input['type'] ) {
			$return['preview_nonce'] = wp_create_nonce( 'post_preview_' . $input['parent'] );
		}

		if ( isset( $sticky ) ) {
			// workaround for sticky test occasionally failing, maybe a race condition with stick_post() above
			$return['sticky'] = ( true === $sticky );
		}

		if ( ! empty( $media_results['errors'] ) )
			$return['media_errors'] = $media_results['errors'];

		if ( 'publish' !== $post->post_status && isset( $input['title'] )) {
			$return['other_URLs'] = (object) $this->get_post_permalink_suggestions( $post_id, $input['title'] );
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'posts' );

		return $return;
	}
}
