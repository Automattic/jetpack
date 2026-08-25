<?php
/**
 * Unit test boosstrap code.
 *
 * @package automattic/jetpack-forms
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// PHPUnit pipes process-isolated child scripts through stdin, so a child starts with an
// empty SCRIPT_FILENAME. wp_guess_url() derives a needle from it and hands the empty result
// to strpos(), which warns on PHP 7.x and errors every isolated test before it runs. Give it
// what the parent process has: a real path outside ABSPATH.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

/*
 * There is no HTTP request behind a PHPUnit run, but most of this package
 * describes what happens when a visitor submits a form: the feedback records the
 * client IP and user agent, and the tests assert on them. Stand in for the
 * request here rather than leaving each test class to depend on another one
 * having set these first.
 */
$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
$_SERVER['HTTP_REFERER']    = 'test';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

// Some of the legacy test rely on this constant
if ( ! defined( 'JETPACK__VERSION' ) ) {
	define( 'JETPACK__VERSION', '10' );
}

/*
 * Contact_Form::process_submission() redirects and then exits once a submission
 * succeeds, taking the whole PHPUnit process down with it. It only returns the
 * success message instead when DOING_AJAX is set, so every test that submits a
 * form needs the constant defined.
 *
 * A constant can be defined but never undefined, so this cannot be left to
 * whichever test class happens to run first: it has to be set for the whole run,
 * or the tests that submit forms only pass in one particular order. Tests that
 * need a frontend request instead - Request::is_frontend() is false while
 * wp_doing_ajax() is true, which makes the form block render its fallback link -
 * opt out per test with the `wp_doing_ajax` filter.
 */
if ( ! defined( 'DOING_AJAX' ) ) {
	define( 'DOING_AJAX', true );
}

/*
 * Bring up the plugin the same way a site does. Registering it here rather than
 * from a test means WorDBless snapshots its hooks as part of the baseline it
 * restores after every test - Contact_Form_Plugin::init() is a singleton, so a
 * class that initializes it mid-run adds hooks that WorDBless then strips, and
 * later calls hand back the cached instance without putting them back.
 *
 * Among other things this registers the contact-field shortcode, without which
 * `new Contact_Form( array() )` cannot build its default form.
 */
\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::init();
