<?php
/**
 * Tests for the popup window features sharing sources publish to the front end.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-sources.php';

/**
 * Tests Sharing_Source::js_dialog().
 *
 * The delegated click handler in modules/sharedaddy/sharing.js reads the map these tests
 * assert on, so its shape is a contract between the two files.
 */
class Sharing_Source_Js_Dialog_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The script queue in place before the test replaced it.
	 *
	 * @var WP_Scripts|null
	 */
	private $previous_wp_scripts;

	/**
	 * Set up each test with a clean script queue holding the sharing-js handle.
	 */
	public function set_up() {
		parent::set_up();

		$this->previous_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts']     = new WP_Scripts();
		wp_register_script( 'sharing-js', 'https://example.org/sharing.js', array(), '1.0', true );
	}

	/**
	 * Put the original script queue back, so later tests are not affected.
	 */
	public function tear_down() {
		$GLOBALS['wp_scripts'] = $this->previous_wp_scripts;

		parent::tear_down();
	}

	/**
	 * Ensure a service publishes its own window features under its own name.
	 */
	public function test_js_dialog_publishes_the_service_window_features() {
		$this->display_footer( 'x' );

		$this->assertSame(
			"window.WPCOM_sharing_popups = window.WPCOM_sharing_popups || {};\n"
			. 'window.WPCOM_sharing_popups[ "x" ] = "menubar=1,resizable=1,width=600,height=350";',
			$this->get_inline_script()
		);
	}

	/**
	 * Ensure each service contributes exactly one entry, with its own dimensions.
	 */
	public function test_js_dialog_publishes_one_entry_per_service() {
		$this->display_footer( 'x' );
		$this->display_footer( 'telegram' );

		$script = $this->get_inline_script();

		$this->assertSame( 2, substr_count( $script, 'window.WPCOM_sharing_popups[' ) );
		$this->assertStringContainsString(
			'window.WPCOM_sharing_popups[ "x" ] = "menubar=1,resizable=1,width=600,height=350";',
			$script
		);
		$this->assertStringContainsString(
			'window.WPCOM_sharing_popups[ "telegram" ] = "menubar=1,resizable=1,width=450,height=450";',
			$script
		);
	}

	/**
	 * Ensure no popup is registered when sharing links are set to open in the same tab.
	 */
	public function test_js_dialog_publishes_nothing_when_links_open_in_the_same_tab() {
		add_filter( 'jetpack_open_sharing_in_new_window', '__return_false' );

		$this->display_footer( 'x' );

		$this->assertSame( '', $this->get_inline_script() );
	}

	/**
	 * Ensure every statement starts with an identifier.
	 *
	 * WordPress concatenates all of the sharing-js after-scripts into one script tag, so a
	 * statement starting with "(" or "[" would be parsed as a continuation of whatever a
	 * third party appended before it.
	 */
	public function test_js_dialog_statements_cannot_continue_a_preceding_statement() {
		$this->display_footer( 'x' );

		foreach ( explode( "\n", $this->get_inline_script() ) as $statement ) {
			$this->assertStringStartsWith( 'window.', $statement );
		}
	}

	/**
	 * Run a sharing service's footer output.
	 *
	 * @param string $service Service slug, matching the key used by Sharing_Service.
	 */
	private function display_footer( $service ) {
		$classes = array(
			'x'        => 'Share_X',
			'telegram' => 'Share_Telegram',
		);
		$class   = $classes[ $service ];

		/*
		 * Sharing sources are instantiated with the string service slug as the id in production
		 * (see Sharing_Service), so the int phpdoc on the constructor is inaccurate here.
		 */
		// @phan-suppress-next-line PhanTypeMismatchArgument
		$source = new $class( $service, array( 'button_style' => 'icon' ) );
		$source->display_footer();
	}

	/**
	 * Read everything queued after the sharing-js script.
	 *
	 * @return string Inline script contents.
	 */
	private function get_inline_script() {
		return trim( implode( "\n", array_filter( (array) wp_scripts()->get_data( 'sharing-js', 'after' ) ) ) );
	}
}
