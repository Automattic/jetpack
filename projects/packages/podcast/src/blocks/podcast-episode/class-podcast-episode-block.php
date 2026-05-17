<?php
/**
 * Podcast Episode block.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Request;

/**
 * Registers and renders the Podcast Episode block.
 *
 * Activation is gated by the `jetpack_podcast_untangle` filter; the
 * caller (Podcast::init()) is responsible for the host gate. Each action
 * callback re-checks the filter at hook time, so a late-registered filter
 * callback still takes effect.
 */
class Podcast_Episode_Block {

	/**
	 * Editor script handle.
	 */
	const EDITOR_HANDLE = 'jetpack-podcast-episode-editor';

	/**
	 * Front-end + editor shared style handle. Side-loaded by
	 * `Assets::register_script` from the sibling `style.css` bundle.
	 */
	const STYLE_HANDLE = 'jetpack-podcast-episode-style';

	/**
	 * Front-end view script handle. Enqueued from the render callback
	 * because the block.json `viewScript` field can't resolve to the
	 * package's dist directory from the deployed src location.
	 */
	const VIEW_HANDLE = 'jetpack-podcast-episode-view';

	/**
	 * Wire the block's actions. Hooks are added unconditionally; each
	 * callback re-checks the untangle filter and short-circuits when off.
	 */
	public static function register_hooks() {
		add_action( 'init', array( __CLASS__, 'register_block' ), 9 );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'load_editor_scripts' ), 9 );
	}

	/**
	 * Whether the new podcast experience is enabled.
	 */
	private static function is_enabled(): bool {
		/** This filter is documented in projects/packages/podcast/src/class-podcast.php */
		return (bool) apply_filters( 'jetpack_podcast_untangle', false );
	}

	/**
	 * Register the block when the gate is open.
	 *
	 * Also registers the front-end style bundle (built separately from the
	 * editor bundle so it actually ships on the public post page) and hands
	 * the handle to `register_block_type` via the `style` arg, which auto-
	 * enqueues it whenever the block is rendered.
	 */
	public static function register_block() {
		if ( ! self::is_enabled() ) {
			return;
		}

		// Assets::register_script side-loads the sibling style.css and
		// registers a style handle under the same name. The accompanying
		// (essentially empty) style.js handle is registered too but never
		// enqueued — only the style is passed to register_block_type below.
		Assets::register_script(
			self::STYLE_HANDLE,
			'../../../dist/blocks/podcast-episode/style.js',
			__FILE__,
			array(
				'css_path' => '../../../dist/blocks/podcast-episode/style.css',
			)
		);

		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => array( __CLASS__, 'render_block' ),
				'style'           => self::STYLE_HANDLE,
			)
		);
	}

	/**
	 * Register and enqueue the front-end view script that wires chapter and
	 * soundbite buttons to the audio player. Called from the render callback
	 * so the script only ships on pages that actually contain the block.
	 *
	 * `Assets::register_script` dedups internally, so calling this for each
	 * rendered instance of the block is safe.
	 */
	private static function enqueue_view_script() {
		Assets::register_script(
			self::VIEW_HANDLE,
			'../../../dist/blocks/podcast-episode/view.js',
			__FILE__,
			array(
				'in_footer' => true,
				'enqueue'   => true,
			)
		);
	}

	/**
	 * Enqueue the bundled editor script + style from the package's dist/.
	 */
	public static function load_editor_scripts() {
		if ( ! self::is_enabled() ) {
			return;
		}

		Assets::register_script(
			self::EDITOR_HANDLE,
			'../../../dist/blocks/podcast-episode/editor.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'enqueue'    => true,
				'textdomain' => 'jetpack-podcast',
			)
		);

		// Add the script_loader_src rewrite only while the editor script is
		// in flight, so the filter doesn't run on every front-end script load.
		add_filter( 'script_loader_src', array( __CLASS__, 'filter_editor_script_src' ), 10, 2 );
	}

	/**
	 * Rewrite the editor script src to match the admin scheme.
	 *
	 * On WPCOM sites with a custom domain mapping that lacks SSL, `home_url()`
	 * (and therefore `plugins_url()`) returns `http://mapped-domain.test` even
	 * though wp-admin is served from `.wordpress.com` over HTTPS. The script
	 * URL then trips the browser's mixed-content block. Routing through the
	 * canonical `script_loader_src` filter keeps the URL valid in both cases
	 * without mutating `$wp_scripts->registered` directly.
	 *
	 * @param string $src    Script source URL.
	 * @param string $handle Script handle.
	 * @return string
	 */
	public static function filter_editor_script_src( $src, $handle ) {
		if ( self::EDITOR_HANDLE !== $handle ) {
			return $src;
		}

		$admin_scheme = wp_parse_url( admin_url(), PHP_URL_SCHEME );
		if ( ! $admin_scheme ) {
			return $src;
		}

		return set_url_scheme( $src, $admin_scheme );
	}

	/**
	 * Format a seconds value as a MM:SS or HH:MM:SS label. Negative input clamps to 0.
	 *
	 * @param float|int|string $seconds Seconds value (Podcasting 2.0 soundbite startTime/duration are floats).
	 * @return string Formatted label (always non-empty; "0:00" for zero input).
	 */
	private static function format_seconds_label( $seconds ) {
		$total   = (int) floor( max( 0, (float) $seconds ) );
		$hours   = (int) floor( $total / 3600 );
		$minutes = (int) floor( ( $total % 3600 ) / 60 );
		$secs    = $total % 60;

		if ( $hours > 0 ) {
			return sprintf( '%d:%02d:%02d', $hours, $minutes, $secs );
		}
		return sprintf( '%d:%02d', $minutes, $secs );
	}

	/**
	 * Render callback.
	 *
	 * Pulls title, author, and date from the surrounding post — the post is
	 * the episode. Cover art falls back to the show-level `podcasting_image`
	 * option when the block has no episode-specific override.
	 *
	 * @param array     $attributes Block attributes.
	 * @param string    $content    Inner content (fallback direct-link markup from save.js).
	 * @param \WP_Block $block      The parsed block instance, used to read post context.
	 * @return string
	 */
	public static function render_block( $attributes, $content, $block = null ) {
		// Outside the frontend, fall back to the saved direct link so RSS / email / REST export stays
		// simple and predictable.
		if ( ! Request::is_frontend() ) {
			return $content;
		}

		if ( empty( $attributes['mediaUrl'] ) ) {
			return '';
		}

		// Resolve the post that backs this episode. Prefer block context (set by Query Loop / singular
		// templates / post-bound block contexts) and fall back to the global loop for direct theme
		// rendering. With no resolvable post, the block has nothing to display.
		$post_id = 0;
		if ( $block && isset( $block->context['postId'] ) ) {
			$post_id = (int) $block->context['postId'];
		}
		if ( ! $post_id ) {
			$post_id = (int) get_the_ID();
		}
		if ( ! $post_id ) {
			return '';
		}
		$post = get_post( $post_id );
		if ( ! $post ) {
			return '';
		}

		$media_url = esc_url_raw( $attributes['mediaUrl'] );
		if ( ! wp_http_validate_url( $media_url ) ) {
			return '';
		}

		$media_type     = isset( $attributes['mediaType'] ) && 'video' === $attributes['mediaType'] ? 'video' : 'audio';
		$mime_type      = isset( $attributes['mediaMimeType'] ) ? (string) $attributes['mediaMimeType'] : '';
		$episode_number = isset( $attributes['episodeNumber'] ) ? (int) $attributes['episodeNumber'] : 0;
		$season_number  = isset( $attributes['seasonNumber'] ) ? (int) $attributes['seasonNumber'] : 0;
		$episode_type   = isset( $attributes['episodeType'] ) ? (string) $attributes['episodeType'] : 'full';
		$is_explicit    = ! empty( $attributes['explicit'] );
		$duration       = isset( $attributes['duration'] ) ? (string) $attributes['duration'] : '';
		$show_poster    = ! isset( $attributes['showPoster'] ) || ! empty( $attributes['showPoster'] );
		$transcript_url = isset( $attributes['transcriptUrl'] ) ? esc_url_raw( $attributes['transcriptUrl'] ) : '';
		$chapters       = isset( $attributes['chapters'] ) && is_array( $attributes['chapters'] ) ? $attributes['chapters'] : array();
		$location_name  = isset( $attributes['locationName'] ) ? (string) $attributes['locationName'] : '';
		$license        = isset( $attributes['license'] ) ? (string) $attributes['license'] : '';
		$license_url    = isset( $attributes['licenseUrl'] ) ? esc_url_raw( $attributes['licenseUrl'] ) : '';
		$people         = isset( $attributes['people'] ) && is_array( $attributes['people'] ) ? $attributes['people'] : array();

		$soundbites           = isset( $attributes['soundbites'] ) && is_array( $attributes['soundbites'] ) ? $attributes['soundbites'] : array();
		$alternate_enclosures = isset( $attributes['alternateEnclosures'] ) && is_array( $attributes['alternateEnclosures'] ) ? $attributes['alternateEnclosures'] : array();

		// Only ship the click-to-seek script on episodes that actually have chapters or soundbites to wire.
		if ( ! empty( $chapters ) || ! empty( $soundbites ) ) {
			self::enqueue_view_script();
		}

		if ( '' !== $transcript_url && ! wp_http_validate_url( $transcript_url ) ) {
			$transcript_url = '';
		}

		$author_id        = (int) $post->post_author;
		$title            = get_the_title( $post );
		$author_name      = get_the_author_meta( 'display_name', $author_id );
		$author_url       = esc_url_raw( (string) get_the_author_meta( 'url', $author_id ) );
		$publish_date_iso = get_the_date( 'c', $post );
		$publish_date     = get_the_date( '', $post );
		$episode_url      = get_permalink( $post );
		$transcript_type  = isset( $attributes['transcriptType'] ) ? (string) $attributes['transcriptType'] : '';

		// Show-level data backs the `partOfSeries` PodcastSeries reference so
		// search engines can connect the episode to its parent show.
		$show_title     = (string) get_option( 'podcasting_title', '' );
		$show_image_url = (string) get_option( 'podcasting_image', '' );
		$show_email     = (string) get_option( 'podcasting_email', '' );

		// Cover art chain: episode override → post featured image → show-level cover → none.
		// Resolved unconditionally so schema metadata always carries the image; the
		// `$show_poster` toggle only gates the visible figure and the video poster.
		$image_url = '';
		if ( isset( $attributes['coverArt'] ) && is_array( $attributes['coverArt'] ) && ! empty( $attributes['coverArt']['url'] ) ) {
			$image_url = esc_url_raw( $attributes['coverArt']['url'] );
		} else {
			$featured_id = (int) get_post_thumbnail_id( $post );
			if ( $featured_id ) {
				$featured_url = (string) wp_get_attachment_image_url( $featured_id, 'full' );
				if ( '' !== $featured_url ) {
					$image_url = $featured_url;
				}
			}
			if ( '' === $image_url ) {
				$image_url = $show_image_url;
			}
		}

		// AudioObject/VideoObject @type for the embedded media.
		$media_object_type = 'video' === $media_type ? 'VideoObject' : 'AudioObject';

		$wrapper_attributes = get_block_wrapper_attributes();

		ob_start();
		?>
		<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() returns pre-escaped attribute output. ?>>
			<article class="jetpack-podcast-episode" itemscope itemtype="https://schema.org/PodcastEpisode">
				<?php if ( $episode_url ) : ?>
					<link itemprop="url" href="<?php echo esc_url( $episode_url ); ?>" />
				<?php endif; ?>
				<?php if ( $image_url && $show_poster ) : ?>
					<figure class="jetpack-podcast-episode__poster">
						<img
							src="<?php echo esc_url( $image_url ); ?>"
							alt=""
							itemprop="image"
							loading="lazy"
						/>
					</figure>
				<?php elseif ( $image_url ) : ?>
					<meta itemprop="image" content="<?php echo esc_url( $image_url ); ?>" />
				<?php endif; ?>

				<div class="jetpack-podcast-episode__body">
					<?php if ( $season_number || $episode_number || 'full' !== $episode_type || $is_explicit ) : ?>
						<p class="jetpack-podcast-episode__meta-line">
							<?php if ( $season_number ) : ?>
								<span class="jetpack-podcast-episode__season" itemprop="partOfSeason" itemscope itemtype="https://schema.org/PodcastSeason">
									<meta itemprop="seasonNumber" content="<?php echo esc_attr( (string) $season_number ); ?>" />
									<?php
									/* translators: %d: season number. */
									echo esc_html( sprintf( __( 'Season %d', 'jetpack-podcast' ), $season_number ) );
									?>
								</span>
							<?php endif; ?>
							<?php if ( $episode_number ) : ?>
								<span class="jetpack-podcast-episode__episode-number">
									<meta itemprop="episodeNumber" content="<?php echo esc_attr( (string) $episode_number ); ?>" />
									<?php
									/* translators: %d: episode number. */
									echo esc_html( sprintf( __( 'Episode %d', 'jetpack-podcast' ), $episode_number ) );
									?>
								</span>
							<?php endif; ?>
							<?php if ( 'trailer' === $episode_type ) : ?>
								<span class="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--trailer"><?php esc_html_e( 'Trailer', 'jetpack-podcast' ); ?></span>
							<?php elseif ( 'bonus' === $episode_type ) : ?>
								<span class="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--bonus"><?php esc_html_e( 'Bonus', 'jetpack-podcast' ); ?></span>
							<?php endif; ?>
							<?php if ( $is_explicit ) : ?>
								<span class="jetpack-podcast-episode__badge jetpack-podcast-episode__badge--explicit" title="<?php esc_attr_e( 'Explicit content', 'jetpack-podcast' ); ?>"><?php echo esc_html( _x( 'E', 'short label for explicit content', 'jetpack-podcast' ) ); ?></span>
							<?php endif; ?>
						</p>
					<?php endif; ?>

					<?php if ( $title ) : ?>
						<h3 class="jetpack-podcast-episode__title" itemprop="name"><?php echo esc_html( $title ); ?></h3>
					<?php endif; ?>

					<?php if ( $author_name || $publish_date || $duration ) : ?>
						<p class="jetpack-podcast-episode__byline">
							<?php if ( $author_name ) : ?>
								<span class="jetpack-podcast-episode__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
									<?php if ( $author_url ) : ?>
										<a href="<?php echo esc_url( $author_url ); ?>" itemprop="url">
											<span itemprop="name"><?php echo esc_html( $author_name ); ?></span>
										</a>
									<?php else : ?>
										<span itemprop="name"><?php echo esc_html( $author_name ); ?></span>
									<?php endif; ?>
								</span>
							<?php endif; ?>
							<?php if ( $publish_date ) : ?>
								<time
									class="jetpack-podcast-episode__date"
									datetime="<?php echo esc_attr( $publish_date_iso ); ?>"
									itemprop="datePublished"
								>
									<?php echo esc_html( $publish_date ); ?>
								</time>
							<?php endif; ?>
							<?php if ( $duration ) : ?>
								<span class="jetpack-podcast-episode__duration"><?php echo esc_html( $duration ); ?></span>
							<?php endif; ?>
						</p>
					<?php endif; ?>

					<div
						class="jetpack-podcast-episode__player"
						itemprop="<?php echo 'video' === $media_type ? 'video' : 'audio'; ?>"
						itemscope
						itemtype="https://schema.org/<?php echo esc_attr( $media_object_type ); ?>"
					>
						<meta itemprop="contentUrl" content="<?php echo esc_url( $media_url ); ?>" />
						<?php if ( $mime_type ) : ?>
							<meta itemprop="encodingFormat" content="<?php echo esc_attr( $mime_type ); ?>" />
						<?php endif; ?>
						<?php if ( $duration ) : ?>
							<meta itemprop="duration" content="<?php echo esc_attr( $duration ); ?>" />
						<?php endif; ?>
						<?php if ( 'video' === $media_type ) : ?>
							<video
								class="jetpack-podcast-episode__video"
								controls
								preload="none"
								src="<?php echo esc_url( $media_url ); ?>"
								<?php
								if ( $image_url && $show_poster ) :
									?>
									poster="<?php echo esc_url( $image_url ); ?>"<?php endif; ?>
								<?php
								if ( $mime_type ) :
									?>
									data-mime="<?php echo esc_attr( $mime_type ); ?>"<?php endif; ?>
							></video>
						<?php else : ?>
							<audio
								class="jetpack-podcast-episode__audio"
								controls
								preload="none"
								src="<?php echo esc_url( $media_url ); ?>"
								<?php
								if ( $mime_type ) :
									?>
									data-mime="<?php echo esc_attr( $mime_type ); ?>"<?php endif; ?>
							></audio>
						<?php endif; ?>
					</div>

					<?php if ( ! empty( $soundbites ) ) : ?>
						<ul class="jetpack-podcast-episode__soundbites">
							<?php
							foreach ( $soundbites as $soundbite ) :
								if ( ! is_array( $soundbite ) || ! isset( $soundbite['startTime'] ) ) {
									continue;
								}
								$start_label     = self::format_seconds_label( $soundbite['startTime'] );
								$soundbite_title = isset( $soundbite['title'] ) ? trim( (string) $soundbite['title'] ) : '';
								$start_seconds   = (int) floor( max( 0, (float) $soundbite['startTime'] ) );
								$end_seconds     = isset( $soundbite['duration'] )
									? $start_seconds + (int) floor( max( 0, (float) $soundbite['duration'] ) )
									: null;
								?>
								<li
									class="jetpack-podcast-episode__soundbite"
									itemprop="hasPart"
									itemscope
									itemtype="https://schema.org/Clip"
								>
									<meta itemprop="startOffset" content="<?php echo esc_attr( (string) $start_seconds ); ?>" />
									<?php if ( null !== $end_seconds ) : ?>
										<meta itemprop="endOffset" content="<?php echo esc_attr( (string) $end_seconds ); ?>" />
									<?php endif; ?>
									<button
										type="button"
										class="jetpack-podcast-episode__soundbite-button"
										data-start-time="<?php echo esc_attr( (string) $start_seconds ); ?>"
									>
										<time class="jetpack-podcast-episode__soundbite-time"><?php echo esc_html( $start_label ); ?></time>
										<?php if ( '' !== $soundbite_title ) : ?>
											<span class="jetpack-podcast-episode__soundbite-title" itemprop="name"><?php echo esc_html( $soundbite_title ); ?></span>
										<?php endif; ?>
									</button>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<?php
					$rendered_chapters = array();
					foreach ( $chapters as $chapter ) {
						if ( ! is_array( $chapter ) || ! isset( $chapter['startTime'] ) ) {
							continue;
						}
						$rendered_chapters[] = array(
							'startTime' => (float) $chapter['startTime'],
							'title'     => isset( $chapter['title'] ) ? trim( (string) $chapter['title'] ) : '',
						);
					}
					usort(
						$rendered_chapters,
						static function ( $a, $b ) {
							return $a['startTime'] <=> $b['startTime'];
						}
					);
					?>
					<?php if ( ! empty( $rendered_chapters ) ) : ?>
						<ol class="jetpack-podcast-episode__chapters">
							<?php foreach ( $rendered_chapters as $chapter ) : ?>
								<?php $chapter_start_seconds = (int) floor( max( 0, $chapter['startTime'] ) ); ?>
								<li
									class="jetpack-podcast-episode__chapter"
									itemprop="hasPart"
									itemscope
									itemtype="https://schema.org/Clip"
								>
									<meta itemprop="startOffset" content="<?php echo esc_attr( (string) $chapter_start_seconds ); ?>" />
									<button
										type="button"
										class="jetpack-podcast-episode__chapter-button"
										data-start-time="<?php echo esc_attr( (string) $chapter_start_seconds ); ?>"
									>
										<time class="jetpack-podcast-episode__chapter-time"><?php echo esc_html( self::format_seconds_label( $chapter['startTime'] ) ); ?></time>
										<?php if ( '' !== $chapter['title'] ) : ?>
											<span class="jetpack-podcast-episode__chapter-title" itemprop="name"><?php echo esc_html( $chapter['title'] ); ?></span>
										<?php endif; ?>
									</button>
								</li>
							<?php endforeach; ?>
						</ol>
					<?php endif; ?>

					<?php if ( ! empty( $alternate_enclosures ) ) : ?>
						<ul class="jetpack-podcast-episode__alternates">
							<?php
							foreach ( $alternate_enclosures as $alt ) :
								if ( ! is_array( $alt ) || empty( $alt['url'] ) ) {
									continue;
								}
								$alt_url = esc_url_raw( (string) $alt['url'] );
								if ( ! wp_http_validate_url( $alt_url ) ) {
									continue;
								}
								$alt_type    = isset( $alt['type'] ) ? (string) $alt['type'] : '';
								$alt_title   = isset( $alt['title'] ) ? trim( (string) $alt['title'] ) : '';
								$alt_lang    = isset( $alt['lang'] ) ? (string) $alt['lang'] : '';
								$alt_bitrate = isset( $alt['bitrate'] ) ? (int) $alt['bitrate'] : 0;
								$details     = array();
								if ( '' !== $alt_lang ) {
									$details[] = $alt_lang;
								}
								if ( $alt_bitrate > 0 ) {
									$details[] = sprintf(
										/* translators: %d: bitrate in kilobits per second. */
										__( '%d kbps', 'jetpack-podcast' ),
										(int) round( $alt_bitrate / 1000 )
									);
								}
								if ( '' !== $alt_type ) {
									$details[] = $alt_type;
								}
								$details_label = $details ? ' (' . implode( ', ', $details ) . ')' : '';
								$display_label = '' !== $alt_title ? $alt_title : __( 'Alternative version', 'jetpack-podcast' );
								?>
								<li class="jetpack-podcast-episode__alternate">
									<a href="<?php echo esc_url( $alt_url ); ?>"<?php echo '' !== $alt_lang ? ' hreflang="' . esc_attr( $alt_lang ) . '"' : ''; ?>>
										<?php echo esc_html( $display_label . $details_label ); ?>
									</a>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<?php if ( ! empty( $people ) ) : ?>
						<ul class="jetpack-podcast-episode__people">
							<?php
							foreach ( $people as $person ) :
								if ( ! is_array( $person ) || empty( $person['name'] ) ) {
									continue;
								}
								$person_name = (string) $person['name'];
								$person_role = isset( $person['role'] ) ? (string) $person['role'] : '';
								$person_href = isset( $person['href'] ) ? esc_url_raw( $person['href'] ) : '';
								$person_img  = isset( $person['img'] ) ? esc_url_raw( $person['img'] ) : '';
								?>
								<li class="jetpack-podcast-episode__person" itemprop="contributor" itemscope itemtype="https://schema.org/Person">
									<?php if ( $person_img ) : ?>
										<img src="<?php echo esc_url( $person_img ); ?>" alt="" loading="lazy" />
									<?php endif; ?>
									<?php if ( $person_href ) : ?>
										<a href="<?php echo esc_url( $person_href ); ?>" itemprop="url">
											<span itemprop="name"><?php echo esc_html( $person_name ); ?></span>
										</a>
									<?php else : ?>
										<span itemprop="name"><?php echo esc_html( $person_name ); ?></span>
									<?php endif; ?>
									<?php if ( $person_role ) : ?>
										<span class="jetpack-podcast-episode__person-role"><?php echo esc_html( $person_role ); ?></span>
									<?php endif; ?>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<?php if ( '' !== $show_title ) : ?>
						<div class="jetpack-podcast-episode__series" itemprop="partOfSeries" itemscope itemtype="https://schema.org/PodcastSeries">
							<meta itemprop="name" content="<?php echo esc_attr( $show_title ); ?>" />
							<?php if ( $show_image_url ) : ?>
								<meta itemprop="image" content="<?php echo esc_url( $show_image_url ); ?>" />
							<?php endif; ?>
							<?php if ( $show_email ) : ?>
								<span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
									<meta itemprop="email" content="<?php echo esc_attr( $show_email ); ?>" />
								</span>
							<?php endif; ?>
						</div>
					<?php endif; ?>

					<?php if ( $transcript_url || $location_name || $license ) : ?>
						<ul class="jetpack-podcast-episode__links">
							<?php if ( $transcript_url ) : ?>
								<li itemprop="transcript" itemscope itemtype="https://schema.org/MediaObject">
									<meta itemprop="contentUrl" content="<?php echo esc_url( $transcript_url ); ?>" />
									<?php if ( '' !== $transcript_type ) : ?>
										<meta itemprop="encodingFormat" content="<?php echo esc_attr( $transcript_type ); ?>" />
									<?php endif; ?>
									<a href="<?php echo esc_url( $transcript_url ); ?>" class="jetpack-podcast-episode__transcript-link">
										<?php esc_html_e( 'Read transcript', 'jetpack-podcast' ); ?>
									</a>
								</li>
							<?php endif; ?>
							<?php if ( $location_name ) : ?>
								<li class="jetpack-podcast-episode__location" itemprop="contentLocation"><?php echo esc_html( $location_name ); ?></li>
							<?php endif; ?>
							<?php if ( $license ) : ?>
								<li class="jetpack-podcast-episode__license">
									<?php
									/* translators: %s: license identifier (e.g. "CC-BY-4.0"). */
									$license_label = sprintf( _x( 'License: %s', 'episode metadata license label', 'jetpack-podcast' ), $license );
									?>
									<?php if ( $license_url ) : ?>
										<a href="<?php echo esc_url( $license_url ); ?>" itemprop="license"><?php echo esc_html( $license_label ); ?></a>
									<?php else : ?>
										<?php echo esc_html( $license_label ); ?>
									<?php endif; ?>
								</li>
							<?php endif; ?>
						</ul>
					<?php endif; ?>
				</div>
			</article>
		</div>
		<?php

		return ob_get_clean();
	}
}
