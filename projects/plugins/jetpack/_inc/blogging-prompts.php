<?php
/**
 * Used by the blogging prompt feature.
 *
 * @package automattic/jetpack
 */

add_filter( 'rest_api_allowed_public_metadata', 'jetpack_blogging_prompts_add_meta_data' );

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

/**
 * Sets up a new post as an answer to a blogging prompt.
 *
 * Called on `wp_insert_post` hook.
 *
 * @param int $post_id ID of post being inserted.
 * @return void
 */
function jetpack_setup_blogging_prompt_response( $post_id ) {
	$prompt_id = isset( $_GET['answer_prompt'] ) && absint( $_GET['answer_prompt'] ) ? absint( $_GET['answer_prompt'] ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	if ( ! jetpack_is_new_post_screen() || ! $prompt_id ) {
		return;
	}

	if ( jetpack_is_valid_blogging_prompt( $prompt_id ) ) {
		update_post_meta( $post_id, '_jetpack_blogging_prompt_key', $prompt_id );
		wp_add_post_tags( $post_id, 'dailyprompt' );
	}
}

add_action( 'wp_insert_post', 'jetpack_setup_blogging_prompt_response' );

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

/**
 * Determines if the site might have a blog.
 *
 * @param @param array $checks {
 *     Optional. An array of checks to determine if the site has a blog.
 *
 *     @type bool $post_count  Whether to check the number of posts. Default true.
 *     @type bool $posts_page  Whehter to check if posts page is set. Default true.
 *     @type bool $site_intent Whether to check the site intent when the site was created. Default true.
 * }
 * @return bool
 */
function jetpack_is_potential_blogging_site( $checks = array() ) {
	$checks = wp_parse_args(
		$checks,
		array(
			'posts_count' => true,
			'posts_page'  => true,
			'site_intent' => true,
		)
	);

	// During site creation the "Write" intent was choose.
	if ( $checks['site_intent'] && 'write' === get_option( 'site_intent', '' ) ) {
		return true;
	}

	if ( $checks['posts_page'] ) {
		// The site is set up to be a blog.
		if ( 'posts' === get_option( 'show_on_front' ) ) {
			return true;
		}

		// They are choosing to set the posts to be set to 0.
		$is_posts_page_set = (int) get_option( 'page_for_posts' ) > 0;
		if ( $is_posts_page_set ) {
			return true;
		}
	}

	if ( $checks['posts_count'] ) {
		// Lets count the posts.
		$count_posts_object = wp_count_posts( 'post' );

		if ( $count_posts_object->publish >= 2 ) {
			return true;
		}

		$count_posts = (int) $count_posts_object->publish + (int) $count_posts_object->future + (int) $count_posts_object->draft;

		return $count_posts >= 100;
	}

	return false;
}

/**
 * Retrieve a daily blogging prompt from the wpcom API and cache it.
 *
 * @return stdClass[] Array of blogging prompt objects.
 */
function jetpack_get_daily_blogging_prompts() {
	$today         = date_i18n( 'Y-m-d', true );
	$locale        = get_locale();
	$transient_key = 'jetpack_blogging_prompt_' . $today . '_' . $locale;
	$prompts_today = get_transient( $transient_key );

	// Return the cached prompt, if we have it. Otherwise fetch it from the API.
	if ( false !== $prompts_today ) {
		return $prompts_today;
	}

	$blog_id = \Jetpack_Options::get_option( 'id' );
	$path    = '/sites/' . $blog_id . '/blogging-prompts?from=' . $today . '&number=1';
	$args    = array(
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
		// This will load the library, but the `enqueue_block_assets` hook is too late to load any endpoints
		// using WPCOM_API_Direct::register_endpoints.
		require_lib( 'wpcom-api-direct' );
		$response = \WPCOM_API_Direct::do_request( $args );
	} else {
		$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user( $path, 'v2', $args, null, 'wpcom' );
	}
	$response_status = wp_remote_retrieve_response_code( $response );

	if ( is_wp_error( $response ) || $response_status !== \WP_Http::OK ) {
		return null;
	}

	$body    = json_decode( wp_remote_retrieve_body( $response ) );
	$prompts = $body->prompts;
	set_transient( $transient_key, $prompts, DAY_IN_SECONDS );

	l( $prompts );

	return $prompts;
}
