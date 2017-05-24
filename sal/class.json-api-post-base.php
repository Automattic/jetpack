<?php 
/**
 * This class wraps a WP_Post and proxies any undefined attributes
 * and methods to the wrapped class. We need to do this because at present
 * the WP_Post class is marked as final (in 4.5 this will change, though it's
 * not clear if there will be a mechanism to retrieve from the DB into the over-
 * ridden class dynamically).
 **/

require_once dirname( __FILE__ ) . '/class.json-api-metadata.php';
require_once dirname( __FILE__ ) . '/class.json-api-date.php';
require_once ( ABSPATH . "wp-includes/post.php" );

abstract class SAL_Post {
	public $post;
	public $context;
	public $site;

	function __construct( $site, $post, $context ) {
		$this->post = $post;
		$this->context = $context;
		$this->site = $site;
	}

	public function __set( $key, $value ) {
		$this->post->{ $key } = $value;
	}

	public function __get( $key ) {
		if ( $key === 'links' ) {
			require_once dirname( __FILE__ ) . '/class.json-api-links.php';
			return WPCOM_JSON_API_Links::getInstance();
		}
		return $this->post->{ $key };
	}

	public function __call( $name, $arguments ) {
		if ( is_callable( array( $this->post, $name ) ) ) {
			return call_user_func_array( array( $this->post, $name ), $arguments );
		} else {
			trigger_error("Call to undefined method '{$name}'");
		}
	}

	public function __isset ( $name ) {
		return isset( $this->post->{ $name } );
	}

	abstract public function get_like_count();
	abstract public function is_liked();
	abstract public function is_reblogged();
	abstract public function is_following();
	abstract public function get_global_id();
	abstract public function get_geo();
	
	public function get_menu_order() {
		return (int) $this->post->menu_order;
	}

	public function get_guid() {
		return (string) $this->post->guid;
	}

	public function get_type() {
		return (string) $this->post->post_type;
	}

	public function get_terms() {
		$taxonomies = get_object_taxonomies( $this->post, 'objects' );
		$terms = array();
		foreach ( $taxonomies as $taxonomy ) {
			if ( ! $taxonomy->public && ! current_user_can( $taxonomy->cap->assign_terms ) ) {
				continue;
			}

			$terms[ $taxonomy->name ] = array();

			$taxonomy_terms = wp_get_object_terms( $this->post->ID, $taxonomy->name, array( 'fields' => 'all' ) );
			foreach ( $taxonomy_terms as $term ) {
				$formatted_term = $this->format_taxonomy( $term, $taxonomy->name, 'display' );
				$terms[ $taxonomy->name ][ $term->name ] = $formatted_term;
			}

			$terms[ $taxonomy->name ] = (object) $terms[ $taxonomy->name ];
		}

		return (object) $terms;
	}

	public function get_tags() {
		$tags = array();
		$terms = wp_get_post_tags( $this->post->ID );
		foreach ( $terms as $term ) {
			if ( !empty( $term->name ) ) {
				$tags[$term->name] = $this->format_taxonomy( $term, 'post_tag', 'display' );
			}
		}
		return (object) $tags;
	}

	public function get_categories() {
		$categories = array();
		$terms = wp_get_object_terms( $this->post->ID, 'category', array( 'fields' => 'all' ) );
		foreach ( $terms as $term ) {
			if ( !empty( $term->name ) ) {
				$categories[$term->name] = $this->format_taxonomy( $term, 'category', 'display' );
			}
		}
		return (object) $categories;
	}

	public function get_attachments_and_count() {
		$attachments = array();
		$_attachments = new WP_Query( array( 'post_parent' => $this->post->ID, 'post_status' => 'inherit', 'post_type' => 'attachment', 'posts_per_page' => '20' ) );
		foreach ( $_attachments->posts as $attachment ) {
			$attachments[$attachment->ID] = $this->get_media_item_v1_1( $attachment->ID );
		}
		return array( (object) $attachments, (int) $_attachments->found_posts );
	}

	public function get_metadata() {
		$metadata = array();
		foreach ( (array) has_meta( $this->post->ID ) as $meta ) {
			// Don't expose protected fields.
			$meta_key = $meta['meta_key'];
			
			$show = !( WPCOM_JSON_API_Metadata::is_internal_only( $meta_key ) )
				&&
					( 
						WPCOM_JSON_API_Metadata::is_public( $meta_key ) 
					|| 
						current_user_can( 'edit_post_meta', $this->post->ID , $meta_key )
					);

			// Only business plan subscribers can view custom meta description
			if ( Jetpack_SEO_Posts::DESCRIPTION_META_KEY == $meta_key && ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
				$show = false;
			}

			if ( $show ) {
				$metadata[] = array(
					'id'    => $meta['meta_id'],
					'key'   => $meta['meta_key'],
					'value' => maybe_unserialize( $meta['meta_value'] ),
				);
			}
		}

		if ( ! empty( $metadata ) ) {
			return $metadata;
		} else {
			return false;
		}
	}

	public function get_meta() {
		$meta = (object) array(
			'links' => (object) array(
				'self'    => (string) $this->get_post_link(),
				'help'    => (string) $this->get_post_link( 'help' ),
				'site'    => (string) $this->get_site_link(),
				'replies' => (string) $this->get_post_link( 'replies/' ),
				'likes'   => (string) $this->get_post_link( 'likes/' ),
			),
		);

		// add autosave link if a more recent autosave exists
		if ( 'edit' === $this->context ) {
			$autosave = wp_get_post_autosave( $this->post->ID );
			if ( $autosave && $autosave->post_modified > $this->post->post_modified )
				$meta->links->autosave = (string) $this->get_post_link() . '/autosave';
		}

		return $meta;
	}

	public function get_current_user_capabilities() {
		return array(
			'publish_post' => current_user_can( 'publish_post', $this->post ),
			'delete_post'  => current_user_can( 'delete_post', $this->post ),
			'edit_post'    => current_user_can( 'edit_post', $this->post )
		);
	}

	public function get_revisions() {
		if ( 'edit' !== $this->context ) {
			return false;
		}

		$revisions = array();
		$post_revisions = wp_get_post_revisions( $this->post->ID );

		foreach ( $post_revisions as $_post ) {
			$revisions[] = $_post->ID;
		}

		return $revisions;
	}

	public function get_other_urls() {
		$other_urls = array();

		if ( 'publish' !== $this->post->post_status ) {
			$other_urls = $this->get_permalink_suggestions( $this->post->post_title );
		}

		return (object) $other_urls;
	}

	protected function get_site_link() {
		return $this->links->get_site_link( $this->site->get_id() );
	}

	protected function get_post_link( $path = null ) {
		return $this->links->get_post_link( $this->site->get_id(), $this->post->ID, $path );
	}

	public function get_publicize_urls() {
		$publicize_URLs = array();
		$publicize      = get_post_meta( $this->post->ID, 'publicize_results', true );
		if ( $publicize ) {
			foreach ( $publicize as $service => $data ) {
				switch ( $service ) {
				case 'twitter' :
					foreach ( $data as $datum ) {
						$publicize_URLs[] = esc_url_raw( "https://twitter.com/{$datum['user_id']}/status/{$datum['post_id']}" );
					}
					break;
				case 'fb' :
					foreach ( $data as $datum ) {
						$publicize_URLs[] = esc_url_raw( "https://www.facebook.com/permalink.php?story_fbid={$datum['post_id']}&id={$datum['user_id']}" );
					}
					break;
				}
			}
		}
		return (array) $publicize_URLs;
	}

	public function get_page_template() {
		return (string) get_post_meta( $this->post->ID, '_wp_page_template', true );
	}

	// note this is overridden in jetpack-shadow
	public function get_featured_image() {
		$image_attributes = wp_get_attachment_image_src( get_post_thumbnail_id( $this->post->ID ), 'full' );
		if ( is_array( $image_attributes ) && isset( $image_attributes[0] ) ) {
			return (string) $image_attributes[0];
		} else {
			return '';
		}
	}

	public function get_post_thumbnail() {
		$thumb = null;

		$thumb_id = get_post_thumbnail_id( $this->post->ID );

		if ( ! empty( $thumb_id ) ) {
			$attachment = get_post( $thumb_id );
			if ( ! empty( $attachment ) )
				$featured_image_object = $this->get_attachment( $attachment );

			if ( ! empty( $featured_image_object ) ) {
				$thumb = (object) $featured_image_object;
			}
		}

		return $thumb;
	}

	public function get_format() {
		$format = (string) get_post_format( $this->post->ID );
		if ( !$format ) {
			$format = 'standard';
		}

		return $format;
	}

	private function get_attachment( $attachment ) {
		$metadata = wp_get_attachment_metadata( $attachment->ID );

		$result = array(
			'ID'        => (int) $attachment->ID,
			'URL'       => (string) wp_get_attachment_url( $attachment->ID ),
			'guid'      => (string) $attachment->guid,
			'mime_type' => (string) $attachment->post_mime_type,
			'width'     => (int) isset( $metadata['width']  ) ? $metadata['width']  : 0,
			'height'    => (int) isset( $metadata['height'] ) ? $metadata['height'] : 0,
		);

		if ( isset( $metadata['duration'] ) ) {
			$result['duration'] = (int) $metadata['duration'];
		}

		/** This filter is documented in class.jetpack-sync.php */
		return (object) apply_filters( 'get_attachment', $result );
	}

	public function get_date() {
		return (string) WPCOM_JSON_API_Date::format_date( $this->post->post_date_gmt, $this->post->post_date );
	}

	public function get_modified_date() {
		return (string) WPCOM_JSON_API_Date::format_date( $this->post->post_modified_gmt, $this->post->post_modified );
	}

	public function get_title() {
		if ( 'display' === $this->context ) {
			return (string) get_the_title( $this->post->ID );
		} else {
			return (string) htmlspecialchars_decode( $this->post->post_title, ENT_QUOTES );
		}
	}

	public function get_url() {
		if ( 'revision' === $this->post->post_type ) {
			return (string) esc_url_raw( get_permalink( $this->post->post_parent ) );
		} else {
			return (string) esc_url_raw( get_permalink( $this->post->ID ) );
		}
	}

	public function get_shortlink() {
		return (string) esc_url_raw( wp_get_shortlink( $this->post->ID ) );
	}

	public function get_content() {
		if ( 'display' === $this->context ) {
			// TODO: move this WPCOM-specific hack
			add_filter( 'the_password_form', array( $this, 'the_password_form' ) );
			$content = (string) $this->get_the_post_content_for_display();
			remove_filter( 'the_password_form', array( $this, 'the_password_form' ) );
			return $content;
		} else {
			return (string) $this->post->post_content;
		}
	}

	public function get_excerpt() {
		if ( 'display' === $this->context ) {
			add_filter( 'the_password_form', array( $this, 'the_password_form' ) );
			ob_start();
			the_excerpt();
			$response = (string) ob_get_clean();
			remove_filter( 'the_password_form', array( $this, 'the_password_form' ) );
		} else {
			$response = htmlspecialchars_decode( (string) $this->post->post_excerpt, ENT_QUOTES );
		}
		return $response;
	}

	public function get_status() {
		return (string) get_post_status( $this->post->ID );
	}

	public function is_sticky() {
		return (bool) is_sticky( $this->post->ID );
	}

	public function get_slug() {
		return (string) $this->post->post_name;
	}

	public function get_password() {
		$password = (string) $this->post->post_password;
		if ( 'edit' === $this->context ) {
			$password = htmlspecialchars_decode( (string) $password, ENT_QUOTES );
		}
		return $password;
	}

	public function get_parent() {
		if ( $this->post->post_parent ) {
			$parent = get_post( $this->post->post_parent );
			if ( 'display' === $this->context ) {
				$parent_title = (string) get_the_title( $parent->ID );
			} else {
				$parent_title = (string) htmlspecialchars_decode( $this->post->post_title, ENT_QUOTES );
			}
			return (object) array(
				'ID'   => (int) $parent->ID,
				'type' => (string) $parent->post_type,
				'link' => (string) $this->links->get_post_link( $this->site->get_id(), $parent->ID ),
				'title' => $parent_title,
			);
		} else {
			return false;
		}
	}

	function the_password_form() {
		return __( 'This post is password protected.', 'jetpack' );
	}

	public function get_discussion() {
		return array(
			'comments_open'  => (bool) comments_open( $this->post->ID ),
			'comment_status' => (string) $this->post->comment_status,
			'pings_open'     => (bool) pings_open( $this->post->ID ),
			'ping_status'    => (string) $this->post->ping_status,
			'comment_count'  => (int) $this->post->comment_count,
		);
	}

	public function is_likes_enabled() {
		/** This filter is documented in modules/likes.php */
		$sitewide_likes_enabled = (bool) apply_filters( 'wpl_is_enabled_sitewide', ! get_option( 'disabled_likes' ) );
		$post_likes_switched    = (bool) get_post_meta( $this->post->ID, 'switch_like_status', true );
		$post_likes_enabled = $sitewide_likes_enabled;
		if ( $post_likes_switched ) {
			$post_likes_enabled = ! $post_likes_enabled;
		}
		return (bool) $post_likes_enabled;
	}

	public function is_sharing_enabled() {
		$show = true;
		/** This filter is documented in modules/sharedaddy/sharing-service.php */
		$show = apply_filters( 'sharing_show', $show, $this->post );

		$switched_status = get_post_meta( $this->post->ID, 'sharing_disabled', false );

		if ( !empty( $switched_status ) )
			$show = false;

		return (bool) $show;
	}

	// No Blog ID parameter.  No Post ID parameter.  Depends on globals.
	// Expects setup_postdata() to already have been run
	function get_the_post_content_for_display() {
		global $pages, $page;

		$old_pages = $pages;
		$old_page  = $page;

		$content = join( "\n\n", $pages );
		$content = preg_replace( '/<!--more(.*?)?-->/', '', $content );
		$pages   = array( $content );
		$page    = 1;

		ob_start();
		the_content();
		$return = ob_get_clean();

		$pages = $old_pages;
		$page  = $old_page;

		return $return;
	}

	public function get_author() {
		if ( 0 == $this->post->post_author )
			return null;

		$show_email = $this->context === 'edit' && current_user_can( 'edit_post', $this->post );

		$user = get_user_by( 'id', $this->post->post_author );

		if ( ! $user || is_wp_error( $user ) ) {
			trigger_error( 'Unknown user', E_USER_WARNING );

			return null;
		}

		// TODO factor this out
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$active_blog = get_active_blog_for_user( $user->ID );
			$site_id     = $active_blog->blog_id;
			$profile_URL = "http://en.gravatar.com/{$user->user_login}";
		} else {
			$profile_URL = 'http://en.gravatar.com/' . md5( strtolower( trim( $user->user_email ) ) );
			$site_id     = -1;
		}

		$author = array(
			'ID'          => (int) $user->ID,
			'login'       => (string) $user->user_login,
			'email'       => $show_email ? (string) $user->user_email : false, // (string|bool)
			'name'        => (string) $user->display_name,
			'first_name'  => (string) $user->first_name,
			'last_name'   => (string) $user->last_name,
			'nice_name'   => (string) $user->user_nicename,
			'URL'         => (string) esc_url_raw( $user->user_url ),
			'avatar_URL'  => (string) esc_url_raw( $this->get_avatar_url( $user->user_email ) ),
			'profile_URL' => (string) esc_url_raw( $profile_URL )
		);

		if ($site_id > -1) {
			$author['site_ID'] = (int) $site_id;
		}

		return (object) $author;
	}

	protected function get_avatar_url( $email, $avatar_size = 96 ) {
		$avatar_url = wpcom_get_avatar_url( $email, $avatar_size, '', true );
		if ( ! $avatar_url || is_wp_error( $avatar_url ) ) {
			return '';
		}

		return esc_url_raw( htmlspecialchars_decode( $avatar_url[0] ) );
	}

	/**
 	 * Get extra post permalink suggestions
 	 * @return array	array of permalink suggestions: 'permalink_URL', 'suggested_slug'
 	 */
	public function get_permalink_suggestions( $title ) {
		$suggestions = array();
		list( $suggestions['permalink_URL'], $suggestions['suggested_slug'] ) = get_sample_permalink( $this->post->ID, $title );
		return $suggestions;
	}

	private function format_taxonomy( $taxonomy, $taxonomy_type, $context ) {
		// Permissions
		switch ( $context ) {
		case 'edit' :
			$tax = get_taxonomy( $taxonomy_type );
			if ( !current_user_can( $tax->cap->edit_terms ) )
				return new WP_Error( 'unauthorized', 'User cannot edit taxonomy', 403 );
			break;
		case 'display' :
			if ( -1 == get_option( 'blog_public' ) && ! current_user_can( 'read' ) ) {
				return new WP_Error( 'unauthorized', 'User cannot view taxonomy', 403 );
			}
			break;
		default :
			return new WP_Error( 'invalid_context', 'Invalid API CONTEXT', 400 );
		}

		$response                = array();
		$response['ID']          = (int) $taxonomy->term_id;
		$response['name']        = (string) $taxonomy->name;
		$response['slug']        = (string) $taxonomy->slug;
		$response['description'] = (string) $taxonomy->description;
		$response['post_count']  = (int) $taxonomy->count;

		if ( is_taxonomy_hierarchical( $taxonomy_type ) ) {
			$response['parent'] = (int) $taxonomy->parent;
		}

		$response['meta'] = (object) array(
			'links' => (object) array(
				'self' => (string) $this->links->get_taxonomy_link( $this->site->get_id(), $taxonomy->slug, $taxonomy_type ),
				'help' => (string) $this->links->get_taxonomy_link( $this->site->get_id(), $taxonomy->slug, $taxonomy_type, 'help' ),
				'site' => (string) $this->links->get_site_link( $this->site->get_id() ),
			),
		);

		return (object) $response;
	}

	// TODO: factor this out into site
	private function get_media_item_v1_1( $media_id ) {
		$media_item = get_post( $media_id );

		if ( ! $media_item || is_wp_error( $media_item ) )
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );

		$file = basename( wp_get_attachment_url( $media_item->ID ) );
		$file_info = pathinfo( $file );
		$ext  = $file_info['extension'];

		$response = array(
			'ID'           => $media_item->ID,
			'URL'          => wp_get_attachment_url( $media_item->ID ),
			'guid'         => $media_item->guid,
			'date'         => (string) WPCOM_JSON_API_Date::format_date( $media_item->post_date_gmt, $media_item->post_date ),
			'post_ID'      => $media_item->post_parent,
			'author_ID'    => (int) $media_item->post_author,
			'file'         => $file,
			'mime_type'    => $media_item->post_mime_type,
			'extension'    => $ext,
			'title'        => $media_item->post_title,
			'caption'      => $media_item->post_excerpt,
			'description'  => $media_item->post_content,
			'alt'          => get_post_meta( $media_item->ID, '_wp_attachment_image_alt', true ),
			'thumbnails'   => array()
		);

		if ( in_array( $ext, array( 'jpg', 'jpeg', 'png', 'gif' ) ) ) {
			$metadata = wp_get_attachment_metadata( $media_item->ID );
			if ( isset( $metadata['height'], $metadata['width'] ) ) {
				$response['height'] = $metadata['height'];
				$response['width'] = $metadata['width'];
			}

			if ( isset( $metadata['sizes'] ) ) {
				/**
				 * Filter the thumbnail sizes available for each attachment ID.
				 *
				 * @module json-api
				 *
				 * @since 3.9.0
				 *
				 * @param array $metadata['sizes'] Array of thumbnail sizes available for a given attachment ID.
				 * @param string $media_id Attachment ID.
				 */
				$sizes = apply_filters( 'rest_api_thumbnail_sizes', $metadata['sizes'], $media_id );
				if ( is_array( $sizes ) ) {
					foreach ( $sizes as $size => $size_details ) {
						$response['thumbnails'][ $size ] = dirname( $response['URL'] ) . '/' . $size_details['file'];
					}
				}
			}

			if ( isset( $metadata['image_meta'] ) ) {
				$response['exif'] = $metadata['image_meta'];
			}
		}

		if ( in_array( $ext, array( 'mp3', 'm4a', 'wav', 'ogg' ) ) ) {
			$metadata = wp_get_attachment_metadata( $media_item->ID );
			$response['length'] = $metadata['length'];
			$response['exif']   = $metadata;
		}

		if ( in_array( $ext, array( 'ogv', 'mp4', 'mov', 'wmv', 'avi', 'mpg', '3gp', '3g2', 'm4v' ) ) ) {
			$metadata = wp_get_attachment_metadata( $media_item->ID );
			if ( isset( $metadata['height'], $metadata['width'] ) ) {
				$response['height'] = $metadata['height'];
				$response['width']  = $metadata['width'];
			}

			if ( isset( $metadata['length'] ) ) {
				$response['length'] = $metadata['length'];
			}

			// add VideoPress info
			if ( function_exists( 'video_get_info_by_blogpostid' ) ) {
				$info = video_get_info_by_blogpostid( $this->site->get_id(), $media_id );

				// Thumbnails
				if ( function_exists( 'video_format_done' ) && function_exists( 'video_image_url_by_guid' ) ) {
					$response['thumbnails'] = array( 'fmt_hd' => '', 'fmt_dvd' => '', 'fmt_std' => '' );
					foreach ( $response['thumbnails'] as $size => $thumbnail_url ) {
						if ( video_format_done( $info, $size ) ) {
							$response['thumbnails'][ $size ] = video_image_url_by_guid( $info->guid, $size );
						} else {
							unset( $response['thumbnails'][ $size ] );
						}
					}
				}

				$response['videopress_guid'] = $info->guid;
				$response['videopress_processing_done'] = true;
				if ( '0000-00-00 00:00:00' == $info->finish_date_gmt ) {
					$response['videopress_processing_done'] = false;
				}
			}
		}

		$response['thumbnails'] = (object) $response['thumbnails'];

		$response['meta'] = (object) array(
			'links' => (object) array(
				'self' => (string) $this->links->get_media_link( $this->site->get_id(), $media_id ),
				'help' => (string) $this->links->get_media_link( $this->site->get_id(), $media_id, 'help' ),
				'site' => (string) $this->links->get_site_link( $this->site->get_id() ),
			),
		);

		// add VideoPress link to the meta
		if ( in_array( $ext, array( 'ogv', 'mp4', 'mov', 'wmv', 'avi', 'mpg', '3gp', '3g2', 'm4v' ) ) ) {
			if ( function_exists( 'video_get_info_by_blogpostid' ) ) {
				$response['meta']->links->videopress = (string) $this->links->get_link( '/videos/%s', $response['videopress_guid'], '' );
			}
		}

		if ( $media_item->post_parent > 0 ) {
			$response['meta']->links->parent = (string) $this->links->get_post_link( $this->site->get_id(), $media_item->post_parent );
		}

		return (object) $response;
	}
}
