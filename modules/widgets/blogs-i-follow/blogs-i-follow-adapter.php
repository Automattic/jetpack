<?php

/**
 * Interface to encapsulate data and settings needed by the Blogs I Follow widget.
 *
 * This allows the plugin code to stay in sync between WordPress.com and Jetpack,
 * leaving the particulars to each implementation below.
 */
interface iBlogs_I_Follow_Adapter {
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
	public function get_blavatars( $subscription, $avatar_size ) {
		// TODO: Implement for WPCOM
		$domain = blavatar_domain( $subscription['blog_url'] );
		return blavatar_exists( $domain ) ? get_blavatar( $subscription['blog_url'], $avatar_size ) : NULL;
	}
}
