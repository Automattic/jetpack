<?php
/**
 * Adds meta tags to pages that need it.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

/**
 * Adds the meta tags.
 */
class Meta_Tags {
	/**
	 * This list is copied verbatim from class.jetpack.php
	 *
	 * Note: All in One SEO Pack, All in one SEO Pack Pro, WordPress SEO by Yoast, and WordPress SEO Premium by Yoast automatically deactivate
	 * Jetpack's Open Graph tags via filter when their Social Meta modules are active.
	 *
	 * @var array Array of plugin slugs.
	 */
	private $open_graph_conflicting_plugins = array(
		'2-click-socialmedia-buttons/2-click-socialmedia-buttons.php', // 2 Click Social Media Buttons.
		'add-link-to-facebook/add-link-to-facebook.php',         // Add Link to Facebook.
		'add-meta-tags/add-meta-tags.php',                       // Add Meta Tags.
		'complete-open-graph/complete-open-graph.php',           // Complete Open Graph.
		'easy-facebook-share-thumbnails/esft.php',               // Easy Facebook Share Thumbnail.
		'heateor-open-graph-meta-tags/heateor-open-graph-meta-tags.php', // Open Graph Meta Tags by Heateor.
		'facebook/facebook.php',                                 // Facebook (official plugin).
		'facebook-awd/AWD_facebook.php',                         // Facebook AWD All in one.
		'facebook-featured-image-and-open-graph-meta-tags/fb-featured-image.php', // Facebook Featured Image & OG Meta Tags.
		'facebook-meta-tags/facebook-metatags.php',              // Facebook Meta Tags.
		'wonderm00ns-simple-facebook-open-graph-tags/wonderm00n-open-graph.php', // Facebook Open Graph Meta Tags for WordPress.
		'facebook-revised-open-graph-meta-tag/index.php',        // Facebook Revised Open Graph Meta Tag.
		'facebook-thumb-fixer/_facebook-thumb-fixer.php',        // Facebook Thumb Fixer.
		'facebook-and-digg-thumbnail-generator/facebook-and-digg-thumbnail-generator.php', // Fedmich's Facebook Open Graph Meta.
		'network-publisher/networkpub.php',                      // Network Publisher.
		'nextgen-facebook/nextgen-facebook.php',                 // NextGEN Facebook OG.
		'social-networks-auto-poster-facebook-twitter-g/NextScripts_SNAP.php', // NextScripts SNAP.
		'og-tags/og-tags.php',                                   // OG Tags.
		'opengraph/opengraph.php',                               // Open Graph.
		'open-graph-protocol-framework/open-graph-protocol-framework.php', // Open Graph Protocol Framework.
		'seo-facebook-comments/seofacebook.php',                 // SEO Facebook Comments.
		'seo-ultimate/seo-ultimate.php',                         // SEO Ultimate.
		'sexybookmarks/sexy-bookmarks.php',                      // Shareaholic.
		'shareaholic/sexy-bookmarks.php',                        // Shareaholic.
		'sharepress/sharepress.php',                             // SharePress.
		'simple-facebook-connect/sfc.php',                       // Simple Facebook Connect.
		'social-discussions/social-discussions.php',             // Social Discussions.
		'social-sharing-toolkit/social_sharing_toolkit.php',     // Social Sharing Toolkit.
		'socialize/socialize.php',                               // Socialize.
		'squirrly-seo/squirrly.php',                             // SEO by SQUIRRLY™.
		'only-tweet-like-share-and-google-1/tweet-like-plusone.php', // Tweet, Like, Google +1 and Share.
		'wordbooker/wordbooker.php',                             // Wordbooker.
		'wpsso/wpsso.php',                                       // WordPress Social Sharing Optimization.
		'wp-caregiver/wp-caregiver.php',                         // WP Caregiver.
		'wp-facebook-like-send-open-graph-meta/wp-facebook-like-send-open-graph-meta.php', // WP Facebook Like Send & Open Graph Meta.
		'wp-facebook-open-graph-protocol/wp-facebook-ogp.php',   // WP Facebook Open Graph protocol.
		'wp-ogp/wp-ogp.php',                                     // WP-OGP.
		'zoltonorg-social-plugin/zosp.php',                      // Zolton.org Social Plugin.
		'wp-fb-share-like-button/wp_fb_share-like_widget.php',   // WP Facebook Like Button.
		'open-graph-metabox/open-graph-metabox.php',             // Open Graph Metabox.
		'seo-by-rank-math/rank-math.php',                        // Rank Math.
		'slim-seo/slim-seo.php',                                 // Slim SEO.
	);

	/**
	 * This list is copied verbatim from class.jetpack.php
	 *
	 * @var array Plugins that conflict with Twitter cards.
	 */
	private $twitter_cards_conflicting_plugins = array(
		'eewee-twitter-card/index.php',              // Eewee Twitter Card.
		'ig-twitter-cards/ig-twitter-cards.php',     // IG:Twitter Cards.
		'jm-twitter-cards/jm-twitter-cards.php',     // JM Twitter Cards.
		'kevinjohn-gallagher-pure-web-brilliants-social-graph-twitter-cards-extention/kevinjohn_gallagher___social_graph_twitter_output.php',  // Pure Web Brilliant's Social Graph Twitter Cards Extension.
		'twitter-cards/twitter-cards.php',           // Twitter Cards.
		'twitter-cards-meta/twitter-cards-meta.php', // Twitter Cards Meta.
		'wp-to-twitter/wp-to-twitter.php',           // WP to Twitter.
		'wp-twitter-cards/twitter_cards.php',        // WP Twitter Cards.
		'seo-by-rank-math/rank-math.php',            // Rank Math.
		'slim-seo/slim-seo.php',                     // Slim SEO.
	);

	/**
	 * Get a list of all active plugins.
	 *
	 * @return array Array of active plugins.
	 */
	public function get_active_plugins() {
		$active_plugins = (array) get_option( 'active_plugins', array() );

		if ( is_multisite() ) {
			// Due to legacy code, active_sitewide_plugins stores them in the keys,
			// whereas active_plugins stores them in the values.
			$network_plugins = array_keys( get_site_option( 'active_sitewide_plugins', array() ) );
			if ( $network_plugins ) {
				$active_plugins = array_merge( $active_plugins, $network_plugins );
			}
		}

		sort( $active_plugins );

		return array_unique( $active_plugins );
	}

	/**
	 * Check if meta tags should be rendered.
	 *
	 * @return bool True if meta tags should be rendered.
	 */
	public function should_render_meta_tags() {
		if ( ! empty( array_intersect( $this->get_active_plugins(), $this->open_graph_conflicting_plugins ) ) ) {
			return false;
		}

		if ( ! is_singular() ) {
			return false;
		}

		if ( ! apply_filters( 'jetpack_enable_open_graph', true ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if Twitter Cards tags should be rendered.
	 *
	 * @return bool True if Twitter Cards tags should be rendered.
	 */
	public function should_render_twitter_cards_tags() {
		return empty( array_intersect( $this->get_active_plugins(), $this->twitter_cards_conflicting_plugins ) );
	}

	/**
	 * Get the featured image for a post.
	 *
	 * @param int $post_id The post ID. Optional. Defaults to global $post.
	 * @param int $width   The minimum width of the image. Optional. Defaults to 200.
	 * @param int $height  The minimum height of the image. Optional. Defaults to 200.
	 * @return array The featured image and dimensions. Empty array if no image is found.
	 */
	public function get_featured_image( $post_id = 0, $width = 200, $height = 200 ) {
		$post = get_post( $post_id );

		if ( ! has_post_thumbnail( $post ) ) {
			return array();
		}

		if ( ! empty( $post->post_password ) ) {
			return array();
		}

		$thumb = get_post_thumbnail_id( $post );
		$meta  = wp_get_attachment_metadata( $thumb );

		// Must be larger than requested minimums.
		if ( ! isset( $meta['width'] ) || $meta['width'] < $width ) {
			return array();
		}

		if ( ! isset( $meta['height'] ) || $meta['height'] < $height ) {
			return array();
		}

		$img_src = wp_get_attachment_image_src( $thumb, array( 1200, 1200 ) );

		if ( empty( $img_src ) ) {
			return array();
		}

		return array(
			'url'    => $img_src[0],
			'width'  => $img_src[1],
			'height' => $img_src[2],
		);
	}

	/**
	 * Render meta tags in head.
	 */
	public function render_tags() {
		if ( ! $this->should_render_meta_tags() ) {
			return;
		}

		$image = $this->get_featured_image();

		if ( empty( $image ) ) {
			return;
		}

		$tags = array(
			'og:image'        => $image['url'],
			'og:image:width'  => $image['width'],
			'og:image:height' => $image['height'],
		);

		if ( $this->should_render_twitter_cards_tags() ) {
			$tags = array_merge(
				$tags,
				array(
					'twitter:image' => $image['url'],
					'twitter:card'  => 'summary_large_image',
				)
			);
		}

		echo '<!-- Generated by Jetpack Social -->' . PHP_EOL;

		foreach ( $tags as $property => $content ) {
			$label = strpos( $property, 'twitter' ) === false ? 'property' : 'name';

			if ( $content ) {
				printf( '<meta %1$s="%2$s" content="%3$s">' . PHP_EOL, esc_attr( $label ), esc_attr( $property ), esc_attr( $content ) );
			}
		}

		echo '<!-- / Jetpack Social -->' . PHP_EOL;
	}
}
