<?php
/**
 * The VideoPress channel blocks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Registers and renders the server-side blocks a VideoPress channel theme
 * builds its pages from, on sites with the channel feature enabled. Each renders
 * nothing when it has nothing to show. Also resolves the Video Playlist block's
 * `source` ( a playlist published on the site ) on any theme.
 */
class Channel_Blocks {

	/**
	 * Blocks, by name, with their render method.
	 *
	 * @var array<string, string>
	 */
	const BLOCKS = array(
		'videopress/channel-details' => 'render_channel_details',
	);

	/**
	 * Channel details items, the first ones being the default selection.
	 *
	 * @var string[]
	 */
	const CHANNEL_ITEMS         = array( 'handle', 'subscribers', 'videos', 'playlists', 'views', 'joined' );
	const DEFAULT_CHANNEL_ITEMS = array( 'handle', 'subscribers', 'videos', 'playlists' );

	/**
	 * Register the Video Playlist block's `source` on any theme, and the blocks where the channel
	 * feature is enabled ( see Channel::is_enabled() ). Like the All Playlists block, only where
	 * the Video Playlist block is.
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

		foreach ( Channel::is_enabled() ? self::BLOCKS : array() as $name => $method ) {
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
			default: // 'joined', the last of CHANNEL_ITEMS.
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
	}
}
