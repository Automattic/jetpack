<?php
/**
 * Create AI Podcast — wp-admin page under Media.
 *
 * Standalone PHP page (no wp-build chassis, no React). Renders a static
 * form server-side; a single vanilla-JS island fetches quota, drives the
 * posts picker, submits the generate request, polls the job, and resumes
 * across reloads via localStorage.
 *
 * Bootstrapped from `Podcast::init()` after the Host (Simple/WoA) and
 * `jetpack_podcast_untangle` gates have already been checked upstream.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

require_once __DIR__ . '/admin-pages/create-ai-podcast/presets.php';

use function Automattic\Jetpack\Podcast\Admin_Pages\Create_AI_Podcast\length_presets;
use function Automattic\Jetpack\Podcast\Admin_Pages\Create_AI_Podcast\voice_presets;
use function Automattic\Jetpack\Podcast\Admin_Pages\Create_AI_Podcast\window_presets;

/**
 * Registers the Media > Create AI Podcast submenu and renders the page.
 */
class Create_AI_Podcast_Page {

	const PAGE_SLUG         = 'create-ai-podcast';
	const SCRIPT_HANDLE     = 'jetpack-create-ai-podcast';
	const STYLE_HANDLE      = 'jetpack-create-ai-podcast';
	const EPISODES_PER_PAGE = 5;

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire admin hooks. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
	}

	/**
	 * Register the Media > Create AI Podcast submenu.
	 */
	public static function register_menu() {
		$page_suffix = add_submenu_page(
			'upload.php',
			__( 'Create AI Podcast', 'jetpack-podcast' ),
			__( 'Create AI Podcast', 'jetpack-podcast' ),
			'upload_files',
			self::PAGE_SLUG,
			array( __CLASS__, 'render' )
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'on_load' ) );
		}
	}

	/**
	 * Wire enqueue once we know the Create AI Podcast page is loading.
	 */
	public static function on_load() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_action( 'admin_head-media_page_create-ai-podcast', array( __CLASS__, 'render_resource_hints' ) );
	}

	/**
	 * On wpcom Simple sites every wp.apiFetch call is routed through the
	 * wpcom-proxy iframe at public-api.wordpress.com. The iframe load adds a
	 * full DNS + TLS round-trip before our prefetched quota/episodes requests
	 * can leave the page. Preconnect shaves that off.
	 */
	public static function render_resource_hints() {
		?>
		<link rel="preconnect" href="https://public-api.wordpress.com" crossorigin>
		<link rel="dns-prefetch" href="//public-api.wordpress.com">
		<?php
	}

	/**
	 * Enqueue the static JS island, the page stylesheet, and the localized data bundle.
	 */
	public static function enqueue_assets() {
		$base_url  = plugins_url( 'admin-pages/create-ai-podcast/', __FILE__ );
		$base_path = __DIR__ . '/admin-pages/create-ai-podcast/';

		wp_enqueue_style(
			self::STYLE_HANDLE,
			$base_url . 'style.css',
			array(),
			(string) ( file_exists( $base_path . 'style.css' ) ? filemtime( $base_path . 'style.css' ) : '0.1.0' )
		);

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$base_url . 'index.js',
			array( 'wp-api-fetch', 'wp-i18n' ),
			(string) ( file_exists( $base_path . 'index.js' ) ? filemtime( $base_path . 'index.js' ) : '0.1.0' ),
			true
		);

		wp_localize_script(
			self::SCRIPT_HANDLE,
			'jetpackCreateAiPodcast',
			self::build_localized_data()
		);
	}

	/**
	 * Build the data bundle passed to the JS island via wp_localize_script.
	 *
	 * @return array<string, mixed>
	 */
	private static function build_localized_data(): array {
		return array(
			'endpoints' => array(
				'enqueue'  => '/wpcom/v2/posts-to-podcast',
				'job'      => '/wpcom/v2/posts-to-podcast/jobs/',
				'quota'    => '/wpcom/v2/posts-to-podcast',
				'posts'    => '/wp/v2/posts',
				'episodes' => '/wpcom/v2/posts-to-podcast/episodes',
			),
			'blogId'    => self::resolve_blog_id(),
			'bootstrap' => self::bootstrap_data(),
			'presets'   => array(
				'window' => window_presets(),
				'length' => length_presets(),
				'voice'  => voice_presets(),
			),
			'poll'      => array(
				'fastMs'    => 3000,
				'slowMs'    => 10000,
				'switchMs'  => 30000,
				'timeoutMs' => 5 * 60 * 1000,
			),
			'i18n'      => array(
				'submitting'          => __( 'Submitting…', 'jetpack-podcast' ),
				'polling'             => __( 'Generating your episode…', 'jetpack-podcast' ),
				'succeeded'           => __( 'Episode draft ready.', 'jetpack-podcast' ),
				'editDraft'           => __( 'Edit draft', 'jetpack-podcast' ),
				'failed'              => __( 'Generation failed.', 'jetpack-podcast' ),
				'timedOut'            => __( 'Generation is taking longer than expected. Check your drafts.', 'jetpack-podcast' ),
				'tryAgain'            => __( 'Try again', 'jetpack-podcast' ),
				'dismiss'             => __( 'Dismiss', 'jetpack-podcast' ),
				'notAvailable'        => __( 'Create AI Podcast isn\'t available on your current plan.', 'jetpack-podcast' ),
				// translators: 1: number of credits used, 2: total credits available.
				'creditsUsed'         => __( '%1$d of %2$d credits used.', 'jetpack-podcast' ),
				'creditsLabel'        => __( 'Credits', 'jetpack-podcast' ),
				// translators: 1: number of credits used, 2: total credits available.
				'creditsCount'        => __( '%1$d / %2$d', 'jetpack-podcast' ),
				'creditsUnlimited'    => __( 'Unlimited generations available.', 'jetpack-podcast' ),
				// translators: %d: credits remaining.
				'creditsRemaining'    => __( '%d remaining', 'jetpack-podcast' ),
				// translators: %s: relative time, e.g. "in 12 days" or "tomorrow".
				'creditsResetSummary' => __( 'Resets %s', 'jetpack-podcast' ),
				'creditsResetMonthly' => __( 'Resets monthly', 'jetpack-podcast' ),
				'relativeToday'       => __( 'today', 'jetpack-podcast' ),
				'relativeTomorrow'    => __( 'tomorrow', 'jetpack-podcast' ),
				// translators: %d: number of days until reset.
				'relativeDays'        => __( 'in %d days', 'jetpack-podcast' ),
				// translators: %s: formatted date, e.g. "May 20, 2026".
				'relativeOn'          => __( 'on %s', 'jetpack-podcast' ),
				'runningLowTitle'     => __( 'Running low', 'jetpack-podcast' ),
				'runningLowMessage'   => __( 'Upgrade your plan to keep generating without waiting for the monthly refresh.', 'jetpack-podcast' ),
				'outOfCreditsTitle'   => __( 'Out of credits', 'jetpack-podcast' ),
				// translators: %s: relative time, e.g. "in 12 days" or "tomorrow".
				'outOfCreditsWait'    => __( 'Your credits will refresh %s.', 'jetpack-podcast' ),
				// translators: %s: relative time, e.g. "in 12 days" or "tomorrow".
				'outOfCreditsUpgrade' => __( 'Upgrade your plan for more credits, or wait until they refresh %s.', 'jetpack-podcast' ),
				'noPostsFound'        => __( 'No posts match.', 'jetpack-podcast' ),
				'loadingPosts'        => __( 'Loading posts…', 'jetpack-podcast' ),
				'pickPosts'           => __( 'Select at least one post to continue.', 'jetpack-podcast' ),
				'upgradeCta'          => __( 'Upgrade plan', 'jetpack-podcast' ),
				'episodesTitle'       => __( 'Generated podcasts', 'jetpack-podcast' ),
				'episodesEmpty'       => __( 'No generated podcasts yet.', 'jetpack-podcast' ),
				'episodesLoading'     => __( 'Loading podcasts…', 'jetpack-podcast' ),
				'editPost'            => __( 'Edit post', 'jetpack-podcast' ),
				'statusDraft'         => __( 'Draft', 'jetpack-podcast' ),
				'statusPublished'     => __( 'Published', 'jetpack-podcast' ),
				// translators: 1: range start, 2: range end, 3: total count. Example: "Showing 1–5 of 12"
				'paginationSummary'   => __( 'Showing %1$d–%2$d of %3$d', 'jetpack-podcast' ),
				'paginationPrev'      => __( 'Previous', 'jetpack-podcast' ),
				'paginationNext'      => __( 'Next', 'jetpack-podcast' ),
				// translators: %d: page number. Example: "Go to page 3"
				'paginationGoTo'      => __( 'Go to page %d', 'jetpack-podcast' ),
				'paginationLabel'     => __( 'Episodes pagination', 'jetpack-podcast' ),
			),
		);
	}

	/**
	 * Resolve the wpcom blog id for this site. On Atomic Jetpack stores it
	 * under the `id` option; on Simple sites it's the current blog id.
	 *
	 * @return int
	 */
	private static function resolve_blog_id(): int {
		if ( class_exists( '\\Jetpack_Options' ) ) {
			$id = (int) \Jetpack_Options::get_option( 'id' );
			if ( $id > 0 ) {
				return $id;
			}
		}
		return (int) get_current_blog_id();
	}

	/**
	 * Pre-warm the two initial reads (quota + episodes) server-side via
	 * rest_do_request so the client can render with data immediately instead
	 * of waiting on the wpcom-proxy iframe for the first paint. Failures fall
	 * through silently — the JS island falls back to fetch when an entry is
	 * null or absent.
	 *
	 * @return array{quota: array|null, episodes: array|null}
	 */
	private static function bootstrap_data(): array {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return self::bootstrap_data_wpcom();
		}
		return self::bootstrap_data_via_proxy();
	}

	/**
	 * Atomic / self-hosted path: hit the local Jetpack-side proxy via
	 * rest_do_request, which forwards to wpcom over HTTPS using the current
	 * user's Jetpack token.
	 *
	 * @return array
	 */
	private static function bootstrap_data_via_proxy(): array {
		$bootstrap = array(
			'quota'    => null,
			'episodes' => self::empty_episodes_envelope(),
		);

		$quota_request  = new \WP_REST_Request( 'GET', '/wpcom/v2/posts-to-podcast' );
		$quota_response = rest_do_request( $quota_request );
		if ( $quota_response instanceof \WP_REST_Response ) {
			if ( ! $quota_response->is_error() ) {
				$bootstrap['quota'] = $quota_response->get_data();
			} else {
				$status = (int) $quota_response->get_status();
				if ( 403 === $status || 404 === $status ) {
					$bootstrap['quota'] = array( 'notAvailable' => true );
				} else {
					$bootstrap['quota'] = array(
						'quota' => 0,
						'used'  => 0,
					);
				}
			}
		}

		$episodes_request = new \WP_REST_Request( 'GET', '/wpcom/v2/posts-to-podcast/episodes' );
		$episodes_request->set_param( 'page', 1 );
		$episodes_request->set_param( 'per_page', self::EPISODES_PER_PAGE );
		$episodes_response = rest_do_request( $episodes_request );
		if ( $episodes_response instanceof \WP_REST_Response && ! $episodes_response->is_error() ) {
			$bootstrap['episodes'] = self::normalize_episodes_payload( $episodes_response->get_data() );
		}

		return $bootstrap;
	}

	/**
	 * Replicate the wpcom-side endpoint's active-job payload shape so the
	 * client can resume polling the "Generating…" notice across reloads on
	 * Simple sites, the same way it does on Atomic through the proxy.
	 *
	 * @param int $blog_id Current blog id.
	 *
	 * @return array|\stdClass
	 */
	private static function build_active_job_payload_wpcom( int $blog_id ) {
		if ( ! function_exists( 'posts_to_podcast_get_active_job_record' ) ) {
			return new \stdClass();
		}
		$record = posts_to_podcast_get_active_job_record( $blog_id );
		if ( null === $record ) {
			return new \stdClass();
		}

		$status_map = array(
			'queued'    => 'pending',
			'succeeded' => 'complete',
			'failed'    => 'failed',
		);
		$raw        = function_exists( 'get_job_status' ) ? get_job_status( $record['id'] ) : 'queued';
		$status     = $status_map[ $raw ] ?? 'pending';

		$payload = array(
			'jobId'     => (int) $record['id'],
			'status'    => $status,
			'createdAt' => gmdate( 'c', (int) $record['queued_at'] ),
		);

		if ( 'complete' === $status && function_exists( 'posts_to_podcast_get_job_result' ) ) {
			$post_id = posts_to_podcast_get_job_result( $record['id'] );
			if ( null !== $post_id ) {
				$payload['postId']  = $post_id;
				$payload['editUrl'] = (string) get_edit_post_link( $post_id, 'raw' );
			}
		}

		return $payload;
	}

	/**
	 * Replicate the wpcom-side endpoint's upgrade URL builder so the Out of
	 * credits banner can surface an Upgrade plan CTA even on Simple sites
	 * (where we don't go through the REST proxy). Returns the Calypso
	 * checkout URL for the next tier up, or empty when the site is already
	 * on the top podcast tier.
	 *
	 * @param int $blog_id Current blog id.
	 *
	 * @return string
	 */
	private static function build_upgrade_url_wpcom( int $blog_id ): string {
		if ( ! class_exists( '\\WPCOM_Features' ) || ! function_exists( 'wpcom_site_has_feature' ) ) {
			return '';
		}

		if ( wpcom_site_has_feature( \WPCOM_Features::POSTS_TO_PODCAST_TIER_3, $blog_id ) ) {
			return '';
		}
		if ( wpcom_site_has_feature( \WPCOM_Features::POSTS_TO_PODCAST_TIER_2, $blog_id ) ) {
			$plan = 'business';
		} elseif ( wpcom_site_has_feature( \WPCOM_Features::POSTS_TO_PODCAST_TIER_1, $blog_id ) ) {
			$plan = 'premium';
		} else {
			$plan = 'personal';
		}

		$site_slug = class_exists( '\\WPCOM_Masterbar' )
			? \WPCOM_Masterbar::get_calypso_site_slug( $blog_id )
			: '';
		if ( '' === $site_slug ) {
			return '';
		}

		return sprintf( 'https://wordpress.com/checkout/%s/%s', $site_slug, $plan );
	}

	/**
	 * Default empty episodes envelope used while the page is still loading
	 * data or when an upstream request errors.
	 *
	 * @return array
	 */
	private static function empty_episodes_envelope(): array {
		return array(
			'items'      => array(),
			'total'      => 0,
			'page'       => 1,
			'perPage'    => self::EPISODES_PER_PAGE,
			'totalPages' => 0,
		);
	}

	/**
	 * Accept either the new envelope shape (preferred) or the legacy bare
	 * array (older sandboxes that haven't shipped the pagination upgrade yet)
	 * and return the envelope.
	 *
	 * @param mixed $payload Upstream response body.
	 *
	 * @return array
	 */
	private static function normalize_episodes_payload( $payload ): array {
		if ( is_array( $payload ) && isset( $payload['items'] ) && is_array( $payload['items'] ) ) {
			return array(
				'items'      => array_values( $payload['items'] ),
				'total'      => isset( $payload['total'] ) ? (int) $payload['total'] : count( $payload['items'] ),
				'page'       => isset( $payload['page'] ) ? max( 1, (int) $payload['page'] ) : 1,
				'perPage'    => isset( $payload['perPage'] ) ? max( 1, (int) $payload['perPage'] ) : self::EPISODES_PER_PAGE,
				'totalPages' => isset( $payload['totalPages'] ) ? max( 0, (int) $payload['totalPages'] ) : 0,
			);
		}
		if ( is_array( $payload ) ) {
			$items = array_values( $payload );
			return array(
				'items'      => $items,
				'total'      => count( $items ),
				'page'       => 1,
				'perPage'    => self::EPISODES_PER_PAGE,
				'totalPages' => count( $items ) > 0 ? 1 : 0,
			);
		}
		return self::empty_episodes_envelope();
	}

	/**
	 * Simple (wpcom) path: rest_do_request can't reach the posts-to-podcast
	 * endpoint here — the wpcom REST plugin loader gates the endpoint files
	 * behind REST_API_PLUGINS, which isn't set in admin context. Call the
	 * underlying wpcom helpers directly. Permissions are still enforced
	 * (admin caps required to render this page, automattician gate replicated
	 * below).
	 *
	 * @return array
	 */
	private static function bootstrap_data_wpcom(): array {
		$bootstrap = array(
			'quota'    => null,
			'episodes' => self::empty_episodes_envelope(),
		);

		if ( function_exists( 'is_automattician' ) && ! is_automattician() ) {
			$bootstrap['quota'] = array( 'notAvailable' => true );
			return $bootstrap;
		}

		if ( ! function_exists( 'require_lib' ) ) {
			return $bootstrap;
		}
		require_lib( 'posts-to-podcast' );

		$blog_id = (int) get_current_blog_id();

		if ( function_exists( '\\Automattic\\Posts_To_Podcast\\get_usage' ) || function_exists( 'posts_to_podcast_get_usage' ) ) {
			$usage              = function_exists( 'posts_to_podcast_get_usage' )
				? posts_to_podcast_get_usage( $blog_id )
				: array();
			$bootstrap['quota'] = array(
				'quota'      => $usage,
				'activeJob'  => self::build_active_job_payload_wpcom( $blog_id ),
				'upgradeUrl' => self::build_upgrade_url_wpcom( $blog_id ),
			);
		}

		$per_page = self::EPISODES_PER_PAGE;
		$query    = new \WP_Query(
			array(
				'post_type'              => 'post',
				'post_status'            => array( 'draft', 'publish' ),
				'posts_per_page'         => $per_page,
				'paged'                  => 1,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'update_post_term_cache' => false,
				'meta_query'             => array(
					array(
						'key'     => 'posts_to_podcast_metadata',
						'compare' => 'EXISTS',
					),
				),
			)
		);

		$items = array();
		foreach ( $query->posts as $post ) {
			$raw_meta = get_post_meta( $post->ID, 'posts_to_podcast_metadata', true );
			$meta     = is_string( $raw_meta ) ? json_decode( $raw_meta, true ) : null;
			$audio    = ( is_array( $meta ) && isset( $meta['audio'] ) && is_array( $meta['audio'] ) ) ? $meta['audio'] : array();
			$title    = wp_strip_all_tags(
				html_entity_decode( (string) get_the_title( $post ), ENT_QUOTES | ENT_HTML5, 'UTF-8' )
			);
			if ( '' === trim( $title ) ) {
				// translators: Fallback shown in the Generated podcasts list when a draft has an empty title.
				$title = __( '(no title)', 'jetpack-podcast' );
			}

			$items[] = array(
				'id'        => $post->ID,
				'title'     => $title,
				'status'    => $post->post_status,
				'date'      => mysql2date( 'c', $post->post_date_gmt, false ),
				'editUrl'   => get_edit_post_link( $post->ID, 'raw' ),
				'mediaUrl'  => isset( $audio['url'] ) ? esc_url_raw( (string) $audio['url'] ) : '',
				'mediaType' => 'audio',
				'mediaMime' => isset( $audio['mimeType'] ) ? (string) $audio['mimeType'] : '',
				'duration'  => isset( $audio['durationSeconds'] ) ? (int) round( (float) $audio['durationSeconds'] ) : 0,
			);
		}

		$total                 = (int) $query->found_posts;
		$bootstrap['episodes'] = array(
			'items'      => $items,
			'total'      => $total,
			'page'       => 1,
			'perPage'    => $per_page,
			'totalPages' => (int) ceil( $total / $per_page ),
		);

		return $bootstrap;
	}

	/**
	 * Render the page chrome and the static form HTML.
	 */
	public static function render() {
		$window = window_presets();
		$length = length_presets();
		$voice  = voice_presets();
		?>
		<div class="wrap jetpack-create-ai-podcast">
			<h1 class="jetpack-create-ai-podcast__page-title">
				<?php echo esc_html__( 'Create AI Podcast', 'jetpack-podcast' ); ?>
			</h1>

			<div id="jetpack-create-ai-podcast-app">
				<section class="jetpack-create-ai-podcast__intro" role="region" aria-labelledby="jetpack-create-ai-podcast-intro-title">
					<div class="jetpack-create-ai-podcast__intro-body">
						<p class="jetpack-create-ai-podcast__intro-eyebrow">
							<span class="jetpack-create-ai-podcast__intro-wpmark" aria-hidden="true"></span>
							<span><?php echo esc_html__( 'WordPress.com exclusive', 'jetpack-podcast' ); ?></span>
						</p>
						<h2 id="jetpack-create-ai-podcast-intro-title" class="jetpack-create-ai-podcast__intro-title">
							<?php echo esc_html__( 'Turn your posts into a podcast episode', 'jetpack-podcast' ); ?>
						</h2>
						<p class="jetpack-create-ai-podcast__intro-text">
							<?php echo esc_html__( 'Pick a date range or a few specific posts and we’ll generate a two-host conversation, complete with narration and a ready-to-publish draft. Edit, refine, and hit Publish when you’re happy.', 'jetpack-podcast' ); ?>
						</p>
					</div>
					<div class="jetpack-create-ai-podcast__intro-art" aria-hidden="true">
						<svg viewBox="0 0 64 64" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<linearGradient id="jetpack-create-ai-podcast-grad" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
									<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
								</linearGradient>
							</defs>
							<circle cx="32" cy="32" r="28" fill="url(#jetpack-create-ai-podcast-grad)"/>
							<path fill="#fff" d="M32 14a8 8 0 0 0-8 8v10a8 8 0 0 0 16 0V22a8 8 0 0 0-8-8zm-12 18a1.5 1.5 0 0 1 3 0 9 9 0 0 0 18 0 1.5 1.5 0 0 1 3 0 12 12 0 0 1-10.5 11.9V48h4.5v3h-12v-3H30v-2.1A12 12 0 0 1 20 32z"/>
						</svg>
					</div>
				</section>

				<div
					class="jetpack-create-ai-podcast__card jetpack-create-ai-podcast__credits"
					data-region="credits"
				></div>

				<form class="jetpack-create-ai-podcast__form" data-region="form">
					<section class="jetpack-create-ai-podcast__card">
						<h2 class="jetpack-create-ai-podcast__card-title">
							<?php echo esc_html__( 'Source', 'jetpack-podcast' ); ?>
						</h2>

						<div class="jetpack-create-ai-podcast__radio-group" role="radiogroup">
							<label class="jetpack-create-ai-podcast__radio">
								<input type="radio" name="source" value="window" checked>
								<span><?php echo esc_html__( 'From a date range', 'jetpack-podcast' ); ?></span>
							</label>
							<label class="jetpack-create-ai-podcast__radio">
								<input type="radio" name="source" value="posts">
								<span><?php echo esc_html__( 'From specific posts', 'jetpack-podcast' ); ?></span>
							</label>
						</div>

						<div class="jetpack-create-ai-podcast__field" data-source="window">
							<label for="jetpack-create-ai-podcast-window">
								<?php echo esc_html__( 'Date range', 'jetpack-podcast' ); ?>
							</label>
							<select id="jetpack-create-ai-podcast-window" name="window">
								<?php foreach ( $window as $opt ) : ?>
									<option value="<?php echo esc_attr( $opt['id'] ); ?>"><?php echo esc_html( $opt['label'] ); ?></option>
								<?php endforeach; ?>
							</select>
						</div>

						<div class="jetpack-create-ai-podcast__field" data-source="posts" hidden>
							<label for="jetpack-create-ai-podcast-posts-search">
								<?php echo esc_html__( 'Search posts', 'jetpack-podcast' ); ?>
							</label>
							<input
								type="search"
								id="jetpack-create-ai-podcast-posts-search"
								placeholder="<?php echo esc_attr__( 'Type to filter…', 'jetpack-podcast' ); ?>"
							>
							<div class="jetpack-create-ai-podcast__posts" data-region="posts"></div>
						</div>

						<div class="jetpack-create-ai-podcast__advanced" aria-labelledby="jetpack-create-ai-podcast-advanced-title">
							<div class="jetpack-create-ai-podcast__advanced-header">
								<h3 id="jetpack-create-ai-podcast-advanced-title" class="jetpack-create-ai-podcast__advanced-title">
									<?php echo esc_html__( 'Customize', 'jetpack-podcast' ); ?>
								</h3>
								<span class="jetpack-create-ai-podcast__soon-pill">
									<?php echo esc_html__( 'Coming soon', 'jetpack-podcast' ); ?>
								</span>
							</div>

							<div class="jetpack-create-ai-podcast__field">
								<label for="jetpack-create-ai-podcast-length">
									<?php echo esc_html__( 'Length', 'jetpack-podcast' ); ?>
								</label>
								<select id="jetpack-create-ai-podcast-length" name="length" disabled data-locked-disabled="true">
									<?php foreach ( $length as $opt ) : ?>
										<option value="<?php echo esc_attr( $opt['id'] ); ?>"><?php echo esc_html( $opt['label'] ); ?></option>
									<?php endforeach; ?>
								</select>
							</div>

							<div class="jetpack-create-ai-podcast__field">
								<label for="jetpack-create-ai-podcast-voice">
									<?php echo esc_html__( 'Voice', 'jetpack-podcast' ); ?>
								</label>
								<select id="jetpack-create-ai-podcast-voice" name="voice" disabled data-locked-disabled="true">
									<?php foreach ( $voice as $opt ) : ?>
										<option value="<?php echo esc_attr( $opt['id'] ); ?>"><?php echo esc_html( $opt['label'] ); ?></option>
									<?php endforeach; ?>
								</select>
							</div>

							<div class="jetpack-create-ai-podcast__field">
								<label for="jetpack-create-ai-podcast-prompt">
									<?php echo esc_html__( 'Prompt (optional)', 'jetpack-podcast' ); ?>
								</label>
								<textarea
									id="jetpack-create-ai-podcast-prompt"
									name="prompt"
									rows="3"
									disabled
									data-locked-disabled="true"
									placeholder="<?php echo esc_attr__( 'Steer the tone, framing, or focus of the episode…', 'jetpack-podcast' ); ?>"
								></textarea>
							</div>
						</div>

						<div class="jetpack-create-ai-podcast__actions">
							<button type="submit" class="button button-primary button-hero">
								<?php echo esc_html__( 'Generate', 'jetpack-podcast' ); ?>
							</button>
						</div>
					</section>
				</form>

				<div class="jetpack-create-ai-podcast__status" aria-live="polite" data-region="status"></div>

				<section
					class="jetpack-create-ai-podcast__card jetpack-create-ai-podcast__episodes"
					data-region="episodes"
					aria-busy="false"
				>
					<h2 class="jetpack-create-ai-podcast__card-title">
						<?php echo esc_html__( 'Generated podcasts', 'jetpack-podcast' ); ?>
					</h2>
					<div class="jetpack-create-ai-podcast__episodes-list" data-region="episodes-list"></div>
				</section>
			</div>
		</div>
		<?php
	}
}
