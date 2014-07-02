<?php

function jetpack_is_mobile( $kind = 'any', $return_matched_agent = false ) {
	static $kinds = array( 'smart' => false, 'dumb' => false, 'any' => false );
	static $first_run = true;
	static $matched_agent = '';

	$ua_info = new Jetpack_User_Agent_Info();

	if ( empty( $_SERVER['HTTP_USER_AGENT'] ) || strpos( strtolower( $_SERVER['HTTP_USER_AGENT'] ), 'ipad' ) )
		return false;

	if( $ua_info->is_android_tablet() &&  $ua_info->is_kindle_touch() === false )
		return false;

	if( $ua_info->is_blackberry_tablet() )
		return false;

	if ( $first_run ) {
		$first_run = false;

		//checks for iPhoneTier devices & RichCSS devices
		if ( $ua_info->isTierIphone() || $ua_info->isTierRichCSS() ) {
			 $kinds['smart'] = true;
		     $matched_agent = $ua_info->matched_agent;
		}

		if ( !$kinds['smart'] ) {
			// if smart, we are not dumb so no need to check
			$dumb_agents = $ua_info->dumb_agents;
			$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
			foreach ( $dumb_agents as $dumb_agent ) {
				if ( false !== strpos( $agent, $dumb_agent ) ) {
					$kinds['dumb'] = true;
					$matched_agent = $dumb_agent;
					break;
				}
			}

			if ( !$kinds['dumb'] ) {
				if ( isset( $_SERVER['HTTP_X_WAP_PROFILE'] ) ) {
					$kinds['dumb'] = true;
					$matched_agent = 'http_x_wap_profile';
				} elseif ( isset( $_SERVER['HTTP_ACCEPT']) && ( preg_match( '/wap\.|\.wap/i', $_SERVER['HTTP_ACCEPT'] ) || false !== strpos( strtolower( $_SERVER['HTTP_ACCEPT'] ), 'application/vnd.wap.xhtml+xml' ) ) ) {
					$kinds['dumb'] = true;
					$matched_agent = 'vnd.wap.xhtml+xml';
				}
			}
		}

		if ( $kinds['dumb'] || $kinds['smart'] )
			$kinds['any'] = true;
	}

	if ( $return_matched_agent )
		return $matched_agent;

	return $kinds[$kind];
}

class Jetpack_User_Agent_Info {

	var $useragent;
	var $matched_agent;
    var $isTierIphone; //Stores whether is the iPhone tier of devices.
    var $isTierRichCss; //Stores whether the device can probably support Rich CSS, but JavaScript (jQuery) support is not assumed.
    var $isTierGenericMobile; //Stores whether it is another mobile device, which cannot be assumed to support CSS or JS (eg, older BlackBerry, RAZR)

    private $_platform = null; //Stores the device platform name
	const PLATFORM_WINDOWS 			= 'windows';
	const PLATFORM_IPHONE 			= 'iphone';
	const PLATFORM_IPOD 			= 'ipod';
	const PLATFORM_IPAD 			= 'ipad';
	const PLATFORM_BLACKBERRY 		= 'blackberry';
	const PLATFORM_BLACKBERRY_10 	= 'blackberry_10';
	const PLATFORM_SYMBIAN			= 'symbian_series60';
	const PLATFORM_SYMBIAN_S40		= 'symbian_series40';
	const PLATFORM_J2ME_MIDP		= 'j2me_midp';
	const PLATFORM_ANDROID 			= 'android';
	const PLATFORM_ANDROID_TABLET	= 'android_tablet';
	const PLATFORM_FIREFOX_OS		= 'firefoxOS';

	var $dumb_agents = array(
		'nokia', 'blackberry', 'philips', 'samsung', 'sanyo', 'sony', 'panasonic', 'webos',
		'ericsson', 'alcatel', 'palm',
		'windows ce', 'opera mini', 'series60', 'series40',
		'au-mic,', 'audiovox', 'avantgo', 'blazer',
		'danger', 'docomo', 'epoc',
		'ericy', 'i-mode', 'ipaq',  'midp-',
		'mot-', 'netfront', 'nitro',
		'palmsource',  'pocketpc', 'portalmmm',
		'rover', 'sie-',
		'symbian', 'cldc-', 'j2me',
		'smartphone', 'up.browser', 'up.link',
		'up.link', 'vodafone/', 'wap1.', 'wap2.', 'mobile', 'googlebot-mobile',
	);

   //The constructor. Initializes default variables.
   function Jetpack_User_Agent_Info()
   {
   		if ( !empty( $_SERVER['HTTP_USER_AGENT'] ) )
       		$this->useragent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
   }

   /**
    * This method detects the mobile User Agent name.
    *
    * @return string The matched User Agent name, false otherwise.
    */
   function get_mobile_user_agent_name() {
   		if( $this->is_chrome_for_iOS( ) ) //keep this check before the safari rule
   			return 'chrome-for-ios';
	   	elseif ( $this->is_iphone_or_ipod( 'iphone-safari' ) )
	 	  	return  'iphone';
	   	elseif ( $this->is_ipad( 'ipad-safari' ) )
	   		return 'ipad';
	   	elseif ( $this->is_android_tablet() ) //keep this check before the android rule
	   		return 'android_tablet';
	   	elseif ( $this->is_android() )
	   		return 'android';
	   	elseif ( $this->is_blackberry_10() )
	   		return 'blackberry_10';
	   	elseif ( $this->is_blackbeberry() )
	   		return 'blackberry';
	   	elseif ( $this->is_WindowsPhone7() )
	   		return 'win7';
	   	elseif ( $this->is_windows_phone_8() )
	   		return 'winphone8';
	   	elseif ( $this->is_opera_mini() )
	   		return 'opera-mini';
		elseif ( $this->is_opera_mini_dumb() )
	   		return 'opera-mini-dumb';
	   	elseif ( $this->is_opera_mobile() )
	   		return 'opera-mobi';
	   	elseif ( $this->is_blackberry_tablet() )
	   		return 'blackberry_tablet';
	   	elseif ( $this->is_kindle_fire() )
	   		return 'kindle-fire';
	   	elseif ( $this->is_PalmWebOS() )
	   		return 'webos';
	   	elseif ( $this->is_S60_OSSBrowser() )
	   		return 'series60';
	   	elseif ( $this->is_firefox_os() )
	   	   	return 'firefoxOS';
	   	elseif ( $this->is_firefox_mobile() )
	   		return 'firefox_mobile';
	   	elseif ( $this->is_MaemoTablet() )
	   		return 'maemo';
		elseif ( $this->is_MeeGo() )
	   		return 'meego';
	   	elseif( $this->is_TouchPad() )
	   		return 'hp_tablet';
	    elseif ( $this->is_facebook_for_iphone() )
 	  		return  'facebook-for-iphone';
 	  	elseif ( $this->is_facebook_for_ipad() )
 	  		return  'facebook-for-ipad';
   		elseif ( $this->is_twitter_for_iphone() )
 	  		return  'twitter-for-iphone';
 	  	elseif ( $this->is_twitter_for_ipad() )
 	  		return  'twitter-for-ipad';
 	  	elseif ( $this->is_wordpress_for_ios() )
 	  		return  'ios-app';
	   	elseif ( $this->is_iphone_or_ipod( 'iphone-not-safari' ) )
	 	  	return  'iphone-unknown';
	   	elseif ( $this->is_ipad( 'ipad-not-safari' ) )
	   		return 'ipad-unknown';
	   	elseif ( $this->is_Nintendo_3DS() )
	   		return 'nintendo-3ds';
	   	else {
	   		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
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
    * @return string Name of the platform, false otherwise.
    */
   public function get_platform() {
   	if ( isset( $this->_platform ) ) {
   		return $this->_platform;
   	}

    if ( strpos( $this->useragent, 'windows phone' ) !== false ) {
   		$this->_platform = self::PLATFORM_WINDOWS;
   	}
   	elseif ( strpos( $this->useragent, 'windows ce' ) !== false ) {
   		$this->_platform = self::PLATFORM_WINDOWS;
   	}
   	elseif ( strpos( $this->useragent, 'ipad' ) !== false ) {
   		$this->_platform = self::PLATFORM_IPAD;
   	}
   	else if ( strpos( $this->useragent, 'ipod' ) !== false ) {
   		$this->_platform = self::PLATFORM_IPOD;
   	}
   	else if ( strpos( $this->useragent, 'iphone' ) !== false ) {
   		$this->_platform = self::PLATFORM_IPHONE;
   	}
   	elseif ( strpos( $this->useragent, 'android' ) !== false ) {
   	 if ( $this->is_android_tablet() )
   		 $this->_platform = self::PLATFORM_ANDROID_TABLET;
   	 else
   		$this->_platform = self::PLATFORM_ANDROID;
   	}
    elseif ( $this->is_kindle_fire() ) {
   		$this->_platform = self::PLATFORM_ANDROID_TABLET;
   	}
   	elseif ( $this->is_blackberry_10() ) {
   		$this->_platform = self::PLATFORM_BLACKBERRY_10;
   	}
   	elseif ( strpos( $this->useragent, 'blackberry' ) !== false ) {
   		$this->_platform = self::PLATFORM_BLACKBERRY;
   	}
   	elseif ( $this->is_blackberry_tablet() ) {
   		$this->_platform = self::PLATFORM_BLACKBERRY;
   	}
    elseif ( $this->is_symbian_platform() ) {
   		$this->_platform = self::PLATFORM_SYMBIAN;
   	}
    elseif ( $this->is_symbian_s40_platform() ) {
   		$this->_platform = self::PLATFORM_SYMBIAN_S40;
   	}
    elseif ( $this->is_J2ME_platform() ) {
   		$this->_platform = self::PLATFORM_J2ME_MIDP;
   	}
   	elseif ( $this->is_firefox_os() ) {
   		$this->_platform = self::PLATFORM_FIREFOX_OS;
   	}
   	else
   		$this->_platform = false;

   		return $this->_platform;
   }

	/*
	 * This method detects for UA which can display iPhone-optimized web content.
	 * Includes iPhone, iPod Touch, Android, WebOS, Fennec (Firefox mobile), etc.
	 *
	 */
	function isTierIphone() {
		if ( isset( $this->isTierIphone ) ) {
			return $this->isTierIphone;
		}
		if ( $this->is_iphoneOrIpod() ) {
			$this->matched_agent = 'iphone';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_android() ) {
			$this->matched_agent = 'android';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_windows_phone_8() ) {
			$this->matched_agent = 'winphone8';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_WindowsPhone7() ) {
			$this->matched_agent = 'win7';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_blackberry_10() ) {
			$this->matched_agent = 'blackberry-10';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_blackbeberry() && $this->detect_blackberry_browser_version() == 'blackberry-webkit' ) {
			$this->matched_agent = 'blackberry-webkit';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_blackberry_tablet() ) {
			$this->matched_agent = 'blackberry_tablet';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_PalmWebOS() ) {
			$this->matched_agent = 'webos';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_TouchPad() ) {
			$this->matched_agent = 'hp_tablet';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_firefox_os() ) {
			$this->matched_agent = 'firefoxOS';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_firefox_mobile() ) {
			$this->matched_agent = 'fennec';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_opera_mobile() ) {
			$this->matched_agent = 'opera-mobi';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_MaemoTablet() ) {
			$this->matched_agent = 'maemo';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_MeeGo() ) {
			$this->matched_agent = 'meego';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_kindle_touch() ) {
			$this->matched_agent = 'kindle-touch';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_Nintendo_3DS() ) {
			$this->matched_agent = 'nintendo-3ds';
			$this->isTierIphone = true;
			$this->isTierRichCss = false;
			$this->isTierGenericMobile = false;
		}
		else {
			$this->isTierIphone = false;
		}
		return $this->isTierIphone;
	}

	/*
	 * This method detects for UA which are likely to be capable
	 * but may not necessarily support JavaScript.
	 * Excludes all iPhone Tier UA.
	 *
	 */
	function isTierRichCss(){
		if ( isset( $this->isTierRichCss ) ) {
			return $this->isTierRichCss;
		}
		if ($this->isTierIphone())
		return false;

		//The following devices are explicitly ok.
		if ( $this->is_S60_OSSBrowser() ) {
			$this->matched_agent = 'series60';
			$this->isTierIphone = false;
			$this->isTierRichCss = true;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_opera_mini() ) {
			$this->matched_agent = 'opera-mini';
			$this->isTierIphone = false;
			$this->isTierRichCss = true;
			$this->isTierGenericMobile = false;
		}
		elseif ( $this->is_blackbeberry() ) {
			$detectedDevice = $this->detect_blackberry_browser_version();
			if ( $detectedDevice === 'blackberry-5' || $detectedDevice == 'blackberry-4.7' || $detectedDevice === 'blackberry-4.6' ) {
				$this->matched_agent = $detectedDevice;
				$this->isTierIphone = false;
				$this->isTierRichCss = true;
				$this->isTierGenericMobile = false;
			}
		}
		else {
			$this->isTierRichCss = false;
		}

		return $this->isTierRichCss;
	}

	// Detects if the user is using a tablet.
	// props Corey Gilmore, BGR.com
	static function is_tablet() {
		return ( 0 // never true, but makes it easier to manage our list of tablet conditions
				||  self::is_ipad()
				||  self::is_android_tablet()
				||  self::is_blackberry_tablet()
				||  self::is_kindle_fire()
				||  self::is_MaemoTablet()
				||  self::is_TouchPad()
		);
	}

	/*
	 *  Detects if the current UA is the default iPhone or iPod Touch Browser.
	 *
	 *  DEPRECATED: use is_iphone_or_ipod
	 *
	 */
	static function is_iphoneOrIpod(){

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		if ( ( strpos( $ua, 'iphone' ) !== false ) || ( strpos( $ua,'ipod' ) !== false ) ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		}
		else
			return false;
	}


	/*
	 *  Detects if the current UA is iPhone Mobile Safari or another iPhone or iPod Touch Browser.
	 *
	 *  They type can check for any iPhone, an iPhone using Safari, or an iPhone using something other than Safari.
	 *
	 *  Note: If you want to check for Opera mini, Opera mobile or Firefox mobile (or any 3rd party iPhone browser),
	 *  you should put the check condition before the check for 'iphone-any' or 'iphone-not-safari'.
	 *  Otherwise those browsers will be 'catched' by the iphone string.
	 *
	 */
	static function is_iphone_or_ipod( $type = 'iphone-any' ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		$is_iphone = ( strpos( $ua, 'iphone' ) !== false ) || ( strpos( $ua,'ipod' ) !== false );
		$is_safari = ( false !== strpos( $ua, 'safari' ) );

		if ( 'iphone-safari' == $type )
			return $is_iphone && $is_safari;
		elseif ( 'iphone-not-safari' == $type )
			return $is_iphone && !$is_safari;
		else
			return $is_iphone;
	}


	/*
	*  Detects if the current UA is Chrome for iOS
	*
	*  The User-Agent string in Chrome for iOS is the same as the Mobile Safari User-Agent, with CriOS/<ChromeRevision> instead of Version/<VersionNum>.
	*  - Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1_1 like Mac OS X; en) AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/19.0.1084.60 Mobile/9B206 Safari/7534.48.3
	*/
	static function is_chrome_for_iOS( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		if ( self::is_iphone_or_ipod( 'iphone-safari' ) === false ) return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'crios/' ) !== false )
			return true;
		else
			return false;
	}


	/*
	 *  Detects if the current UA is Twitter for iPhone
	 *
	 * Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_5 like Mac OS X; nb-no) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile/8L1 Twitter for iPhone
	 * Mozilla/5.0 (iPhone; CPU iPhone OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206 Twitter for iPhone
	 *
	 */
	static function is_twitter_for_iphone( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'ipad' ) !== false )
			return false;

		if ( strpos( $ua, 'twitter for iphone' ) !== false )
			return true;
		else
			return false;
	}

	/*
	 * Detects if the current UA is Twitter for iPad
	 *
	 * Old version 4.X - Mozilla/5.0 (iPad; U; CPU OS 4_3_5 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile/8L1 Twitter for iPad
	 * Ver 5.0 or Higher - Mozilla/5.0 (iPad; CPU OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206 Twitter for iPhone
	 *
	 */
	static function is_twitter_for_ipad( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'twitter for ipad' ) !== false )
			return true;
		elseif( strpos( $ua, 'ipad' ) !== false && strpos( $ua, 'twitter for iphone' ) !== false )
			return true;
		else
			return false;
	}


	/*
	 * Detects if the current UA is Facebook for iPhone
	 * - Facebook 4020.0 (iPhone; iPhone OS 5.0.1; fr_FR)
	 * - Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_0 like Mac OS X; en_US) AppleWebKit (KHTML, like Gecko) Mobile [FBAN/FBForIPhone;FBAV/4.0.2;FBBV/4020.0;FBDV/iPhone3,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/5.0;FBSS/2; FBCR/O2;FBID/phone;FBLC/en_US;FBSF/2.0]
	 * - Mozilla/5.0 (iPhone; CPU iPhone OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206 [FBAN/FBIOS;FBAV/5.0;FBBV/47423;FBDV/iPhone3,1;FBMD/iPhone;FBSN/iPhone OS;FBSV/5.1.1;FBSS/2; FBCR/3ITA;FBID/phone;FBLC/en_US]
	 */
	static function is_facebook_for_iphone( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if( strpos( $ua, 'iphone' ) === false )
			return false;

		if ( strpos( $ua, 'facebook' ) !== false  && strpos( $ua, 'ipad' ) === false )
			return true;
		else if ( strpos( $ua, 'fbforiphone' ) !== false && strpos( $ua, 'tablet' ) === false )
			return true;
		else if ( strpos( $ua, 'fban/fbios;' ) !== false && strpos( $ua, 'tablet' ) === false ) //FB app v5.0 or higher
			return true;
		else
			return false;
	}

	/*
	 * Detects if the current UA is Facebook for iPad
	 * - Facebook 4020.0 (iPad; iPhone OS 5.0.1; en_US)
	 * - Mozilla/5.0 (iPad; U; CPU iPhone OS 5_0 like Mac OS X; en_US) AppleWebKit (KHTML, like Gecko) Mobile [FBAN/FBForIPhone;FBAV/4.0.2;FBBV/4020.0;FBDV/iPad2,1;FBMD/iPad;FBSN/iPhone OS;FBSV/5.0;FBSS/1; FBCR/;FBID/tablet;FBLC/en_US;FBSF/1.0]
	 * - Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10A403 [FBAN/FBIOS;FBAV/5.0;FBBV/47423;FBDV/iPad2,1;FBMD/iPad;FBSN/iPhone OS;FBSV/6.0;FBSS/1; FBCR/;FBID/tablet;FBLC/en_US]
	 */
	static function is_facebook_for_ipad( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'ipad' ) === false )
			return false;

		if ( strpos( $ua, 'facebook' ) !== false || strpos( $ua, 'fbforiphone' ) !== false  || strpos( $ua, 'fban/fbios;' ) !== false )
			return true;
		else
			return false;
	}

	/*
	 *  Detects if the current UA is WordPress for iOS
	 */
	static function is_wordpress_for_ios( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		if ( strpos( $ua, 'wp-iphone' ) !== false )
			return true;
		else
			return false;
	}

	/*
	 * Detects if the current device is an iPad.
	 * They type can check for any iPad, an iPad using Safari, or an iPad using something other than Safari.
	 *
	 * Note: If you want to check for Opera mini, Opera mobile or Firefox mobile (or any 3rd party iPad browser),
	 * you should put the check condition before the check for 'iphone-any' or 'iphone-not-safari'.
	 * Otherwise those browsers will be 'catched' by the ipad string.
	 *
	*/
	static function is_ipad( $type = 'ipad-any' ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$is_ipad = ( false !== strpos( $ua, 'ipad' ) );
		$is_safari = ( false !== strpos( $ua, 'safari' ) );

		if ( 'ipad-safari' == $type )
			return $is_ipad && $is_safari;
		elseif ( 'ipad-not-safari' == $type )
			return $is_ipad && !$is_safari;
		else
			return $is_ipad;
	}

	/*
	 * Detects if the current browser is Firefox Mobile (Fennec)
	 *
	 * http://www.useragentstring.com/pages/Fennec/
	 * Mozilla/5.0 (Windows NT 6.1; WOW64; rv:2.1.1) Gecko/20110415 Firefox/4.0.2pre Fennec/4.0.1
	 * Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.1b2pre) Gecko/20081015 Fennec/1.0a1
	 */
	static function is_firefox_mobile( ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'fennec' ) !== false )
			return true;
		else
			return false;
	}


	/*
	 * Detects if the current browser is FirefoxOS Native browser
	*
	* Mozilla/5.0 (Mobile; rv:14.0) Gecko/14.0 Firefox/14.0
	*
	*/
	static function is_firefox_os( ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'mozilla' ) !== false && strpos( $ua, 'mobile' ) !== false && strpos( $ua, 'gecko' ) !== false && strpos( $ua, 'firefox' ) !== false)
			return true;
		else
			return false;
	}


	/*
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
	 */
	static function is_opera_mobile( ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'opera' ) !== false && strpos( $ua, 'mobi' ) !== false )
			return true;
		elseif ( strpos( $ua, 'opera' ) !== false && strpos( $ua, 'nintendo dsi' ) !== false )
			return true;
		else
			return false;
	}


	/*
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
	 */
	static function is_opera_mini( ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'opera' ) !== false && strpos( $ua, 'mini' ) !== false )
			return true;
		else
			return false;
	}

	/*
	 * Detects if the current browser is Opera Mini, but not on a smart device OS(Android, iOS, etc)
	 * Used to send users on dumb devices to m.wor
	 */
	static function is_opera_mini_dumb( ) {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;
		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( self::is_opera_mini() ) {
			if ( strpos( $ua, 'android' ) !== false  || strpos( $ua, 'iphone' ) !== false || strpos( $ua, 'ipod' ) !== false
		 	|| strpos( $ua, 'ipad' ) !== false || strpos( $ua, 'blackberry' ) !== false)
				return false;
			else
				return true;
		} else {
			return false;
		}
	}

	/*
	 * Detects if the current browser is Opera Mobile or Mini.
	 * DEPRECATED: use is_opera_mobile or is_opera_mini
	 *
	 * Opera Mini 5 Beta: Opera/9.80 (J2ME/MIDP; Opera Mini/5.0.15650/756; U; en) Presto/2.2.0
	 * Opera Mini 8: Opera/8.01 (J2ME/MIDP; Opera Mini/3.0.6306/1528; en; U; ssr)
	 */
	static function is_OperaMobile() {
		_deprecated_function( __FUNCTION__, 'always', 'is_opera_mini() or is_opera_mobile()' );

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'opera' ) !== false ) {
			if ( ( strpos( $ua, 'mini' ) !== false ) || ( strpos( $ua,'mobi'  ) !== false ) )
				return true;
			else
				return false;
		} else {
			return false;
		}
	}

	/*
	 * Detects if the current browser is a Windows Phone 7 device.
	 * ex: Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; LG; GW910)
	 */
	static function is_WindowsPhone7() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'windows phone os 7' ) === false ) {
			return false;
		} else {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		}
	}

	/*
	 * Detects if the current browser is a Windows Phone 8 device.
	 * ex: Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; ARM; Touch; IEMobile/10.0; <Manufacturer>; <Device> [;<Operator>])
	 */
	static function is_windows_phone_8() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		if ( strpos( $ua, 'windows phone 8' ) === false ) {
			return false;
		} else {
			return true;
		}
	}


	/*
	 * Detects if the current browser is on a Palm device running the new WebOS. This EXCLUDES TouchPad.
	 *
	 * ex1: Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pre/1.1
	 * ex2: Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pixi/1.1
	 *
	 */
	static function is_PalmWebOS() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'webos' ) === false ) {
	   		return false;
		} else {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		}
	}

	/*
	 * Detects if the current browser is the HP TouchPad default browser. This excludes phones wt WebOS.
	 *
	 * TouchPad Emulator: Mozilla/5.0 (hp-desktop; Linux; hpwOS/2.0; U; it-IT) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.70 Safari/534.6 Desktop/1.0
	 * TouchPad: Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.0; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.70 Safari/534.6 TouchPad/1.0
	 *
	 */
	static function is_TouchPad() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$http_user_agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		if ( false !== strpos( $http_user_agent, 'hp-tablet' )  || false !== strpos( $http_user_agent, 'hpwos' ) || false !== strpos( $http_user_agent, 'touchpad' ) ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		}
		else
			return false;
	}


	/*
	 * Detects if the current browser is the Series 60 Open Source Browser.
	 *
	 * OSS Browser 3.2 on E75: Mozilla/5.0 (SymbianOS/9.3; U; Series60/3.2 NokiaE75-1/110.48.125 Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413
	 *
	 * 7.0 Browser (Nokia 5800 XpressMusic (v21.0.025)) : Mozilla/5.0 (SymbianOS/9.4; U; Series60/5.0 Nokia5800d-1/21.0.025; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413
	 *
	 * Browser 7.1 (Nokia N97 (v12.0.024)) : Mozilla/5.0 (SymbianOS/9.4; Series60/5.0 NokiaN97-1/12.0.024; Profile/MIDP-2.1 Configuration/CLDC-1.1; en-us) AppleWebKit/525 (KHTML, like Gecko) BrowserNG/7.1.12344
	 *
	 */
	static function is_S60_OSSBrowser() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   		return false;

		$pos_webkit = strpos( $agent, 'webkit' );
		if ( $pos_webkit !== false ) {
			//First, test for WebKit, then make sure it's either Symbian or S60.
			if ( strpos( $agent, 'symbian' ) !== false || strpos( $agent, 'series60' ) !== false ) {
		   			return true;
			} else
				return false;
		} elseif ( strpos( $agent, 'symbianos' ) !== false && strpos( $agent,'series60' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'nokia' ) !== false && strpos( $agent,'series60' ) !== false ) {
			return true;
		}

	    return false;
	}

	/*
	 *
	 * Detects if the device platform is the Symbian Series 60.
	 *
	 */
	static function is_symbian_platform() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$pos_webkit = strpos( $agent, 'webkit' );
		if ( $pos_webkit !== false ) {
			//First, test for WebKit, then make sure it's either Symbian or S60.
			if ( strpos( $agent, 'symbian' ) !== false || strpos( $agent, 'series60' ) !== false ) {
		   			return true;
			} else
				return false;
		} elseif ( strpos( $agent, 'symbianos' ) !== false && strpos( $agent,'series60' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'nokia' ) !== false && strpos( $agent,'series60' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'opera mini' ) !== false ) {
			if( strpos( $agent,'symbianos' ) !== false || strpos( $agent,'symbos' ) !== false || strpos( $agent,'series 60' ) !== false )
			return true;
		}

	    return false;
	}

	/*
	 *
	 * Detects if the device platform is the Symbian Series 40.
	 * Nokia Browser for Series 40 is a proxy based browser, previously known as Ovi Browser.
	 * This browser will report 'NokiaBrowser' in the header, however some older version will also report 'OviBrowser'.
	 *
	 */
	static function is_symbian_s40_platform() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $agent, 'series40' ) !== false ) {
			if( strpos( $agent,'nokia' ) !== false || strpos( $agent,'ovibrowser' ) !== false || strpos( $agent,'nokiabrowser' ) !== false )
			return true;
		}

	    return false;
	}

	static function is_J2ME_platform() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $agent, 'j2me/midp' ) !== false ) {
			return true;
		} elseif ( strpos( $agent, 'midp' ) !== false && strpos( $agent, 'cldc' ) ) {
			return true;
		}

	    return false;
	}


	/*
	 * Detects if the current UA is on one of the Maemo-based Nokia Internet Tablets.
	 */
	static function is_MaemoTablet() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$pos_maemo = strpos( $agent, 'maemo' );
		if ( $pos_maemo === false ) return false;

		//Must be Linux + Tablet, or else it could be something else.
		if ( strpos( $agent, 'tablet' ) !== false && strpos( $agent, 'linux' ) !== false ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		} else
			return false;
	}

	/*
	 * Detects if the current UA is a MeeGo device (Nokia Smartphone).
	 */
	static function is_MeeGo() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( strpos( $ua, 'meego' ) === false ) {
	   		return false;
		} else {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		}
	}


	/*
	 is_webkit() can be used to check the User Agent for an webkit generic browser
	 */
	static function is_webkit() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$pos_webkit = strpos( $agent, 'webkit' );

		if ( $pos_webkit !== false )
			return true;
		else
			return false;
	}

    /**
     * Detects if the current browser is the Native Android browser.
     * @return boolean true if the browser is Android otherwise false
     */
	static function is_android() {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		$pos_android = strpos( $agent, 'android' );
		if ( $pos_android !== false ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
	   			return false;
	   		else
	   			return true;
		}
		else
			return false;
	}


	/**
	 * Detects if the current browser is the Native Android Tablet browser.
	 * 	Assumes 'Android' should be in the user agent, but not 'mobile'
	 *
	 * @return boolean true if the browser is Android and not 'mobile' otherwise false
	 */
	static function is_android_tablet( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$pos_android = strpos( $agent, 'android' );
		$pos_mobile = strpos( $agent, 'mobile' );
		$post_android_app = strpos( $agent, 'wp-android' );

		if ( $pos_android !== false && $pos_mobile === false && $post_android_app === false ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
				return false;
			else
				return true;
		} else
			return false;
	}

	/**
	 * Detects if the current browser is the Kindle Fire Native browser.
	 *
	 * Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-84) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true
	 * Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.1.0-84) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=false
	 *
	 * @return boolean true if the browser is Kindle Fire Native browser otherwise false
	 */
	static function is_kindle_fire( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent    = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		$pos_silk = strpos( $agent, 'silk/' );
		$pos_silk_acc = strpos( $agent, 'silk-accelerated=' );
		if ( $pos_silk !== false && $pos_silk_acc !== false )
	   		return true;
		else
			return false;
	}


/**
 	* Detects if the current browser is the Kindle Touch Native browser
 	*
 	* Mozilla/5.0 (X11; U; Linux armv7l like Android; en-us) AppleWebKit/531.2+ (KHTML, like Gecko) Version/5.0 Safari/533.2+ Kindle/3.0+
 	*
 	* @return boolean true if the browser is Kindle monochrome Native browser otherwise false
 	*/
 	static function is_kindle_touch( ) {
 		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
 			return false;
 		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
 		$pos_kindle_touch = strpos( $agent, 'kindle/3.0+' );
 		if ( $pos_kindle_touch !== false && self::is_kindle_fire() === false )
 			return true;
 		else
 			return false;
 		}


	// Detect if user agent is the WordPress.com Windows 8 app (used ONLY on the custom oauth stylesheet)
	static function is_windows8_auth( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		$pos = strpos( $agent, 'msauthhost' );
		if ( $pos !== false )
	   		return true;
		else
			return false;
	}

	// Detect if user agent is the WordPress.com Windows 8 app.
	static function is_wordpress_for_win8( ) {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		$pos   = strpos( $agent, 'wp-windows8' );
		if ( $pos !== false )
			return true;
		else
			return false;
	}


	/*
	 * is_blackberry_tablet() can be used to check the User Agent for a RIM blackberry tablet
	 * The user agent of the BlackBerry® Tablet OS follows a format similar to the following:
	 * Mozilla/5.0 (PlayBook; U; RIM Tablet OS 1.0.0; en-US) AppleWebKit/534.8+ (KHTML, like Gecko) Version/0.0.1 Safari/534.8+
	 *
	 */
	static function is_blackberry_tablet() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		$pos_playbook = stripos( $agent, 'PlayBook' );
		$pos_rim_tablet = stripos( $agent, 'RIM Tablet' );

		if ( ($pos_playbook === false) || ($pos_rim_tablet === false) )
		{
			return false;
		} else {
			return true;
		}
	}

	/*
	 is_blackbeberry() can be used to check the User Agent for a blackberry device
	 Note that opera mini on BB matches this rule.
	 */
	static function is_blackbeberry() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$pos_blackberry = strpos( $agent, 'blackberry' );
		if ( $pos_blackberry !== false ) {
			if ( self::is_opera_mini() || self::is_opera_mobile() || self::is_firefox_mobile() )
				return false;
			else
				return true;
		} else {
			return false;
		}
	}

	/*
	 is_blackberry_10() can be used to check the User Agent for a BlackBerry 10 device.
	*/
	static function is_blackberry_10() {
		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		return ( strpos( $agent, 'bb10' ) !== false ) && ( strpos( $agent, 'mobile' ) !== false );
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
	 * @return string Version of the BB OS.
	 * If version is not found, get_blackbeberry_OS_version will return boolean false.
	 */
	static function get_blackbeberry_OS_version() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		if ( self::is_blackberry_10() )
			return 'blackberry-10';

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		$pos_blackberry = stripos( $agent, 'blackberry' );
		if ( $pos_blackberry === false ) {
			//not a blackberry device
			return false;
		}

		//blackberry devices OS 6.0 or higher
		//Mozilla/5.0 (BlackBerry; U; BlackBerry 9670; en) AppleWebKit/534.3+ (KHTML, like Gecko) Version/6.0.0.286 Mobile Safari/534.3+
		//Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en) AppleWebKit/534.1+ (KHTML, Like Gecko) Version/6.0.0.141 Mobile Safari/534.1+
		//Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en-US) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.0.0 Mobile Safari/534.11+
		$pos_webkit = stripos( $agent, 'webkit' );
		if ( $pos_webkit !== false ) {
			//detected blackberry webkit browser
			$pos_torch = stripos( $agent, 'BlackBerry 9800' );
			if ( $pos_torch !== false ) {
				return 'blackberry-torch'; //match the torch first edition. the 2nd edition should use the OS7 and doesn't need any special rule
			} else {
				//detecting the BB OS version for devices running OS 6.0 or higher
				if ( preg_match( '#Version\/([\d\.]+)#i', $agent, $matches ) ) {
					$version = $matches[1];
					$version_num = explode( '.', $version );
					if( is_array( $version_num ) === false || count( $version_num ) <= 1 )
						return 'blackberry-6'; //not a BB device that match our rule.
					else
					return 'blackberry-'.$version_num[0];
				} else {
					//if doesn't match returns the minimun version with a webkit browser. we should never fall here.
					return 'blackberry-6'; //not a BB device that match our rule.
				}
			}
		}

		//blackberry devices <= 5.XX
		//BlackBerry9000/5.0.0.93 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/179
		if ( preg_match( '#BlackBerry\w+\/([\d\.]+)#i', $agent, $matches ) ) {
			$version = $matches[1];
		} else {
			return false; //not a BB device that match our rule.
		}

		$version_num = explode( '.', $version );

		if( is_array( $version_num ) === false || count( $version_num ) <= 1 )
			return false;
		if ( $version_num[0] == 5 ) {
			return 'blackberry-5';
		} elseif ( $version_num[0] == 4 && $version_num[1] == 7 ) {
			return 'blackberry-4.7';
		} elseif ( $version_num[0] == 4 && $version_num[1] == 6 ) {
			return 'blackberry-4.6';
		} elseif ( $version_num[0] == 4 && $version_num[1] == 5 ) {
			return 'blackberry-4.5';
		} else {
			return false;
		}

		return false;
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
	 * @return string Type of the BB browser.
	 * If browser's version is not found, detect_blackbeberry_browser_version will return boolean false.
	 */
	static function detect_blackberry_browser_version() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
		return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( self::is_blackberry_10() )
			return 'blackberry-10';

		$pos_blackberry = strpos( $agent, 'blackberry' );
		if ( $pos_blackberry === false ) {
			//not a blackberry device
			return false;
		}

		$pos_webkit = strpos( $agent, 'webkit' );

		if ( ! ( $pos_webkit === false ) ) {
			return 'blackberry-webkit';
		} else {
			if ( preg_match( '#BlackBerry\w+\/([\d\.]+)#i', $agent, $matches ) ) {
				$version = $matches[1];
			} else {
				return false; //not a BB device that match our rule.
			}

			$version_num = explode( '.', $version );

			if( is_array( $version_num ) === false || count( $version_num ) <= 1 )
			return false;

			if ( $version_num[0] == 5 ) {
				return 'blackberry-5';
			} elseif ( $version_num[0] == 4 && $version_num[1] == 7 ) {
				return 'blackberry-4.7';
			} elseif ( $version_num[0] == 4 && $version_num[1] == 6 ) {
				return 'blackberry-4.6';
			} else {
				//A very old BB device is found or this is a BB device that doesn't match our rules.
				return false;
			}
		}
		return false;
	}

	//Checks if a visitor is coming from one of the WordPress mobile apps
	static function is_mobile_app() {

		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) )
			return false;

		$agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );

		if ( isset( $_SERVER['X_USER_AGENT'] ) && preg_match( '|wp-webos|', $_SERVER['X_USER_AGENT'] ) )
			return true; //wp4webos 1.1 or higher

		$app_agents = array( 'wp-android', 'wp-blackberry', 'wp-iphone', 'wp-nokia', 'wp-webos', 'wp-windowsphone' );
		// the mobile reader on iOS has an incorrect UA when loading the reader
		// currently it is the default one provided by the iOS framework which
		// causes problems with 2-step-auth
		// User-Agent	WordPress/3.1.4 CFNetwork/609 Darwin/13.0.0
		$app_agents[] = 'wordpress/3.1';

		foreach ( $app_agents as $app_agent ) {
			if ( false !== strpos( $agent, $app_agent ) )
			return true;
		}
		return false;
	}

  /*
	 * Detects if the current browser is Nintendo 3DS handheld.
	 *
	 * example: Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7498.US
	 * can differ in language, version and region
	 */
	static function is_Nintendo_3DS() {
	 	if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return false;
		}

		$ua = strtolower( $_SERVER['HTTP_USER_AGENT'] );
		if ( strpos( $ua, 'nintendo 3ds' ) !== false ) {
	   		return true;
		}
		return false;
	}

	/**
	 * Was the current request made by a known bot?
	 *
	 * @return boolean
	 */
	static function is_bot() {
		static $is_bot = null;

		if ( is_null( $is_bot ) ) {
			$is_bot = Jetpack_User_Agent_Info::is_bot_user_agent( $_SERVER['HTTP_USER_AGENT'] );
		}

		return $is_bot;
	}

	/**
	 * Is the given user-agent a known bot?
	 * If you want an is_bot check for the current request's UA, use is_bot() instead of passing a user-agent to this method.
	 *
	 * @param $ua (string) A user-agent string
	 * @return boolean
	 */
	static function is_bot_user_agent( $ua = null ) {

		if ( empty( $ua ) )
			return false;

		$bot_agents = array(
			'alexa', 'altavista', 'ask jeeves', 'attentio', 'baiduspider', 'bingbot', 'chtml generic', 'crawler', 'fastmobilecrawl',
			'feedfetcher-google', 'firefly', 'froogle', 'gigabot', 'googlebot', 'googlebot-mobile', 'heritrix', 'ia_archiver', 'irlbot',
			'infoseek', 'jumpbot', 'lycos', 'mediapartners', 'mediobot', 'motionbot', 'msnbot', 'mshots', 'openbot',
			'pss-webkit-request',
			'pythumbnail', 'scooter', 'slurp', 'snapbot', 'spider', 'taptubot', 'technoratisnoop',
			'teoma', 'twiceler', 'yahooseeker', 'yahooysmcm', 'yammybot',
		);

		foreach ( $bot_agents as $bot_agent ) {
			if ( false !== stripos( $ua, $bot_agent ) ) {
				return true;
			}
		}

		return false;
	}



}
