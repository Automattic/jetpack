<?php
/**
 * VideoPress Channel: a page for every video in the media library.
 *
 * A video is a VideoPress attachment; nothing has to be written around it.
 * `/videopress?v=<guid>` renders the theme's `videopress-video` block template
 * for that attachment, where a video block with `useQueriedVideo` plays it.
 * Titles, posters and the rest of the video's metadata come from VideoPress
 * at render time and are never stored on the blog.
 *
 * Enabled when the active theme declares `add_theme_support( 'videopress-channel' )`
 * or the `videopress_channel_enabled` filter returns true.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP;
use WP_Post;

/**
 * VideoPress Channel feature.
 */
class Channel {

	const MIME_TYPE = 'video/videopress';
	const ENDPOINT  = 'videopress';
	const QUERY_VAR = 'videopress_video';
	const TEMPLATE  = 'videopress-video';

	/**
	 * Whether the feature has been wired up in this request.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the feature up. Registration itself waits for `init`, when the
	 * active theme is known.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'init', array( __CLASS__, 'register' ), 9 );
	}

	/**
	 * Whether the channel feature is enabled for this site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$enabled = function_exists( 'current_theme_supports' ) && current_theme_supports( 'videopress-channel' );

		/**
		 * Filters whether the VideoPress Channel feature ( video pages ) is enabled.
		 *
		 * @since 0.55.0
		 *
		 * @param bool $enabled True when the active theme supports `videopress-channel`.
		 */
		return (bool) apply_filters( 'videopress_channel_enabled', $enabled );
	}

	/**
	 * Register the video page routing and the block hooks.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! self::is_enabled() ) {
			return;
		}

		add_filter( 'query_vars', array( __CLASS__, 'query_vars' ) );
		add_action( 'parse_request', array( __CLASS__, 'route_video_page' ) );
		add_filter( 'attachment_template_hierarchy', array( __CLASS__, 'template_hierarchy' ) );
		add_filter( 'attachment_link', array( __CLASS__, 'attachment_link' ), 10, 2 );
		add_filter( 'videopress_playlist_entry_url', array( __CLASS__, 'playlist_entry_url' ), 10, 2 );
		add_filter( 'render_block_data', array( __CLASS__, 'queried_video_block' ) );
	}

	/**
	 * The VideoPress GUID of an attachment, or an empty string.
	 *
	 * Jetpack sites store it in attachment meta; WordPress.com Simple keeps the
	 * uploaded file's attachment ( still `video/mp4` ) and maps it in the
	 * platform's videos table.
	 *
	 * @param int|WP_Post $attachment The attachment.
	 * @return string
	 */
	public static function guid( $attachment ) {
		$post = get_post( $attachment );
		if ( ! $post instanceof WP_Post || 'attachment' !== $post->post_type || 0 !== strpos( (string) $post->post_mime_type, 'video/' ) ) {
			return '';
		}
		$guid = (string) get_post_meta( $post->ID, 'videopress_guid', true );
		if ( '' === $guid ) {
			$meta = wp_get_attachment_metadata( $post->ID );
			$guid = isset( $meta['videopress']['guid'] ) ? (string) $meta['videopress']['guid'] : '';
		}
		if ( '' === $guid && function_exists( 'video_get_info_by_blogpostid' ) ) {
			// WordPress.com's videos table; the package shims this from post meta elsewhere.
			$info = video_get_info_by_blogpostid( get_current_blog_id(), $post->ID );
			$guid = is_object( $info ) && ! empty( $info->guid ) ? (string) $info->guid : '';
		}
		return preg_match( '/^[a-zA-Z0-9]{8}$/', $guid ) ? $guid : '';
	}

	/**
	 * The attachment a VideoPress GUID belongs to on this site, or 0.
	 *
	 * @param string $guid The GUID.
	 * @return int
	 */
	public static function attachment_id( $guid ) {
		if ( ! is_string( $guid ) || ! preg_match( '/^[a-zA-Z0-9]{8}$/', $guid ) ) {
			return 0;
		}
		$id = function_exists( 'videopress_get_post_id_by_guid' ) ? videopress_get_post_id_by_guid( $guid ) : false;
		if ( ! is_int( $id ) && function_exists( 'video_get_info_by_guid' ) ) {
			$info = video_get_info_by_guid( $guid );
			if ( is_object( $info ) && ! empty( $info->post_id ) && (int) $info->blog_id === get_current_blog_id() ) {
				$id = (int) $info->post_id;
			}
		}
		return is_int( $id ) && $id > 0 ? $id : 0;
	}

	/**
	 * The channel page of a video: `/videopress?v=<guid>`.
	 *
	 * @param int|WP_Post $attachment The attachment.
	 * @return string Empty when the attachment is not a VideoPress video.
	 */
	public static function video_url( $attachment ) {
		$guid = self::guid( $attachment );
		return '' === $guid ? '' : add_query_arg( 'v', $guid, user_trailingslashit( home_url( '/' . self::ENDPOINT ) ) );
	}

	/**
	 * Public query vars: `v` selects the video, `videopress_video` marks the page.
	 *
	 * @param string[] $vars Query vars.
	 * @return string[]
	 */
	public static function query_vars( $vars ) {
		$vars[] = 'v';
		$vars[] = self::QUERY_VAR;
		return $vars;
	}

	/**
	 * `/videopress?v=<guid>` becomes the attachment's request, so the main
	 * query, the template context and the post blocks all see the video.
	 * An unknown GUID 404s.
	 *
	 * @param WP $wp The request.
	 * @return void
	 */
	public static function route_video_page( $wp ) {
		$path = trim( (string) $wp->request, '/' );
		if ( self::ENDPOINT !== $path && empty( $wp->query_vars[ self::QUERY_VAR ] ) ) {
			return;
		}
		$guid = isset( $_GET['v'] ) ? sanitize_text_field( wp_unslash( $_GET['v'] ) ) : ( $wp->query_vars['v'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- public URL.
		$id   = self::attachment_id( $guid );
		if ( ! $id ) {
			$wp->query_vars = array( 'error' => '404' );
			return;
		}
		$wp->query_vars = array(
			'attachment_id' => $id,
			'post_type'     => 'attachment',
			self::QUERY_VAR => 1,
			'v'             => $guid,
		);
	}

	/**
	 * Video pages render the theme's `videopress-video` block template.
	 *
	 * @param string[] $templates Template hierarchy.
	 * @return string[]
	 */
	public static function template_hierarchy( $templates ) {
		if ( get_query_var( self::QUERY_VAR ) ) {
			array_unshift( $templates, self::TEMPLATE . '.php' );
		}
		return $templates;
	}

	/**
	 * VideoPress attachments link to their channel page.
	 *
	 * @param string $link    Attachment permalink.
	 * @param int    $post_id The attachment.
	 * @return string
	 */
	public static function attachment_link( $link, $post_id ) {
		$url = self::video_url( $post_id );
		return '' === $url ? $link : $url;
	}

	/**
	 * Playlist entries that open a video link to its channel page when the
	 * video belongs to this site.
	 *
	 * @param string $url  The entry URL ( videopress.com by default ).
	 * @param string $guid The video GUID.
	 * @return string
	 */
	public static function playlist_entry_url( $url, $guid ) {
		$id = self::attachment_id( $guid );
		return $id ? self::video_url( $id ) : $url;
	}

	/**
	 * The video a block refers to: the Query Loop entry when it is a
	 * VideoPress attachment, else the queried attachment.
	 *
	 * @param int $context_post_id The block's postId context, if any.
	 * @return WP_Post|null
	 */
	public static function current_video( $context_post_id = 0 ) {
		$candidates = array( (int) $context_post_id, (int) get_the_ID() );
		$queried    = get_queried_object();
		if ( $queried instanceof WP_Post ) {
			$candidates[] = (int) $queried->ID;
		}
		foreach ( $candidates as $id ) {
			$post = $id ? get_post( $id ) : null;
			if ( $post instanceof WP_Post && '' !== self::guid( $post ) ) {
				return $post;
			}
		}
		return null;
	}

	/**
	 * A video block with `useQueriedVideo` plays the current video. Its title
	 * and poster are read from VideoPress at render time, not from the blog.
	 *
	 * @param array $parsed_block The block being rendered.
	 * @return array
	 */
	public static function queried_video_block( $parsed_block ) {
		if ( ! isset( $parsed_block['blockName'] ) || 'videopress/video' !== $parsed_block['blockName'] || empty( $parsed_block['attrs']['useQueriedVideo'] ) ) {
			return $parsed_block;
		}
		$post = self::current_video();
		$guid = $post instanceof WP_Post ? self::guid( $post ) : '';
		if ( ! $post instanceof WP_Post || '' === $guid ) {
			$parsed_block['attrs']['guid'] = '';
			return $parsed_block;
		}
		$details = function_exists( 'videopress_get_video_details' ) ? videopress_get_video_details( $guid ) : null;
		$details = is_object( $details ) && ! is_wp_error( $details ) ? $details : null;

		$parsed_block['attrs']['guid']  = $guid;
		$parsed_block['attrs']['id']    = $post->ID;
		$parsed_block['attrs']['src']   = 'https://videopress.com/v/' . $guid;
		$parsed_block['attrs']['title'] = $details && ! empty( $details->title ) ? (string) $details->title : get_the_title( $post );
		if ( $details && ! empty( $details->poster ) ) {
			$parsed_block['attrs']['poster'] = (string) $details->poster;
		}
		return $parsed_block;
	}
}
