<?php
/**
 * Jetpack Posts to Podcast admin page.
 *
 * Registers the "Posts to Podcast" submenu under Jetpack and renders a
 * three-control form that POSTs to the local proxy endpoint, polls until the
 * upstream wpcom job completes, and writes the resulting markdown script as a
 * draft post via wp.apiFetch.
 *
 * Phase A: vanilla HTML form + inline script using wp.apiFetch — no build step.
 * Phase B can move this to a built React app under _inc/client/ if/when the
 * UX needs more than three controls.
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
	 * Enqueue scripts for the admin page. Phase A relies on wp.apiFetch which is
	 * registered globally; we add a small inline initialiser bound to the page's
	 * #jetpack-posts-to-podcast-app container.
	 */
	public function page_admin_scripts() {
		wp_enqueue_script( 'wp-api-fetch' );
		wp_enqueue_script( 'wp-i18n' );

		$bootstrap = array(
			'apiPath'        => '/wpcom/v2/posts-to-podcast',
			'jobsPath'       => '/wpcom/v2/posts-to-podcast/jobs/',
			'voicePresets'   => Jetpack_Posts_To_Podcast_Helper::get_voice_presets(),
			'lengthPresets'  => Jetpack_Posts_To_Podcast_Helper::get_length_presets(),
			'windowPresets'  => Jetpack_Posts_To_Podcast_Helper::get_window_presets(),
			'pollFastMs'     => 3000,
			'pollSlowMs'     => 10000,
			'pollSwitchMs'   => 30000,
			'pollTimeoutMs'  => 5 * 60 * 1000,
			'newPostBaseUrl' => admin_url( 'post-new.php' ),
			'editPostUrl'    => admin_url( 'post.php' ),
			'i18n'           => array(
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
			'wp-api-fetch',
			'window.jetpackPostsToPodcast = ' . wp_json_encode( $bootstrap, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'after'
		);

		wp_add_inline_script( 'wp-api-fetch', $this->get_inline_app_script(), 'after' );
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

	/**
	 * Inline JS that drives the form: builds the request body, POSTs to the local
	 * proxy, polls until terminal state, and writes a draft post on success.
	 *
	 * Kept as a heredoc so Phase A doesn't need a build pipeline. Phase B can
	 * move this into a real React app and an asset manifest.
	 *
	 * @return string
	 */
	private function get_inline_app_script() {
		// phpcs:disable Squiz.Strings.DoubleQuoteUsage.NotRequired -- heredoc is intentional.
		return <<<'JS'
( function () {
	if ( ! window.wp || ! window.wp.apiFetch ) {
		return;
	}
	if ( ! window.jetpackPostsToPodcast ) {
		return;
	}

	var settings = window.jetpackPostsToPodcast;
	var apiFetch = window.wp.apiFetch;

	function $( id ) { return document.getElementById( id ); }

	function buildWindow() {
		var presetId = $( 'jp-p2p-window' ).value;
		var preset = ( settings.windowPresets || [] ).find( function ( p ) { return p.id === presetId; } );
		if ( ! preset ) {
			return null;
		}
		return { unit: preset.unit, n: preset.n };
	}

	function setStatus( html ) {
		$( 'jp-p2p-status' ).innerHTML = html;
	}

	function setBusy( busy ) {
		var btn = $( 'jp-p2p-generate' );
		btn.disabled = !! busy;
		btn.textContent = busy ? settings.i18n.generating : settings.i18n.generate;
		[ 'jp-p2p-window', 'jp-p2p-length', 'jp-p2p-voice' ].forEach( function ( id ) {
			$( id ).disabled = !! busy;
		} );
	}

	function pollJob( jobId, startedAt ) {
		var elapsed = Date.now() - startedAt;
		if ( elapsed > settings.pollTimeoutMs ) {
			setStatus( '<p>' + settings.i18n.pollFailed + '</p>' );
			setBusy( false );
			return;
		}
		var nextDelay = elapsed < settings.pollSwitchMs ? settings.pollFastMs : settings.pollSlowMs;
		apiFetch( { path: settings.jobsPath + encodeURIComponent( jobId ) } )
			.then( function ( record ) {
				if ( record.status === 'pending' || record.status === 'unknown' ) {
					setStatus( '<p>' + settings.i18n.pendingStatus + '</p>' );
					setTimeout( function () { pollJob( jobId, startedAt ); }, nextDelay );
					return;
				}
				if ( record.status === 'failed' ) {
					var msg = record.message || record.errorMessage || record.errorCode || 'unknown';
					setStatus( '<p>' + settings.i18n.jobFailed.replace( '%s', msg ) + '</p>' );
					setBusy( false );
					return;
				}
				if ( record.status === 'complete' ) {
					if ( record.editUrl ) {
						setStatus( '<p>' + settings.i18n.draftCreated + '</p>' );
						window.location.href = record.editUrl;
						return;
					}
					if ( record.postId ) {
						setStatus( '<p>' + settings.i18n.draftCreated + '</p>' );
						window.location.href = settings.editPostUrl + '?action=edit&post=' + encodeURIComponent( record.postId );
						return;
					}
					setStatus( '<p>' + settings.i18n.draftCreateFailed + '</p>' );
					setBusy( false );
					return;
				}
				setStatus( '<p>' + settings.i18n.pollFailed + '</p>' );
				setBusy( false );
			} )
			.catch( function () {
				setStatus( '<p>' + settings.i18n.pollFailed + '</p>' );
				setBusy( false );
			} );
	}

	function onGenerate() {
		setBusy( true );
		setStatus( '' );
		var win = buildWindow();
		if ( ! win ) {
			setStatus( '<p>' + settings.i18n.queueFailed + '</p>' );
			setBusy( false );
			return;
		}
		var body = {
			window:      win,
			length:      $( 'jp-p2p-length' ).value,
			voicePreset: $( 'jp-p2p-voice' ).value,
		};
		apiFetch( { path: settings.apiPath, method: 'POST', data: body } )
			.then( function ( resp ) {
				if ( ! resp || ! resp.jobId ) {
					setStatus( '<p>' + settings.i18n.queueFailed + '</p>' );
					setBusy( false );
					return;
				}
				setStatus( '<p>' + settings.i18n.pendingStatus + '</p>' );
				pollJob( resp.jobId, Date.now() );
			} )
			.catch( function () {
				setStatus( '<p>' + settings.i18n.queueFailed + '</p>' );
				setBusy( false );
			} );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		var btn = document.getElementById( 'jp-p2p-generate' );
		if ( btn ) {
			btn.addEventListener( 'click', onGenerate );
		}
	} );
} )();
JS;
		// phpcs:enable
	}
}
