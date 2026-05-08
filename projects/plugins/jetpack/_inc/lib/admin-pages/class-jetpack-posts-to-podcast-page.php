<?php
/**
 * Jetpack Posts to Podcast admin page.
 *
 * Registers the "Posts to Podcast" submenu under Jetpack and renders a
 * three-control form. The bundled JS calls public-api.wordpress.com directly
 * via wpcom-proxy-request, polls the wpcom job, and navigates to the editUrl
 * that wpcom returns when the draft post is ready.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_Posts_To_Podcast_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-posts-to-podcast-helper.php';
}

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Class Jetpack_Posts_To_Podcast_Page
 */
class Jetpack_Posts_To_Podcast_Page extends Jetpack_Admin_Page {

	/**
	 * Hide the submenu when Jetpack is not connected.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Register the submenu under the Jetpack top-level menu.
	 *
	 * @return string|false Hook returned by Admin_Menu::add_menu().
	 */
	public function get_page_hook() {
		if ( ! Jetpack_Posts_To_Podcast_Helper::is_enabled() ) {
			return false;
		}

		return Admin_Menu::add_menu(
			__( 'Posts to Podcast', 'jetpack' ),
			__( 'Posts to Podcast', 'jetpack' ),
			'edit_posts',
			'jetpack-posts-to-podcast',
			array( $this, 'render' ),
			6
		);
	}

	/**
	 * Attach page-specific actions.
	 *
	 * @param string $hook The page hook returned by get_page_hook().
	 */
	public function add_page_actions( $hook ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Nothing extra needed beyond the common hooks in Jetpack_Admin_Page::add_actions().
	}

	/**
	 * Enqueue the bundled JS and seed the bootstrap object that drives it.
	 */
	public function page_admin_scripts() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $blog_id < 1 ) {
			return;
		}

		$script_path    = JETPACK__PLUGIN_DIR . '_inc/build/posts-to-podcast.asset.php';
		$script_deps    = array( 'wp-polyfill' );
		$script_version = JETPACK__VERSION;
		if ( file_exists( $script_path ) ) {
			$asset_manifest = include $script_path;
			$script_deps    = $asset_manifest['dependencies'];
			$script_version = $asset_manifest['version'];
		}

		wp_enqueue_script(
			'jetpack-posts-to-podcast',
			plugins_url( '_inc/build/posts-to-podcast.js', JETPACK__PLUGIN_FILE ),
			$script_deps,
			$script_version,
			true
		);

		wp_set_script_translations( 'jetpack-posts-to-podcast', 'jetpack' );

		$bootstrap = array(
			'blogId'        => $blog_id,
			'voicePresets'  => Jetpack_Posts_To_Podcast_Helper::get_voice_presets(),
			'lengthPresets' => Jetpack_Posts_To_Podcast_Helper::get_length_presets(),
			'windowPresets' => Jetpack_Posts_To_Podcast_Helper::get_window_presets(),
			'pollFastMs'    => 3000,
			'pollSlowMs'    => 10000,
			'pollSwitchMs'  => 30000,
			'pollTimeoutMs' => 5 * 60 * 1000,
			'editPostUrl'   => admin_url( 'post.php' ),
			'i18n'          => array(
				'generate'          => __( 'Generate', 'jetpack' ),
				'generating'        => __( 'Generating…', 'jetpack' ),
				'queueFailed'       => __( 'Failed to queue the generation. Please try again.', 'jetpack' ),
				'pollFailed'        => __( 'Failed to read job status. Please try again.', 'jetpack' ),
				/* translators: %s: error message returned by the generation pipeline. */
				'jobFailed'         => __( 'Generation failed: %s', 'jetpack' ),
				'draftCreated'      => __( 'Draft created. Opening the editor…', 'jetpack' ),
				'draftCreateFailed' => __( 'Generation completed but the draft post could not be opened.', 'jetpack' ),
				'pendingStatus'     => __( 'Pending — your job is queued. This usually takes 30–90 seconds.', 'jetpack' ),
			),
		);

		wp_add_inline_script(
			'jetpack-posts-to-podcast',
			'window.jetpackPostsToPodcast = ' . wp_json_encode( $bootstrap, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);
	}

	/**
	 * Render the form into the page body. wrap_ui() in the parent class supplies
	 * the Jetpack masthead/footer; we only render the page-specific markup here.
	 */
	public function page_render() {
		$presets = Jetpack_Posts_To_Podcast_Helper::get_window_presets();
		$lengths = Jetpack_Posts_To_Podcast_Helper::get_length_presets();
		$voices  = Jetpack_Posts_To_Podcast_Helper::get_voice_presets();
		?>
		<div id="jetpack-posts-to-podcast-app" class="jp-p2p-app" style="max-width:680px;padding:24px;">
			<h1><?php esc_html_e( 'Posts to Podcast', 'jetpack' ); ?></h1>
			<p>
				<?php esc_html_e( 'Generate a podcast-style episode script from your site\'s recent activity. Pick a window, a length, and a voice preset; the result is saved as a draft post you can edit, record, and publish through the existing Podcast block.', 'jetpack' ); ?>
			</p>
			<form id="jp-p2p-form" onsubmit="return false;">
				<p>
					<label for="jp-p2p-window"><strong><?php esc_html_e( 'Window', 'jetpack' ); ?></strong></label><br />
					<select id="jp-p2p-window" name="window">
						<?php foreach ( $presets as $preset ) : ?>
							<option value="<?php echo esc_attr( $preset['id'] ); ?>"><?php echo esc_html( $preset['label'] ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
				<p>
					<label for="jp-p2p-length"><strong><?php esc_html_e( 'Length', 'jetpack' ); ?></strong></label><br />
					<select id="jp-p2p-length" name="length">
						<?php foreach ( $lengths as $length ) : ?>
							<option value="<?php echo esc_attr( $length['id'] ); ?>" <?php selected( 'medium', $length['id'] ); ?>><?php echo esc_html( $length['label'] ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
				<p>
					<label for="jp-p2p-voice"><strong><?php esc_html_e( 'Voice preset', 'jetpack' ); ?></strong></label><br />
					<select id="jp-p2p-voice" name="voicePreset">
						<?php foreach ( $voices as $voice ) : ?>
							<option value="<?php echo esc_attr( $voice['id'] ); ?>"><?php echo esc_html( $voice['label'] ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
				<p>
					<button id="jp-p2p-generate" type="submit" class="button button-primary"><?php esc_html_e( 'Generate', 'jetpack' ); ?></button>
				</p>
			</form>
			<div id="jp-p2p-status" role="status" aria-live="polite" style="margin-top:16px;"></div>
		</div>
		<?php
	}
}
