<?php
/**
 * P2 Reader Chat
 *
 * Loads the reader-chat bundle on P2 frontends. Unlike the main Agents
 * Manager (which explicitly skips P2 frontends), this feature embeds a
 * self-contained AI reading buddy on P2 posts and streams so workspace
 * members can catch up on discussions, find decisions, and explore
 * context without leaving the page.
 *
 * The bundle is the same `reader-chat.min.js` deployed for public blog
 * reader chat — we just pass `agentId: 'p2-reader-chat'` and `isP2: true`
 * in the config so the agent and frontend can adapt.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class P2_Reader_Chat
 */
class P2_Reader_Chat {
	/**
	 * CDN path for reader-chat assets.
	 *
	 * @var string
	 */
	private const ASSET_BASE_PATH = 'widgets.wp.com/agents-manager/';

	/**
	 * Class instance.
	 *
	 * @var P2_Reader_Chat|null
	 */
	private static $instance = null;

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( $this, 'render_mount_div' ) );
	}

	/**
	 * Initialize singleton.
	 *
	 * @return void
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
	}

	/**
	 * Enqueue the reader-chat script and CSS on P2 frontends.
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		if ( ! self::is_p2_site() ) {
			return;
		}

		// Allow themes/plugins to opt out.
		if ( ! apply_filters( 'p2_reader_chat_enabled', true ) ) {
			return;
		}

		$asset_file = $this->get_asset_file();
		if ( ! $asset_file ) {
			return;
		}

		$version = self::is_dev_mode() ? (string) wp_rand() : $asset_file['version'];

		wp_enqueue_script(
			'p2-reader-chat',
			'https://' . self::ASSET_BASE_PATH . 'reader-chat.min.js',
			array(),
			$version,
			true
		);

		wp_enqueue_style(
			'p2-reader-chat-style',
			'https://' . self::ASSET_BASE_PATH . 'reader-chat' . ( is_rtl() ? '.rtl.css' : '.css' ),
			array(),
			$version
		);

		wp_add_inline_script(
			'p2-reader-chat',
			'window.JetpackReaderChatConfig = ' . wp_json_encode(
				$this->get_config(),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);
	}

	/**
	 * Render the mount div in the footer.
	 *
	 * Only outputs when the script was successfully enqueued.
	 *
	 * @return void
	 */
	public function render_mount_div() {
		if ( ! wp_script_is( 'p2-reader-chat' ) ) {
			return;
		}

		echo '<div id="jetpack-reader-chat"></div>';
	}

	/**
	 * Build the config object for the reader chat JS bundle.
	 *
	 * @return array
	 */
	private function get_config() {
		$config = array(
			'siteId'    => get_current_blog_id(),
			'siteUrl'   => home_url(),
			'siteName'  => get_bloginfo( 'name' ),
			'isDevMode' => self::is_dev_mode(),
			'agentId'   => 'p2-reader-chat',
			'isP2'      => true,
		);

		// Include the current post context on singular pages so the agent
		// can ground its answers in what the reader is actually viewing.
		if ( is_singular() ) {
			$post = get_post();
			if ( $post ) {
				$config['currentPost'] = array(
					'id'      => $post->ID,
					'title'   => get_the_title( $post ),
					'url'     => get_permalink( $post ),
					'excerpt' => wp_trim_words( wp_strip_all_tags( $post->post_content ), 120 ),
					'author'  => get_the_author_meta( 'display_name', $post->post_author ),
					'date'    => get_the_date( 'F j, Y', $post ),
				);

				$comment_count = (int) get_comments_number( $post );
				if ( $comment_count > 0 ) {
					$config['currentPost']['commentCount'] = $comment_count;
				}
			}
		}

		return $config;
	}

	/**
	 * Fetch the asset file for reader-chat.
	 *
	 * Cached in a transient for one hour to avoid hammering widgets.wp.com.
	 *
	 * @return array|null The decoded asset file, or null on failure.
	 */
	private function get_asset_file() {
		$cache_key  = 'p2-reader-chat-asset.json';
		$asset_file = get_transient( $cache_key );

		if ( ! $asset_file ) {
			$asset_file = self::fetch_asset_json( self::ASSET_BASE_PATH . 'reader-chat.asset.json' );
			if ( ! $asset_file ) {
				return null;
			}
			set_transient( $cache_key, $asset_file, HOUR_IN_SECONDS );
		}

		return $asset_file;
	}

	/**
	 * Fetch asset.json from filesystem (Simple) or HTTP (Atomic).
	 *
	 * @param string $filepath Path relative to ABSPATH or widgets.wp.com.
	 * @return array|null
	 */
	private static function fetch_asset_json( $filepath ) {
		if ( file_exists( ABSPATH . $filepath ) ) {
			$contents = file_get_contents( ABSPATH . $filepath );
			if ( false === $contents ) {
				return null;
			}
			return json_decode( $contents, true );
		}

		$request = wp_remote_get( 'https://' . $filepath );
		if ( is_wp_error( $request ) ) {
			return null;
		}

		if ( 200 !== wp_remote_retrieve_response_code( $request ) ) {
			return null;
		}

		$body = wp_remote_retrieve_body( $request );
		if ( '' === $body ) {
			return null;
		}

		$decoded = json_decode( $body, true );
		return JSON_ERROR_NONE === json_last_error() ? $decoded : null;
	}

	/**
	 * Detect whether the current request is on a P2 site.
	 *
	 * Mirrors the detection used by Agents_Manager to exclude P2 frontends
	 * (stylesheet starts with pub/p2 or WPForTeams site check).
	 *
	 * @return bool
	 */
	private static function is_p2_site() {
		$stylesheet = get_stylesheet();
		if ( str_contains( (string) $stylesheet, 'pub/p2' ) ) {
			return true;
		}

		if ( function_exists( '\WPForTeams\is_wpforteams_site' ) ) {
			return (bool) \WPForTeams\is_wpforteams_site( get_current_blog_id() );
		}

		return false;
	}

	/**
	 * Whether the current environment is a developer/test environment.
	 *
	 * @return bool
	 */
	private static function is_dev_mode() {
		$domain = wp_parse_url( get_site_url(), PHP_URL_HOST );
		if (
			'localhost' === $domain ||
			'.jurassic.tube' === stristr( (string) $domain, '.jurassic.tube' ) ||
			'.jurassic.ninja' === stristr( (string) $domain, '.jurassic.ninja' )
		) {
			return true;
		}

		if ( function_exists( 'wpcom_is_proxied_request' ) && wpcom_is_proxied_request() ) {
			return true;
		}

		return false;
	}
}

add_action( 'init', array( __NAMESPACE__ . '\P2_Reader_Chat', 'init' ) );
