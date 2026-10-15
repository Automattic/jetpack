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

	const MIME_TYPE        = 'video/videopress';
	const ENDPOINT         = 'videopress';
	const QUERY_VAR        = 'videopress_video';
	const TEMPLATE         = 'videopress-video';
	const PLAYLIST_SOURCES = array( 'own', 'index' );

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

		/*
		 * WordPress.com's videopress_get_post_id_by_guid() returns the post ID of
		 * whichever blog owns the GUID, so every candidate must prove it is this
		 * blog's attachment for that GUID before it is used.
		 */
		$candidates = array();
		if ( function_exists( 'videopress_get_post_id_by_guid' ) ) {
			$candidates[] = videopress_get_post_id_by_guid( $guid );
		}
		if ( function_exists( 'video_get_info_by_guid' ) ) {
			$info = video_get_info_by_guid( $guid );
			if ( is_object( $info ) && ! empty( $info->post_id ) && isset( $info->blog_id ) && (int) $info->blog_id === get_current_blog_id() ) {
				$candidates[] = $info->post_id;
			}
		}

		foreach ( $candidates as $candidate ) {
			$id = is_numeric( $candidate ) ? (int) $candidate : 0;
			if ( $id > 0 && self::is_attachment_for( $id, $guid ) ) {
				return $id;
			}
		}
		return 0;
	}

	/**
	 * Whether a post ID is this blog's VideoPress attachment for a GUID.
	 *
	 * @param int    $id   Post ID.
	 * @param string $guid The GUID.
	 * @return bool
	 */
	private static function is_attachment_for( $id, $guid ) {
		$post = get_post( $id );
		return $post instanceof WP_Post && 'attachment' === $post->post_type && self::guid( $post ) === $guid;
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
	 * Whether a URL points at this site rather than, say, videopress.com.
	 *
	 * @param string $url The URL.
	 * @return bool
	 */
	public static function is_site_url( $url ) {
		$host = wp_parse_url( (string) $url, PHP_URL_HOST );
		return is_string( $host ) && strtolower( $host ) === strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
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

	/**
	 * Whether this request is a channel video page.
	 *
	 * @return bool
	 */
	public static function is_video_page() {
		return (bool) get_query_var( self::QUERY_VAR );
	}

	/**
	 * The GUID of the video page's video, or an empty string.
	 *
	 * @return string
	 */
	public static function queried_guid() {
		if ( ! self::is_video_page() ) {
			return '';
		}
		$post = self::current_video();
		return $post instanceof WP_Post ? self::guid( $post ) : '';
	}

	/**
	 * One indexed playlist with its key, or null.
	 *
	 * @param string $key Playlist key.
	 * @return array|null Record with key, title, description, videos and post_id.
	 */
	public static function playlist_record( $key ) {
		$key = is_string( $key ) ? sanitize_key( $key ) : '';
		if ( '' === $key ) {
			return null;
		}
		$index = Playlist_Index::get_playlists();
		if ( ! isset( $index[ $key ] ) || ! is_array( $index[ $key ] ) ) {
			return null;
		}
		return self::normalize_record( $key, $index[ $key ] );
	}

	/**
	 * Every indexed playlist whose source post is published, most recently updated first.
	 *
	 * @return array[] Records as playlist_record() returns them, plus `updated` ( unix time ).
	 */
	public static function playlists() {
		$playlists = array();
		foreach ( Playlist_Index::get_playlists() as $key => $record ) {
			if ( ! is_array( $record ) ) {
				continue;
			}
			$record = self::normalize_record( (string) $key, $record );
			$post   = $record['post_id'] ? get_post( $record['post_id'] ) : null;
			if ( ! $post instanceof WP_Post || 'publish' !== $post->post_status ) {
				continue;
			}
			$record['updated'] = (int) strtotime( $post->post_modified_gmt . ' UTC' );
			$playlists[]       = $record;
		}
		usort(
			$playlists,
			function ( $a, $b ) {
				return $b['updated'] !== $a['updated'] ? $b['updated'] - $a['updated'] : strcmp( $a['key'], $b['key'] );
			}
		);
		return $playlists;
	}

	/**
	 * Normalize an index record.
	 *
	 * @param string $key    Playlist key.
	 * @param array  $record Index record.
	 * @return array
	 */
	private static function normalize_record( $key, array $record ) {
		return array(
			'key'         => $key,
			'title'       => isset( $record['title'] ) && is_string( $record['title'] ) ? $record['title'] : '',
			'description' => isset( $record['description'] ) && is_string( $record['description'] ) ? $record['description'] : '',
			'videos'      => Initializer::sanitize_playlist_entries( $record['videos'] ?? null ),
			'post_id'     => isset( $record['post_id'] ) ? absint( $record['post_id'] ) : 0,
		);
	}

	/**
	 * The playlist a block shows: an indexed one by key ( the most recently
	 * updated when no key is set ).
	 *
	 * @param string $source One of PLAYLIST_SOURCES.
	 * @param string $key    Playlist key for the `index` source.
	 * @return array|null
	 */
	public static function source_playlist( $source, $key = '' ) {
		if ( 'index' !== $source ) {
			return null;
		}
		if ( is_string( $key ) && '' !== $key ) {
			return self::playlist_record( $key );
		}
		$playlists = self::playlists();
		return $playlists ? $playlists[0] : null;
	}

	/**
	 * A Video Playlist block whose `source` is `index` shows that playlist. Hooked by
	 * Channel_Blocks::register() on every site with the block, channel theme or not.
	 *
	 * @param array $parsed_block The block being rendered.
	 * @return array
	 */
	public static function playlist_source_block( $parsed_block ) {
		if ( ! isset( $parsed_block['blockName'] ) || Playlist_Index::BLOCK_NAME !== $parsed_block['blockName'] ) {
			return $parsed_block;
		}
		$attrs  = isset( $parsed_block['attrs'] ) && is_array( $parsed_block['attrs'] ) ? $parsed_block['attrs'] : array();
		$source = isset( $attrs['source'] ) && in_array( $attrs['source'], self::PLAYLIST_SOURCES, true ) ? $attrs['source'] : 'own';
		if ( 'own' === $source ) {
			return $parsed_block;
		}

		$playlist = self::source_playlist( $source, isset( $attrs['sourcePlaylistId'] ) ? (string) $attrs['sourcePlaylistId'] : '' );
		if ( ! $playlist ) {
			$parsed_block['attrs']['videos'] = array();
			return $parsed_block;
		}

		$parsed_block['attrs']['videos']              = $playlist['videos'];
		$parsed_block['attrs']['playlistTitle']       = $playlist['title'];
		$parsed_block['attrs']['playlistDescription'] = $playlist['description'];
		return $parsed_block;
	}
}
