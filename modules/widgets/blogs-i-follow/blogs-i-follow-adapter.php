<?php

/**
 * Interface to encapsulate data and settings needed by the Blogs I Follow widget.
 *
 * This allows the plugin code to stay in sync between WordPress.com and Jetpack,
 * leaving the particulars to each flavor.
 */
interface iBlogs_I_Follow_Adapter {
	public function get_followed_blogs( $args );
	public function get_blog_locale();
	public function staticize_subdomain( $url );
}

class Blogs_I_Follow_Jetpack_Adapter implements iBlogs_I_Follow_Adapter {
	/**
	 * Converts data from the WordPress.com REST API into a format usable by the plugin
	 *
	 * The read/following/mine API is not identical in its contents or format to the private
	 * WPCOM tables used for Blogs I Follow. The data must be translated into a format that
	 * loosely conforms to what the plugin expects.
	 */
	private function convert_rest_subscription( $subscription ) {
		return array(
			'id' => $subscription->ID,
			'blog_id' => $subscription->blog_ID,
			'blog_url' => $subscription->URL,
			'feed_url' => $subscription->URL,
			'date_subscribed' => $subscription->date_subscribed,
		);
	}

	/**
	 * Retrieve the user's followed blogs from the WordPress.com REST API
	 */
	public function get_followed_blogs($args) {
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

	public function get_blog_locale() {
		return substr( get_locale(), 0, 2 );
	}

	public function staticize_subdomain( $url ) {
		return Jetpack::staticize_subdomain( $url );
	}
}

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
}
