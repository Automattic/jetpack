<?php
/**
 * Tests for the Ignored_Vulnerabilities class.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Models\Vulnerability_Model;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Ignored_Vulnerabilities class.
 */
class Ignored_Vulnerabilities_Test extends BaseTestCase {

	/**
	 * Tear down after each test.
	 */
	protected function tear_down() {
		Ignored_Vulnerabilities::delete_option();
	}

	/**
	 * Build a vulnerability.
	 *
	 * @param string|null $id    Vulnerability ID.
	 * @param string      $title Vulnerability title.
	 * @return Vulnerability_Model
	 */
	private function vuln( $id, $title = 'Title' ) {
		return new Vulnerability_Model(
			array(
				'id'    => $id,
				'title' => $title,
			)
		);
	}

	/**
	 * Build a threat for a plugin.
	 *
	 * @param array  $vulns Vulnerabilities.
	 * @param string $slug  Plugin slug.
	 * @return Threat_Model
	 */
	private function threat( array $vulns, $slug = 'akismet/akismet.php' ) {
		$extension         = new Extension_Model(
			array(
				'type'    => 'plugins',
				'slug'    => $slug,
				'name'    => 'Akismet',
				'version' => '1.0',
			)
		);
		$threat            = Threat_Model::generate_from_extension_vulnerabilities( $extension, $vulns );
		$threat->extension = $extension;
		return $threat;
	}

	public function test_ignored_threat_hides_only_while_all_its_vulnerabilities_are_ignored() {
		$v1 = $this->vuln( 'v1' );
		$v2 = $this->vuln( 'v2' );
		$v3 = $this->vuln( 'v3' );

		$this->assertTrue( Ignored_Vulnerabilities::ignore( $this->threat( array( $v1, $v2 ) ) ) );

		$this->assertTrue( Ignored_Vulnerabilities::is_ignored( 'plugins', 'akismet/akismet.php', array( $v1, $v2 ) ) );
		$this->assertFalse( Ignored_Vulnerabilities::is_ignored( 'plugins', 'akismet/akismet.php', array( $v1, $v2, $v3 ) ) );
		$this->assertFalse( Ignored_Vulnerabilities::is_ignored( 'themes', 'akismet/akismet.php', array( $v1 ) ) );
	}

	public function test_vulnerability_without_id_matches_by_title() {
		Ignored_Vulnerabilities::ignore( $this->threat( array( $this->vuln( null, 'XSS' ) ) ) );

		$this->assertTrue( Ignored_Vulnerabilities::is_ignored( 'plugins', 'akismet/akismet.php', array( $this->vuln( null, 'XSS' ) ) ) );
		$this->assertFalse( Ignored_Vulnerabilities::is_ignored( 'plugins', 'akismet/akismet.php', array( $this->vuln( null, 'SQLi' ) ) ) );
	}

	public function test_prune_drops_vulnerabilities_no_longer_reported() {
		$v1 = $this->vuln( 'v1' );
		$v2 = $this->vuln( 'v2' );
		Ignored_Vulnerabilities::ignore( $this->threat( array( $v1, $v2 ) ) );

		Ignored_Vulnerabilities::prune( 'plugins', 'akismet/akismet.php', array( $v2 ) );

		$this->assertTrue( Ignored_Vulnerabilities::is_ignored( 'plugins', 'akismet/akismet.php', array( $v2 ) ) );
		$this->assertCount( 1, Ignored_Vulnerabilities::get_all()[0]['vulnerabilities'] );

		Ignored_Vulnerabilities::prune( 'plugins', 'akismet/akismet.php', array() );
		$this->assertSame( array(), Ignored_Vulnerabilities::get_all() );
	}

	/**
	 * Data provider for deletion handlers.
	 *
	 * @return array
	 */
	public static function provide_deletion_handlers() {
		return array(
			'plugins' => array( 'plugins', 'on_plugin_deleted' ),
			'themes'  => array( 'themes', 'on_theme_deleted' ),
		);
	}

	/**
	 * Test deleting an extension drops only its own entry, and only when the deletion succeeded.
	 *
	 * @param string $type    Extension type.
	 * @param string $handler Handler method name.
	 * @dataProvider provide_deletion_handlers
	 */
	#[DataProvider( 'provide_deletion_handlers' )]
	public function test_deletion_handler_drops_only_the_deleted_extension( $type, $handler ) {
		foreach ( array( 'a', 'b' ) as $slug ) {
			$extension         = new Extension_Model(
				array(
					'type'    => $type,
					'slug'    => $slug,
					'name'    => $slug,
					'version' => '1.0',
				)
			);
			$threat            = Threat_Model::generate_from_extension_vulnerabilities( $extension, array( $this->vuln( 'v1' ) ) );
			$threat->extension = $extension;
			Ignored_Vulnerabilities::ignore( $threat );
		}

		Ignored_Vulnerabilities::$handler( 'a', false );
		$this->assertCount( 2, Ignored_Vulnerabilities::get_all() );

		Ignored_Vulnerabilities::$handler( 'a', true );
		$all = Ignored_Vulnerabilities::get_all();
		$this->assertCount( 1, $all );
		$this->assertSame( 'b', $all[0]['slug'] );
	}

	public function test_register_hooks_adds_the_deletion_handlers() {
		Ignored_Vulnerabilities::register_hooks();

		$this->assertNotFalse( has_action( 'deleted_plugin', array( Ignored_Vulnerabilities::class, 'on_plugin_deleted' ) ) );
		$this->assertNotFalse( has_action( 'deleted_theme', array( Ignored_Vulnerabilities::class, 'on_theme_deleted' ) ) );
	}

	public function test_ignoring_the_same_threat_twice_reports_success_both_times() {
		$threat = $this->threat( array( $this->vuln( 'v1' ) ) );

		$this->assertTrue( Ignored_Vulnerabilities::ignore( $threat ) );
		$this->assertTrue( Ignored_Vulnerabilities::ignore( $threat ) );
	}

	public function test_unignore_by_threat_id() {
		$threat = $this->threat( array( $this->vuln( 'v1' ) ) );
		Ignored_Vulnerabilities::ignore( $threat );

		$this->assertTrue( Ignored_Vulnerabilities::unignore( $threat->id ) );
		$this->assertSame( array(), Ignored_Vulnerabilities::get_all() );
		$this->assertFalse( Ignored_Vulnerabilities::unignore( 'plugins-nope-1.0' ) );
	}

	public function test_ignoring_again_replaces_the_entry() {
		$v1 = $this->vuln( 'v1' );
		Ignored_Vulnerabilities::ignore( $this->threat( array( $v1 ) ) );
		Ignored_Vulnerabilities::ignore( $this->threat( array( $v1, $this->vuln( 'v2' ) ) ) );

		$all = Ignored_Vulnerabilities::get_all();
		$this->assertCount( 1, $all );
		$this->assertCount( 2, $all[0]['vulnerabilities'] );
	}
}
