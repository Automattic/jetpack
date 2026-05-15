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

	const PAGE_SLUG     = 'create-ai-podcast';
	const SCRIPT_HANDLE = 'jetpack-create-ai-podcast';
	const STYLE_HANDLE  = 'jetpack-create-ai-podcast';

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
			/** "Create AI Podcast" is a product feature name, not translated. */
			'Create AI Podcast',
			'Create AI Podcast',
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
				'enqueue' => '/wpcom/v2/posts-to-podcast',
				'job'     => '/wpcom/v2/posts-to-podcast/jobs/',
				'quota'   => '/wpcom/v2/posts-to-podcast',
				'posts'   => '/wp/v2/posts',
			),
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
				'notAvailable'        => __( 'Create AI Podcast isn\'t available on your current plan.', 'jetpack-podcast' ),
				// translators: 1: number of credits used, 2: total credits available.
				'creditsUsed'         => __( '%1$d of %2$d credits used.', 'jetpack-podcast' ),
				'creditsLabel'        => __( 'Credits', 'jetpack-podcast' ),
				// translators: 1: number of credits used, 2: total credits available.
				'creditsCount'        => __( '%1$d / %2$d', 'jetpack-podcast' ),
				// translators: %s: date when credits reset.
				'creditsReset'        => __( 'Resets on %s.', 'jetpack-podcast' ),
				'creditsUnlimited'    => __( 'Unlimited generations available.', 'jetpack-podcast' ),
				'noPostsFound'        => __( 'No posts match.', 'jetpack-podcast' ),
				'loadingPosts'        => __( 'Loading posts…', 'jetpack-podcast' ),
				'pickPosts'           => __( 'Select at least one post to continue.', 'jetpack-podcast' ),
				'upgradeRunningLow'   => __( 'Running low on credits.', 'jetpack-podcast' ),
				'upgradeOutOfCredits' => __( 'You\'re out of credits for this period.', 'jetpack-podcast' ),
				'upgradeCta'          => __( 'Upgrade plan', 'jetpack-podcast' ),
			),
		);
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
					</section>

					<div class="jetpack-create-ai-podcast__field" hidden>
						<label for="jetpack-create-ai-podcast-length">
							<?php echo esc_html__( 'Length', 'jetpack-podcast' ); ?>
						</label>
						<select id="jetpack-create-ai-podcast-length" name="length">
							<?php foreach ( $length as $opt ) : ?>
								<option value="<?php echo esc_attr( $opt['id'] ); ?>"><?php echo esc_html( $opt['label'] ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<div class="jetpack-create-ai-podcast__field" hidden>
						<label for="jetpack-create-ai-podcast-voice">
							<?php echo esc_html__( 'Voice', 'jetpack-podcast' ); ?>
						</label>
						<select id="jetpack-create-ai-podcast-voice" name="voice">
							<?php foreach ( $voice as $opt ) : ?>
								<option value="<?php echo esc_attr( $opt['id'] ); ?>"><?php echo esc_html( $opt['label'] ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>

					<div class="jetpack-create-ai-podcast__field" hidden>
						<label for="jetpack-create-ai-podcast-prompt">
							<?php echo esc_html__( 'Prompt (optional)', 'jetpack-podcast' ); ?>
						</label>
						<textarea
							id="jetpack-create-ai-podcast-prompt"
							name="prompt"
							rows="3"
						></textarea>
					</div>

					<div class="jetpack-create-ai-podcast__actions">
						<button type="submit" class="button button-primary button-hero">
							<?php echo esc_html__( 'Generate', 'jetpack-podcast' ); ?>
						</button>
					</div>
				</form>

				<div class="jetpack-create-ai-podcast__status" aria-live="polite" data-region="status"></div>
			</div>
		</div>
		<?php
	}
}
