<?php
/**
 * The VideoPress channel blocks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Post;

/**
 * Registers and renders the server-side blocks a VideoPress channel theme
 * builds its pages from. Each renders nothing when it has nothing to show.
 * Also resolves the Video Playlist block's `source` ( a playlist published on
 * the site ) on any theme.
 */
class Channel_Blocks {

	/**
	 * Blocks, by name, with their render method.
	 *
	 * @var array<string, string>
	 */
	const BLOCKS = array(
		'videopress/channel-details' => 'render_channel_details',
		'videopress/video-details'   => 'render_video_details',
	);

	/**
	 * Channel details items, the first ones being the default selection.
	 *
	 * @var string[]
	 */
	const CHANNEL_ITEMS         = array( 'handle', 'subscribers', 'videos', 'playlists', 'views', 'joined' );
	const DEFAULT_CHANNEL_ITEMS = array( 'handle', 'subscribers', 'videos', 'playlists' );

	/**
	 * Register the blocks and the Video Playlist block's `source`. Like the All Playlists block,
	 * only where the Video Playlist block is; any theme.
	 *
	 * @param string|null $build_dir Directory holding each block's block.json; tests can point it at fixtures.
	 *
	 * @return void
	 */
	public static function register( $build_dir = null ) {
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Index::BLOCK_NAME ) ) {
			return;
		}
		if ( ! has_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) ) ) {
			add_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) );
		}
		if ( null === $build_dir ) {
			$build_dir = __DIR__ . '/../build/block-editor/blocks';
		}

		foreach ( self::BLOCKS as $name => $method ) {
			$metadata_file = $build_dir . '/' . substr( $name, strlen( 'videopress/' ) ) . '/block.json';
			if ( ! file_exists( $metadata_file ) || \WP_Block_Type_Registry::get_instance()->is_registered( $name ) ) {
				continue;
			}
			register_block_type( $metadata_file, array( 'render_callback' => array( __CLASS__, $method ) ) );
		}

		if ( ! has_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_data' ) ) ) {
			add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_data' ) );
		}
	}

	/**
	 * Hand the editor the site's playlists, most recently updated first, for the playlist pickers
	 * of the blocks that show one and for their canvas previews. An inline script rather than a
	 * REST route, so WordPress.com Simple's editor gets it too.
	 *
	 * @return void
	 */
	public static function enqueue_editor_data() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$handle = '';
		foreach ( array( Playlist_Index::BLOCK_NAME ) as $name ) {
			$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
			if ( $block_type && ! empty( $block_type->editor_script_handles ) ) {
				$handle = $block_type->editor_script_handles[0];
				break;
			}
		}
		if ( '' === $handle ) {
			return;
		}

		$playlists = array();
		foreach ( Channel::playlists() as $playlist ) {
			$playlists[] = array(
				'key'    => $playlist['key'],
				'title'  => $playlist['title'],
				'videos' => $playlist['videos'],
			);
		}
		wp_add_inline_script(
			$handle,
			'window.videopressChannelEditor = ' . wp_json_encode( array( 'playlists' => $playlists ), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ';',
			'before'
		);
	}

	/**
	 * A boolean attribute.
	 *
	 * @param array  $attributes    Block attributes.
	 * @param string $key           Attribute.
	 * @param bool   $default_value Value when unset.
	 *
	 * @return bool
	 */
	private static function flag( $attributes, $key, $default_value ) {
		return isset( $attributes[ $key ] ) ? (bool) $attributes[ $key ] : $default_value;
	}

	/**
	 * A heading level attribute, 1 to 6; anything else ( 0 = automatic ) picks the default.
	 *
	 * @param array $attributes    Block attributes.
	 * @param int   $default_value Level when unset.
	 *
	 * @return int
	 */
	private static function heading_level( $attributes, $default_value ) {
		$level = isset( $attributes['headingLevel'] ) && is_numeric( $attributes['headingLevel'] ) ? (int) $attributes['headingLevel'] : 0;
		return $level >= 1 && $level <= 6 ? $level : $default_value;
	}

	/**
	 * Channel details: the handle, subscribers, videos, playlists, views and join date.
	 *
	 * @param array $attributes Block attributes.
	 *
	 * @return string
	 */
	public static function render_channel_details( $attributes ) {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$items      = isset( $attributes['items'] ) && is_array( $attributes['items'] )
			? array_values( array_intersect( array_unique( $attributes['items'] ), self::CHANNEL_ITEMS ) )
			: self::DEFAULT_CHANNEL_ITEMS;
		$layout     = isset( $attributes['layout'] ) && 'list' === $attributes['layout'] ? 'list' : 'inline';

		$markup = '';
		foreach ( $items as $item ) {
			$value = self::channel_item( $item );
			if ( null === $value ) {
				continue;
			}
			$markup .= 'list' === $layout
				? sprintf(
					'<div class="videopress-channel-details__item is-%1$s"><dt>%2$s</dt><dd>%3$s</dd></div>',
					esc_attr( $item ),
					esc_html( $value['label'] ),
					esc_html( $value['value'] )
				)
				: sprintf(
					'<span class="videopress-channel-details__item is-%1$s">%2$s</span>',
					esc_attr( $item ),
					esc_html( $value['inline'] )
				);
		}
		if ( '' === $markup ) {
			return '';
		}

		$tag = 'list' === $layout ? 'dl' : 'div';
		return sprintf(
			'<%1$s %2$s>%3$s</%1$s>',
			$tag,
			get_block_wrapper_attributes( array( 'class' => 'videopress-channel-details is-layout-' . $layout ) ),
			$markup
		);
	}

	/**
	 * One channel details item, or null when its value is unknown.
	 *
	 * @param string $item One of CHANNEL_ITEMS.
	 *
	 * @return array{label: string, value: string, inline: string}|null
	 */
	private static function channel_item( $item ) {
		switch ( $item ) {
			case 'handle':
				$handle = Channel_Data::handle();
				return '' === $handle ? null : array(
					'label'  => __( 'Handle', 'jetpack-videopress-pkg' ),
					'value'  => $handle,
					'inline' => $handle,
				);
			case 'subscribers':
				$count = Channel_Data::subscriber_count();
				if ( null === $count ) {
					return null;
				}
				return array(
					'label'  => __( 'Subscribers', 'jetpack-videopress-pkg' ),
					'value'  => Channel_Data::compact_number( $count ),
					/* translators: %s: number of subscribers, e.g. "48K". */
					'inline' => sprintf( _n( '%s subscriber', '%s subscribers', $count, 'jetpack-videopress-pkg' ), Channel_Data::compact_number( $count ) ),
				);
			case 'videos':
				$count = Channel_Data::video_count();
				return array(
					'label'  => __( 'Videos', 'jetpack-videopress-pkg' ),
					'value'  => number_format_i18n( $count ),
					/* translators: %s: number of videos. */
					'inline' => sprintf( _n( '%s video', '%s videos', $count, 'jetpack-videopress-pkg' ), number_format_i18n( $count ) ),
				);
			case 'playlists':
				$count = count( Channel::playlists() );
				return array(
					'label'  => __( 'Playlists', 'jetpack-videopress-pkg' ),
					'value'  => number_format_i18n( $count ),
					/* translators: %s: number of playlists. */
					'inline' => sprintf( _n( '%s playlist', '%s playlists', $count, 'jetpack-videopress-pkg' ), number_format_i18n( $count ) ),
				);
			case 'views':
				$count = Channel_Data::total_views();
				return array(
					'label'  => __( 'Total views', 'jetpack-videopress-pkg' ),
					'value'  => Channel_Data::compact_number( $count ),
					/* translators: %s: number of views, e.g. "1.2M". */
					'inline' => sprintf( _n( '%s view', '%s views', $count, 'jetpack-videopress-pkg' ), Channel_Data::compact_number( $count ) ),
				);
			case 'joined':
				$time = Channel_Data::joined();
				if ( ! $time ) {
					return null;
				}
				$date = date_i18n( get_option( 'date_format' ), $time );
				return array(
					'label'  => __( 'Joined', 'jetpack-videopress-pkg' ),
					'value'  => $date,
					/* translators: %s: date the channel started. */
					'inline' => sprintf( __( 'Joined %s', 'jetpack-videopress-pkg' ), $date ),
				);
		}
		return null;
	}

	/**
	 * The video a block shows: the video page's, or the newest upload.
	 *
	 * @param array $attributes Block attributes.
	 *
	 * @return WP_Post|null
	 */
	private static function block_video( $attributes ) {
		if ( isset( $attributes['source'] ) && 'latest' === $attributes['source'] ) {
			return Channel_Data::latest_video();
		}
		return Channel::is_video_page() ? Channel::current_video() : null;
	}

	/**
	 * Video details: eyebrow, title, views and age, description and playlist chips.
	 *
	 * @param array $attributes Block attributes.
	 *
	 * @return string
	 */
	public static function render_video_details( $attributes ) {
		$attributes = is_array( $attributes ) ? $attributes : array();
		$post       = self::block_video( $attributes );
		$is_latest  = isset( $attributes['source'] ) && 'latest' === $attributes['source'];
		$guid       = $post instanceof WP_Post ? Channel::guid( $post ) : '';
		if ( ! $post instanceof WP_Post || '' === $guid ) {
			return '';
		}
		$details  = Channel_Data::video_details( $guid, $post );
		$record   = Channel_Data::record( $post );
		$playlist = $is_latest ? null : Channel::queried_playlist();
		if ( $playlist && ! in_array( $guid, array_column( $playlist['videos'], 'guid' ), true ) ) {
			$playlist = null;
		}

		$markup = '';
		if ( self::flag( $attributes, 'showEyebrow', true ) ) {
			$markup .= sprintf( '<span class="videopress-video-details__eyebrow">%s</span>', esc_html( self::episode_label( $guid, $playlist ) ) );
		}
		if ( self::flag( $attributes, 'showTitle', true ) && '' !== $details['title'] ) {
			$level   = self::heading_level( $attributes, $is_latest ? 2 : 1 );
			$title   = $is_latest
				? sprintf( '<a href="%1$s">%2$s</a>', esc_url( Channel::video_url( $post ) ), esc_html( $details['title'] ) )
				: esc_html( $details['title'] );
			$markup .= sprintf( '<h%1$d class="videopress-video-details__title">%2$s</h%1$d>', $level, $title );
		}
		if ( self::flag( $attributes, 'showMeta', true ) && $record ) {
			$meta = Channel_Data::views_and_age( Channel_Data::with_views( array( $record ) )[0], ! $is_latest );
			if ( '' !== $meta ) {
				$markup .= sprintf( '<div class="videopress-video-details__meta">%s</div>', esc_html( $meta ) );
			}
		}
		if ( self::flag( $attributes, 'showDescription', true ) && '' !== trim( wp_strip_all_tags( $details['description'] ) ) ) {
			$markup .= sprintf( '<div class="videopress-video-details__description">%s</div>', wpautop( esc_html( wp_strip_all_tags( $details['description'] ) ) ) );
		}
		if ( self::flag( $attributes, 'showPlaylists', true ) ) {
			$chips = '';
			foreach ( Channel::playlists_with_video( $guid ) as $holder ) {
				$chips .= sprintf(
					'<a class="videopress-video-details__chip" href="%1$s">%2$s</a>',
					esc_url( Channel::playlist_url( $holder['key'] ) ),
					/* translators: %s: playlist title. */
					esc_html( sprintf( __( 'Playlist: %s', 'jetpack-videopress-pkg' ), '' !== $holder['title'] ? $holder['title'] : __( 'Untitled playlist', 'jetpack-videopress-pkg' ) ) )
				);
			}
			if ( '' !== $chips ) {
				$markup .= sprintf( '<div class="videopress-video-details__chips">%s</div>', $chips );
			}
		}
		if ( '' === $markup ) {
			return '';
		}

		return sprintf( '<div %1$s>%2$s</div>', get_block_wrapper_attributes( array( 'class' => 'videopress-video-details' ) ), $markup );
	}

	/**
	 * "Episode 12" by upload order, or "Episode 3 · Playlist name" within a playlist.
	 *
	 * @param string     $guid     The video.
	 * @param array|null $playlist The playlist the video is played from.
	 *
	 * @return string
	 */
	private static function episode_label( $guid, $playlist ) {
		if ( $playlist ) {
			$position = array_search( $guid, array_column( $playlist['videos'], 'guid' ), true );
			$label    = sprintf(
				/* translators: %s: episode number. */
				__( 'Episode %s', 'jetpack-videopress-pkg' ),
				number_format_i18n( (int) $position + 1 )
			);
			return '' !== $playlist['title'] ? $label . ' · ' . $playlist['title'] : $label;
		}
		$order    = array_reverse( array_column( Channel_Data::videos(), 'guid' ) );
		$position = array_search( $guid, $order, true );
		/* translators: %s: episode number. */
		return sprintf( __( 'Episode %s', 'jetpack-videopress-pkg' ), number_format_i18n( false === $position ? count( $order ) + 1 : $position + 1 ) );
	}
}
