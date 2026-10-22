<?php
/**
 * Tests for installing WordPress.com themes from core's Add Themes screen.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class WpcomThemesInstallTest.
 */
class WpcomThemesInstallTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const SLUG = 'wpcomsh-test-partner';

	/**
	 * What WordPress.com's reinstall does: 'delivers' the partner theme, 'nothing', 'errors', or 'fails'.
	 *
	 * @var string
	 */
	private $reinstall = 'nothing';

	/**
	 * How many times the reinstall was asked for.
	 *
	 * @var int
	 */
	private $reinstalls = 0;

	/**
	 * Connects the current user and answers WordPress.com's endpoints locally.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		update_option( 'jetpack_options', array( 'id' => 1234 ) );
		update_option( 'jetpack_private_options', array( 'user_tokens' => array( $user_id => "key.secret.$user_id" ) ) );
		add_filter( 'pre_http_request', array( $this, 'respond' ), 10, 3 );
	}

	/**
	 * Removes anything a test installed.
	 */
	public function tear_down() {
		$installed = get_theme_root() . '/' . self::SLUG;
		if ( file_exists( "$installed/style.css" ) ) {
			unlink( "$installed/style.css" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			rmdir( $installed ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		}

		delete_option( 'jetpack_options' );
		delete_option( 'jetpack_private_options' );
		parent::tear_down();
	}

	/**
	 * Stands in for the themes API and the marketplace reinstall.
	 *
	 * @param false|array $response Short-circuit response.
	 * @param array       $args     Request arguments.
	 * @param string      $url      Request URL.
	 * @return array|WP_Error
	 */
	public function respond( $response, $args, $url ) {
		$body = '{}';
		$code = 200;

		if ( false !== strpos( $url, '/sites/1234/marketplace/products/reinstall' ) ) {
			++$this->reinstalls;
			if ( 'fails' === $this->reinstall ) {
				return new WP_Error( 'http_request_failed', 'Timed out.' );
			}
			if ( 'errors' === $this->reinstall ) {
				$code = 500;
			}
			if ( 'delivers' === $this->reinstall ) {
				$this->put_partner_theme();
			}
		} elseif ( preg_match( '#/rest/v1\.2/themes/([^?]+)#', $url, $matches ) ) {
			$tier = self::SLUG === $matches[1] ? 'partner' : 'premium';
			$body = wp_json_encode( array( 'body' => $this->theme( $matches[1], $tier ) ), JSON_UNESCAPED_SLASHES );
		}

		return array(
			'headers'  => array(),
			'body'     => $body,
			'response' => array( 'code' => $code ),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Puts the partner theme on the site, as WordPress.com's install does.
	 */
	private function put_partner_theme() {
		wp_mkdir_p( get_theme_root() . '/' . self::SLUG );
		file_put_contents( get_theme_root() . '/' . self::SLUG . '/style.css', '/* Theme Name: Partner */' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
	}

	/**
	 * A theme as the WordPress.com themes API returns it.
	 *
	 * @param string $slug Theme slug.
	 * @param string $tier Tier slug.
	 * @return array
	 */
	private function theme( $slug, $tier ) {
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
			'theme_tier'  => array( 'slug' => $tier ),
			'taxonomies'  => array(),
		);
	}

	/**
	 * Runs core's install of a theme through the filter.
	 *
	 * @param string $slug Theme slug.
	 * @return Theme_Upgrader The upgrader the filter reported to.
	 */
	private function install( $slug ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		$upgrader = new Theme_Upgrader( new Automatic_Upgrader_Skin() );
		wpcomsh_theme_install_by_symlink( false, $slug, $upgrader );

		return $upgrader;
	}

	/**
	 * A theme nothing can install fails, rather than reporting an install that never happened.
	 */
	public function test_theme_nothing_can_install_is_reported_as_failure() {
		// Without WP Cloud's theme folders wpcomsh logs their absence, which would print here.
		$error_log = ini_set( 'error_log', '/dev/null' ); // phpcs:ignore WordPress.PHP.IniSet.Risky
		$upgrader  = $this->install( 'wpcomsh-test-unhosted' );
		ini_set( 'error_log', (string) $error_log ); // phpcs:ignore WordPress.PHP.IniSet.Risky

		$this->assertWPError( $upgrader->result );
		$this->assertSame( 'wpcom_theme_not_installable', $upgrader->result->get_error_code() );
	}

	/**
	 * A partner theme is reinstalled by WordPress.com unless already there, and installed only if it arrives.
	 *
	 * @dataProvider provide_partner_installs
	 *
	 * @param bool        $installed  Whether the theme is already on the site.
	 * @param string      $reinstall  What WordPress.com's reinstall does.
	 * @param int         $reinstalls How many reinstalls should be asked for.
	 * @param string|null $error      The error expected, null for an install.
	 */
	#[DataProvider( 'provide_partner_installs' )]
	public function test_partner_theme_install( $installed, $reinstall, $reinstalls, $error ) {
		if ( $installed ) {
			$this->put_partner_theme();
		}
		$this->reinstall = $reinstall;

		$upgrader = $this->install( self::SLUG );

		$this->assertSame( $reinstalls, $this->reinstalls );
		$this->assertSame( $error, is_wp_error( $upgrader->result ) ? $upgrader->result->get_error_code() : null );
	}

	/**
	 * Whether the theme is there already, and what the reinstall does.
	 *
	 * @return array
	 */
	public static function provide_partner_installs() {
		return array(
			'delivered'         => array( false, 'delivers', 1, null ),
			'not owned'         => array( false, 'nothing', 1, 'wpcom_theme_not_purchased' ),
			'reinstall errors'  => array( false, 'errors', 1, 'wpcom_theme_install_failed' ),
			'request fails'     => array( false, 'fails', 1, 'http_request_failed' ),
			'already installed' => array( true, 'nothing', 0, null ),
		);
	}
}
