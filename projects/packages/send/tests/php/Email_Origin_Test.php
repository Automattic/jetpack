<?php
/**
 * Tests for Email_Origin.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Email_Origin
 */
#[CoversClass( Email_Origin::class )]
class Email_Origin_Test extends BaseTestCase {

	const DIRS = array(
		'plugins' => array( '/srv/wp-content/plugins', '/srv/wp-content/mu-plugins' ),
		'themes'  => '/srv/wp-content/themes',
		'self'    => '/srv/wp-content/plugins/other/jetpack_vendor/automattic/jetpack-send',
	);

	/**
	 * A backtrace as Mailer sees it: Send's own frames, the filter, then wp_mail() and its callers.
	 *
	 * @param array $callers Frames outside wp_mail(), innermost first: `[ file, function ]`.
	 * @return array
	 */
	private static function frames( array $callers ) {
		$frames   = array(
			array(
				'file'     => self::DIRS['self'] . '/src/class-mailer.php',
				'function' => 'detect',
				'class'    => Email_Origin::class,
			),
			array(
				'file'     => '/srv/wp-includes/class-wp-hook.php',
				'function' => 'pre_wp_mail',
				'class'    => Mailer::class,
			),
			array(
				'file'     => '/srv/wp-includes/pluggable.php',
				'function' => 'apply_filters',
			),
		);
		$function = 'wp_mail';
		foreach ( $callers as $caller ) {
			$frames[] = array(
				'file'     => $caller[0],
				'function' => $function,
			);
			$function = $caller[1];
		}
		if ( '' !== $function ) {
			$frames[] = array( 'function' => $function );
		}
		return $frames;
	}

	/**
	 * Call stacks and the origin each should get.
	 *
	 * @return array[]
	 */
	public static function provide_stacks() {
		$wp_login = array( '/srv/wp-login.php', '' );
		return array(
			'plugin'                         => array( array( array( '/srv/wp-content/plugins/woocommerce/includes/class-wc-emails.php', 'send' ), $wp_login ), 'plugin:woocommerce' ),
			'single-file mu-plugin'          => array( array( array( '/srv/wp-content/mu-plugins/site-alerts.php', 'alert' ) ), 'plugin:site-alerts' ),
			'theme'                          => array( array( array( '/srv/wp-content/themes/twentytwenty/functions.php', 'notify' ) ), 'theme:twentytwenty' ),
			'password reset'                 => array( array( array( '/srv/wp-includes/user.php', 'retrieve_password' ), $wp_login ), 'core:password_reset' ),
			'new account'                    => array( array( array( '/srv/wp-includes/pluggable.php', 'wp_new_user_notification' ), $wp_login ), 'core:new_user' ),
			'comment notice'                 => array( array( array( '/srv/wp-includes/pluggable.php', 'wp_notify_postauthor' ), array( '/srv/wp-includes/class-wp-hook.php', '' ) ), 'core:comment' ),
			'moderation notice'              => array( array( array( '/srv/wp-includes/pluggable.php', 'wp_notify_moderator' ) ), 'core:comment' ),
			'admin email change'             => array( array( array( '/srv/wp-admin/includes/misc.php', 'update_option_new_admin_email' ) ), 'core:admin' ),
			'unknown core caller'            => array( array( array( '/srv/wp-includes/functions.php', 'something_else' ) ), 'core' ),
			'plugin beats the core function' => array( array( array( '/srv/wp-includes/user.php', 'retrieve_password' ), array( '/srv/wp-content/plugins/shop/reset.php', 'go' ) ), 'plugin:shop' ),
			"Send's own frames are skipped"  => array( array( array( self::DIRS['self'] . '/src/x.php', 'y' ), array( '/srv/wp-content/plugins/jetpack-send/jetpack-send.php', 'z' ), $wp_login ), 'core' ),
		);
	}

	/**
	 * @dataProvider provide_stacks
	 *
	 * @param array  $callers  Frames outside wp_mail().
	 * @param string $expected Origin key.
	 */
	#[DataProvider( 'provide_stacks' )]
	public function test_detect( array $callers, $expected ) {
		$this->assertSame( $expected, Email_Origin::detect( self::frames( $callers ), self::DIRS ) );
	}

	public function test_detect_without_a_wp_mail_frame_is_core() {
		$this->assertSame( 'core', Email_Origin::detect( array( array( 'function' => 'x' ) ), self::DIRS ) );
	}

	/**
	 * Keys and their labels.
	 *
	 * @return array[]
	 */
	public static function provide_labels() {
		return array(
			'password resets'  => array( 'core:password_reset', 'Password resets' ),
			'new accounts'     => array( 'core:new_user', 'New accounts' ),
			'comments'         => array( 'core:comment', 'Comment notices' ),
			'site notices'     => array( 'core:admin', 'Site notices' ),
			'core'             => array( 'core', 'WordPress' ),
			'removed plugin'   => array( 'plugin:long-gone-plugin', 'long-gone-plugin' ),
			'missing theme'    => array( 'theme:long-gone-theme', 'long-gone-theme' ),
			'unknown key kept' => array( 'mystery', 'mystery' ),
		);
	}

	/**
	 * @dataProvider provide_labels
	 *
	 * @param string $key      Origin key.
	 * @param string $expected Label.
	 */
	#[DataProvider( 'provide_labels' )]
	public function test_label( $key, $expected ) {
		$this->assertSame( $expected, Email_Origin::label( $key ) );
	}

	/**
	 * Forget the faked plugin list and update check.
	 */
	public function tear_down() {
		Email_Origin::forget();
		wp_cache_delete( 'plugins', 'plugins' );
		delete_site_transient( 'update_plugins' );
		parent::tear_down();
	}

	/**
	 * Origins, what core's update check stored, and the icon each should get.
	 *
	 * @return array[]
	 */
	public static function provide_icons() {
		$svg   = 'https://ps.w.org/shop/assets/icon.svg?rev=1';
		$both  = array(
			'1x'  => 'https://ps.w.org/shop/assets/icon-128x128.png',
			'svg' => $svg,
		);
		$entry = fn( array $icons ) => (object) array(
			'slug'  => 'shop',
			'icons' => $icons,
		);
		return array(
			'update waiting, svg preferred' => array( 'plugin:shop', array( 'response' => array( 'shop/shop.php' => $entry( $both ) ) ), $svg ),
			'up to date, high-density only' => array( 'plugin:shop', array( 'no_update' => array( 'shop/shop.php' => $entry( array( '2x' => 'https://ps.w.org/shop/assets/icon-256x256.png' ) ) ) ), 'https://ps.w.org/shop/assets/icon-256x256.png' ),
			'generated pattern'             => array( 'plugin:shop', array( 'no_update' => array( 'shop/shop.php' => $entry( array( 'default' => 'https://s.w.org/plugins/geopattern-icon/shop.svg' ) ) ) ), 'https://s.w.org/plugins/geopattern-icon/shop.svg' ),
			'single-file plugin'            => array( 'plugin:hello', array( 'no_update' => array( 'hello.php' => $entry( array( 'svg' => $svg ) ) ) ), $svg ),
			'icon hosted elsewhere'         => array( 'plugin:shop', array( 'response' => array( 'shop/shop.php' => $entry( array( 'svg' => 'https://cdn.example.com/shop.svg' ) ) ) ), null ),
			'not over https'                => array( 'plugin:shop', array( 'response' => array( 'shop/shop.php' => $entry( array( 'svg' => 'http://ps.w.org/shop/assets/icon.svg' ) ) ) ), null ),
			'not in the update check'       => array( 'plugin:shop', array( 'no_update' => array() ), null ),
			'plugin no longer installed'    => array( 'plugin:long-gone', array( 'no_update' => array( 'long-gone/long-gone.php' => $entry( array( 'svg' => $svg ) ) ) ), null ),
			'theme'                         => array( 'theme:twentytwenty', array(), null ),
			'kind of WordPress email'       => array( 'core:password_reset', array(), null ),
		);
	}

	/**
	 * @dataProvider provide_icons
	 *
	 * @param string      $key      Origin key.
	 * @param array       $updates  The `update_plugins` site transient's lists.
	 * @param string|null $expected Icon URL.
	 */
	#[DataProvider( 'provide_icons' )]
	public function test_icon_url( $key, array $updates, $expected ) {
		$plugins = array(
			'shop/shop.php' => array( 'Name' => 'Shop' ),
			'hello.php'     => array( 'Name' => 'Hello' ),
		);
		wp_cache_set( 'plugins', array( '' => $plugins ), 'plugins' );
		set_site_transient( 'update_plugins', (object) $updates );

		$this->assertSame( $expected, Email_Origin::icon_url( $key ) );
	}

	public function test_icon_url_before_the_first_update_check() {
		wp_cache_set( 'plugins', array( '' => array( 'shop/shop.php' => array( 'Name' => 'Shop' ) ) ), 'plugins' );

		$this->assertNull( Email_Origin::icon_url( 'plugin:shop' ) );
	}
}
