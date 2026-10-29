<?php
/**
 * VideoPress playlist block email renderer class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Handles rendering VideoPress playlist blocks for email contexts.
 *
 * Emails cannot play a playlist, so the first video is shown as a poster with a
 * play button and the next ones as a grid of thumbnails, all linking to the post.
 */
class Playlist_Block_Email_Renderer {

	/**
	 * Thumbnails per grid row.
	 *
	 * @var int
	 */
	const GRID_COLUMNS = 3;

	/**
	 * Thumbnails shown under the first video before the "more videos" link.
	 *
	 * @var int
	 */
	const GRID_MAX_VIDEOS = 6;

	/**
	 * Padding around each grid thumbnail, in pixels.
	 *
	 * @var int
	 */
	const GRID_CELL_PADDING = 4;

	/**
	 * Render the Video Playlist block for email.
	 *
	 * @param string $block_content     The block's front-end HTML, read for the playlist title heading.
	 * @param array  $parsed_block      The parsed block data including attributes.
	 * @param object $rendering_context Email rendering context.
	 *
	 * @return string
	 */
	public static function render( $block_content, $parsed_block, $rendering_context ) {
		if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] ) ||
			! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Video' ) ) {
			return '';
		}

		$entries  = Initializer::sanitize_playlist_entries( $parsed_block['attrs']['videos'] ?? null );
		$post_url = get_permalink();

		if ( ! $entries || empty( $post_url ) ) {
			return '';
		}

		$videos = array();
		foreach ( array_slice( $entries, 0, 1 + self::GRID_MAX_VIDEOS ) as $index => $entry ) {
			$videos[] = self::video_details( $entry['guid'], $index + 1 );
		}

		$html  = self::render_heading( $block_content );
		$html .= self::render_first_video( $videos[0], $post_url, $rendering_context );

		if ( count( $entries ) > 1 ) {
			$html .= self::render_summary( $entries );
			$html .= self::render_grid( array_slice( $videos, 1 ), $post_url, self::layout_width( $rendering_context ) );
		}

		$hidden = count( $entries ) - count( $videos );
		if ( $hidden > 0 ) {
			$html .= sprintf(
				'<p style="margin: 8px 0 0; font-size: 14px;"><a href="%s" target="_blank" rel="noopener noreferrer">%s</a></p>',
				esc_url( $post_url ),
				/* translators: %d: number of playlist videos not shown in the email. */
				esc_html( sprintf( _n( '+ %d more video', '+ %d more videos', $hidden, 'jetpack-videopress-pkg' ), $hidden ) )
			);
		}

		$margin_top  = '';
		$email_attrs = $parsed_block['email_attrs'] ?? array();
		if ( ! empty( $email_attrs['margin-top'] ) && is_string( $email_attrs['margin-top'] ) ) {
			$margin_top = 'margin-top: ' . $email_attrs['margin-top'] . ';';
		}

		return sprintf( '<div class="videopress-playlist-email" style="%s">%s</div>', esc_attr( $margin_top ), $html );
	}

	/**
	 * Render the Latest Videos Playlist block for email: the site's newest videos as a playlist.
	 *
	 * @param string $block_content     The block's front-end HTML, unused: the block has no title.
	 * @param array  $parsed_block      The parsed block data including attributes.
	 * @param object $rendering_context Email rendering context.
	 *
	 * @return string
	 */
	public static function render_latest_videos( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$attributes = isset( $parsed_block['attrs'] ) && is_array( $parsed_block['attrs'] ) ? $parsed_block['attrs'] : array();
		$count      = isset( $attributes['count'] ) && is_numeric( $attributes['count'] )
			? (int) $attributes['count']
			: Initializer::LATEST_VIDEOS_PLAYLIST_DEFAULT_COUNT;
		$count      = max( Initializer::LATEST_VIDEOS_PLAYLIST_MIN_COUNT, min( Initializer::LATEST_VIDEOS_PLAYLIST_MAX_COUNT, $count ) );

		$parsed_block['attrs'] = array( 'videos' => Data::get_latest_videopress_playlist_entries( $count ) );

		return self::render( '', $parsed_block, $rendering_context );
	}

	/**
	 * A video's title and poster, as anyone may see them.
	 *
	 * Private videos get no poster and keep their positional title, as on the
	 * front end for a viewer who is not allowed to watch them.
	 *
	 * @param string $guid     Video GUID.
	 * @param int    $position Position of the video in the playlist, from 1.
	 *
	 * @return array{title: string, poster: string}
	 */
	private static function video_details( $guid, $position ) {
		$details = function_exists( 'videopress_get_video_details' ) ? videopress_get_video_details( $guid ) : null;
		$details = is_object( $details ) && ! is_wp_error( $details ) && empty( $details->is_private ) ? $details : null;

		$title  = $details && ! empty( $details->title ) && is_string( $details->title ) ? $details->title : '';
		$poster = $details && ! empty( $details->poster ) && is_string( $details->poster ) ? esc_url_raw( $details->poster ) : '';

		return array(
			/* translators: %d: position of the video in the playlist. */
			'title'  => '' !== $title ? $title : sprintf( __( 'Video %d', 'jetpack-videopress-pkg' ), $position ),
			'poster' => $poster,
		);
	}

	/**
	 * The playlist title heading from the block's front-end HTML, already rendered for email.
	 *
	 * @param string $block_content The block's front-end HTML.
	 *
	 * @return string
	 */
	private static function render_heading( $block_content ) {
		if ( ! is_string( $block_content )
			|| ! preg_match( '#<div class="videopress-playlist__heading">(.*)</div><div class="videopress-playlist__body">#s', $block_content, $matches )
		) {
			return '';
		}

		return $matches[1];
	}

	/**
	 * The first video as a poster with a play button, or a link when it has no poster.
	 *
	 * @param array  $video             Video details.
	 * @param string $post_url          Post URL.
	 * @param object $rendering_context Email rendering context.
	 *
	 * @return string
	 */
	private static function render_first_video( $video, $post_url, $rendering_context ) {
		if ( '' !== $video['poster'] ) {
			$video_block = array(
				'blockName' => 'core/video',
				'attrs'     => array(
					'poster'   => $video['poster'],
					'videoUrl' => $post_url,
				),
				'innerHTML' => '<figure class="wp-block-video"></figure>',
			);

			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() in render().
			$video_renderer = new \Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Video();

			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() in render().
			$html = $video_renderer->render( $video_block['innerHTML'], $video_block, $rendering_context );
			if ( ! empty( $html ) ) {
				return $html;
			}
		}

		return sprintf(
			'<p><a href="%s" target="_blank" rel="noopener noreferrer">%s</a></p>',
			esc_url( $post_url ),
			esc_html__( 'Visit the post to watch the video', 'jetpack-videopress-pkg' )
		);
	}

	/**
	 * The "4 videos · 12 min" line introducing the grid.
	 *
	 * @param array $entries Every playlist entry.
	 *
	 * @return string
	 */
	private static function render_summary( $entries ) {
		$count = count( $entries );
		/* translators: %d: number of videos in the playlist. */
		$label   = sprintf( _n( '%d video', '%d videos', $count, 'jetpack-videopress-pkg' ), $count );
		$runtime = Initializer::playlist_runtime_label( array_sum( array_column( $entries, 'durationMs' ) ) );
		if ( '' !== $runtime ) {
			$label .= ' · ' . $runtime;
		}

		return sprintf( '<p style="margin: 16px 0 8px; font-size: 14px;">%s</p>', esc_html( $label ) );
	}

	/**
	 * The videos after the first as a table of linked thumbnails.
	 *
	 * @param array  $videos   Video details.
	 * @param string $post_url Post URL.
	 * @param int    $width    Email content width in pixels.
	 *
	 * @return string
	 */
	private static function render_grid( $videos, $post_url, $width ) {
		$image_width = (int) floor( $width / self::GRID_COLUMNS ) - 2 * self::GRID_CELL_PADDING;
		$cell_style  = sprintf(
			'width: %s%%; padding: %dpx; vertical-align: top;',
			round( 100 / self::GRID_COLUMNS, 2 ),
			self::GRID_CELL_PADDING
		);

		$rows = '';
		foreach ( array_chunk( $videos, self::GRID_COLUMNS ) as $row_videos ) {
			$cells = '';
			foreach ( $row_videos as $video ) {
				$thumbnail = '' !== $video['poster']
					? sprintf(
						'<a href="%1$s" target="_blank" rel="noopener noreferrer"><img src="%2$s" alt="%3$s" width="%4$d" style="display: block; width: 100%%; max-width: %4$dpx; height: auto; border: 0; border-radius: 4px;" /></a>',
						esc_url( $post_url ),
						esc_url( $video['poster'] ),
						esc_attr( $video['title'] ),
						$image_width
					)
					: '';

				$cells .= sprintf(
					'<td style="%1$s">%2$s<p style="margin: 4px 0 0; font-size: 14px; line-height: 1.4;"><a href="%3$s" target="_blank" rel="noopener noreferrer">%4$s</a></p></td>',
					esc_attr( $cell_style ),
					$thumbnail,
					esc_url( $post_url ),
					esc_html( $video['title'] )
				);
			}

			// Pad the last row so its cells keep the same width as the others.
			$cells .= str_repeat(
				sprintf( '<td style="%s"></td>', esc_attr( $cell_style ) ),
				self::GRID_COLUMNS - count( $row_videos )
			);

			$rows .= '<tr>' . $cells . '</tr>';
		}

		return sprintf(
			'<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="width: 100%%; border-collapse: collapse; table-layout: fixed;">%s</table>',
			$rows
		);
	}

	/**
	 * The email content width, 600px unless the rendering context says otherwise.
	 *
	 * @param object $rendering_context Email rendering context.
	 *
	 * @return int Width in pixels.
	 */
	private static function layout_width( $rendering_context ) {
		if ( is_object( $rendering_context ) && method_exists( $rendering_context, 'get_layout_width_without_padding' ) ) {
			$width = (int) $rendering_context->get_layout_width_without_padding();
			if ( $width > 0 ) {
				return $width;
			}
		}

		return 600;
	}
}
