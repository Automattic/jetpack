<?php
/**
 * Reads the site state that Settings > Sharing branches on.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * The facts Settings > Sharing branches on, read in one place so the sections
 * and the state resolver stay free of environment lookups.
 */
final class Environment {

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

		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}

		return \Jetpack::is_connection_ready() || ( new Status() )->is_offline_mode();
	}

	/**
	 * Whether this site can have Like buttons at all.
	 *
	 * The Likes module declares `Requires Connection: Yes`, so without a
	 * WordPress.com connection it cannot be activated and its buttons cannot
	 * render: the widget is keyed on the blog ID a connection provides.
	 */
	public static function likes_supported(): bool {
		if ( self::is_simple_site() ) {
			return true;
		}

		return class_exists( 'Jetpack' ) && \Jetpack::is_connection_ready();
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
	 * Whether the Sharing Buttons block is available to offer as an alternative.
	 */
	public static function has_sharing_block(): bool {
		return self::block_is_available( 'sharing-buttons' );
	}

	/**
	 * Whether the Like block is available to offer as an alternative.
	 */
	public static function has_like_block(): bool {
		return self::block_is_available( 'like' );
	}

	/**
	 * Site Editor URL for the active theme's single post template.
	 *
	 * Empty when the stylesheet cannot be resolved, which callers treat as
	 * "offer no Site Editor link" rather than linking nowhere.
	 */
	public static function post_template_url(): string {
		$stylesheet = get_stylesheet();
		if ( ! $stylesheet ) {
			return '';
		}

		return add_query_arg(
			array(
				'p'      => '/wp_template/' . $stylesheet . '//single',
				'canvas' => 'edit',
			),
			admin_url( 'site-editor.php' )
		);
	}

	/**
	 * Whether a block extension is registered and available.
	 *
	 * @param string $slug Block slug as it appears in the extension availability list.
	 */
	private static function block_is_available( string $slug ): bool {
		$availability = Jetpack_Gutenberg::get_cached_availability();

		return isset( $availability[ $slug ] ) && ! empty( $availability[ $slug ]['available'] );
	}
}
