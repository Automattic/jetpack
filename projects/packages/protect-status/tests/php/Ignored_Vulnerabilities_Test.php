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

	public function test_prune_uninstalled_drops_removed_extensions() {
		Ignored_Vulnerabilities::ignore( $this->threat( array( $this->vuln( 'v1' ) ), 'a' ) );
		Ignored_Vulnerabilities::ignore( $this->threat( array( $this->vuln( 'v1' ) ), 'b' ) );

		Ignored_Vulnerabilities::prune_uninstalled( 'plugins', array( 'a' ) );

		$all = Ignored_Vulnerabilities::get_all();
		$this->assertCount( 1, $all );
		$this->assertSame( 'a', $all[0]['slug'] );
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
