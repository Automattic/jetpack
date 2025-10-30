<?php
/**
 * User agent detection for Jetpack.
 *
 * @package automattic/jetpack-device-detection
 *
 * We don't want to rename public members.
 *
 * @phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
 * @phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
 * @phpcs:disable WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
 * @phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
 */

namespace Automattic\Jetpack\Device_Detection;

require_once __DIR__ . '/functions.php';

/**
 * A class providing device properties detection.
 *
 * Note: str_contains() and other PHP8+ functions that have a polyfill in core are not used here,
 * as wp-includes/compat.php may not be loaded yet.
 */
class User_Agent_Info {

	/**
	 * Provided or fetched User-Agent string.
	 *
	 * @var string
	 */
	public $useragent;

	/**
	 * A device group matched user agent, e.g. 'iphone'.
	 *
	 * @var string
	 */
	public $matched_agent;

	/**
	 * Stores whether is the iPhone tier of devices.
	 *
	 * @var bool
	 */
	public $isTierIphone;

	/**
	 * Stores whether the device can probably support Rich CSS, but JavaScript (jQuery) support is not assumed.
	 *
	 * @var bool
	 */
	public $isTierRichCss;

	/**
	 * Stores whether it is another mobile device, which cannot be assumed to support CSS or JS (eg, older BlackBerry, RAZR)
	 *
	 * @var bool
	 */
	public $isTierGenericMobile;

	/**
	 * Stores the device platform name
	 *
	 * @var null|string
	 */
	private $platform              = null;
	const PLATFORM_WINDOWS         = 'windows';
	const PLATFORM_IPHONE          = 'iphone';
	const PLATFORM_IPOD            = 'ipod';
	const PLATFORM_IPAD            = 'ipad';
	const PLATFORM_BLACKBERRY      = 'blackberry';
	const PLATFORM_BLACKBERRY_10   = 'blackberry_10';
	const PLATFORM_SYMBIAN         = 'symbian_series60';
	const PLATFORM_SYMBIAN_S40     = 'symbian_series40';
	const PLATFORM_J2ME_MIDP       = 'j2me_midp';
	const PLATFORM_ANDROID         = 'android';
	const PLATFORM_ANDROID_TABLET  = 'android_tablet';
	const PLATFORM_FIREFOX_OS      = 'firefoxOS';
	const PLATFORM_DESKTOP_LINUX   = 'linux';
	const PLATFORM_DESKTOP_MAC     = 'mac';
	const PLATFORM_DESKTOP_WINDOWS = 'windows';
	const PLATFORM_DESKTOP_CHROME  = 'chrome';
	const BROWSER_CHROME           = 'chrome';
	const BROWSER_FIREFOX          = 'firefox';
	const BROWSER_SAFARI           = 'safari';
	const BROWSER_EDGE             = 'edge';
	const BROWSER_OPERA            = 'opera';
	const BROWSER_IE               = 'ie';
	const BROWSER_SAMSUNG          = 'samsung';
	const BROWSER_UC               = 'uc';
	const BROWSER_YANDEX           = 'yandex';
	const BROWSER_VIVALDI          = 'vivaldi';
	const BROWSER_MIUI             = 'miui';
	const BROWSER_SILK             = 'silk';
	const OTHER                    = 'other';

	const BROWSER_DISPLAY_NAME_MAP = array(
		self::BROWSER_CHROME  => 'Chrome',
		self::BROWSER_FIREFOX => 'Firefox',
		self::BROWSER_SAFARI  => 'Safari',
		self::BROWSER_EDGE    => 'Edge',
		self::BROWSER_OPERA   => 'Opera',
		self::BROWSER_IE      => 'Internet Explorer',
		self::BROWSER_SAMSUNG => 'Samsung Browser',
		self::BROWSER_UC      => 'UC Browser',
		self::BROWSER_YANDEX  => 'Yandex Browser',
		self::BROWSER_VIVALDI => 'Vivaldi',
		self::BROWSER_MIUI    => 'MIUI Browser',
		self::BROWSER_SILK    => 'Amazon Silk',
		self::OTHER           => 'Other',
	);

	/**
	 * A list of dumb-phone user agent parts.
	 *
	 * @var array
	 */
	public $dumb_agents = array(
		'nokia',
		'blackberry',
		'philips',
		'samsung',
		'sanyo',
		'sony',
		'panasonic',
		'webos',
		'ericsson',
		'alcatel',
		'palm',
		'windows ce',
		'opera mini',
		'series60',
		'series40',
		'au-mic,',
		'audiovox',
		'avantgo',
		'blazer',
		'danger',
		'docomo',
		'epoc',
		'ericy',
		'i-mode',
		'ipaq',
		'midp-',
		'mot-',
		'netfront',
		'nitro',
		'palmsource',
		'pocketpc',
		'portalmmm',
		'rover',
		'sie-',
		'symbian',
		'cldc-',
		'j2me',
		'smartphone',
		'up.browser',
		'up.link',
		'up.link',
		'vodafone/',
		'wap1.',
		'wap2.',
		'mobile',
		'googlebot-mobile',
	);

	/**
	 * The constructor.
	 *
	 * @param string $ua (Optional) User agent.
	 */
	public function __construct( $ua = '' ) {
		if ( $ua ) {
			$this->useragent = $ua;
		} elseif ( ! empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			$this->useragent = wp_unslash( $_SERVER['HTTP_USER_AGENT'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This class is all about validating.
		}
	}

	/**
	 * This method detects the mobile User Agent name.
	 *
	 * @return string The matched User Agent name, false otherwise.
	 */
	public function get_mobile_user_agent_name() {
		if ( static::is_chrome_for_iOS() ) { // Keep this check before the safari rule.
			return 'chrome-for-ios';
		} elseif ( static::is_iphone_or_ipod( 'iphone-safari' ) ) {
			return 'iphone';
		} elseif ( static::is_ipad( 'ipad-safari' ) ) {
			return 'ipad';
		} elseif ( static::is_android_tablet() ) { // Keep this check before the android rule.
			return 'android_tablet';
		} elseif ( static::is_android() ) {
			return 'android';
		} elseif ( static::is_blackberry_10() ) {
			return 'blackberry_10';
		} elseif ( static::is_blackbeberry() ) {
			return 'blackberry';
		} elseif ( static::is_WindowsPhone7() ) {
			return 'win7';
		} elseif ( static::is_windows_phone_8() ) {
			return 'winphone8';
		} elseif ( static::is_opera_mini() ) {
			return 'opera-mini';
		} elseif ( static::is_opera_mini_dumb() ) {
			return 'opera-mini-dumb';
		} elseif ( static::is_opera_mobile() ) {
			return 'opera-mobi';
		} elseif ( static::is_blackberry_tablet() ) {
			return 'blackberry_tablet';
		} elseif ( static::is_kindle_fire() ) {
			return 'kindle-fire';
		} elseif ( static::is_PalmWebOS() ) {
			return 'webos';
		} elseif ( static::is_S60_OSSBrowser() ) {
			return 'series60';
		} elseif ( static::is_firefox_os() ) {
			return 'firefoxOS';
		} elseif ( static::is_firefox_mobile() ) {
			return 'firefox_mobile';
		} elseif ( static::is_MaemoTablet() ) {
			return 'maemo';
		} elseif ( static::is_MeeGo() ) {
			return 'meego';
		} elseif ( static::is_TouchPad() ) {
			return 'hp_tablet';
		} elseif ( static::is_facebook_for_iphone() ) {
			return 'facebook-for-iphone';
		} elseif ( static::is_facebook_for_ipad() ) {
			return 'facebook-for-ipad';
		} elseif ( static::is_twitter_for_iphone() ) {
			return 'twitter-for-iphone';
		} elseif ( static::is_twitter_for_ipad() ) {
			return 'twitter-for-ipad';
		} elseif ( static::is_wordpress_for_ios() ) {
			return 'ios-app';
		} elseif ( static::is_iphone_or_ipod( 'iphone-not-safari' ) ) {
			return 'iphone-unknown';
		} elseif ( static::is_ipad( 'ipad-not-safari' ) ) {
			return 'ipad-unknown';
		} elseif ( static::is_Nintendo_3DS() ) {
			return 'nintendo-3ds';
		} else {
			$agent       = $this->useragent;
			$dumb_agents = $this->dumb_agents;
			foreach ( $dumb_agents as $dumb_agent ) {
				if ( false !== strpos( $agent, $dumb_agent ) ) {
					return $dumb_agent;
				}
			}
		}

		return false;
	}

	/**
	 * This method detects the mobile device's platform. All return strings are from the class constants.
	 * Note that this function returns the platform name, not the UA name/type. You should use a different function
	 * if you need to test the UA capabilites.
	 *
	 * @return string|bool Name of the platform, false otherwise.
	 */
	public function get_platform() {
		if ( isset( $this->platform ) ) {
			return $this->platform;
		}

		if ( empty( $this->useragent ) ) {
			return false;
		}

		$ua = strtolower( $this->useragent );
		if ( strpos( $ua, 'windows phone' ) !== false ) {
			$this->platform = self::PLATFORM_WINDOWS;
		} elseif ( strpos( $ua, 'windows ce' ) !== false ) {
			$this->platform = self::PLATFORM_WINDOWS;
		} elseif ( strpos( $ua, 'ipad' ) !== false ) {
			$this->platform = self::PLATFORM_IPAD;
		} elseif ( strpos( $ua, 'ipod' ) !== false ) {
			$this->platform = self::PLATFORM_IPOD;
		} elseif ( strpos( $ua, 'iphone' ) !== false ) {
			$this->platform = self::PLATFORM_IPHONE;
		} elseif ( strpos( $ua, 'android' ) !== false ) {
			if ( static::is_android_tablet() ) {
				$this->platform = self::PLATFORM_ANDROID_TABLET;
			} else {
				$this->platform = self::PLATFORM_ANDROID;
			}
		} elseif ( static::is_kindle_fire() ) {
			$this->platform = self::PLATFORM_ANDROID_TABLET;
		} elseif ( static::is_blackberry_10() ) {
			$this->platform = self::PLATFORM_BLACKBERRY_10;
		} elseif ( strpos( $ua, 'blackberry' ) !== false ) {
			$this->platform = self::PLATFORM_BLACKBERRY;
		} elseif ( static::is_blackberry_tablet() ) {
			$this->platform = self::PLATFORM_BLACKBERRY;
		} elseif ( static::is_symbian_platform() ) {
			$this->platform = self::PLATFORM_SYMBIAN;
		} elseif ( static::is_symbian_s40_platform() ) {
			$this->platform = self::PLATFORM_SYMBIAN_S40;
		} elseif ( static::is_J2ME_platform() ) {
			$this->platform = self::PLATFORM_J2ME_MIDP;
		} elseif ( static::is_firefox_os() ) {
			$this->platform = self::PLATFORM_FIREFOX_OS;
		} else {
			$this->platform = false;
		}

		return $this->platform;
	}

	/**
	 * Returns the platform for desktops
	 *
	 * @return string
	 */
	public function get_desktop_platform() {
		$ua = $this->useragent;
		if ( empty( $ua ) ) {
			return false;
		}
		$platform = self::OTHER;

		if ( static::is_linux_desktop( $ua ) ) {
			$platform = self::PLATFORM_DESKTOP_LINUX;
		} elseif ( static::is_mac_desktop( $ua ) ) {
			$platform = self::PLATFORM_DESKTOP_MAC;
		} elseif ( static::is_windows_desktop( $ua ) ) {
			$platform = self::PLATFORM_DESKTOP_WINDOWS;
		} elseif ( static::is_chrome_desktop( $ua ) ) {
			$platform = self::PLATFORM_DESKTOP_CHROME;
		}
		return $platform;
	}

	/**
	 * A simple pattern matching method for extracting the browser from the user agent.
	 *
	 * @return string
	 */
	public function get_browser() {
		$ua = $this->useragent;
		if ( empty( $ua ) ) {
			return self::OTHER;
		}

		// Check for browsers based on Chromium BEFORE checking for Chrome itself,
		// as they all include "Chrome" in their user agent string.
		// Order matters - most specific checks first!

		if ( static::is_samsung_browser( $ua ) ) {
			return self::BROWSER_SAMSUNG;
		} elseif ( static::is_yandex_browser( $ua ) ) {
			return self::BROWSER_YANDEX;
		} elseif ( static::is_vivaldi_browser( $ua ) ) {
			return self::BROWSER_VIVALDI;
		} elseif ( static::is_uc_browser( $ua ) ) {
			return self::BROWSER_UC;
		} elseif ( static::is_miui_browser( $ua ) ) {
			return self::BROWSER_MIUI;
		} elseif ( static::is_silk_browser( $ua ) ) {
			return self::BROWSER_SILK;
		} elseif ( static::is_opera_mini( $ua ) || static::is_opera_mobile( $ua ) || static::is_opera_desktop( $ua ) || static::is_opera_mini_dumb( $ua ) ) {
			return self::BROWSER_OPERA;
		} elseif ( static::is_edge_browser( $ua ) ) {
			return self::BROWSER_EDGE;
		} elseif ( static::is_chrome_desktop( $ua ) || self::is_chrome_for_iOS( $ua ) ) {
			return self::BROWSER_CHROME;
		} elseif ( static::is_safari_browser( $ua ) ) {
			return self::BROWSER_SAFARI;
		} elseif ( static::is_firefox_mobile( $ua ) || static::is_firefox_desktop( $ua ) ) {
			return self::BROWSER_FIREFOX;
		} elseif ( static::is_ie_browser( $ua ) ) {
			return self::BROWSER_IE;
		}
		return self::OTHER;
	}

	/**
	 * Get the display name of the browser.
	 *
	 * @return string
	 */
	public function get_browser_display_name() {
		$browser = $this->get_browser();
		return self::BROWSER_DISPLAY_NAME_MAP[ $browser ] ?? $browser;
	}

	/**
	 * This method detects for UA which can display iPhone-optimized web content.
	 * Includes iPhone, iPod Touch, Android, WebOS, Fennec (Firefox mobile), etc.
	 */
	public function isTierIphone() {
		if ( isset( $this->isTierIphone ) ) {
			return $this->isTierIphone;
		}
		if ( $this->is_iphoneOrIpod() ) {
			$this->matched_agent       = 'iphone';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_android() ) {
			$this->matched_agent       = 'android';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_windows_phone_8() ) {
			$this->matched_agent       = 'winphone8';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_WindowsPhone7() ) {
			$this->matched_agent       = 'win7';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_blackberry_10() ) {
			$this->matched_agent       = 'blackberry-10';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_blackbeberry() && 'blackberry-webkit' === static::detect_blackberry_browser_version() ) {
			$this->matched_agent       = 'blackberry-webkit';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_blackberry_tablet() ) {
			$this->matched_agent       = 'blackberry_tablet';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_PalmWebOS() ) {
			$this->matched_agent       = 'webos';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_TouchPad() ) {
			$this->matched_agent       = 'hp_tablet';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_firefox_os() ) {
			$this->matched_agent       = 'firefoxOS';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_firefox_mobile() ) {
			$this->matched_agent       = 'fennec';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_opera_mobile() ) {
			$this->matched_agent       = 'opera-mobi';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_MaemoTablet() ) {
			$this->matched_agent       = 'maemo';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_MeeGo() ) {
			$this->matched_agent       = 'meego';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_kindle_touch() ) {
			$this->matched_agent       = 'kindle-touch';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_Nintendo_3DS() ) {
			$this->matched_agent       = 'nintendo-3ds';
			$this->isTierIphone        = true;
			$this->isTierRichCss       = false;
			$this->isTierGenericMobile = false;
		} else {
			$this->isTierIphone = false;
		}
		return $this->isTierIphone;
	}

	/**
	 * This method detects for UA which are likely to be capable
	 * but may not necessarily support JavaScript.
	 * Excludes all iPhone Tier UA.
	 */
	public function isTierRichCss() {
		if ( isset( $this->isTierRichCss ) ) {
			return $this->isTierRichCss;
		}
		if ( $this->isTierIphone() ) {
			return false;
		}

		// The following devices are explicitly ok.
		if ( static::is_S60_OSSBrowser() ) {
			$this->matched_agent       = 'series60';
			$this->isTierIphone        = false;
			$this->isTierRichCss       = true;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_opera_mini() ) {
			$this->matched_agent       = 'opera-mini';
			$this->isTierIphone        = false;
			$this->isTierRichCss       = true;
			$this->isTierGenericMobile = false;
		} elseif ( static::is_blackbeberry() ) {
			$detectedDevice = static::detect_blackberry_browser_version();
			if (
				'blackberry-5' === $detectedDevice
				|| 'blackberry-4.7' === $detectedDevice
				|| 'blackberry-4.6' === $detectedDevice
			) {
				$this->matched_agent       = $detectedDevice;
				$this->isTierIphone        = false;
				$this->isTierRichCss       = true;
				$this->isTierGenericMobile = false;
			}
		} else {
			$this->isTierRichCss = false;
		}

		return $this->isTierRichCss;
	}

	/**
	 * Detects if the user is using a tablet.
	 * props Corey Gilmore, BGR.com
	 *
	 * @return bool
	 */
	public function is_tablet() {
		$ua = $this->useragent;
		return ( 0 // Never true, but makes it easier to manage our list of tablet conditions.
				|| self::is_ipad( $ua )
				|| self::is_android_tablet( $ua )
				|| self::is_blackberry_tablet( $ua )
				|| self::is_kindle_fire( $ua )
				|| self::is_MaemoTablet( $ua )
				|| self::is_TouchPad( $ua )
		);
	}

	/**
	 *  Detects if the current UA is the default iPhone or iPod Touch Browser.
	 *
	 *  DEPRECATED: use is_iphone_or_ipod
	 */
	public function is_iphoneOrIpod() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( ( strpos( $ua, 'iphone' ) !== false ) || ( strpos( $ua, 'ipod' ) !== false ) ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Retrieves the user agent from the server if not provided.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 * @return string|false The user agent string or false if not available.
	 */
	private static function maybe_get_user_agent_from_server( $user_agent = null ) {
		if ( null !== $user_agent ) {
			return $user_agent;
		}

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return false;
		}
		return wp_unslash( $_SERVER['HTTP_USER_AGENT'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
	}

	/**
	 *  Detects if the current UA is iPhone Mobile Safari or another iPhone or iPod Touch Browser.
	 *
	 *  They type can check for any iPhone, an iPhone using Safari, or an iPhone using something other than Safari.
	 *
	 *  Note: If you want to check for Opera mini, Opera mobile or Firefox mobile (or any 3rd party iPhone browser),
	 *  you should put the check condition before the check for 'iphone-any' or 'iphone-not-safari'.
	 *  Otherwise those browsers will be 'catched' by the iphone string.
	 *
	 * @param string      $type       Type of iPhone detection.
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_iphone_or_ipod( $type = 'iphone-any', $user_agent = null ) {

		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua        = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$is_iphone = ( strpos( $ua, 'iphone' ) !== false ) || ( strpos( $ua, 'ipod' ) !== false );
		$is_safari = ( false !== strpos( $ua, 'safari' ) );

		if ( 'iphone-safari' === $type ) {
			return $is_iphone && $is_safari;
		} elseif ( 'iphone-not-safari' === $type ) {
			return $is_iphone && ! $is_safari;
		} else {
			return $is_iphone;
		}
	}

	/**
	 *  Detects if the current UA is Chrome for iOS
	 *
	 *  The User-Agent string in Chrome for iOS is the same as the Mobile Safari User-Agent, with CriOS/<ChromeRevision> instead of Version/<VersionNum>.
	 *  - Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1_1 like Mac OS X; en) AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/19.0.1084.60 Mobile/9B206 Safari/7534.48.3
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_chrome_for_iOS( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( self::is_iphone_or_ipod( 'iphone-safari', $user_agent ) === false ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'crios/' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 *  Detects if the current UA is Twitter for iPhone
	 *
	 * Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_5 like Mac OS X; nb-no) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile/8L1 Twitter for iPhone
	 * Mozilla/5.0 (iPhone; CPU iPhone OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206 Twitter for iPhone
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_twitter_for_iphone( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'ipad' ) !== false ) {
			return false;
		}

		if ( strpos( $ua, 'twitter for iphone' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current UA is Twitter for iPad
	 *
	 * Old version 4.X - Mozilla/5.0 (iPad; U; CPU OS 4_3_5 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile/8L1 Twitter for iPad
	 * Ver 5.0 or Higher - Mozilla/5.0 (iPad; CPU OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206 Twitter for iPhone
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_twitter_for_ipad( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'twitter for ipad' ) !== false ) {
			return true;
		} elseif ( strpos( $ua, 'ipad' ) !== false && strpos( $ua, 'twitter for iphone' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current UA is Facebook for iPhone
	 * - Facebook 4020.0 (iPhone; iPhone OS 5.0.1; fr_FR)
	 * - Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_0 like Mac OS X; en_US) AppleWebKit (KHTML, like Gecko) Mobile [FBAN/FBForIPhone;FBAV/4.0.2;FBBV/4020.0;FBDV/iPhone3,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/5.0;FBSS/2; FBCR/O2;FBID/phone;FBLC/en_US;FBSF/2.0]
	 * - Mozilla/5.0 (iPhone; CPU iPhone OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206 [FBAN/FBIOS;FBAV/5.0;FBBV/47423;FBDV/iPhone3,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/5.1.1;FBSS/2; FBCR/3ITA;FBID/phone;FBLC/en_US]
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_facebook_for_iphone( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( false === strpos( $ua, 'iphone' ) ) {
			return false;
		}

		if ( false !== strpos( $ua, 'facebook' ) && false === strpos( $ua, 'ipad' ) ) {
			return true;
		} elseif ( false !== strpos( $ua, 'fbforiphone' ) && false === strpos( $ua, 'tablet' ) ) {
			return true;
		} elseif ( false !== strpos( $ua, 'fban/fbios;' ) && false === strpos( $ua, 'tablet' ) ) { // FB app v5.0 or higher.
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current UA is Facebook for iPad
	 * - Facebook 4020.0 (iPad; iPhone OS 5.0.1; en_US)
	 * - Mozilla/5.0 (iPad; U; CPU iPhone OS 5_0 like Mac OS X; en_US) AppleWebKit (KHTML, like Gecko) Mobile [FBAN/FBForIPhone;FBAV/4.0.2;FBBV/4020.0;FBDV/iPad2,1;FBMD/iPad;FBSN/iPhone OS;FBSV/5.0;FBSS/1; FBCR/;FBID/tablet;FBLC/en_US;FBSF/1.0]
	 * - Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10A403 [FBAN/FBIOS;FBAV/5.0;FBBV/47423;FBDV/iPad2,1;FBMD/iPad;FBSN/iPhone OS;FBSV/6.0;FBSS/1; FBCR/;FBID/tablet;FBLC/en_US]
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_facebook_for_ipad( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( false === strpos( $ua, 'ipad' ) ) {
			return false;
		}

		if ( false !== strpos( $ua, 'facebook' ) || false !== strpos( $ua, 'fbforiphone' ) || false !== strpos( $ua, 'fban/fbios;' ) ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 *  Detects if the current UA is WordPress for iOS
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_wordpress_for_ios( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( false !== strpos( $ua, 'wp-iphone' ) ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current device is an iPad.
	 * They type can check for any iPad, an iPad using Safari, or an iPad using something other than Safari.
	 *
	 * Note: If you want to check for Opera mini, Opera mobile or Firefox mobile (or any 3rd party iPad browser),
	 * you should put the check condition before the check for 'iphone-any' or 'iphone-not-safari'.
	 * Otherwise those browsers will be 'catched' by the ipad string.
	 *
	 * @param string      $type       iPad type.
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_ipad( $type = 'ipad-any', $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$is_ipad   = ( false !== strpos( $ua, 'ipad' ) );
		$is_safari = ( false !== strpos( $ua, 'safari' ) );

		if ( 'ipad-safari' === $type ) {
			return $is_ipad && $is_safari;
		} elseif ( 'ipad-not-safari' === $type ) {
			return $is_ipad && ! $is_safari;
		} else {
			return $is_ipad;
		}
	}

	/**
	 * Detects if the current browser is Firefox Mobile (Fennec)
	 *
	 * See http://www.useragentstring.com/pages/Fennec/
	 * Mozilla/5.0 (Windows NT 6.1; WOW64; rv:2.1.1) Gecko/20110415 Firefox/4.0.2pre Fennec/4.0.1
	 * Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.1b2pre) Gecko/20081015 Fennec/1.0a1
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_firefox_mobile( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'fennec' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is Firefox for desktop
	 *
	 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent/Firefox
	 * Mozilla/5.0 (platform; rv:geckoversion) Gecko/geckotrail Firefox/firefoxversion
	 * The platform section will include 'Mobile' for phones and 'Tablet' for tablets.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_firefox_desktop( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( false !== strpos( $ua, 'firefox' ) && false === strpos( $ua, 'mobile' ) && false === strpos( $ua, 'tablet' ) ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is FirefoxOS Native browser
	 *
	 * Mozilla/5.0 (Mobile; rv:14.0) Gecko/14.0 Firefox/14.0
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_firefox_os( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'mozilla' ) !== false && strpos( $ua, 'mobile' ) !== false && strpos( $ua, 'gecko' ) !== false && strpos( $ua, 'firefox' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detect Safari browser
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_safari_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( false === strpos( wp_unslash( $user_agent ), 'Safari' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return false;
		}
		return true;
	}

	/**
	 * Detect Edge browser
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_edge_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = wp_unslash( $user_agent ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		// Check for both legacy Edge ("Edge/") and modern Chromium-based Edge ("Edg/")
		if ( false === strpos( $ua, 'Edge' ) && false === strpos( $ua, 'Edg/' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Detect IE browser
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_ie_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = wp_unslash( $user_agent ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( false === ( strpos( $ua, 'MSIE' ) || strpos( $ua, 'Trident/7' ) ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Detect modern Opera desktop
	 *
	 * Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 OPR/74.0.3911.203
	 *
	 * Looking for "OPR/" specifically.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_opera_desktop( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( false === strpos( wp_unslash( $user_agent ), 'OPR/' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return false;
		}

		return true;
	}

	/**
	 * Detects if the current browser is Opera Mobile
	 *
	 * What is the difference between Opera Mobile and Opera Mini?
	 * - Opera Mobile is a full Internet browser for mobile devices.
	 * - Opera Mini always uses a transcoder to convert the page for a small display.
	 * (it uses Opera advanced server compression technology to compress web content before it gets to a device.
	 *  The rendering engine is on Opera's server.)
	 *
	 * Opera/9.80 (Windows NT 6.1; Opera Mobi/14316; U; en) Presto/2.7.81 Version/11.00"
	 * Opera/9.50 (Nintendo DSi; Opera/507; U; en-US)
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_opera_mobile( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'opera' ) !== false && strpos( $ua, 'mobi' ) !== false ) {
			return true;
		} elseif ( strpos( $ua, 'opera' ) !== false && strpos( $ua, 'nintendo dsi' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is Opera Mini
	 *
	 * Opera/8.01 (J2ME/MIDP; Opera Mini/3.0.6306/1528; en; U; ssr)
	 * Opera/9.80 (Android;Opera Mini/6.0.24212/24.746 U;en) Presto/2.5.25 Version/10.5454
	 * Opera/9.80 (iPhone; Opera Mini/5.0.019802/18.738; U; en) Presto/2.4.15
	 * Opera/9.80 (J2ME/iPhone;Opera Mini/5.0.019802/886; U; ja) Presto/2.4.15
	 * Opera/9.80 (J2ME/iPhone;Opera Mini/5.0.019802/886; U; ja) Presto/2.4.15
	 * Opera/9.80 (Series 60; Opera Mini/5.1.22783/23.334; U; en) Presto/2.5.25 Version/10.54
	 * Opera/9.80 (BlackBerry; Opera Mini/5.1.22303/22.387; U; en) Presto/2.5.25 Version/10.54
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_opera_mini( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $ua, 'opera' ) !== false && strpos( $ua, 'mini' ) !== false ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is Opera Mini, but not on a smart device OS(Android, iOS, etc)
	 * Used to send users on dumb devices to m.wor
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_opera_mini_dumb( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( self::is_opera_mini( $user_agent ) ) {
			if ( strpos( $ua, 'android' ) !== false || strpos( $ua, 'iphone' ) !== false || strpos( $ua, 'ipod' ) !== false
			|| strpos( $ua, 'ipad' ) !== false || strpos( $ua, 'blackberry' ) !== false ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is Samsung Internet for Android.
	 *
	 * Samsung Internet is the default browser on Samsung devices.
	 * User agent contains: SamsungBrowser
	 *
	 * @param string|null $user_agent Optional user agent string.
	 * @return bool
	 */
	public static function is_samsung_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		return false !== stripos( $user_agent, 'SamsungBrowser' );
	}

	/**
	 * Detects if the current browser is UC Browser.
	 *
	 * UC Browser is popular in Asia and emerging markets.
	 * User agent contains: UCBrowser or UCWEB
	 *
	 * @param string|null $user_agent Optional user agent string.
	 * @return bool
	 */
	public static function is_uc_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		return false !== stripos( $user_agent, 'UCBrowser' ) || false !== stripos( $user_agent, 'UCWEB' );
	}

	/**
	 * Detects if the current browser is Yandex Browser.
	 *
	 * Yandex Browser is popular in Russia and CIS countries.
	 * User agent contains: YaBrowser
	 *
	 * @param string|null $user_agent Optional user agent string.
	 * @return bool
	 */
	public static function is_yandex_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		return false !== stripos( $user_agent, 'YaBrowser' );
	}

	/**
	 * Detects if the current browser is Vivaldi.
	 *
	 * Vivaldi is a feature-rich browser for power users.
	 * User agent contains: Vivaldi
	 *
	 * @param string|null $user_agent Optional user agent string.
	 * @return bool
	 */
	public static function is_vivaldi_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		return false !== stripos( $user_agent, 'Vivaldi' );
	}

	/**
	 * Detects if the current browser is MIUI Browser.
	 *
	 * MIUI Browser is the default browser on Xiaomi devices.
	 * User agent contains: MiuiBrowser or XiaoMi
	 *
	 * @param string|null $user_agent Optional user agent string.
	 * @return bool
	 */
	public static function is_miui_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		return false !== stripos( $user_agent, 'MiuiBrowser' ) || false !== stripos( $user_agent, 'XiaoMi' );
	}

	/**
	 * Detects if the current browser is Amazon Silk.
	 *
	 * Amazon Silk is the browser on Kindle Fire and Echo devices.
	 * User agent contains: Silk or Silk-Accelerated
	 *
	 * @param string|null $user_agent Optional user agent string.
	 * @return bool
	 */
	public static function is_silk_browser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		return false !== stripos( $user_agent, 'Silk' );
	}

	/**
	 * Detects if the current browser is a Windows Phone 7 device.
	 * ex: Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; LG; GW910)
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_WindowsPhone7( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( false === strpos( $ua, 'windows phone os 7' ) ) {
			return false;
		} elseif ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Detects if the current browser is a Windows Phone 8 device.
	 * ex: Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; ARM; Touch; IEMobile/10.0; <Manufacturer>; <Device> [;<Operator>])
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_windows_phone_8( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( strpos( $ua, 'windows phone 8' ) === false ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Detects if the current browser is on a Palm device running the new WebOS. This EXCLUDES TouchPad.
	 *
	 * Ex1: Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pre/1.1
	 * Ex2: Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pixi/1.1
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_PalmWebOS( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( false === strpos( $ua, 'webos' ) ) {
			return false;
		} elseif ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * Detects if the current browser is the HP TouchPad default browser. This excludes phones wt WebOS.
	 *
	 * TouchPad Emulator: Mozilla/5.0 (hp-desktop; Linux; hpwOS/2.0; U; it-IT) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.70 Safari/534.6 Desktop/1.0
	 * TouchPad: Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.0; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.70 Safari/534.6 TouchPad/1.0
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_TouchPad( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$http_user_agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( false !== strpos( $http_user_agent, 'hp-tablet' ) || false !== strpos( $http_user_agent, 'hpwos' ) || false !== strpos( $http_user_agent, 'touchpad' ) ) {
			if ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is the Series 60 Open Source Browser.
	 *
	 * OSS Browser 3.2 on E75: Mozilla/5.0 (SymbianOS/9.3; U; Series60/3.2 NokiaE75-1/110.48.125 Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413
	 *
	 * 7.0 Browser (Nokia 5800 XpressMusic (v21.0.025)) : Mozilla/5.0 (SymbianOS/9.4; U; Series60/5.0 Nokia5800d-1/21.0.025; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413
	 *
	 * Browser 7.1 (Nokia N97 (v12.0.024)) : Mozilla/5.0 (SymbianOS/9.4; Series60/5.0 NokiaN97-1/12.0.024; Profile/MIDP-2.1 Configuration/CLDC-1.1; en-us) AppleWebKit/525 (KHTML, like Gecko) BrowserNG/7.1.12344
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_S60_OSSBrowser( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
			return false;
		}

		$pos_webkit = strpos( $agent, 'webkit' );
		if ( false !== $pos_webkit ) {
			// First, test for WebKit, then make sure it's either Symbian or S60.
			if ( strpos( $agent, 'symbian' ) !== false || strpos( $agent, 'series60' ) !== false ) {
					return true;
			} else {
				return false;
			}
		} elseif ( strpos( $agent, 'symbianos' ) !== false && strpos( $agent, 'series60' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'nokia' ) !== false && strpos( $agent, 'series60' ) !== false ) {
			return true;
		}

		return false;
	}

	/**
	 * Detects if the device platform is the Symbian Series 60.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_symbian_platform( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$pos_webkit = strpos( $agent, 'webkit' );
		if ( false !== $pos_webkit ) {
			// First, test for WebKit, then make sure it's either Symbian or S60.
			if ( strpos( $agent, 'symbian' ) !== false || strpos( $agent, 'series60' ) !== false ) {
					return true;
			} else {
				return false;
			}
		} elseif ( strpos( $agent, 'symbianos' ) !== false && strpos( $agent, 'series60' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'nokia' ) !== false && strpos( $agent, 'series60' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'opera mini' ) !== false ) {
			if ( strpos( $agent, 'symbianos' ) !== false || strpos( $agent, 'symbos' ) !== false || strpos( $agent, 'series 60' ) !== false ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Detects if the device platform is the Symbian Series 40.
	 * Nokia Browser for Series 40 is a proxy based browser, previously known as Ovi Browser.
	 * This browser will report 'NokiaBrowser' in the header, however some older version will also report 'OviBrowser'.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_symbian_s40_platform( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $agent, 'series40' ) !== false ) {
			if ( strpos( $agent, 'nokia' ) !== false || strpos( $agent, 'ovibrowser' ) !== false || strpos( $agent, 'nokiabrowser' ) !== false ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns if the device belongs to J2ME capable family.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return bool
	 */
	public static function is_J2ME_platform( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( strpos( $agent, 'j2me/midp' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'midp' ) !== false && strpos( $agent, 'cldc' ) ) {
			return true;
		}
		return false;
	}

	/**
	 * Detects if the current UA is on one of the Maemo-based Nokia Internet Tablets.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_MaemoTablet( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$pos_maemo = strpos( $agent, 'maemo' );
		if ( false === $pos_maemo ) {
			return false;
		}

		// Must be Linux + Tablet, or else it could be something else.
		if ( strpos( $agent, 'tablet' ) !== false && strpos( $agent, 'linux' ) !== false ) {
			if ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current UA is a MeeGo device (Nokia Smartphone).
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_MeeGo( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( false === strpos( $ua, 'meego' ) ) {
			return false;
		} elseif ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * The is_webkit() method can be used to check the User Agent for an webkit generic browser.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_webkit( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$pos_webkit = strpos( $agent, 'webkit' );

		if ( false !== $pos_webkit ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is the Native Android browser.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return boolean true if the browser is Android otherwise false
	 */
	public static function is_android( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent       = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos_android = strpos( $agent, 'android' );
		if ( false !== $pos_android ) {
			if ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is the Native Android Tablet browser.
	 * Assumes 'Android' should be in the user agent, but not 'mobile'
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return boolean true if the browser is Android and not 'mobile' otherwise false
	 */
	public static function is_android_tablet( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$pos_android      = strpos( $agent, 'android' );
		$pos_mobile       = strpos( $agent, 'mobile' );
		$post_android_app = strpos( $agent, 'wp-android' );

		if ( false !== $pos_android && false === $pos_mobile && false === $post_android_app ) {
			if ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is the Kindle Fire Native browser.
	 *
	 * Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-84) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true
	 * Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-84) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=false
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return boolean true if the browser is Kindle Fire Native browser otherwise false
	 */
	public static function is_kindle_fire( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent        = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos_silk     = strpos( $agent, 'silk/' );
		$pos_silk_acc = strpos( $agent, 'silk-accelerated=' );
		if ( false !== $pos_silk && false !== $pos_silk_acc ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detects if the current browser is the Kindle Touch Native browser
	 *
	 * Mozilla/5.0 (X11; U; Linux armv7l like Android; en-us) AppleWebKit/531.2+ (KHTML, like Gecko) Version/5.0 Safari/533.2+ Kindle/3.0+
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return boolean true if the browser is Kindle monochrome Native browser otherwise false
	 */
	public static function is_kindle_touch( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent            = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos_kindle_touch = strpos( $agent, 'kindle/3.0+' );
		if ( false !== $pos_kindle_touch && false === self::is_kindle_fire( $user_agent ) ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detect if user agent is the WordPress.com Windows 8 app (used ONLY on the custom oauth stylesheet)
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_windows8_auth( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos   = strpos( $agent, 'msauthhost' );
		if ( false !== $pos ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detect if user agent is the WordPress.com Windows 8 app.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_wordpress_for_win8( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos   = strpos( $agent, 'wp-windows8' );
		if ( false !== $pos ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Detect if user agent is the WordPress.com Desktop app.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_wordpress_desktop_app( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos   = strpos( $agent, 'WordPressDesktop' );
		if ( false !== $pos ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * The is_blackberry_tablet() method can be used to check the User Agent for a RIM blackberry tablet.
	 * The user agent of the BlackBerry® Tablet OS follows a format similar to the following:
	 * Mozilla/5.0 (PlayBook; U; RIM Tablet OS 1.0.0; en-US) AppleWebKit/534.8+ (KHTML, like Gecko) Version/0.0.1 Safari/534.8+
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_blackberry_tablet( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent          = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		$pos_playbook   = stripos( $agent, 'PlayBook' );
		$pos_rim_tablet = stripos( $agent, 'RIM Tablet' );

		if ( ( false === $pos_playbook ) || ( false === $pos_rim_tablet ) ) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * The is_blackbeberry() method can be used to check the User Agent for a blackberry device.
	 * Note that opera mini on BB matches this rule.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_blackbeberry( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$pos_blackberry = strpos( $agent, 'blackberry' );
		if ( false !== $pos_blackberry ) {
			if ( self::is_opera_mini( $user_agent ) || self::is_opera_mobile( $user_agent ) || self::is_firefox_mobile( $user_agent ) ) {
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}

	/**
	 * The is_blackberry_10() method can be used to check the User Agent for a BlackBerry 10 device.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_blackberry_10( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		return ( strpos( $agent, 'bb10' ) !== false ) && ( strpos( $agent, 'mobile' ) !== false );
	}

	/**
	 * Determines whether a desktop platform is Linux OS
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return bool
	 */
	public static function is_linux_desktop( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( ! preg_match( '/linux/i', wp_unslash( $user_agent ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return false;
		}
		return true;
	}

	/**
	 * Determines whether a desktop platform is Mac OS
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return bool
	 */
	public static function is_mac_desktop( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( ! preg_match( '/macintosh|mac os x/i', wp_unslash( $user_agent ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return false;
		}
		return true;
	}

	/**
	 * Determines whether a desktop platform is Windows OS
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return bool
	 */
	public static function is_windows_desktop( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( ! preg_match( '/windows|win32/i', wp_unslash( $user_agent ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return false;
		}
		return true;
	}

	/**
	 * Determines whether a desktop platform is Chrome OS
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return bool
	 */
	public static function is_chrome_desktop( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( ! preg_match( '/chrome/i', wp_unslash( $user_agent ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
			return false;
		}
		return true;
	}

	/**
	 * Retrieve the blackberry OS version.
	 *
	 * Return strings are from the following list:
	 * - blackberry-10
	 * - blackberry-7
	 * - blackberry-6
	 * - blackberry-torch //only the first edition. The 2nd edition has the OS7 onboard and doesn't need any special rule.
	 * - blackberry-5
	 * - blackberry-4.7
	 * - blackberry-4.6
	 * - blackberry-4.5
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return string Version of the BB OS.
	 * If version is not found, get_blackbeberry_OS_version will return boolean false.
	 */
	public static function get_blackbeberry_OS_version( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		if ( self::is_blackberry_10( $user_agent ) ) {
			return 'blackberry-10';
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		$pos_blackberry = stripos( $agent, 'blackberry' );
		if ( false === $pos_blackberry ) {
			// Not a blackberry device.
			return false;
		}

		// Blackberry devices OS 6.0 or higher.
		// Mozilla/5.0 (BlackBerry; U; BlackBerry 9670; en) AppleWebKit/534.3+ (KHTML, like Gecko) Version/6.0.0.286 Mobile Safari/534.3+.
		// Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en) AppleWebKit/534.1+ (KHTML, Like Gecko) Version/6.0.0.141 Mobile Safari/534.1+.
		// Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.0.0 Mobile Safari/534.11+.
		$pos_webkit = stripos( $agent, 'webkit' );
		if ( false !== $pos_webkit ) {
			// Detected blackberry webkit browser.
			$pos_torch = stripos( $agent, 'BlackBerry 9800' );
			if ( false !== $pos_torch ) {
				return 'blackberry-torch'; // Match the torch first edition. the 2nd edition should use the OS7 and doesn't need any special rule.
			} elseif ( preg_match( '#Version\/([\d\.]+)#i', $agent, $matches ) ) { // Detecting the BB OS version for devices running OS 6.0 or higher.
				$version     = $matches[1];
				$version_num = explode( '.', $version );
				if ( count( $version_num ) <= 1 ) {
					return 'blackberry-6'; // not a BB device that match our rule.
				} else {
					return 'blackberry-' . $version_num[0];
				}
			} else {
				// if doesn't match returns the minimun version with a webkit browser. we should never fall here.
				return 'blackberry-6'; // not a BB device that match our rule.
			}
		}

		// Blackberry devices <= 5.XX.
		// BlackBerry9000/5.0.0.93 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/179.
		if ( preg_match( '#BlackBerry\w+\/([\d\.]+)#i', $agent, $matches ) ) {
			$version = $matches[1];
		} else {
			return false; // not a BB device that match our rule.
		}

		$version_num = explode( '.', $version );

		if ( count( $version_num ) <= 1 ) {
			return false;
		}

		$version_num_major = (int) $version_num[0];
		$version_num_minor = (int) $version_num[1];

		if ( 5 === $version_num_major ) {
			return 'blackberry-5';
		} elseif ( 4 === $version_num_major && 7 === $version_num_minor ) {
			return 'blackberry-4.7';
		} elseif ( 4 === $version_num_major && 6 === $version_num_minor ) {
			return 'blackberry-4.6';
		} elseif ( 4 === $version_num_major && 5 === $version_num_minor ) {
			return 'blackberry-4.5';
		} else {
			return false;
		}
	}

	/**
	 * Retrieve the blackberry browser version.
	 *
	 * Return string are from the following list:
	 * - blackberry-10
	 * - blackberry-webkit
	 * - blackberry-5
	 * - blackberry-4.7
	 * - blackberry-4.6
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return string Type of the BB browser.
	 * If browser's version is not found, detect_blackbeberry_browser_version will return boolean false.
	 */
	public static function detect_blackberry_browser_version( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( self::is_blackberry_10( $user_agent ) ) {
			return 'blackberry-10';
		}

		$pos_blackberry = strpos( $agent, 'blackberry' );
		if ( false === $pos_blackberry ) {
			// Not a blackberry device.
			return false;
		}

		$pos_webkit = strpos( $agent, 'webkit' );

		if ( ! ( false === $pos_webkit ) ) {
			return 'blackberry-webkit';
		} else {
			if ( ! preg_match( '#BlackBerry\w+\/([\d\.]+)#i', $agent, $matches ) ) {
				return false; // not a BB device that match our rule.
			}

			$version_num = explode( '.', $matches[1] );

			if ( count( $version_num ) <= 1 ) {
				return false;
			}

			$version_num_major = (int) $version_num[0];
			$version_num_minor = (int) $version_num[1];

			if ( 5 === $version_num_major ) {
				return 'blackberry-5';
			} elseif ( 4 === $version_num_major && 7 === $version_num_minor ) {
				return 'blackberry-4.7';
			} elseif ( 4 === $version_num_major && 6 === $version_num_minor ) {
				return 'blackberry-4.6';
			} else {
				// A very old BB device is found or this is a BB device that doesn't match our rules.
				return false;
			}
		}
	}

	/**
	 * Checks if a visitor is coming from one of the WordPress mobile apps.
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return bool
	 */
	public static function is_mobile_app( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$agent = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

		if ( isset( $_SERVER['X_USER_AGENT'] ) && preg_match( '|wp-webos|', $_SERVER['X_USER_AGENT'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
			return true; // Wp4webos 1.1 or higher.
		}

		$app_agents = array( 'wp-android', 'wp-blackberry', 'wp-iphone', 'wp-nokia', 'wp-webos', 'wp-windowsphone' );
		// the mobile reader on iOS has an incorrect UA when loading the reader
		// currently it is the default one provided by the iOS framework which
		// causes problems with 2-step-auth
		// User-Agent   WordPress/3.1.4 CFNetwork/609 Darwin/13.0.0.
		$app_agents[] = 'wordpress/3.1';

		foreach ( $app_agents as $app_agent ) {
			if ( false !== strpos( $agent, $app_agent ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Detects if the current browser is Nintendo 3DS handheld.
	 *
	 * Example: Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7498.US
	 * can differ in language, version and region
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 */
	public static function is_Nintendo_3DS( $user_agent = null ) {
		$user_agent = self::maybe_get_user_agent_from_server( $user_agent );
		if ( empty( $user_agent ) ) {
			return false;
		}

		$ua = strtolower( wp_unslash( $user_agent ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.
		if ( strpos( $ua, 'nintendo 3ds' ) !== false ) {
			return true;
		}
		return false;
	}

	/**
	 * Was the current request made by a known bot?
	 *
	 * @param string|null $user_agent Optional. User agent string to check. If not provided, uses $_SERVER['HTTP_USER_AGENT'].
	 *
	 * @return boolean
	 */
	public static function is_bot( $user_agent = null ) {
		static $is_bot = null;

		if ( null === $user_agent ) {
			if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
				return false;
			}
			$user_agent = wp_unslash( $_SERVER['HTTP_USER_AGENT'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- This is validating.

			// Use cached result only when using the default $_SERVER['HTTP_USER_AGENT'].
			if ( $is_bot === null ) {
				$is_bot = self::is_bot_user_agent( $user_agent );
			}
			return $is_bot;
		}

		if ( empty( $user_agent ) ) {
			return false;
		}

		// Don't use cache when a custom user agent is provided.
		return self::is_bot_user_agent( $user_agent );
	}

	/**
	 * Is the given user-agent a known bot?
	 * If you want an is_bot check for the current request's UA, use is_bot() instead of passing a user-agent to this method.
	 *
	 * @param string $ua A user-agent string.
	 *
	 * @return boolean
	 */
	public static function is_bot_user_agent( $ua = null ) {

		if ( empty( $ua ) ) {
			return false;
		}

		// Some sourced via
		// https://github.com/ua-parser/uap-core/blob/432e95f6767cc8bab4c20c255784cd6f7e93bc15/regexes.yaml#L151
		$bot_agents = array(
			// Microsoft/Bing https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0
			'bingbot', // Bing/Copilot
			'adidxbot', // Bing Ads
			'bingpreview', // Generates page snapshots for Bing
			'bingvideopreview', // Generates previews of videos for Bing
			'microsoft',

			// Google https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
			'adsbot-google',
			'appengine-google',
			'feedfetcher-google',
			'mediapartners-google',
			'storebot-google', // https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-storebot
			'google sketchup',
			'google-cloudbertexbot', // https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-cloudvertexbot
			'google-extended', // Gemini https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-extended
			'google-inspectiontool', // https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
			'google-safety;', // https://www.google.com/bot.html
			'googlebot-mobile',
			'googlebot', // and googlebot-[image,video,news,] https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googlebot
			'googleother', // and googleother-[video,image] https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#googleother

			// OpenAI https://platform.openai.com/docs/bots
			'gptbot', // Crawler
			'chatgpt-user', // ChatGPT on behalf of user
			'oai-searchbot', // ChatGPT search features

			// Anthropic
			'claudebot', // chat citation fetch https://support.anthropic.com/en/articles/8896518
			'claude-web', // web-focused crawl https://darkvisitors.com/agents/claude-web
			'anthropic-ai', // bulk model training https://darkvisitors.com/agents/anthropic-ai

			// Perplexity
			'perplexitybot', // index builder https://docs.perplexity.ai/guides/bots
			'perplexity-user', // human-triggered visit https://docs.perplexity.ai/guides/bots

			// Meta https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
			'facebookbot', // AI data scraper https://darkvisitors.com/agents/facebookbot
			'facebookexternalhit', // shares https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/#identify
			'facebookcatalog', // shares https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/#identify
			'meta-webindexer', // Meta AI search indexer https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/#meta-webindexer
			'meta-externalads', // web crawler improving ads https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/#meta-externalads
			'meta-externalagent', // training AI models https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/#identify-2
			'meta-externalfetcher', // user-initiated fetches, may skip robots.txt https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/#identify-3

			// Semrush https://www.semrush.com/bot/
			'semrushbot',
			'siteauditbot',

			// Other bots (alphabetized list)
			'123metaspider-bot',
			'1470.net crawler',
			'50.nu',
			'8bo crawler bot',
			'aboundex',
			'ahrefsbot',
			'ai2bot', // AI2 crawler for LLMm training https://allenai.org/crawler
			'alexa',
			'altavista',
			'amazonbot', // https://developer.amazon.com/amazonbot
			'applebot', // https://support.apple.com/en-ca/HT204683
			'arcgis hub indexer',
			'archive.org_bot', // http://archive.org/details/archive.org_bot
			'archiver',
			'ask jeeves',
			'attentio',
			'baiduspider',
			'blexbot',
			'blitzbot',
			'blogbridge',
			'bloglovin',
			'bne.es_bot', // https://www.bne.es/es/colecciones/archivo-web-espanola/aviso-webmasters
			'boardreader blog indexer',
			'boardreader favicon fetcher',
			'boitho.com-dc',
			'botseer',
			'bubing',
			'bytespider', // ByteDance (owner of TikTok) to train LLMs for Doubao https://darkvisitors.com/agents/bytespider
			'catchpoint',
			'ccbot', // CommonCrawl non-profit https://commoncrawl.org/ccbot
			'charlotte',
			'checklinks',
			'chtml generic',
			'cityreview robot',
			'cloudflare-alwaysonline',
			'clumboot',
			'coccocbot', // Coc Coc https://darkvisitors.com/agents/coccocbot-web
			'cohere-ai', // Cohere AI https://darkvisitors.com/agents/cohere-ai
			'comodo http',
			'comodo-webinspector-crawler',
			'converacrawler',
			'cookieinformationscanner', // Internal ref p1699315886066389-slack-C0438NHCLSY
			'crawl-e',
			'crawlconvera',
			'crawldaddy',
			'crawler',
			'crawlfire',
			'csimplespider',
			'dataforseobot', // https://www.dataforseo.com/dataforseo-bot
			'daumoa',
			'diffbot', // https://docs.diffbot.com/docs/how-to-use-custom-user-agents-with-extract-apis & https://darkvisitors.com/agents/diffbot
			'domaintunocrawler',
			'dotbot', // https://darkvisitors.com/agents/dotbot
			'duckassistbot', // DuckDuckGo AI Assistant https://darkvisitors.com/agents/duckassistbot
			'elisabot',
			'ezlynxbot', // https://www.ezoic.com/bot
			'fastmobilecrawl',
			'feed seeker bot',
			'feedbin',
			'feedburner',
			'finderbots',
			'findlinks',
			'firefly',
			'flamingo_searchengine',
			'followsite bot',
			'froogle',
			'furlbot',
			'genieo',
			'germcrawler',
			'gigabot',
			'gomezagent',
			'gonzo1',
			'grapeshotcrawler',
			'grokkit-crawler',
			'grub-client',
			'gsa-crawler',
			'heritrix',
			'hiddenmarket',
			'holmes',
			'hoowwwer',
			'htdig',
			'httrack',
			'ia_archiver',
			'icarus6j',
			'icc-crawler',
			'ichiro',
			'iconsurf',
			'iescholar',
			'iltrovatore',
			'index crawler',
			'infoseek',
			'infuzapp',
			'innovazion crawler',
			'internetarchive',
			'irlbot',
			'jbot',
			'job roboter',
			'jumpbot',
			'kaloogabot',
			'kiwistatus spider',
			'kraken',
			'kurzor',
			'larbin',
			'leia',
			'lesnikbot',
			'lijit crawler',
			'linguee bot',
			'linkaider',
			'linkcheck',
			'linkdexbot',
			'linkedinbot',
			'linkfluence', // http://linkfluence.com/
			'linkwalker', // https://www.linkwalker.com/
			'lite bot',
			'livelapbot',
			'llaut',
			'lycos',
			'mail.ru_bot',
			'masidani_bot',
			'masscan',
			'mediapartners',
			'mediobot',
			'mj12bot',
			'mogimogi',
			'mojeekbot', // https://www.mojeek.com/bot.html
			'motionbot',
			'mozdex',
			'mshots',
			'msnbot',
			'msrbot',
			'mtps feed aggregation system',
			'netresearch',
			'netvibes',
			'newsgator',
			'ning',
			'nutch',
			'nymesis',
			'objectssearch',
			'ogscrper',
			'omgili', // Webz.io web crawler for a data seller https://darkvisitors.com/agents/omgili
			'oozbot',
			'openbot',
			'openhosebot',
			'orbiter',
			'pagepeeker',
			'pagesinventory',
			'paxleframework',
			'peeplo screenshot bot',
			'phpcrawl',
			'pingdom.com_bot',
			'plantynet_webrobot',
			'pompos',
			'pss-webkit-request',
			'pythumbnail',
			'queryseekersp ider',
			'queryseekerspider',
			'qwantify',
			'read%20later',
			'reaper',
			'redcarpet',
			'retreiver',
			'riddler',
			'rival iq',
			'scollspider',
			'scooter',
			'scrapy',
			'scrubby',
			'searchsight',
			'seekbot',
			'semanticdiscovery',
			'seostats',
			'simplepie',
			'simplerss',
			'simpy',
			'sitecat webbot',
			'sitecon',
			'slack-imgproxy',
			'slackbot-linkexpanding',
			'slurp',
			'snapbot',
			'snapchat', // https://developers.snap.com/robots
			'snappy',
			'speedy spider',
			'spider',
			'squrl java',
			'stringer',
			'taptubot',
			'technoratisnoop',
			'teoma',
			'theusefulbot',
			'thumbshots.ru',
			'thumbshotsbot',
			'timpibot', // LLM trainer https://darkvisitors.com/agents/timpibot
			'tiny tiny rss',
			'trendictionbot',  // http://www.trendiction.de/bot;
			'trends crawler',
			'tweetmemebot',
			'twiceler',
			'twitterbot', // https://developer.x.com/en/docs/x-for-websites/cards/guides/getting-started#crawling
			'url2png',
			'usyd-nlp-spider',
			'vagabondo',
			'voilabot',
			'vortex',
			'votay bot',
			'voyager',
			'wasalive.bot',
			'web-sniffer',
			'webthumb',
			'wesee',
			'whatsapp',
			'whatweb',
			'wire',
			'wordpress',
			'wotbox',
			'wp-e2e-tests', // WordPress e2e tests
			'www.almaden.ibm.com',
			'xenu',
			'yacybot', // http://yacy.net/bot.html
			'yahoo! slurp',
			'yahooseeker',
			'yahooysmcm',
			'yammybot',
			'yandexbot',
			'yottaamonitor',
			'youbot', // You.com AI assistant https://darkvisitors.com/agents/youbot
			'yowedo',
			'zao-crawler',
			'zao',
			'zebot_www.ze.bz',
			'zoombot', // SEOZOom https://darkvisitors.com/agents/zoombot
			'zooshot',
			'zyborg',
		);

		foreach ( $bot_agents as $bot_agent ) {
			if ( false !== stripos( $ua, $bot_agent ) ) {
				return true;
			}
		}

		return false;
	}
}
