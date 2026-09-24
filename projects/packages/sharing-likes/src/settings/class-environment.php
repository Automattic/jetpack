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
	private static $single_template_editor_url = null;

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
	 */
	public static function sharing_module_running(): bool {
		return self::legacy_sharing_supported() && self::module_active( 'sharedaddy' );
	}

	/**
	 * Whether every sharing service has been removed, so sharedaddy renders nothing.
	 *
	 * An absent option is not that: `Sharing_Service::get_blog_services()` falls
	 * back to its default services when the option was never saved.
	 */
	public static function legacy_sharing_switched_off(): bool {
		$services = get_option( 'sharing-services' );

		if ( ! is_array( $services ) ) {
			return false;
		}

		return empty( $services['visible'] ) && empty( $services['hidden'] );
	}

	/**
	 * Whether this site can have legacy sharing buttons at all.
	 *
	 * The module needs no connection, but `Jetpack::load_modules()` includes
	 * nothing on a site that is neither connected nor in offline mode, and
	 * `Modules::activate()` refuses there too: an active module renders no
	 * buttons, and offering to turn it on would do nothing. Simple loads
	 * sharedaddy from `post-flair.php` without either.
	 */
	public static function legacy_sharing_supported(): bool {
		return self::is_simple_site() || self::is_connected() || ( new Status() )->is_offline_mode();
	}

	/**
	 * Whether this site can have Like buttons at all.
	 *
	 * The Likes module declares `Requires Connection: Yes`, so without a
	 * WordPress.com connection it cannot be activated and its buttons cannot
	 * render: the widget is keyed on the blog ID a connection provides.
	 */
	public static function likes_supported(): bool {
		return self::is_simple_site() || self::is_connected();
	}

	/**
	 * Whether the site holds a WordPress.com connection.
	 */
	private static function is_connected(): bool {
		return ( new Connection_Manager( 'jetpack' ) )->is_connected();
	}

	/**
	 * Whether Like buttons can still produce output.
	 *
	 * The module can be left active in the options through a disconnect,
	 * which is why support is checked too.
	 */
	public static function likes_module_running(): bool {
		return self::likes_supported() && self::module_active( 'likes' );
	}

	/**
	 * Whether posts show neither a Like nor a Reblog button, bar those that opted in individually.
	 *
	 * Both count because the legacy widget renders for either.
	 */
	public static function legacy_likes_switched_off(): bool {
		return ! Likes_Options::likes_enabled_sitewide() && ! Likes_Options::reblogs_enabled_sitewide();
	}

	/**
	 * Whether comments can still be liked.
	 *
	 * Comment Likes is its own module, but it reads the Likes settings: both
	 * `disabled_likes` and the shared placement gate `is_likes_visible()`. So a
	 * site running it without the Likes module still needs those controls.
	 */
	public static function comment_likes_module_running(): bool {
		return self::likes_supported() && self::module_active( 'comment-likes' );
	}

	/**
	 * Whether anything on this site still reads the Likes settings.
	 *
	 * Both features are gated on `disabled_likes` and the shared placement, so
	 * either one keeps those controls worth showing. Switching the buttons off
	 * for every post does not end that: posts still opt in one by one, and
	 * Comment Likes reads the same settings either way.
	 */
	public static function likes_settings_in_use(): bool {
		return self::likes_module_running() || self::comment_likes_module_running();
	}

	/**
	 * Whether anything on this site reads the Twitter Site Tag option.
	 *
	 * Twitter Cards read it, and through them the Sharing Buttons block's X `via`.
	 * Simple's Twitter Cards read `twitter_via` instead.
	 */
	public static function twitter_site_tag_used(): bool {
		if ( self::is_simple_site() ) {
			return false;
		}

		/** This filter is documented in projects/plugins/jetpack/class.jetpack.php */
		return ! apply_filters( 'jetpack_disable_twitter_cards', false );
	}

	/**
	 * Whether a module is active.
	 *
	 * Simple has no modules: wpcom loads both features on every request, so
	 * every module counts as active there whatever the option holds.
	 *
	 * @param string $slug Module slug.
	 */
	private static function module_active( string $slug ): bool {
		return self::is_simple_site() || ( new Modules() )->is_active( $slug );
	}

	/**
	 * Whether the Sharing Buttons block is available to offer as an alternative.
	 */
	public static function sharing_block_registered(): bool {
		return self::block_is_registered( 'jetpack/sharing-buttons' );
	}

	/**
	 * Whether the Like block is available to offer as an alternative.
	 */
	public static function like_block_registered(): bool {
		return self::block_is_registered( 'jetpack/like' );
	}

	/**
	 * Site Editor URL for the active theme's single post template.
	 *
	 * Empty when the theme has no `single` template, which callers treat as
	 * "offer no Site Editor link" rather than linking somewhere that 404s: a
	 * block theme shipping only `index.html` is the case that hits this.
	 */
	public static function single_template_editor_url(): string {
		if ( null !== self::$single_template_editor_url ) {
			return self::$single_template_editor_url;
		}

		$stylesheet = get_stylesheet();
		$template   = $stylesheet ? $stylesheet . '//single' : '';

		if ( ! $template || ! get_block_template( $template ) ) {
			self::$single_template_editor_url = '';

			return self::$single_template_editor_url;
		}

		// `add_query_arg()` does not encode, and the Site Editor router wants `p` percent-encoded.
		self::$single_template_editor_url = admin_url(
			'site-editor.php?p=' . rawurlencode( '/wp_template/' . $template ) . '&canvas=edit'
		);

		return self::$single_template_editor_url;
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
