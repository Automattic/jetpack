<?php
/**
 * Used by the blogging prompt feature.
 *
 * @package automattic/jetpack
 */

/**
 * Hooked functions.
 */

/**
 * Adds the blogging prompt key post meta to the list of allowed post meta to be updated by rest api.
 *
 * @param array $keys Array of post meta keys that are allowed public metadata.
 *
 * @return array
 */
function jetpack_blogging_prompts_add_meta_data( $keys ) {
	$keys[] = '_jetpack_blogging_prompt_key';
	return $keys;
}

add_filter( 'rest_api_allowed_public_metadata', 'jetpack_blogging_prompts_add_meta_data' );

/**
 * Sets up a new post as an answer to a blogging prompt.
 *
 * Called on `wp_insert_post` hook.
 *
 * @param int $post_id ID of post being inserted.
 * @return void
 */
function jetpack_setup_blogging_prompt_response( $post_id ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Clicking a prompt response link can happen from notifications, Calypso, wp-admin, email, etc and only sets up a response post (tag, meta, prompt text); the user must take action to actually publish the post.
	$prompt_id = isset( $_GET['answer_prompt'] ) && absint( $_GET['answer_prompt'] ) ? absint( $_GET['answer_prompt'] ) : false;

	if ( ! jetpack_is_new_post_screen() || ! $prompt_id ) {
		return;
	}

	if ( jetpack_is_valid_blogging_prompt( $prompt_id ) ) {
		update_post_meta( $post_id, '_jetpack_blogging_prompt_key', $prompt_id );
		wp_add_post_tags( $post_id, array( 'dailyprompt', "dailyprompt-$prompt_id" ) );
	}
}

add_action( 'wp_insert_post', 'jetpack_setup_blogging_prompt_response' );

/**
 * When a published posts answers a blogging prompt, store the prompt id in the post meta.
 *
 * @param string  $new_status New post status.
 * @param string  $old_status Old post status.
 * @param WP_Post $post       Post object.
 */
function jetpack_mark_if_post_answers_blogging_prompt( $new_status, $old_status, $post ) {
	// Make sure we are publishing a post, and it's not already published.
	if ( 'post' !== $post->post_type || 'publish' !== $new_status || 'publish' === $old_status ) {
		return;
	}

	$blocks = parse_blocks( $post->post_content );
	foreach ( $blocks as $block ) {
		if ( 'jetpack/blogging-prompt' === $block['blockName'] ) {
			$prompt_id      = isset( $block['attrs']['promptId'] ) ? absint( $block['attrs']['promptId'] ) : null;
			$has_prompt_tag = has_tag( 'dailyprompt', $post ) || ( $prompt_id && has_tag( "dailyprompt-{$prompt_id}", $post ) );

			if ( $prompt_id && $has_prompt_tag && count( $blocks ) > 1 ) {
				update_post_meta( $post->ID, '_jetpack_blogging_prompt_key', $prompt_id );
			}

			break;
		}
	}
}
add_action( 'transition_post_status', 'jetpack_mark_if_post_answers_blogging_prompt', 10, 3 );

/**
 * Utility functions.
 */

/**
 * Retrieve daily blogging prompts from the wpcom API and cache them.
 *
 * @param int $time Unix timestamp representing the day for which to get blogging prompts.
 * @return stdClass[]|null Array of blogging prompt objects or null.
 */
function jetpack_get_daily_blogging_prompts( $time = 0 ) {
	$timestamp = $time ? $time : time();

	// Include prompts from the previous day, just in case someone has an outdated prompt id.
	$day_before    = wp_date( 'Y-m-d', $timestamp - DAY_IN_SECONDS );
	$locale        = get_locale();
	$transient_key = 'jetpack_blogging_prompt_' . $day_before . '_' . $locale;
	$daily_prompts = get_transient( $transient_key );

	// Return the cached prompt, if we have it. Otherwise fetch it from the API.
	if ( false !== $daily_prompts ) {
		return $daily_prompts;
	}

	$blog_id = \Jetpack_Options::get_option( 'id' );
	$path    = '/sites/' . rawurldecode( $blog_id ) . '/blogging-prompts?from=' . rawurldecode( $day_before ) . '&number=10&_locale=' . rawurldecode( $locale );

	$args = array(
		'headers' => array(
			'Content-Type'    => 'application/json',
			'X-Forwarded-For' => ( new \Automattic\Jetpack\Status\Visitor() )->get_ip( true ),
		),
		// `method` and `url` are needed for using `WPCOM_API_Direct::do_request`
		// `wpcom_json_api_request_as_user` will generate and overwrite these.
		'method'  => \WP_REST_Server::READABLE,
		'url'     => JETPACK__WPCOM_JSON_API_BASE . '/wpcom/v2' . $path,
	);

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		// This will load the library, but it may be too late to automatically load any endpoints using WPCOM_API_Direct::register_endpoints.
		// In that case, call `wpcom_rest_api_v2_load_plugin_files( 'wp-content/rest-api-plugins/endpoints/blogging-prompts.php' )`
		// on the `init` hook to load the blogging-prompts endpoint before calling this function.
		require_once WP_CONTENT_DIR . '/lib/wpcom-api-direct/wpcom-api-direct.php';
		$response = \WPCOM_API_Direct::do_request( $args );
	} else {
		$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user( $path, 'v2', $args, null, 'wpcom' );
	}
	$response_status = wp_remote_retrieve_response_code( $response );

	if ( is_wp_error( $response ) || $response_status !== \WP_Http::OK ) {
		return null;
	}

	$body = json_decode( wp_remote_retrieve_body( $response ) );

	if ( ! $body || ! isset( $body->prompts ) ) {
		return null;
	}

	$prompts = $body->prompts;
	set_transient( $transient_key, $prompts, DAY_IN_SECONDS );

	return $prompts;
}

/**
 * Determines if the site has publish posts or plans to publish posts.
 *
 * @return bool
 */
function jetpack_has_or_will_publish_posts() {
	// Lets count the posts.
	$count_posts_object = wp_count_posts( 'post' );
	$count_posts        = (int) $count_posts_object->publish + (int) $count_posts_object->future + (int) $count_posts_object->draft;

	return $count_posts_object->publish >= 2 || $count_posts >= 100;
}

/**
 * Determines if the site has a posts page or shows posts on the front page.
 *
 * @return bool
 */
function jetpack_has_posts_page() {
	// The site is set up to be a blog.
	if ( 'posts' === get_option( 'show_on_front' ) ) {
		return true;
	}

	// There is a page set to show posts.
	$is_posts_page_set = (int) get_option( 'page_for_posts' ) > 0;
	if ( $is_posts_page_set ) {
		return true;
	}

	return false;
}

/**
 * Determines if site had the "Write" intent set when created.
 *
 * @return bool
 */
function jetpack_has_write_intent() {
	return 'write' === get_option( 'site_intent', '' );
}

/**
 * Determines if the current screen (in wp-admin) is creating a new post.
 *
 * /wp-admin/post-new.php
 *
 * @return bool
 */
function jetpack_is_new_post_screen() {
	global $current_screen;

	if (
		$current_screen instanceof \WP_Screen &&
		'add' === $current_screen->action &&
		'post' === $current_screen->post_type
	) {
		return true;
	}

	return false;
}

/**
 * Determines if the site might have a blog.
 *
 * @return bool
 */
function jetpack_is_potential_blogging_site() {
	return jetpack_has_write_intent() || jetpack_has_posts_page() || jetpack_has_or_will_publish_posts();
}

/**
 * Checks if the given prompt id is included in today's blogging prompts.
 *
 * Would be best to use the API to check if the prompt id is valid for any day,
 * but for now we're only using one prompt per day.
 *
 * @param int $prompt_id id of blogging prompt.
 * @return bool
 */
function jetpack_is_valid_blogging_prompt( $prompt_id ) {
	$daily_prompts = jetpack_get_daily_blogging_prompts();

	if ( ! $daily_prompts ) {
		return false;
	}

	foreach ( $daily_prompts as $prompt ) {
		if ( $prompt->id === $prompt_id ) {
			return true;
		}
	}

	return false;
}
