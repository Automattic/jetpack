<?php
/**
 * An extension of Codeception WebDriver module offering specific WordPress browsing methods.
 *
 * @package Codeception\Module
 */

namespace Codeception\Module;

use Codeception\Exception\ModuleConfigException;
use Codeception\Exception\ModuleException;
use Facebook\WebDriver\Cookie as FacebookWebdriverCookie;
use Symfony\Component\BrowserKit\Cookie;
use function tad\WPBrowser\requireCodeceptionModules;

//phpcs:disable
requireCodeceptionModules('WPWebDriver', [ 'WebDriver' ]);
//phpcs:enable

/**
 * Class WPWebDriver
 *
 * @package Codeception\Module
 */
class WPWebDriver extends WebDriver {

	use WPBrowserMethods;

	/**
	 * The module required fields, to be set in the suite .yml configuration file.
	 *
	 * @var array<string>
	 */
	protected $requiredFields = array( 'adminUsername', 'adminPassword', 'adminPath' );

	/**
	 * The login attempts counter.
	 *
	 * @var int
	 */
	protected $loginAttempt = 0;
	/**
	 * Login as the administrator user using the credentials specified in the module configuration.
	 *
	 * The method will **not** follow redirection, after the login, to any page.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnAdminPage('/');
	 * $I->see('Dashboard');
	 * ```
	 *
	 * @param int $timeout The max time, in seconds, to try to login.
	 * @param int $maxAttempts The max number of attempts to try to login.
	 *
	 * @return void
	 *
	 * @throws ModuleException If all the attempts of obtaining the cookie fail.
	 */
	public function loginAsAdmin( $timeout = 10, $maxAttempts = 5 ) {
		$this->loginAs( $this->config['adminUsername'], $this->config['adminPassword'], $timeout, $maxAttempts );
	}

	/**
	 * Login as the specified user.
	 *
	 * The method will **not** follow redirection, after the login, to any page.
	 * Depending on the driven browser the login might be "too fast" and the server might have not
	 * replied with valid cookies yet; in that case the method will re-attempt the login to obtain
	 * the cookies.
	 *
	 * @example
	 * ```php
	 * $I->loginAs('user', 'password');
	 * $I->amOnAdminPage('/');
	 * $I->see('Dashboard');
	 * ```
	 *
	 * @param string $username The user login name.
	 * @param string $password The user password in plain text.
	 * @param int    $timeout The max time, in seconds, to try to login.
	 * @param int    $maxAttempts The max number of attempts to try to login.
	 *
	 * @throws ModuleException If all the attempts of obtaining the cookie fail.
	 *
	 * @return void
	 */
	public function loginAs( $username, $password, $timeout = 10, $maxAttempts = 5 ) {
		if ( $this->loginAttempt === $maxAttempts ) {
			throw new ModuleException(
				__CLASS__,
				"Could not login as [{$username}, {$password}] after {$maxAttempts} attempts."
			);
		}

		$this->debug( "Trying to login, attempt {$this->loginAttempt}/{$maxAttempts}..." );

		$this->amOnPage( $this->getLoginUrl() );

		$this->waitForElement( '#user_login', $timeout );
		$this->waitForElement( '#user_pass', $timeout );
		$this->waitForElement( '#wp-submit', $timeout );

		$this->fillField( '#user_login', $username );
		$this->fillField( '#user_pass', $password );
		$this->click( '#wp-submit' );

		$authCookie    = $this->grabWordPressAuthCookie();
		$loginCookie   = $this->grabWordPressLoginCookie();
		$empty_cookies = empty( $authCookie ) && empty( $loginCookie );

		if ( $empty_cookies ) {
			++$this->loginAttempt;
			$this->wait( 1 );
			$this->loginAs( $username, $password, $timeout, $maxAttempts );
		}

		$this->loginAttempt = 0;
	}

	/**
	 * Returns all the cookies whose name matches a regex pattern.
	 *
	 * @example
	 * ```php
	 * $I->loginAs('customer','password');
	 * $I->amOnPage('/shop');
	 * $cartCookies = $I->grabCookiesWithPattern("#^shop_cart\\.*#");
	 * ```
	 *
	 * @param string $cookiePattern The regular expression pattern to use for the matching.
	 *
	 * @return array<FacebookWebdriverCookie|Cookie>|null An array of cookies matching the pattern.
	 */
	public function grabCookiesWithPattern( $cookiePattern ) {
		/** @var array<FacebookWebdriverCookie|Cookie> $cookies */
		$cookies = $this->webDriver->manage()->getCookies();

		if ( ! $cookies ) {
			return null;
		}
		$matchingCookies = array_filter(
			$cookies,
			static function ( $cookie ) use ( $cookiePattern ) {
				return preg_match( $cookiePattern, $cookie->getName() );
			}
		);
		$cookieList      = array_map(
			static function ( $cookie ) {
				return sprintf( '{"%s": "%s"}', $cookie->getName(), $cookie->getValue() );
			},
			$matchingCookies
		);

		$this->debug( 'Cookies matching pattern ' . $cookiePattern . ' : ' . implode( ', ', $cookieList ) );

		return count( $matchingCookies ) ? $matchingCookies : null;
	}

	/**
	 * Waits for any jQuery triggered AJAX request to be resolved.
	 *
	 * @example
	 * ```php
	 * $I->amOnPage('/triggering-ajax-requests');
	 * $I->waitForJqueryAjax();
	 * $I->see('From AJAX');
	 * ```
	 *
	 * @param int $time The max time to wait for AJAX requests to complete.
	 *
	 * @return void
	 */
	public function waitForJqueryAjax( $time = 10 ) {
		$this->waitForJS( 'return jQuery.active == 0', $time );
	}

	/**
	 * Grabs the current page full URL including the query vars.
	 *
	 * @example
	 * ```php
	 * $today = date('Y-m-d');
	 * $I->amOnPage('/concerts?date=' . $today);
	 * $I->assertRegExp('#\\/concerts$#', $I->grabFullUrl());
	 * ```
	 *
	 * @return string The full page URL.
	 */
	public function grabFullUrl() {
		return $this->executeJS( 'return location.href' );
	}

	/**
	 * Validates the module configuration..
	 *
	 * @internal
	 *
	 * @return void
	 * @throws ModuleConfigException|ModuleException If there's an issue with the configuration.
	 */
	protected function validateConfig() {
		$this->configBackCompat();

		parent::validateConfig();
	}

	/**
	 * In the plugin administration screen deactivate a plugin clicking the "Deactivate" link.
	 *
	 * The method will **not** handle authentication and navigation to the plugins administration page.
	 *
	 * @example
	 * ```php
	 * // Deactivate one plugin.
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->deactivatePlugin('hello-dolly');
	 * // Deactivate a list of plugins.
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->deactivatePlugin(['hello-dolly', 'my-plugin']);
	 * ```
	 *
	 * @param  string|array<string> $pluginSlug The plugin slug, like "hello-dolly", or a list of plugin slugs.
	 *
	 * @return void
	 */
	public function deactivatePlugin( $pluginSlug ) {
		foreach ( (array) $pluginSlug as $plugin ) {
			$option = '//*[@data-slug="' . $plugin . '"]/th/input';
			$this->scrollTo( $option, 0, -40 );
			$this->checkOption( $option );
		}
		$this->scrollTo( 'select[name="action"]', 0, -40 );
		$this->selectOption( 'action', 'deactivate-selected' );
		$this->click( '#doaction' );
	}

	/**
	 * In the plugin administration screen activates one or more plugins clicking the "Activate" link.
	 *
	 * The method will **not** handle authentication and navigation to the plugins administration page.
	 *
	 * @example
	 * ```php
	 * // Activate a plugin.
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->activatePlugin('hello-dolly');
	 * // Activate a list of plugins.
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->activatePlugin(['hello-dolly','another-plugin']);
	 * ```
	 *
	 * @param  string|array<string> $pluginSlug The plugin slug, like "hello-dolly" or a list of plugin slugs.
	 *
	 * @return void
	 */
	public function activatePlugin( $pluginSlug ) {
		$plugins = (array) $pluginSlug;
		foreach ( $plugins as $plugin ) {
			$option = '//*[@data-slug="' . $plugin . '"]/th/input';
			$this->scrollTo( $option, 0, -40 );
			$this->checkOption( $option );
		}
		$this->scrollTo( 'select[name="action"]', 0, -40 );
		$this->selectOption( 'action', 'activate-selected' );
		$this->click( '#doaction' );
	}
}
