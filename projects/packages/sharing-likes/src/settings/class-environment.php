<?php
/**
 * Reads the site state that Settings > Sharing branches on.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * The facts Settings > Sharing branches on, read in one place so the sections
 * and the state resolver stay free of environment lookups.
 */
final class Environment {

	/**
	 * Memoised Site Editor URL, since resolving the template hits the theme's files.
	 *
	 * @var string|null
	 */
	private static $post_template_url = null;

	/**
	 * Whether the active theme is a block theme.
	 */
	public static function is_block_theme(): bool {
		return wp_is_block_theme();
	}

	/**
	 * Whether this is a WordPress.com Simple site.
	 */
	public static function is_simple_site(): bool {
		return ( new Host() )->is_wpcom_simple();
	}

	/**
	 * Whether sharing buttons can still produce output.
	 *
	 * Simple has no modules: `post-flair.php` loads sharedaddy unconditionally.
	 */
	public static function sharing_enabled(): bool {
		return self::is_simple_site() || ( new Modules() )->is_active( 'sharedaddy' );
	}

	/**
	 * Whether a module can be switched on here at all.
	 *
	 * `Modules::activate()` refuses on a site that is neither connected nor in
	 * offline mode, whatever the module declares, so offering the control there
	 * would do nothing.
	 */
	public static function can_activate_modules(): bool {
		if ( self::is_simple_site() ) {
			return true;
		}

		return self::connection_ready() || ( new Status() )->is_offline_mode();
	}

	/**
	 * Whether this site can have Like buttons at all.
	 *
	 * The Likes module declares `Requires Connection: Yes`, so without a
	 * WordPress.com connection it cannot be activated and its buttons cannot
	 * render: the widget is keyed on the blog ID a connection provides.
	 */
	public static function likes_supported(): bool {
		return self::is_simple_site() || self::connection_ready();
	}

	/**
	 * Whether the WordPress.com connection is usable.
	 *
	 * Resolved the same way `Jetpack::is_connection_ready()` resolves it, filter
	 * included, so a site that overrides one overrides both.
	 */
	private static function connection_ready(): bool {
		$connection = new Connection_Manager( 'jetpack' );

		/** This filter is documented in projects/plugins/jetpack/class.jetpack.php */
		return (bool) apply_filters( 'jetpack_is_connection_ready', $connection->is_connected(), $connection );
	}

	/**
	 * Whether Like buttons can still produce output.
	 *
	 * Simple has no modules: `likes_loader()` runs on every request. Elsewhere
	 * the module can be left active in the options through a disconnect, which
	 * is why support is checked too.
	 */
	public static function likes_enabled(): bool {
		if ( ! self::likes_supported() ) {
			return false;
		}

		return self::is_simple_site() || ( new Modules() )->is_active( 'likes' );
	}

	/**
	 * Whether comments can still be liked.
	 *
	 * Comment Likes is its own module, but it reads the Likes settings: both
	 * `disabled_likes` and the shared placement gate `is_likes_visible()`. So a
	 * site running it without the Likes module still needs those controls.
	 */
	public static function comment_likes_enabled(): bool {
		if ( ! self::likes_supported() ) {
			return false;
		}

		return self::is_simple_site() || ( new Modules() )->is_active( 'comment-likes' );
	}

	/**
	 * Whether anything on this site still reads the Likes settings.
	 *
	 * Both features are gated on `disabled_likes` and the shared placement, so
	 * either one keeps those controls worth showing.
	 */
	public static function likes_settings_in_use(): bool {
		return self::likes_enabled() || self::comment_likes_enabled();
	}

	/**
	 * Whether the Sharing Buttons block is available to offer as an alternative.
	 */
	public static function has_sharing_block(): bool {
		return self::block_is_registered( 'jetpack/sharing-buttons' );
	}

	/**
	 * Whether the Like block is available to offer as an alternative.
	 */
	public static function has_like_block(): bool {
		return self::block_is_registered( 'jetpack/like' );
	}

	/**
	 * Site Editor URL for the active theme's single post template.
	 *
	 * Empty when the theme has no `single` template, which callers treat as
	 * "offer no Site Editor link" rather than linking somewhere that 404s: a
	 * block theme shipping only `index.html` is the case that hits this.
	 */
	public static function post_template_url(): string {
		if ( null !== self::$post_template_url ) {
			return self::$post_template_url;
		}

		$stylesheet = get_stylesheet();
		$template   = $stylesheet ? $stylesheet . '//single' : '';

		if ( ! $template || ! get_block_template( $template ) ) {
			self::$post_template_url = '';

			return self::$post_template_url;
		}

		// `add_query_arg()` does not encode, and the Site Editor router wants `p` percent-encoded.
		self::$post_template_url = admin_url(
			'site-editor.php?p=' . rawurlencode( '/wp_template/' . $template ) . '&canvas=edit'
		);

		return self::$post_template_url;
	}

	/**
	 * Whether a block is registered, and so available to add to a template.
	 *
	 * Registration happens on `init`, well before this screen renders.
	 *
	 * @param string $name Fully qualified block name.
	 */
	private static function block_is_registered( string $name ): bool {
		return \WP_Block_Type_Registry::get_instance()->is_registered( $name );
	}
}
