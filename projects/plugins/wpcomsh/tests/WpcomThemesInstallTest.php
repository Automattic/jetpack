<?php
/**
 * Tests for installing WordPress.com themes from core's Add Themes screen.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomThemesInstallTest.
 */
class WpcomThemesInstallTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const SLUG = 'wpcomsh-test-partner';

	const DOWNLOAD_LINK = 'https://example.com/wpcomsh-test-partner.zip';

	/**
	 * Whether WordPress.com offers the theme as a download for this site.
	 *
	 * @var bool
	 */
	private $offers_download = false;

	/**
	 * Connects the site and answers WordPress.com's endpoints locally.
	 */
	public function set_up() {
		parent::set_up();

		update_option( 'jetpack_options', array( 'id' => 1234 ) );
		update_option( 'jetpack_private_options', array( 'blog_token' => 'blog.secret' ) );
		add_filter( 'pre_http_request', array( $this, 'respond' ), 10, 3 );
	}

	/**
	 * Disconnects the site.
	 */
	public function tear_down() {
		delete_option( 'jetpack_options' );
		delete_option( 'jetpack_private_options' );
		parent::tear_down();
	}

	/**
	 * Stands in for the themes API, the marketplace theme updates, and the theme download.
	 *
	 * @param false|array $response Short-circuit response.
	 * @param array       $args     Request arguments.
	 * @param string      $url      Request URL.
	 * @return array
	 */
	public function respond( $response, $args, $url ) {
		$body = '{}';

		if ( self::DOWNLOAD_LINK === $url ) {
			file_put_contents( $args['filename'], 'zip' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		} elseif ( false !== strpos( $url, '/marketplace/themes/updates' ) ) {
			$updates = $this->offers_download ? array(
				array(
					'slug'          => self::SLUG,
					'download_link' => self::DOWNLOAD_LINK,
				),
			) : array();
			$body    = wp_json_encode( array( 'updates' => $updates ), JSON_UNESCAPED_SLASHES );
		} elseif ( preg_match( '#/rest/v1\.2/themes/([^?]+)#', $url, $matches ) ) {
			$body = wp_json_encode( array( 'body' => $this->theme( $matches[1] ) ), JSON_UNESCAPED_SLASHES );
		}

		return array(
			'headers'  => array(),
			'body'     => $body,
			'response' => array( 'code' => 200 ),
			'cookies'  => array(),
			'filename' => $args['filename'] ?? null,
		);
	}

	/**
	 * A partner theme as the WordPress.com themes API returns it.
	 *
	 * @param string $slug Theme slug.
	 * @return array
	 */
	private function theme( $slug ) {
		return array(
			'id'          => $slug,
			'name'        => $slug,
			'demo_uri'    => 'https://example.com',
			'author'      => 'Automattic',
			'screenshot'  => '',
			'description' => '',
			'block_theme' => true,
			'version'     => '1.0.0',
			'date_added'  => '',
			'theme_tier'  => array( 'slug' => 'partner' ),
			'taxonomies'  => array(),
		);
	}

	/**
	 * Asks the install filters for a theme's package, as core does before downloading it.
	 *
	 * @param string $slug Theme slug.
	 * @return mixed The filters' reply.
	 */
	private function install( $slug ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		$upgrader = new Theme_Upgrader( new Automatic_Upgrader_Skin() );

		// Without WP Cloud's theme folders wpcomsh logs their absence, which would print here.
		$error_log = ini_set( 'error_log', '/dev/null' ); // phpcs:ignore WordPress.PHP.IniSet.Risky
		$reply     = apply_filters( 'upgrader_pre_download', false, $slug, $upgrader, array() );
		ini_set( 'error_log', (string) $error_log ); // phpcs:ignore WordPress.PHP.IniSet.Risky

		return $reply;
	}

	/**
	 * A theme nothing can install fails, rather than reporting an install that never happened.
	 */
	public function test_theme_nothing_can_install_is_reported_as_failure() {
		$reply = $this->install( self::SLUG );

		$this->assertWPError( $reply );
		$this->assertSame( 'wpcom_theme_not_installable', $reply->get_error_code() );
	}

	/**
	 * A theme WP Cloud doesn't host is handed to core as its download, for core to unpack and install.
	 */
	public function test_theme_offered_as_download_is_downloaded() {
		$this->offers_download = true;

		$reply = $this->install( self::SLUG );

		$this->assertIsString( $reply );
		$this->assertStringEqualsFile( $reply, 'zip' );
		unlink( $reply ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}
}
