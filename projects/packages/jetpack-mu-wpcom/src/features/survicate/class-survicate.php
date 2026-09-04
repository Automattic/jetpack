<?php
/**
 * Survicate survey integration
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Survicate
 */
class Survicate {
	/**
	 * Survicate workspace key.
	 */
	const WORKSPACE_KEY = 'e4794374cce15378101b63de24117572';

	/**
	 * Class instance.
	 *
	 * @var Survicate
	 */
	private static $instance = null;

	/**
	 * Survicate constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 100 );
	}

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Check whether Survicate should load on the current page.
	 *
	 * @return bool
	 */
	private function should_load() {
		if ( ! is_user_logged_in() ) {
			return false;
		}

		if ( ! is_admin() ) {
			return false;
		}

		// Network and user admin pages are internal tools surfaces; surveys must never reach them.
		if ( is_network_admin() || is_user_admin() ) {
			return false;
		}

		// Only load for English locale users.
		if ( strpos( strtolower( get_user_locale() ), 'en' ) !== 0 ) {
			return false;
		}

		// Atomic powers Automattic's internal P2s; surveys must never reach them.
		if ( ( new \Automattic\Jetpack\Status\Host() )->is_p2_site() ) {
			return false;
		}

		return true;
	}

	/**
	 * Detect whether the current site is a Big Sky site.
	 *
	 * Used as a visitor trait so Survicate's targeting UI can include or exclude
	 * Big Sky users without a code change.
	 *
	 * @return bool
	 */
	private function is_big_sky_site() {
		if ( ! function_exists( 'wpcom_has_blog_sticker' ) ) {
			return false;
		}

		$blog_id = get_wpcom_blog_id();
		if ( ! $blog_id ) {
			return false;
		}

		return wpcom_has_blog_sticker( 'big-sky-enabled', $blog_id )
			|| wpcom_has_blog_sticker( 'big-sky-free-trial', $blog_id );
	}

	/**
	 * Detect the current editor context.
	 *
	 * @return string One of 'site-editor', 'block-editor', or 'wp-admin'.
	 */
	private function get_editor_context() {
		global $pagenow;

		if ( $pagenow === 'site-editor.php' ) {
			return 'site-editor';
		}

		if ( function_exists( 'get_current_screen' ) ) {
			$current_screen = get_current_screen();
			if ( $current_screen && $current_screen->is_block_editor() && $current_screen->id !== 'widgets' ) {
				return 'block-editor';
			}
		}

		return 'wp-admin';
	}

	/**
	 * Get visitor traits for Survicate.
	 *
	 * @return array
	 */
	private function get_visitor_traits() {
		$user_data = get_userdata( get_current_user_id() );
		$email     = $user_data ? $user_data->user_email : '';
		$site_id   = get_wpcom_blog_id();
		$site_type = ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) ? 'atomic' : 'simple';

		return array(
			'email'           => $email,
			'site_id'         => $site_id ? (string) $site_id : '',
			'site_type'       => $site_type,
			'editor_context'  => $this->get_editor_context(),
			// Stringified for Survicate's trait targeting UI, which matches on string equality.
			'is_big_sky_site' => $this->is_big_sky_site() ? 'true' : 'false',
		);
	}

	/**
	 * Enqueue Survicate scripts.
	 */
	public function enqueue_scripts() {
		if ( ! $this->should_load() ) {
			return;
		}

		$traits_json   = wp_json_encode( $this->get_visitor_traits(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
		$workspace_key = self::WORKSPACE_KEY;

		wp_register_script(
			'wpcom-survicate',
			false,
			array( 'wp-data' ),
			'1.0',
			false
		);

		wp_add_inline_script(
			'wpcom-survicate',
			<<<JS
( function () {
	if ( window.__wpcomSurvicateInit ) {
		return;
	}
	window.__wpcomSurvicateInit = true;
	if ( window.innerWidth < 480 ) {
		return;
	}
	var script = document.createElement( 'script' );
	script.src = 'https://survey.survicate.com/workspaces/{$workspace_key}/web_surveys.js';
	script.async = true;
	document.head.appendChild( script );
	var traits = {$traits_json};

	// The Help Center registers this @wordpress/data store from a separate bundle
	// loaded from widgets.wp.com; reads are guarded in case it is not yet registered.
	function isHelpCenterShown() {
		try {
			var store = window.wp && window.wp.data && window.wp.data.select( 'automattic/help-center' );
			return !! ( store && typeof store.isHelpCenterShown === 'function' && store.isHelpCenterShown() );
		} catch ( e ) {
			return false;
		}
	}
	function closeAnySurvey() {
		if ( window._sva && typeof window._sva.closeSurvey === 'function' ) {
			window._sva.closeSurvey();
		}
	}

	// Requiring aria-modal excludes popovers/tooltips that only set role="dialog";
	// the .components-modal__screen-overlay class covers older @wordpress/components
	// Modal versions whose aria-modal attribute sat on an inner node.
	var MODAL_SELECTOR = '[role="dialog"][aria-modal="true"], dialog[open], .components-modal__screen-overlay';
	// The Survicate widget renders role="dialog"/aria-modal elements inside
	// <div id="survicate-box" class="survicate-box-...">; without this exclusion
	// every survey would suppress itself on display.
	var SURVICATE_CONTAINER_SELECTOR = '#survicate-box, [class*="survicate-box"]';
	function isElementRendered( el ) {
		if ( typeof el.checkVisibility === 'function' ) {
			return el.checkVisibility();
		}
		return el.getClientRects().length > 0;
	}
	function isModalOpen() {
		try {
			var candidates = document.querySelectorAll( MODAL_SELECTOR );
			for ( var i = 0; i < candidates.length; i++ ) {
				if ( candidates[ i ].closest( SURVICATE_CONTAINER_SELECTOR ) ) {
					continue;
				}
				if ( ! isElementRendered( candidates[ i ] ) ) {
					continue;
				}
				return true;
			}
		} catch ( e ) {
			return false;
		}
		return false;
	}
	function nodeContainsModal( node ) {
		if ( ! node || node.nodeType !== 1 ) {
			return false;
		}
		if ( node.closest( SURVICATE_CONTAINER_SELECTOR ) ) {
			return false;
		}
		if ( node.matches( MODAL_SELECTOR ) ) {
			return true;
		}
		var inner = node.querySelectorAll( MODAL_SELECTOR );
		for ( var i = 0; i < inner.length; i++ ) {
			if ( ! inner[ i ].closest( SURVICATE_CONTAINER_SELECTOR ) ) {
				return true;
			}
		}
		return false;
	}

	if ( window.wp && window.wp.data && typeof window.wp.data.subscribe === 'function' ) {
		var wasShown = isHelpCenterShown();
		// Scope the subscription to the Help Center store so the callback does not
		// fire on every dispatch across all registered stores (e.g. block editor).
		window.wp.data.subscribe( function () {
			var shown = isHelpCenterShown();
			if ( shown && ! wasShown ) {
				closeAnySurvey();
			}
			wasShown = shown;
		}, 'automattic/help-center' );
	}

	window.addEventListener( 'SurvicateReady', function () {
		window._sva.setVisitorTraits( traits );

		// Covers the race where the Help Center or a modal opened before the SDK finished loading.
		if ( isHelpCenterShown() || isModalOpen() ) {
			closeAnySurvey();
		}

		if ( typeof window._sva.addEventListener === 'function' ) {
			// The SDK does not expose a pre-display hook, so we close on the
			// post-display event. This causes a brief flash but is the best the
			// public API allows.
			window._sva.addEventListener( 'survey_displayed', function () {
				if ( isHelpCenterShown() || isModalOpen() ) {
					closeAnySurvey();
				}
			} );
		}

		if ( typeof MutationObserver === 'function' && document.body ) {
			// Close a survey already on screen when a modal opens on top of it.
			// Only added nodes are inspected, so the observer is cheap on
			// ordinary DOM churn; closeAnySurvey() is a no-op without a survey.
			new MutationObserver( function ( mutations ) {
				for ( var m = 0; m < mutations.length; m++ ) {
					var added = mutations[ m ].addedNodes;
					for ( var n = 0; n < added.length; n++ ) {
						if ( nodeContainsModal( added[ n ] ) ) {
							closeAnySurvey();
							return;
						}
					}
				}
			} ).observe( document.body, { childList: true, subtree: true } );
		}
	} );
} )();
JS
		);

		wp_enqueue_script( 'wpcom-survicate' );
	}
}

add_action( 'init', array( __NAMESPACE__ . '\Survicate', 'init' ) );
