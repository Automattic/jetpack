<?php
/**
 * Podcast Episode block.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;

/**
 * Registers and renders the Podcast Episode block.
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
	const STYLE_HANDLE = 'jetpack-block-podcast-episode';

	/**
	 * Front-end view script handle. Enqueued from the render callback because
	 * block.json `viewScript` can't resolve the package's dist dir.
	 */
	const VIEW_HANDLE = 'jetpack-podcast-episode-view';

	/**
	 * Wire the block's actions.
	 */
	public static function register_hooks() {
		add_action( 'init', array( __CLASS__, 'register_block' ), 9 );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'load_editor_scripts' ), 9 );
	}

	/**
	 * Register the block and its front-end style bundle (auto-enqueued via the
	 * `style` arg whenever the block renders).
	 */
	public static function register_block() {
		// Side-loads the sibling style.css and registers it under STYLE_HANDLE.
		Assets::register_script(
			self::STYLE_HANDLE,
			'../../../dist/blocks/podcast-episode/style.js',
			__FILE__,
			array(
				'css_path' => '../../../dist/blocks/podcast-episode/style.css',
			)
		);

		// Register in every context so the RSS feed carries the player — how the
		// WPCOM Reader shows it on Atomic/Jetpack sites.
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback'       => array( __CLASS__, 'render_block' ),
				'style'                 => self::STYLE_HANDLE,
				'render_email_callback' => array( __CLASS__, 'render_email' ),
			)
		);

		// Flag as plan-gated for the editor upgrade prompt. Priority 11 runs after
		// jetpack_register_block's own availability action (10), so this wins.
		// Admin-only: only the editor consumes this availability entry (the
		// front-end render isn't availability-gated), and the self-hosted access
		// check can hit WPCOM — it must never run during a front-end page render.
		if ( is_admin() && class_exists( \Jetpack_Gutenberg::class ) ) {
			add_action( 'jetpack_register_gutenberg_extensions', array( __CLASS__, 'flag_plan_gated' ), 11 );
		}
	}

	/**
	 * Mark the block plan-gated so the editor shows the upgrade prompt (no-op if
	 * the site has access). Standard paid-block behavior: nudge on Atomic/Simple,
	 * hidden on self-hosted Jetpack where nudges are off — upsell in the dashboard.
	 */
	public static function flag_plan_gated() {
		if ( Podcast_Gate::has_product_access() ) {
			return;
		}

		\Jetpack_Gutenberg::set_extension_unavailable(
			'podcast-episode',
			'missing_plan',
			array(
				'required_feature' => 'podcast-episode',
				'required_plan'    => Podcast_Gate::get_required_plan_slug(),
			)
		);
	}

	/**
	 * Register + enqueue the front-end view script (wires soundbite buttons).
	 * Called from render so it only ships on pages with the block; dedups internally.
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

		// Only hook the src rewrite while the editor script is loading.
		add_filter( 'script_loader_src', array( __CLASS__, 'filter_editor_script_src' ), 10, 2 );
	}

	/**
	 * Rewrite the editor script src to the admin scheme, avoiding a mixed-content
	 * block on WPCOM custom domains without SSL (where `plugins_url()` returns
	 * http but wp-admin is https).
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
	 * Resolve the episode cover art URL: episode override → post featured
	 * image → show-level `podcasting_image` option → empty string.
	 *
	 * @param array    $attributes Block attributes.
	 * @param \WP_Post $post       Episode post.
	 * @param string   $size       Featured-image size to request.
	 * @return string
	 */
	private static function resolve_cover_art_url( array $attributes, $post, $size ) {
		if ( isset( $attributes['coverArt'] ) && is_array( $attributes['coverArt'] ) && ! empty( $attributes['coverArt']['url'] ) ) {
			return esc_url_raw( $attributes['coverArt']['url'] );
		}

		$featured_id = (int) get_post_thumbnail_id( $post );
		if ( $featured_id ) {
			$featured_url = (string) wp_get_attachment_image_url( $featured_id, $size );
			if ( '' !== $featured_url ) {
				return $featured_url;
			}
		}

		return (string) get_option( 'podcasting_image', '' );
	}

	/**
	 * Render callback. Full player in every context so the RSS feed carries it
	 * (how the WPCOM Reader shows it on Atomic/Jetpack). Email uses render_email().
	 *
	 * @param array     $attributes Block attributes.
	 * @param string    $content    Saved inner content; unused, the block renders its own markup.
	 * @param \WP_Block $block      Parsed block instance, used for post context.
	 * @return string
	 */
	public static function render_block( $attributes, $content, $block = null ) {
		if ( empty( $attributes['mediaUrl'] ) ) {
			return '';
		}

		// Resolve the backing post: block context (Query Loop / singular) first,
		// then the global loop.
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
		$location_name  = isset( $attributes['locationName'] ) ? (string) $attributes['locationName'] : '';
		$license        = isset( $attributes['license'] ) ? (string) $attributes['license'] : '';
		$license_url    = isset( $attributes['licenseUrl'] ) ? esc_url_raw( $attributes['licenseUrl'] ) : '';
		$people         = isset( $attributes['people'] ) && is_array( $attributes['people'] ) ? $attributes['people'] : array();

		$soundbites           = isset( $attributes['soundbites'] ) && is_array( $attributes['soundbites'] ) ? $attributes['soundbites'] : array();
		$alternate_enclosures = isset( $attributes['alternateEnclosures'] ) && is_array( $attributes['alternateEnclosures'] ) ? $attributes['alternateEnclosures'] : array();

		// Only ship the click-to-seek script when there are soundbites to wire.
		if ( ! empty( $soundbites ) ) {
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

		// Show-level data backs the `partOfSeries` schema reference.
		$show_title     = (string) get_option( 'podcasting_title', '' );
		$show_image_url = (string) get_option( 'podcasting_image', '' );
		$show_email     = (string) get_option( 'podcasting_email', '' );

		// Resolve cover art unconditionally so schema always carries the image;
		// `$show_poster` only gates the visible figure/poster.
		$image_url = self::resolve_cover_art_url( $attributes, $post, 'full' );

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
						<h3 class="jetpack-podcast-episode__title" itemprop="name">
							<?php if ( $episode_url ) : ?>
								<a href="<?php echo esc_url( $episode_url ); ?>"><?php echo esc_html( $title ); ?></a>
							<?php else : ?>
								<?php echo esc_html( $title ); ?>
							<?php endif; ?>
						</h3>
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
							><a href="<?php echo esc_url( $media_url ); ?>"><?php esc_html_e( 'Watch the episode', 'jetpack-podcast' ); ?></a></video>
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
							><a href="<?php echo esc_url( $media_url ); ?>"><?php esc_html_e( 'Listen to the episode', 'jetpack-podcast' ); ?></a></audio>
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

	/**
	 * Render the block for email (WooCommerce Email Editor). Email can't run the
	 * player, so render a static card linking back to the episode post.
	 *
	 * @param string $block_content     The original block HTML content.
	 * @param array  $parsed_block      The parsed block data including attributes.
	 * @param object $rendering_context Email rendering context.
	 * @return string
	 */
	public static function render_email( $block_content, array $parsed_block, $rendering_context ) {
		if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] ) ||
			! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' ) ||
			! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
			return '';
		}

		$attrs = $parsed_block['attrs'];

		if ( empty( $attrs['mediaUrl'] ) || ! wp_http_validate_url( $attrs['mediaUrl'] ) ) {
			return '';
		}

		$post = get_post();
		if ( ! $post ) {
			return '';
		}

		$post_url = get_permalink( $post );
		if ( empty( $post_url ) ) {
			return '';
		}

		$title          = get_the_title( $post );
		$author_name    = get_the_author_meta( 'display_name', (int) $post->post_author );
		$publish_date   = get_the_date( '', $post );
		$duration       = isset( $attrs['duration'] ) ? trim( (string) $attrs['duration'] ) : '';
		$season_number  = isset( $attrs['seasonNumber'] ) ? (int) $attrs['seasonNumber'] : 0;
		$episode_number = isset( $attrs['episodeNumber'] ) ? (int) $attrs['episodeNumber'] : 0;

		$image_url = self::resolve_cover_art_url( $attrs, $post, 'thumbnail' );
		if ( '' !== $image_url && ! wp_http_validate_url( $image_url ) ) {
			$image_url = '';
		}

		$cta_label = isset( $attrs['mediaType'] ) && 'video' === $attrs['mediaType']
			? __( 'Watch the episode', 'jetpack-podcast' )
			: __( 'Listen to the episode', 'jetpack-podcast' );

		$meta_parts = array();
		if ( $season_number ) {
			/* translators: %d: season number. */
			$meta_parts[] = sprintf( __( 'Season %d', 'jetpack-podcast' ), $season_number );
		}
		if ( $episode_number ) {
			/* translators: %d: episode number. */
			$meta_parts[] = sprintf( __( 'Episode %d', 'jetpack-podcast' ), $episode_number );
		}

		$byline_parts = array_filter( array( $author_name, $publish_date, $duration ) );

		$body = '';
		if ( $meta_parts ) {
			$body .= sprintf(
				'<p style="margin: 0 0 4px; font-size: 12px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.5px; color: #757575;">%s</p>',
				esc_html( implode( ' · ', $meta_parts ) )
			);
		}
		if ( $title ) {
			$body .= sprintf(
				'<h3 style="margin: 0 0 4px; font-size: 18px; line-height: 1.3;"><a href="%s" style="color: inherit; text-decoration: none;">%s</a></h3>',
				esc_url( $post_url ),
				esc_html( $title )
			);
		}
		if ( $byline_parts ) {
			$body .= sprintf(
				'<p style="margin: 0 0 12px; font-size: 13px; line-height: 1.4; color: #757575;">%s</p>',
				esc_html( implode( ' · ', $byline_parts ) )
			);
		}
		$body .= sprintf(
			'<p style="margin: 0; font-size: 14px;"><a href="%s" style="font-weight: 600;">&#9654;&nbsp; %s</a></p>',
			esc_url( $post_url ),
			esc_html( $cta_label )
		);

		$cells = '';
		if ( '' !== $image_url ) {
			$image_link = sprintf(
				'<a href="%s"><img src="%s" alt="" width="96" height="96" style="display: block; width: 96px; height: 96px; border-radius: 4px;" /></a>',
				esc_url( $post_url ),
				esc_url( $image_url )
			);

			// Padding on an inner wrapper, not the cell: the mobile media query
			// zeroes `.layout-flex-item` padding when the card stacks.
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
			$cells .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell(
				'<div style="padding: 16px 0 0 16px;">' . $image_link . '</div>',
				array(
					'class'  => 'layout-flex-item',
					'width'  => '96',
					'valign' => 'top',
					'style'  => 'width: 96px;',
				)
			);
		}

		// Table-wrap the body so bare <p>/<h3> survive email pipelines (core
		// blocks do the same); padding rides the nested cell, safe when stacked.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		$body_table = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			$body,
			array( 'style' => 'width: 100%; border-collapse: collapse;' ),
			array( 'style' => 'padding: 16px;' )
		);

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		$cells .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_cell(
			$body_table,
			array(
				'class'  => 'layout-flex-item',
				'valign' => 'top',
			)
		);

		// Cap to the email layout width when the context exposes it.
		$target_width = 600;
		if ( method_exists( $rendering_context, 'get_layout_width_without_padding' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
			$layout_width = (int) \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper::parse_value( $rendering_context->get_layout_width_without_padding() );
			if ( $layout_width > 0 ) {
				$target_width = $layout_width;
			}
		}

		// Preserve the vertical gap from email_attrs (the engine sets margin-top).
		$email_attrs        = $parsed_block['email_attrs'] ?? array();
		$table_margin_style = (string) \WP_Style_Engine::compile_css( array_intersect_key( $email_attrs, array_flip( array( 'margin', 'margin-top' ) ) ), '' );

		// `layout-flex-wrapper` opts into the engine's mobile stacking (collapses
		// under 660px). border-collapse must stay `separate` for the rounded border.
		$table_style = sprintf(
			'%s width: 100%%; max-width: %dpx; border-collapse: separate; border: 1px solid #ddd; border-radius: 6px;',
			$table_margin_style ? $table_margin_style : 'margin: 16px 0;',
			$target_width
		);

		// Append user block supports so editor styling overrides the defaults.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		$user_styles = \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper::get_block_styles( $attrs, $rendering_context, array( 'padding', 'border', 'background-color', 'color' ) );
		if ( ! empty( $user_styles['css'] ) ) {
			$table_style .= ' ' . $user_styles['css'];
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		return \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			$cells,
			array(
				'class' => 'jetpack-podcast-episode-email-card layout-flex-wrapper',
				'style' => $table_style,
			),
			array(),
			array(),
			false
		);
	}
}
