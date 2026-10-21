<?php
/**
 * Knowledge runtime provider selection.
 *
 * @package automattic/jetpack-knowledge
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Knowledge\Knowledge_Post_Type;
use Automattic\Jetpack\Knowledge\Knowledge_Scopes_REST_Controller;

/**
 * Provides Knowledge when Gutenberg's experiment is unavailable.
 */
class Knowledge {
	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Whether this package has registered its fallback hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Schedule provider resolution after all plugin files have loaded.
	 *
	 * @since 0.1.0
	 * @return void
	 */
	public static function init() {
		add_action( 'plugins_loaded', array( __CLASS__, 'bootstrap' ), 100 );
		add_action( 'init', array( __CLASS__, 'bootstrap' ), 0 );
		add_action( 'rest_api_init', array( __CLASS__, 'bootstrap' ), -100 );

		if ( did_action( 'plugins_loaded' ) ) {
			self::bootstrap();
		}
	}

	/**
	 * Register the fallback only after giving Gutenberg the first choice.
	 *
	 * @since 0.1.0
	 * @return void
	 */
	public static function bootstrap() {
		if ( self::$initialized || ! did_action( 'plugins_loaded' ) || self::has_provider() ) {
			return;
		}

		self::$initialized = true;
		require_once __DIR__ . '/knowledge.php';

		add_action( 'init', array( Knowledge_Post_Type::class, 'register' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ), 0 );

		if ( did_action( 'init' ) || doing_action( 'rest_api_init' ) ) {
			Knowledge_Post_Type::register();
		}
	}

	/**
	 * Determine whether Gutenberg or another provider owns Knowledge.
	 *
	 * @return bool Whether a native provider is available.
	 */
	private static function has_provider() {
		return post_type_exists( 'wp_knowledge' ) || function_exists( 'wp_knowledge_types' );
	}

	/**
	 * Register storage before REST routes, including early REST initialization.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		Knowledge_Post_Type::register();
		( new Knowledge_Scopes_REST_Controller() )->register_routes();
	}
}
