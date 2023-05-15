<?php

namespace Module;

use Codeception\Exception\ModuleException;
use Facebook\WebDriver\Cookie as FacebookWebdriverCookie;
use Symfony\Component\BrowserKit\Cookie;
use function GuzzleHttp\Psr7\build_query;

trait WPBrowserMethods {

	/**
	 * The plugin screen absolute URL.
	 *
	 * @var string|null
	 */
	protected $pluginsPath;

	/**
	 * The admin UI path, relative to the WordPress installation root URL.
	 *
	 * @var string
	 */
	protected $adminPath = '/wp-admin';

	/**
	 * The login screen absolute URL
	 *
	 * @var string
	 */
	protected $loginUrl;

	/**
	 * Navigate to the default WordPress logout page and click the logout link.
	 *
	 * @example
	 * ```php
	 * // Log out using the `wp-login.php` form and return to the current page.
	 * $I->logOut(true);
	 * // Log out using the `wp-login.php` form and remain there.
	 * $I->logOut(false);
	 * // Log out using the `wp-login.php` form and move to another page.
	 * $I->logOut('/some-other-page');
	 * ```
	 *
	 * @param bool|string $redirectTo Whether to redirect to another (optionally specified) page after the logout.
	 *
	 * @return void
	 */
	public function logOut( $redirectTo = false ) {
		$previousUri = $this->_getCurrentUri();
		$loginUri    = $this->getLoginUrl();
		$this->amOnPage( $loginUri . '?action=logout' );
		// Use XPath to have a better performance and find the link in any language.
		$this->click( "//a[contains(@href,'action=logout')]" );
		$this->seeInCurrentUrl( 'loggedout=true' );
		if ( $redirectTo ) {
			$redirectUri = $redirectTo === true ? $previousUri : $redirectTo;
			$this->amOnPage( $redirectUri );
		}
	}

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
	 * @return void
	 */
	public function loginAsAdmin() {
		$this->loginAs( $this->config['adminUsername'], $this->config['adminPassword'] );
	}

	/**
	 * Login as the specified user.
	 *
	 * The method will **not** follow redirection, after the login, to any page.
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
	 *
	 * @return void
	 */
	public function loginAs( $username, $password ) {
		$this->amOnPage( $this->loginUrl );

		if ( method_exists( $this, 'waitForElementVisible' ) ) {
			$this->waitForElementVisible( '#loginform' );
		}

		$params = array(
			'log'         => $username,
			'pwd'         => $password,
			'testcookie'  => '1',
			'redirect_to' => '',
		);
		$this->submitForm( '#loginform', $params, '#wp-submit' );
	}

	/**
	 * Initializes the module setting the properties values.
	 *
	 * @return void
	 */
	public function _initialize() {
		parent::_initialize();

		$this->configBackCompat();

		$adminPath         = $this->config['adminPath'];
		$this->loginUrl    = str_replace( 'wp-admin', 'wp-login.php', $adminPath );
		$this->adminPath   = rtrim( $adminPath, '/' );
		$this->pluginsPath = $this->adminPath . '/plugins.php';
	}

	/**
	 * Returns the WordPress authentication cookie.
	 *
	 * @param string|null $pattern The pattern to filter the cookies by.
	 *
	 * @return FacebookWebdriverCookie|Cookie|null The WordPress authorization cookie or `null` if not found.
	 */
	protected function grabWordPressAuthCookie( $pattern = null ) {
		if ( ! method_exists( $this, 'grabCookiesWithPattern' ) ) {
			return null;
		}

		$pattern = $pattern ? $pattern : '/^wordpress_[a-z0-9]{32}$/';
		$cookies = $this->grabCookiesWithPattern( $pattern );

		return empty( $cookies ) ? null : array_pop( $cookies );
	}

	/**
	 * Returns the WordPress login cookie.
	 *
	 * @param string|null $pattern The pattern to filter the cookies by.
	 *
	 * @return FacebookWebdriverCookie|Cookie|null The WordPress login cookie or `null` if not found.
	 */
	protected function grabWordPressLoginCookie( $pattern = null ) {
		if ( ! method_exists( $this, 'grabCookiesWithPattern' ) ) {
			return null;
		}

		$pattern = $pattern ? $pattern : '/^wordpress_logged_in_[a-z0-9]{32}$/';
		$cookies = $this->grabCookiesWithPattern( $pattern );

		return empty( $cookies ) ? null : array_pop( $cookies );
	}

	/**
	 * Go to the plugins administration screen.
	 *
	 *  The method will **not** handle authentication.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->activatePlugin('hello-dolly');
	 * ```
	 *
	 * @return void
	 */
	public function amOnPluginsPage() {
		if ( ! isset( $this->pluginsPath ) ) {
			throw new ModuleException( $this, 'Plugins path is not set.' );
		}
		$this->amOnPage( $this->pluginsPath );
	}

	/**
	 * Go the "Pages" administration screen.
	 *
	 * The method will **not** handle authentication.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnPagesPage();
	 * $I->see('Add New');
	 * ```
	 *
	 * @return void
	 */
	public function amOnPagesPage() {
		$this->amOnPage( $this->adminPath . '/edit.php?post_type=page' );
	}

	/**
	 * Assert a plugin is not activated in the plugins administration screen.
	 *
	 * The method will **not** handle authentication and navigation to the plugin administration screen.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->seePluginDeactivated('my-plugin');
	 * ```
	 *
	 * @param string $pluginSlug The plugin slug, like "hello-dolly".
	 *
	 * @return void
	 */
	public function seePluginDeactivated( $pluginSlug ) {
		$this->seePluginInstalled( $pluginSlug );
		$this->seeElement( "table.plugins tr[data-slug='$pluginSlug'].inactive" );
	}

	/**
	 * Assert a plugin is installed, no matter its activation status, in the plugin adminstration screen.
	 *
	 * The method will **not** handle authentication and navigation to the plugin administration screen.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->seePluginInstalled('my-plugin');
	 * ```
	 *
	 * @param string $pluginSlug The plugin slug, like "hello-dolly".
	 *
	 * @return void
	 */
	public function seePluginInstalled( $pluginSlug ) {
		$this->seeElement( "table.plugins tr[data-slug='$pluginSlug']" );
	}

	/**
	 * Assert a plugin is activated in the plugin administration screen.
	 *
	 * The method will **not** handle authentication and navigation to the plugin administration screen.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->seePluginActivated('my-plugin');
	 * ```
	 *
	 * @param string $pluginSlug The plugin slug, like "hello-dolly".
	 *
	 * @return void
	 */
	public function seePluginActivated( $pluginSlug ) {
		$this->seePluginInstalled( $pluginSlug );
		$this->seeElement( "table.plugins tr[data-slug='$pluginSlug'].active" );
	}

	/**
	 * Assert a plugin is not installed in the plugins administration screen.
	 *
	 * The method will **not** handle authentication and navigation to the plugin administration screen.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $I->amOnPluginsPage();
	 * $I->dontSeePluginInstalled('my-plugin');
	 * ```
	 *
	 * @param string $pluginSlug The plugin slug, like "hello-dolly".
	 *
	 * @return void
	 */
	public function dontSeePluginInstalled( $pluginSlug ) {
		$this->dontSeeElement( "table.plugins tr[data-slug='$pluginSlug']" );
	}

	/**
	 * In an administration screen look for an error admin notice.
	 *
	 * The check is class-based to decouple from internationalization.
	 * The method will **not** handle authentication and navigation the administration area.
	 *
	 * @param string|array<string> $classes A list of classes the notice should have other than the
	 *                                      `.notice.notice-error` ones.
	 *
	 * @return void
	 * @example
	 * ```php
	 * $I->loginAsAdmin()
	 * $I->amOnAdminPage('/');
	 * $I->seeErrorMessage('.my-plugin');
	 * ```
	 */
	public function seeErrorMessage( $classes = '' ) {
		$classes = (array) $classes;
		$classes = implode( '.', $classes );

		$this->seeElement( '.notice.notice-error' . ( $classes ?: '' ) );
	}

	/**
	 * Checks that the current page is one generated by the `wp_die` function.
	 *
	 * The method will try to identify the page based on the default WordPress die page HTML attributes.
	 *
	 * @example
	 * ```php
	 * $I->loginAs('user', 'password');
	 * $I->amOnAdminPage('/forbidden');
	 * $I->seeWpDiePage();
	 * ```
	 *
	 * @return void
	 */
	public function seeWpDiePage() {
		$this->seeElement( 'body#error-page' );
	}

	/**
	 * In an administration screen look for an admin notice.
	 *
	 * The check is class-based to decouple from internationalization.
	 * The method will **not** handle authentication and navigation the administration area.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin()
	 * $I->amOnAdminPage('/');
	 * $I->seeMessage('.missing-api-token.my-plugin');
	 * ```
	 *
	 * @param array<string>|string $classes A list of classes the message should have in addition to the `.notice` one.
	 *
	 * @return void
	 */
	public function seeMessage( $classes = '' ) {
		$classes = (array) $classes;
		$classes = implode( '.', $classes );

		$this->seeElement( '.notice' . ( $classes ?: '' ) );
	}

	/**
	 * Returns WordPress default test cookie object if present.
	 *
	 * @example
	 * ```php
	 * // Grab the default WordPress test cookie.
	 * $wpTestCookie = $I->grabWordPressTestCookie();
	 * // Grab a customized version of the test cookie.
	 * $myTestCookie = $I->grabWordPressTestCookie('my_test_cookie');
	 * ```
	 *
	 * @param string $name Optional, overrides the default cookie name.
	 *
	 * @return \Symfony\Component\BrowserKit\Cookie|null Either a cookie object or `null`.
	 */
	public function grabWordPressTestCookie( $name = null ) {
		$name = $name ?: 'wordpress_test_cookie';

		return $this->grabCookie( $name );
	}

	/**
	 * Go to a page in the admininstration area of the site.
	 *
	 * This method will **not** handle authentication to the administration area.
	 *
	 * @example
	 *
	 * ```php
	 * $I->loginAs('user', 'password');
	 * // Go to the plugins management screen.
	 * $I->amOnAdminPage('/plugins.php');
	 * ```
	 *
	 * @param string $page The path, relative to the admin area URL, to the page.
	 *
	 * @return string The admin page path.
	 */
	public function amOnAdminPage( $page ) {
		return $this->amOnPage( $this->adminPath . '/' . ltrim( $page, '/' ) );
	}

	/**
	 * Go to the `admin-ajax.php` page to start a synchronous, and blocking, `GET` AJAX request.
	 *
	 * The method will **not** handle authentication, nonces or authorization.
	 *
	 * @example
	 * ```php
	 * $I->amOnAdminAjaxPage(['action' => 'my-action', 'data' => ['id' => 23], 'nonce' => $nonce]);
	 * ```
	 *
	 * @param string|array<string,mixed> $queryVars A string or array of query variables to append to the AJAX path.
	 *
	 * @return string The admin page path.
	 */
	public function amOnAdminAjaxPage( $queryVars = null ) {
		$path = 'admin-ajax.php';
		if ( $queryVars !== null ) {
			$path .= '?' . ( is_array( $queryVars ) ? build_query( $queryVars ) : ltrim( $queryVars, '?' ) );
		}

		return $this->amOnAdminPage( $path );
	}

	/**
	 * Go to the cron page to start a synchronous, and blocking, `GET` request to the cron script.
	 *
	 * @example
	 * ```php
	 * // Triggers the cron job with an optional query argument.
	 * $I->amOnCronPage('/?some-query-var=some-value');
	 * ```
	 *
	 * @param string|array<string,mixed> $queryVars A string or array of query variables to append to the AJAX path.
	 *
	 * @return string The page path.
	 */
	public function amOnCronPage( $queryVars = null ) {
		$path = 'wp-cron.php';
		if ( $queryVars !== null ) {
			$path .= '?' . ( is_array( $queryVars ) ? build_query( $queryVars ) : ltrim( $queryVars, '?' ) );
		}

		return $this->amOnPage( $path );
	}

	/**
	 * Go to the admin page to edit the post with the specified ID.
	 *
	 * The method will **not** handle authentication the admin area.
	 *
	 * @example
	 * ```php
	 * $I->loginAsAdmin();
	 * $postId = $I->havePostInDatabase();
	 * $I->amEditingPostWithId($postId);
	 * $I->fillField('post_title', 'Post title');
	 * ```
	 *
	 * @param int $id The post ID.
	 *
	 * @return void
	 */
	public function amEditingPostWithId( $id ) {
		if ( ! is_numeric( $id ) || (int) $id !== $id ) {
			throw new \InvalidArgumentException( 'ID must be an int value' );
		}

		$this->amOnAdminPage( '/post.php?post=' . $id . '&action=edit' );
	}

	/**
	 * Configures for back-compatibility.
	 *
	 * @return void
	 */
	protected function configBackCompat() {
		if ( isset( $this->config['adminUrl'] ) && ! isset( $this->config['adminPath'] ) ) {
			$this->config['adminPath'] = $this->config['adminUrl'];
		}
	}

	/**
	 * Sets the admin path.
	 *
	 * @param string $adminPath The admin path.
	 *
	 * @return void
	 */
	protected function setAdminPath( $adminPath ) {
		$this->adminPath = $adminPath;
	}

	/**
	 * Returns the admin path.
	 *
	 * @return string The admin path.
	 */
	protected function getAdminPath() {
		return $this->adminPath;
	}

	/**
	 * Sets the login URL.
	 *
	 * @param string $loginUrl The login URL.
	 *
	 * @return void
	 */
	protected function setLoginUrl( $loginUrl ) {
		$this->loginUrl = $loginUrl;
	}

	/**
	 * Returns the login URL.
	 *
	 * @return string The login URL.
	 */
	private function getLoginUrl() {
		return $this->loginUrl;
	}
}
