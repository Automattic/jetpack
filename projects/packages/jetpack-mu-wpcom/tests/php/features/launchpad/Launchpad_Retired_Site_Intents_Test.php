<?php
/**
 * Test class for wpcom_launchpad_clear_retired_site_intents.
 *
 * @package automattic/jetpack-mu-wpcom
 */

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
}
