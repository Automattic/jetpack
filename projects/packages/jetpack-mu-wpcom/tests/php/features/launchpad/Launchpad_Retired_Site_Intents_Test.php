<?php
/**
 * Test class for wpcom_launchpad_clear_retired_site_intents.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad-navigator.php';

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Test class for wpcom_launchpad_clear_retired_site_intents.
 */
class Launchpad_Retired_Site_Intents_Test extends \WorDBless\BaseTestCase {
	/**
	 * The `home_url` filter a test installed, if any.
	 *
	 * @var callable|null
	 */
	private $home_url_filter;

	/**
	 * Undo only what this test hooked, even when it fails partway. Other callbacks
	 * on these hooks belong to the rest of the suite.
	 */
	public function tear_down() {
		if ( null !== $this->home_url_filter ) {
			remove_filter( 'home_url', $this->home_url_filter );
			$this->home_url_filter = null;
		}
		remove_action( 'rest_api_switched_to_blog', 'wpcom_launchpad_clear_retired_site_intents' );

		parent::tear_down();
	}

	/**
	 * Pretends the request is being served from the REST API host.
	 */
	private function serve_from_rest_api_host() {
		$this->home_url_filter = function () {
			return 'https://public-api.wordpress.com';
		};
		add_filter( 'home_url', $this->home_url_filter );
	}

	/**
	 * A site left on a retired flow has its intent cleared and its Launchpad turned off.
	 */
	public function test_retired_intent_is_cleared() {
		update_option( 'site_intent', 'start-writing' );
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents();

		$this->assertSame( '', get_option( 'site_intent' ) );
		$this->assertSame( 'off', get_option( 'launchpad_screen' ) );
	}

	/**
	 * The intent is its own guard, so a later run leaves the site alone.
	 */
	public function test_clearing_is_idempotent() {
		update_option( 'site_intent', 'start-writing' );
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents();

		$this->assertSame( '', get_option( 'site_intent' ) );
		$this->assertSame( 'off', get_option( 'launchpad_screen' ) );

		// No intent matches now, so a second pass must not write, even to a site
		// that turned its Launchpad back on in the meantime.
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents();

		$this->assertSame( '', get_option( 'site_intent' ) );
		$this->assertSame( 'full', get_option( 'launchpad_screen' ) );
	}

	/**
	 * A live site intent is never disturbed.
	 *
	 * @param string $site_intent A site intent that is still in use.
	 * @dataProvider provide_live_site_intents
	 */
	#[DataProvider( 'provide_live_site_intents' )]
	public function test_live_site_intents_are_untouched( $site_intent ) {
		update_option( 'site_intent', $site_intent );
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents();

		$this->assertSame( $site_intent, get_option( 'site_intent' ) );
		$this->assertSame( 'full', get_option( 'launchpad_screen' ) );
	}

	/**
	 * Site intents that must survive the cleanup.
	 *
	 * @return array
	 */
	public static function provide_live_site_intents() {
		return array(
			'design-first' => array( 'design-first' ),
			'write'        => array( 'write' ),
			'build'        => array( 'build' ),
			'sell'         => array( 'sell' ),
			'newsletter'   => array( 'newsletter' ),
			'videopress'   => array( 'videopress' ),
		);
	}

	/**
	 * A site with no intent is left alone, and gains no Launchpad option.
	 */
	public function test_site_without_an_intent_is_untouched() {
		delete_option( 'site_intent' );
		delete_option( 'launchpad_screen' );

		wpcom_launchpad_clear_retired_site_intents();

		$this->assertFalse( get_option( 'site_intent' ) );
		$this->assertFalse( get_option( 'launchpad_screen' ) );
	}

	/**
	 * The cleanup runs before the checklists register their task listeners, so no
	 * listener is ever set up for an intent that is about to be cleared.
	 */
	public function test_cleanup_is_dispatched_before_checklist_registration() {
		$cleanup      = has_action( 'init', 'wpcom_launchpad_clear_retired_site_intents_on_correct_action' );
		$registration = has_action( 'init', 'wpcom_register_default_launchpad_checklists' );

		$this->assertNotFalse( $cleanup );
		$this->assertNotFalse( $registration );
		$this->assertLessThan( $registration, $cleanup, 'cleanup must run before checklist registration' );
	}

	/**
	 * Off the REST API host, the cleanup runs straight away.
	 */
	public function test_cleanup_runs_immediately_off_the_rest_api_host() {
		update_option( 'site_intent', 'start-writing' );

		wpcom_launchpad_clear_retired_site_intents_on_correct_action();

		$this->assertSame( '', get_option( 'site_intent' ) );
		$this->assertFalse( has_action( 'rest_api_switched_to_blog', 'wpcom_launchpad_clear_retired_site_intents' ) );
	}

	/**
	 * On the REST API host the cleanup writes nothing when init runs, and waits for
	 * the blog switch instead.
	 *
	 * The suite is single site, so `switch_to_blog()` does not exist here. A switch
	 * is stood in for by changing the options between the two moments: whatever is
	 * readable when the action fires stands for the target site, and whatever was
	 * readable at init stands for the site the request started on.
	 */
	public function test_cleanup_writes_nothing_before_the_blog_switch() {
		$this->serve_from_rest_api_host();
		update_option( 'site_intent', 'start-writing' );
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents_on_correct_action();

		$this->assertSame( 'start-writing', get_option( 'site_intent' ) );
		$this->assertSame( 'full', get_option( 'launchpad_screen' ) );
		$this->assertNotFalse( has_action( 'rest_api_switched_to_blog', 'wpcom_launchpad_clear_retired_site_intents' ) );
	}

	/**
	 * The options the cleanup acts on are the ones readable when the blog switch
	 * fires, not the ones readable at init.
	 */
	public function test_cleanup_reads_the_options_of_the_switched_to_blog() {
		$this->serve_from_rest_api_host();
		update_option( 'site_intent', 'design-first' );
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents_on_correct_action();

		// Stand in for switching to a blog that is on the retired flow.
		update_option( 'site_intent', 'start-writing' );

		do_action( 'rest_api_switched_to_blog' );

		$this->assertSame( '', get_option( 'site_intent' ) );
		$this->assertSame( 'off', get_option( 'launchpad_screen' ) );
	}

	/**
	 * A retired intent seen at init does not get cleared on whatever blog the
	 * request has switched to. This is the regression the dispatcher prevents.
	 */
	public function test_cleanup_ignores_the_intent_seen_before_the_blog_switch() {
		$this->serve_from_rest_api_host();
		update_option( 'site_intent', 'start-writing' );
		update_option( 'launchpad_screen', 'full' );

		wpcom_launchpad_clear_retired_site_intents_on_correct_action();

		// Stand in for switching to a blog that is on a live flow.
		update_option( 'site_intent', 'design-first' );

		do_action( 'rest_api_switched_to_blog' );

		$this->assertSame( 'design-first', get_option( 'site_intent' ), 'the switched-to blog must survive' );
		$this->assertSame( 'full', get_option( 'launchpad_screen' ), 'the switched-to blog must survive' );
	}

	/**
	 * A Navigator config left pointing at a retired checklist reports no active
	 * checklist, rather than one that no longer exists. This can outlive the
	 * intent cleanup, so it must not depend on `site_intent` still matching.
	 */
	public function test_retired_active_checklist_slug_reads_as_none() {
		wpcom_register_default_launchpad_checklists();
		// Cleared already, to prove the repair does not depend on the intent still matching.
		update_option( 'site_intent', '' );
		update_option(
			'wpcom_launchpad_config',
			array(
				'active_checklist_slug' => 'start-writing',
				'navigator_checklists'  => array( 'start-writing', 'design-first' ),
			)
		);

		$this->assertNull( wpcom_launchpad_get_active_checklist(), 'retired active slug must read as none' );
	}

	/**
	 * A live active checklist is still reported.
	 */
	public function test_live_active_checklist_slug_is_reported() {
		wpcom_register_default_launchpad_checklists();
		update_option(
			'wpcom_launchpad_config',
			array( 'active_checklist_slug' => 'design-first' )
		);

		$this->assertSame( 'design-first', wpcom_launchpad_get_active_checklist() );
	}

	/**
	 * Removing a retired active checklist promotes the next registered one, rather
	 * than leaving the retired slug stored with no active checklist reported.
	 */
	public function test_removing_retired_active_checklist_promotes_next_registered() {
		wpcom_register_default_launchpad_checklists();
		update_option(
			'wpcom_launchpad_config',
			array(
				'active_checklist_slug' => 'start-writing',
				'navigator_checklists'  => array( 'start-writing', 'design-first' ),
			)
		);

		$result = wpcom_launchpad_navigator_remove_checklist( 'start-writing' );

		$this->assertSame( 'design-first', $result['new_active_checklist'], 'the next registered checklist must be promoted' );
		$this->assertSame( 'design-first', wpcom_launchpad_get_active_checklist(), 'the promotion must be persisted' );
	}

	/**
	 * A non-string active checklist slug from malformed legacy state reads as none
	 * rather than fataling on the registered-checklist lookup.
	 */
	public function test_malformed_active_checklist_slug_reads_as_none() {
		wpcom_register_default_launchpad_checklists();
		update_option(
			'wpcom_launchpad_config',
			array( 'active_checklist_slug' => array( 'unexpected' ) )
		);

		$this->assertNull( wpcom_launchpad_get_active_checklist() );
	}

	/**
	 * Retired slugs are accepted for reads and removal, but not for setting the
	 * active checklist, so a retired flow cannot be re-selected.
	 */
	public function test_navigator_enums_separate_reads_from_mutations() {
		wpcom_register_default_launchpad_checklists();
		$navigator = new WPCOM_REST_API_V2_Endpoint_Launchpad_Navigator();

		$registered = $navigator->get_checklist_slug_enums();
		$this->assertContains( 'design-first', $registered );
		$this->assertNotContains( 'start-writing', $registered, 'mutations must not accept a retired slug' );

		$readable = $navigator->get_readable_checklist_slug_enums();
		$this->assertContains( 'start-writing', $readable, 'reads and removal must accept a retired slug' );

		$this->assertFalse( $navigator->validate_checklist_slug_param( 'start-writing' ), 'setting a retired slug active must be rejected' );
		$this->assertTrue( $navigator->validate_checklist_slug_param( 'design-first' ) );
		$this->assertTrue( $navigator->validate_checklist_slug_param( null ), 'clearing the active checklist must stay allowed' );
	}
}
