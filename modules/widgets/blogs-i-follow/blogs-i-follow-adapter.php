<?php

/**
 * Interface to encapsulate data and settings needed by the Blogs I Follow widget.
 *
 * This allows the plugin code to stay in sync between WordPress.com and Jetpack,
 * leaving the particulars to each implementation below.
 */
interface iBlogs_I_Follow_Adapter {
	public function get_followed_blogs( $args );
	public function get_blog_locale();
	public function staticize_subdomain( $url );
	public function enable_follow_buttons();
	public function get_blog_option( $blog_id, $option );
	public function get_blavatars( $subscriptions, $avatar_size );
}

/**
 * Implements Blogs I Follow functionality specific to the Jetpack plugin
 *
 * Provides equivalent functionality (where possible) to WPCOM for Jetpack
 * plugin users. Each function has an analagous implementation in WPCOM.
 *
 * @see Blogs_I_Follow_WPCOM_Adapter
 */
class Blogs_I_Follow_Jetpack_Adapter implements iBlogs_I_Follow_Adapter {
	/**
	 * Converts data from the WordPress.com REST API into a format usable by the plugin
	 *
	 * The read/following/mine API is not identical in its contents or format to the private
	 * WPCOM tables used for Blogs I Follow. The data must be translated into a format that
	 * loosely conforms to what the plugin expects.
	 *
	 * @param object $subscription The subscription element retrieved from the REST API
	 * @return array The return value is an array reformmated to be similar to the data
	 * format used in WPCOM
	 */
	private function convert_rest_subscription( $subscription ) {
		return array(
			'id' => intval( $subscription->ID ),
			'blog_id' => intval( $subscription->blog_ID ),
			'blog_url' => $subscription->URL,
			'feed_url' => $subscription->URL,
			'date_subscribed' => $subscription->date_subscribed,
		);
	}

	/**
	 * Retrieve the user's followed blogs from the WordPress.com REST API
	 *
	 * @param array $args An array of arguments used by WPCOM (including the
	 * user id). It is ignored by this function as the REST API call will be
	 * done on behalf of the Jetpack-connected account.
	 * @return array The return value is an array of blog subscription arrays
	 */
	public function get_followed_blogs( $args ) {
		$request_args = array(
			'url' => 'https://public-api.wordpress.com/rest/v1.1/read/following/mine',
			'user_id' => JETPACK_MASTER_USER,
			'method' => 'GET',
		);
		$response = Jetpack_Client::remote_request( $request_args );
		// TODO: Remove the placeholder false value
		if ( false && is_wp_error( $response ) ) {
			// TODO: Handle error appropriately
			return array();
		} else {
			// TODO: Enable this and remove the dummy data once REST API authentication is working
			/*
			$response_body = wp_remote_retrieve_body( $response );
			if ( empty( $response_body ) ) {
				return array();
			}
			*/
			$response_body = '{"subscriptions":[{"ID":"324825249","blog_ID":"114798305","URL":"http:\/\/design.blog","date_subscribed":"2017-01-17T03:12:32+00:00","meta":{"links":{"site":"https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/114798305"}}},{"ID":"324824892","blog_ID":"0","URL":"http:\/\/daringfireball.net\/feeds\/main","date_subscribed":"2017-01-17T03:09:48+00:00","meta":{"links":{"feed":"https:\/\/public-api.wordpress.com\/rest\/v1\/read\/feed\/20787116"}}},{"ID":"324823266","blog_ID":"122690821","URL":"http:\/\/followtesting.wordpress.com","date_subscribed":"2017-01-17T02:57:51+00:00","meta":{"links":{"site":"https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/122690821"}}}]}';
			$response_body = json_decode( $response_body );
			$followed_blogs = array_map( array( $this, 'convert_rest_subscription' ), $response_body->subscriptions );
			return $followed_blogs;
		}
	}

	/**
	 * Returns the configured locale
	 *
	 * @return string The return value is a two-character locale string, e.g. 'en'
	 */
	public function get_blog_locale() {
		return substr( get_locale(), 0, 2 );
	}

	/**
	 * Passes the given url into Jetpack's version of staticize_subdomain
	 *
	 * @param string $url The URL to pass through
	 * @return string The return value is identical if $url is a non-A8C domain,
	 * otherwise it is processed to provide a special A8C URL.
	 */
	public function staticize_subdomain( $url ) {
		return Jetpack::staticize_subdomain( $url );
	}

	/**
	 * Provides a no-op implementation for Jetpack
	 */
	public function enable_follow_buttons() {}

	/**
	 * Provides a no-op implementation for Jetpack
	 *
	 * @param int $blog_id The identifier of the blog from which the option
	 * should be retrieved
	 * @param string $option The option to be queried for the given blog
	 * @return The return value is always NULL. Currently Jetpack can't retrieve
	 * options for outside blogs.
	 */
	public function get_blog_option( $blog_id, $option ) {
		return NULL;
	}

	public function create_blavatar_query( $subscriptions ) {
		$url_string = "";
		$needs_leading_ampersand = false;
		foreach ( $subscriptions as $subscription ) {
			if ( $subscription['blog_id'] === 0 ) {
				continue;
			}
			if ( true === $needs_leading_ampersand ) {
				$url_string .= "&";
			}
			$url_string .= 'urls[]=/sites/' . $subscription['blog_id'];
			$needs_leading_ampersand = true;
		}
		return $url_string;
	}

	/**
	 * Provides a no-op implementation for Jetpack
	 *
	 * @param string $blog_url The blog URL whose blavatar is being requested
	 * @param int $avatar_size The size being requested for the blavatar
	 * @return The return value is always NULL. Currently this widget can't retrieve
	 * external blavatars.
	 */
	public function get_blavatars( $subscriptions, $avatar_size ) {
		$batched_blavatar_query = $this->create_blavatar_query( $subscriptions );
		$response = wp_remote_get( 'https://public-api.wordpress.com/rest/v1.2/batch/?' . $batched_blavatar_query );
		if ( is_wp_error( $response ) ) {
			// TODO: Handle error appropriately
			return NULL;
		} else {
			$response_body = wp_remote_retrieve_body( $response );
			if ( empty( $response_body ) ) {
				return NULL;
			}
			$response_body = json_decode( $response_body );
			foreach ($response_body as $site) {
				if (isset($site->ID) && isset($site->icon) && isset($site->icon->img)) {
					$blavatars[$site->ID] = '<img src="' . $site->icon->img . '" />';
				}
			}
			return $blavatars;
		}
	}
}

/**
 * Implements Blogs I Follow functionality specific to WordPress.com
 *
 * Each function passes through to the WPCOM-only functionality needed for
 * Blogs I Follow in that environment. As each function here is only forwarding
 * on, refer to the WPCOM implementations of the below functions for further
 * documentation on what each is doing.
 */
class Blogs_I_Follow_WPCOM_Adapter implements iBlogs_I_Follow_Adapter {
	public function get_followed_blogs($args) {
		return wpcom_subs_get_blogs($args);
	}

	public function get_blog_locale() {
		return get_blog_locale();
	}

	public function staticize_subdomain( $url ) {
		return staticize_subdomain( $url );
	}

	public function enable_follow_buttons() {
		enable_follow_buttons();
	}

	public function get_blog_option( $blog_id, $option ) {
		return get_blog_option( $blog_id, $option );
	}

	public function get_blavatars( $subscription, $avatar_size ) {
		// TODO: Implement for WPCOM
		$domain = blavatar_domain( $subscription['blog_url'] );
		return blavatar_exists( $domain ) ? get_blavatar( $subscription['blog_url'], $avatar_size ) : NULL;
	}
}
