<?php
/**
 * The All Playlists block: every Video Playlist on the site, as a grid or a list.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Registers and renders the `videopress/all-playlists` block from the playlist
 * index. The markup is a placeholder until the block's design lands.
 */
class All_Playlists_Block {

	/**
	 * Block name.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'videopress/all-playlists';

	/**
	 * Supported layouts, the first being the default.
	 *
	 * @var string[]
	 */
	const LAYOUTS = array( 'grid', 'list' );

	/**
	 * Register the block.
	 *
	 * It lists Video Playlist blocks, so it is only registered where that block is.
	 *
	 * @param string|null $metadata_file Path to the block.json metadata file. Defaults to the
	 *                                   package build output; tests can point it at a fixture.
	 *
	 * @return void
	 */
	public static function register( $metadata_file = null ) {
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Index::BLOCK_NAME ) ) {
			return;
		}

		if ( null === $metadata_file ) {
			$metadata_file = __DIR__ . '/../build/block-editor/blocks/all-playlists/block.json';
		}

		if ( ! file_exists( $metadata_file ) ) {
			return;
		}

		$metadata = json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $metadata_file )
		);

		if ( empty( $metadata->name )
			|| \WP_Block_Type_Registry::get_instance()->is_registered( $metadata->name )
		) {
			return;
		}

		register_block_type(
			$metadata_file,
			array(
				'render_callback' => array( __CLASS__, 'render' ),
			)
		);
	}

	/**
	 * Render callback.
	 *
	 * @param array $block_attributes Block attributes.
	 *
	 * @return string Block markup, or an empty string when the site has no playlists.
	 */
	public static function render( $block_attributes ) {
		$playlists = Playlist_Index::get_playlists();
		if ( ! $playlists ) {
			return '';
		}

		$layout = isset( $block_attributes['layout'] ) && in_array( $block_attributes['layout'], self::LAYOUTS, true )
			? $block_attributes['layout']
			: self::LAYOUTS[0];

		$items = '';
		foreach ( $playlists as $key => $playlist ) {
			if ( ! is_array( $playlist ) ) {
				continue;
			}

			$videos = isset( $playlist['videos'] ) && is_array( $playlist['videos'] ) ? $playlist['videos'] : array();
			$title  = isset( $playlist['title'] ) && is_string( $playlist['title'] ) && '' !== $playlist['title']
				? $playlist['title']
				: __( 'Untitled playlist', 'jetpack-videopress-pkg' );

			$description = isset( $playlist['description'] ) && is_string( $playlist['description'] ) && '' !== $playlist['description']
				? sprintf( '<p class="videopress-all-playlists__description">%s</p>', esc_html( $playlist['description'] ) )
				: '';

			$items .= sprintf(
				'<li class="videopress-all-playlists__item" data-playlist="%1$s">' .
					'<div class="videopress-all-playlists__thumb" aria-hidden="true"></div>' .
					'<div class="videopress-all-playlists__body">' .
						'<h3 class="videopress-all-playlists__title">%2$s</h3>%3$s' .
						'<span class="videopress-all-playlists__count">%4$s</span>' .
					'</div>' .
				'</li>',
				esc_attr( (string) $key ),
				esc_html( $title ),
				$description,
				esc_html(
					sprintf(
						/* translators: %d: number of videos in the playlist. */
						_n( '%d video', '%d videos', count( $videos ), 'jetpack-videopress-pkg' ),
						count( $videos )
					)
				)
			);
		}

		if ( '' === $items ) {
			return '';
		}

		$wrapper_attributes = get_block_wrapper_attributes(
			array(
				'class' => 'videopress-all-playlists is-layout-' . $layout,
			)
		);

		return sprintf(
			'<div %1$s><ul class="videopress-all-playlists__items">%2$s</ul></div>',
			$wrapper_attributes,
			$items
		);
	}
}
