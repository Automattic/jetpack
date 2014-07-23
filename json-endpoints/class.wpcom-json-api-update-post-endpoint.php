<?php
class WPCOM_JSON_API_Update_Post_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	function __construct( $args ) {
		parent::__construct( $args );
		if ( $this->api->ends_with( $this->path, '/delete' ) ) {
			$this->post_object_format['status']['deleted'] = 'The post has been deleted permanently.';
		}
	}

	// /sites/%s/posts/new       -> $blog_id
	// /sites/%s/posts/%d        -> $blog_id, $post_id
	// /sites/%s/posts/%d/delete -> $blog_id, $post_id
	function callback( $path = '', $blog_id = 0, $post_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( $this->api->ends_with( $path, '/delete' ) ) {
			return $this->delete_post( $path, $blog_id, $post_id );
		} else {
			return $this->write_post( $path, $blog_id, $post_id );
		}
	}

	// /sites/%s/posts/new       -> $blog_id
	// /sites/%s/posts/%d        -> $blog_id, $post_id
	function write_post( $path, $blog_id, $post_id ) {
		$new  = $this->api->ends_with( $path, '/new' );
		$args = $this->query_args();

		// unhook publicize, it's hooked again later -- without this, skipping services is impossible
		remove_action( 'save_post', array( $GLOBALS['publicize_ui']->publicize, 'async_publicize_post' ), 100, 2 );
		add_action( 'rest_api_inserted_post', array( $GLOBALS['publicize_ui']->publicize, 'async_publicize_post' ) );

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
				$author_id = $this->parse_and_set_author( $input['author'], $input['type'] );
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
				$author_id = $this->parse_and_set_author( $input['author'], $_post_type );
				unset( $input['author'] );
				if ( is_wp_error( $author_id ) )
					return $author_id;
			}

			if ( 'publish' === $input['status'] && 'publish' !== $post->post_status && !current_user_can( 'publish_post', $post->ID ) ) {
				$input['status'] = 'pending';
			}
			$last_status = $post->post_status;
			$new_status = $input['status'];
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

		$categories = null;
		$tags       = null;

		if ( !empty( $input['categories'] )) {
			if ( is_array( $input['categories'] ) ) {
				$_categories = $input['categories'];
			} else {
				foreach ( explode( ',', $input['categories'] ) as $category ) {
					$_categories[] = $category;
				}
 			}
			foreach ( $_categories as $category ) {
				if ( !$category_info = term_exists( $category, 'category' ) ) {
					if ( is_int( $category ) )
						continue;
					$category_info = wp_insert_term( $category, 'category' );
				}
				if ( !is_wp_error( $category_info ) )
					$categories[] = (int) $category_info['term_id'];
			}
		}

		if ( !empty( $input['tags'] ) ) {
			if ( is_array( $input['tags'] ) ) {
				$tags = $input['tags'];
			} else {
				foreach ( explode( ',', $input['tags'] ) as $tag ) {
					$tags[] = $tag;
				}
 			}
			$tags_string = implode( ',', $tags );
 		}

		unset( $input['tags'], $input['categories'] );

		$insert = array();

		if ( !empty( $input['slug'] ) ) {
			$insert['post_name'] = $input['slug'];
			unset( $input['slug'] );
		}

		if ( true === $input['comments_open'] )
			$insert['comment_status'] = 'open';
		else if ( false === $input['comments_open'] )
			$insert['comment_status'] = 'closed';

		if ( true === $input['pings_open'] )
			$insert['ping_status'] = 'open';
		else if ( false === $input['pings_open'] )
			$insert['ping_status'] = 'closed';

		unset( $input['comments_open'], $input['pings_open'] );

		$publicize = $input['publicize'];
		$publicize_custom_message = $input['publicize_message'];
		unset( $input['publicize'], $input['publicize_message'] );

		if ( isset( $input['featured_image'] ) ) {
			$featured_image = trim( $input['featured_image'] );
			$delete_featured_image = empty( $featured_image );
			$featured_image = $input['featured_image'];
			unset( $input['featured_image'] );
		}

		$metadata = $input['metadata'];
		unset( $input['metadata'] );

		$likes = $input['likes_enabled'];
		$sharing = $input['sharing_enabled'];
		$gplus = $input['gplusauthorship_enabled'];

		unset( $input['likes_enabled'] );
		unset( $input['sharing_enabled'] );
		unset( $input['gplusauthorship_enabled'] );

		$sticky = $input['sticky'];
		unset( $input['sticky'] );

		foreach ( $input as $key => $value ) {
			$insert["post_$key"] = $value;
		}

		if ( ! empty( $author_id ) ) {
			$insert['post_author'] = absint( $author_id );
		}

		if ( !empty( $tags ) )
			$insert["tax_input"]["post_tag"] = $tags;
		if ( !empty( $categories ) )
			$insert["tax_input"]["category"] = $categories;

		$has_media = isset( $input['media'] ) && $input['media'] ? count( $input['media'] ) : false;
		$has_media_by_url = isset( $input['media_urls'] ) && $input['media_urls'] ? count( $input['media_urls'] ) : false;

		if ( $new ) {

			if ( false === strpos( $input['content'], '[gallery' ) && ( $has_media || $has_media_by_url ) ) {
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
			$post_id = wp_update_post( (object) $insert );
		}


		if ( !$post_id || is_wp_error( $post_id ) ) {
			return $post_id;
		}

		if ( $has_media ) {
			$this->api->trap_wp_die( 'upload_error' );
			foreach ( $input['media'] as $media_item ) {
				$_FILES['.api.media.item.'] = $media_item;
				// check for WP_Error if we ever actually need $media_id
				$media_id = media_handle_upload( '.api.media.item.', $post_id );
			}
			$this->api->trap_wp_die( null );

			unset( $_FILES['.api.media.item.'] );
		}

		if ( $has_media_by_url ) {
			foreach ( $input['media_urls'] as $url ) {
				$this->handle_media_sideload( $url, $post_id );
			}
		}
		
		// Set like status for the post
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

		// Set Google+ authorship status for the post
		if ( $new ) {
			$gplus_enabled = isset( $gplus ) ? (bool) $gplus : true;
			if ( false === $gplus_enabled ) {
				update_post_meta( $post_id, 'gplus_authorship_disabled', 1 );
			}
		}
		else {
			if ( isset( $gplus ) && true === $gplus ) {
				delete_post_meta( $post_id, 'gplus_authorship_disabled' );
			} else if ( isset( $gplus ) && false == $gplus ) {
				update_post_meta( $post_id, 'gplus_authorship_disabled', 1 );
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

		if ( true === $sticky ) {
			stick_post( $post_id );
		} else {
			unstick_post( $post_id );
		}

		// WPCOM Specific (Jetpack's will get bumped elsewhere
		// Tracks how many posts are published and sets meta so we can track some other cool stats (like likes & comments on posts published)
		if ( ( $new && 'publish' == $input['status'] ) || ( !$new && isset( $last_status ) && 'publish' != $last_status && isset( $new_status ) && 'publish' == $new_status ) ) {
			if ( function_exists( 'bump_stats_extras' ) ) {
				bump_stats_extras( 'api-insights-posts', $this->api->token_details['client_id'] );
				update_post_meta( $post_id, '_rest_api_published', 1 );
				update_post_meta( $post_id, '_rest_api_client_id', $this->api->token_details['client_id'] );
			}
		}


		// We ask the user/dev to pass Publicize services he/she wants activated for the post, but Publicize expects us
		// to instead flag the ones we don't want to be skipped. proceed with said logic.
		// any posts coming from Path (client ID 25952) should also not publicize
		if ( $publicize === false || 25952 == $this->api->token_details['client_id'] ) {
			// No publicize at all, skipp all by full service
			foreach ( $GLOBALS['publicize_ui']->publicize->get_services( 'all' ) as $name => $service ) {
				update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $name, 1 );
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
				if ( !in_array( $name, $publicize ) && !array_key_exists( $name, $publicize ) ) {
					// Skip the whole service
					update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $name, 1 );
				} else if ( !empty( $publicize[ $name ] ) ) {
					// Seems we're being asked to only push to [a] specific connection[s].
					// Explode the list on commas, which will also support a single passed ID
					$requested_connections = explode( ',', ( preg_replace( '/[\s]*/', '', $publicize[ $name ] ) ) );
					// Get the user's connections and flag the ones we can't match with the requested list to be skipped.
					$service_connections   = $GLOBALS['publicize_ui']->publicize->get_connections( $name );
					foreach ( $service_connections as $service_connection ) {
						if ( !in_array( $service_connection->meta['connection_data']->id, $requested_connections ) ) {
							update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_SKIP . $service_connection->unique_id, 1 );
						}
					}
				}
			}
		}

		if ( !empty( $publicize_custom_message ) )
			update_post_meta( $post_id, $GLOBALS['publicize_ui']->publicize->POST_MESS, trim( $publicize_custom_message ) );

		set_post_format( $post_id, $insert['post_format'] );

		if ( ! empty( $featured_image ) ) {
			$this->parse_and_set_featured_image( $post_id, $delete_featured_image, $featured_image );
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

		do_action( 'rest_api_inserted_post', $post_id, $insert, $new );

		$return = $this->get_post_by( 'ID', $post_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		if ( 'revision' === $input['type'] ) {
			$return['preview_nonce'] = wp_create_nonce( 'post_preview_' . $input['parent'] );
		}

		do_action( 'wpcom_json_api_objects', 'posts' );

		return $return;
	}

	// /sites/%s/posts/%d/delete -> $blog_id, $post_id
	function delete_post( $path, $blog_id, $post_id ) {
		$post = get_post( $post_id );
		if ( !$post || is_wp_error( $post ) ) {
			return new WP_Error( 'unknown_post', 'Unknown post', 404 );
		}

		if ( ! $this->is_post_type_allowed( $post->post_type ) ) {
			return new WP_Error( 'unknown_post_type', 'Unknown post type', 404 );
		}

		if ( !current_user_can( 'delete_post', $post->ID ) ) {
			return new WP_Error( 'unauthorized', 'User cannot delete posts', 403 );
		}

		$args  = $this->query_args();
		$return = $this->get_post_by( 'ID', $post->ID, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'posts' );

		wp_delete_post( $post->ID );

		$status = get_post_status( $post->ID );
		if ( false === $status ) {
			$return['status'] = 'deleted';
			return $return;
		}

		return $this->get_post_by( 'ID', $post->ID, $args['context'] );
	}

	private function parse_and_set_featured_image( $post_id, $delete_featured_image, $featured_image ) {
		if ( $delete_featured_image ) {
			delete_post_thumbnail( $post_id );
			return;
		}

		$featured_image = (string) $featured_image;

		// if we got a post ID, we can just set it as the thumbnail
		if ( ctype_digit( $featured_image ) && 'attachment' == get_post_type( $featured_image ) ) {
			set_post_thumbnail( $post_id, $featured_image );
			return $featured_image;
		}

		$featured_image_id = $this->handle_media_sideload( $featured_image, $post_id );

		if ( empty( $featured_image_id ) || ! is_int( $featured_image_id ) )
			return false;

		set_post_thumbnail( $post_id, $featured_image_id );
		return $featured_image_id;
	}

	private function parse_and_set_author( $author = null, $post_type = 'post' ) {
		if ( empty( $author ) || ! post_type_supports( $post_type, 'author' ) )
			return get_current_user_id();

		if ( ctype_digit( $author ) ) {
			$_user = get_user_by( 'id', $author );
			if ( ! $_user || is_wp_error( $_user ) )
				return new WP_Error( 'invalid_author', 'Invalid author provided' );

			return $_user->ID;
		}

		$_user = get_user_by( 'login', $author );
		if ( ! $_user || is_wp_error( $_user ) )
			return new WP_Error( 'invalid_author', 'Invalid author provided' );

		return $_user->ID;
	}
}
