<?php

define( 'WORDADS_ROOT', dirname( __FILE__ ) );
define( 'WORDADS_BASENAME', plugin_basename( __FILE__ ) );
define( 'WORDADS_FILE_PATH', WORDADS_ROOT . '/' . basename( __FILE__ ) );
define( 'WORDADS_URL', plugins_url( '/', __FILE__ ) );
define( 'WORDADS_API_TEST_ID', '26942' );
define( 'WORDADS_API_TEST_ID2', '114160' );

require_once WORDADS_ROOT . '/php/widgets.php';
require_once WORDADS_ROOT . '/php/api.php';
require_once WORDADS_ROOT . '/php/cron.php';

class WordAds {

	public $params = null;

	public $ads = array();

	/**
	 * Array of supported ad types.
	 *
	 * @var array
	 */
	public static $ad_tag_ids = array(
		'mrec'               => array(
			'tag'    => '300x250_mediumrectangle',
			'height' => '250',
			'width'  => '300',
		),
		'leaderboard'        => array(
			'tag'    => '728x90_leaderboard',
			'height' => '90',
			'width'  => '728',
		),
		'mobile_leaderboard' => array(
			'tag'    => '320x50_mobileleaderboard',
			'height' => '50',
			'width'  => '320',
		),
		'wideskyscraper'     => array(
			'tag'    => '160x600_wideskyscraper',
			'height' => '600',
			'width'  => '160',
		),
	);

	/**
	 * Mapping array of location slugs to placement ids
	 *
	 * @var array
	 */
	public static $ad_location_ids = array(
		'top'           => 110,
		'belowpost'     => 120,
		'belowpost2'    => 130,
		'sidebar'       => 140,
		'widget'        => 150,
		'gutenberg'     => 200,
		'inline'        => 310,
		'inline-plugin' => 320,
	);

	/**
	 * Counter to enable unique, sequential section IDs for all amp-ad units
	 *
	 * @var int
	 */
	public static $amp_section_id = 1;

	/**
	 * Checks for AMP support and returns true iff active & AMP request
	 * @return boolean True if supported AMP request
	 *
	 * @since 7.5.0
	 */
	public static function is_amp() {
		return class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request();
	}

	/**
	 * Increment the AMP section ID and return the value
	 *
	 * @return int
	 */
	public static function get_amp_section_id() {
		return self::$amp_section_id++;
	}

	public static $SOLO_UNIT_CSS = 'float:left;margin-right:5px;margin-top:0px;';

	/**
	 * Convenience function for grabbing options from params->options
	 *
	 * @param  string $option the option to grab
	 * @param  mixed  $default (optional)
	 * @return option or $default if not set
	 *
	 * @since 4.5.0
	 */
	function option( $option, $default = false ) {
		if ( ! isset( $this->params->options[ $option ] ) ) {
			return $default;
		}

		return $this->params->options[ $option ];
	}

	/**
	 * Returns the ad tag property array for supported ad types.
	 * @return array      array with ad tags
	 *
	 * @since 7.1.0
	 */
	function get_ad_tags() {
		return self::$ad_tag_ids;
	}

	/**
	 * Returns the solo css for unit
	 * @return string the special css for solo units
	 *
	 * @since 7.1.0
	 */
	function get_solo_unit_css() {
		return self::$SOLO_UNIT_CSS;
	}

	/**
	 * Instantiate the plugin
	 *
	 * @since 4.5.0
	 */
	function __construct() {
		add_action( 'wp', array( $this, 'init' ) );
		add_action( 'rest_api_init', array( $this, 'init' ) );
	}

	/**
	 * Code to run on WordPress 'init' hook
	 *
	 * @since 4.5.0
	 */
	function init() {
		require_once WORDADS_ROOT . '/php/params.php';
		$this->params = new WordAds_Params();

		if ( $this->should_bail() || self::is_infinite_scroll() ) {
			return;
		}

		if ( is_admin() ) {
			require_once WORDADS_ROOT . '/php/admin.php';
			return;
		}

		$this->insert_adcode();

		if ( '/ads.txt' === $_SERVER['REQUEST_URI'] ) {

			if ( false === ( $ads_txt_transient = get_transient( 'jetpack_ads_txt' ) ) ) {
				$ads_txt_transient = ! is_wp_error( WordAds_API::get_wordads_ads_txt() ) ? WordAds_API::get_wordads_ads_txt() : '';
				set_transient( 'jetpack_ads_txt', $ads_txt_transient, DAY_IN_SECONDS );
			}

			/**
			 * Provide plugins a way of modifying the contents of the automatically-generated ads.txt file.
			 *
			 * @module wordads
			 *
			 * @since 6.1.0
			 *
			 * @param string WordAds_API::get_wordads_ads_txt() The contents of the ads.txt file.
			 */
			$ads_txt_content = apply_filters( 'wordads_ads_txt', $ads_txt_transient );

			header( 'Content-Type: text/plain; charset=utf-8' );
			echo esc_html( $ads_txt_content );
			die();
		}
	}

	/**
	 * Check for Jetpack's The_Neverending_Home_Page and use got_infinity
	 *
	 * @return boolean true if load came from infinite scroll
	 *
	 * @since 4.5.0
	 */
	public static function is_infinite_scroll() {
		return class_exists( 'The_Neverending_Home_Page' ) && The_Neverending_Home_Page::got_infinity();
	}

	/**
	 * Add the actions/filters to insert the ads. Checks for mobile or desktop.
	 *
	 * @since 4.5.0
	 */
	private function insert_adcode() {
		add_filter( 'wp_resource_hints', array( $this, 'resource_hints' ), 10, 2 );
		add_action( 'wp_head', array( $this, 'insert_head_meta' ), 20 );
		add_action( 'wp_head', array( $this, 'insert_head_iponweb' ), 30 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_filter( 'wordads_ads_txt', array( $this, 'insert_custom_adstxt' ) );

		/**
		 * Filters enabling ads in `the_content` filter
		 *
		 * @see https://jetpack.com/support/ads/
		 *
		 * @module wordads
		 *
		 * @since 5.8.0
		 *
		 * @param bool True to disable ads in `the_content`
		 */
		if ( ! apply_filters( 'wordads_content_disable', false ) ) {
			add_filter( 'the_content', array( $this, 'insert_ad' ) );
		}

		/**
		 * Filters enabling ads in `the_excerpt` filter
		 *
		 * @see https://jetpack.com/support/ads/
		 *
		 * @module wordads
		 *
		 * @since 5.8.0
		 *
		 * @param bool True to disable ads in `the_excerpt`
		 */
		if ( ! apply_filters( 'wordads_excerpt_disable', false ) ) {
			add_filter( 'the_excerpt', array( $this, 'insert_ad' ) );
		}

		if ( $this->option( 'enable_header_ad', true ) ) {
			if ( self::is_amp() ) {
				add_filter( 'the_content', array( $this, 'insert_header_ad_amp' ) );
			} else {
				switch ( get_stylesheet() ) {
					case 'twentyseventeen':
					case 'twentyfifteen':
					case 'twentyfourteen':
						add_action( 'wp_footer', array( $this, 'insert_header_ad_special' ) );
						break;
					default:
						add_action( 'wp_head', array( $this, 'insert_header_ad' ), 100 );
						break;
				}
			}
		}
	}

	/**
	 * Register desktop scripts and styles
	 *
	 * @since 4.5.0
	 */
	function enqueue_scripts() {
		wp_enqueue_style(
			'wordads',
			WORDADS_URL . 'css/style.css',
			array(),
			'2015-12-18'
		);
	}

	/**
	 * Add the IPW resource hints
	 *
	 * @since 7.9
	 */
	public function resource_hints( $hints, $relation_type ) {
		if ( 'dns-prefetch' === $relation_type ) {
			$hints[] = '//s.pubmine.com';
			$hints[] = '//x.bidswitch.net';
			$hints[] = '//static.criteo.net';
			$hints[] = '//ib.adnxs.com';
			$hints[] = '//aax.amazon-adsystem.com';
			$hints[] = '//bidder.criteo.com';
			$hints[] = '//cas.criteo.com';
			$hints[] = '//gum.criteo.com';
			$hints[] = '//ads.pubmatic.com';
			$hints[] = '//gads.pubmatic.com';
			$hints[] = '//tpc.googlesyndication.com';
			$hints[] = '//ad.doubleclick.net';
			$hints[] = '//googleads.g.doubleclick.net';
			$hints[] = '//www.googletagservices.com';
			$hints[] = '//cdn.switchadhub.com';
			$hints[] = '//delivery.g.switchadhub.com';
			$hints[] = '//delivery.swid.switchadhub.com';
		}

		return $hints;
	}

	/**
	 * IPONWEB metadata used by the various scripts
	 *
	 * @return [type] [description]
	 */
	function insert_head_meta() {
		if ( self::is_amp() ) {
			return;
		}
		$themename = esc_js( get_stylesheet() );
		$pagetype  = intval( $this->params->get_page_type_ipw() );
		$data_tags = ( $this->params->cloudflare ) ? ' data-cfasync="false"' : '';
		$site_id   = $this->params->blog_id;
		$consent   = intval( isset( $_COOKIE['personalized-ads-consent'] ) );
		echo <<<HTML
		<script$data_tags type="text/javascript">
			var __ATA_PP = { pt: $pagetype, ht: 2, tn: '$themename', amp: false, siteid: $site_id, consent: $consent };
			var __ATA = __ATA || {};
			__ATA.cmd = __ATA.cmd || [];
			__ATA.criteo = __ATA.criteo || {};
			__ATA.criteo.cmd = __ATA.criteo.cmd || [];
		</script>
HTML;
	}

	/**
	 * IPONWEB scripts in <head>
	 *
	 * @since 4.5.0
	 */
	function insert_head_iponweb() {
		if ( self::is_amp() ) {
			return;
		}
		$data_tags = ( $this->params->cloudflare ) ? ' data-cfasync="false"' : '';
		echo <<<HTML
		<script$data_tags type="text/javascript">
			(function(){function g(a,c){a:{for(var b=a.length,d="string"==typeof a?a.split(""):a,e=0;e<b;e++)if(e in d&&c.call(void 0,d[e],e,a)){c=e;break a}c=-1}return 0>c?null:"string"==typeof a?a.charAt(c):a[c]};function h(a,c,b){b=null!=b?"="+encodeURIComponent(String(b)):"";if(c+=b){b=a.indexOf("#");0>b&&(b=a.length);var d=a.indexOf("?");if(0>d||d>b){d=b;var e=""}else e=a.substring(d+1,b);a=[a.substr(0,d),e,a.substr(b)];b=a[1];a[1]=c?b?b+"&"+c:c:b;a=a[0]+(a[1]?"?"+a[1]:"")+a[2]}return a};var k=0;function l(a,c){var b=document.createElement("script");b.src=a;b.onload=function(){c&&c(void 0)};b.onerror=function(){c("error")};a=document.getElementsByTagName("head");var d;a&&0!==a.length?d=a[0]:d=document.documentElement;d.appendChild(b)}function m(a){return"string"==typeof a&&0<a.length}
			function p(a,c,b){c=void 0===c?"":c;b=void 0===b?".":b;var d=[];Object.keys(a).forEach(function(e){var f=a[e],n=typeof f;"object"==n&&null!=f||"function"==n?d.push(p(f,c+e+b)):null!==f&&void 0!==f&&(e=encodeURIComponent(c+e),d.push(e+"="+encodeURIComponent(f)))});return d.filter(m).join("&")}function q(){return window.__ATA||{}}function r(a,c){a||(q().config=c.c,l(c.url))}var t=Math.floor(1E13*Math.random());q().rid=t;
			var u=q().pageParams,v="//"+(q().serverDomain||"s.pubmine.com")+"/conf",w=window.top===window,x;try{var y=JSON.parse(document.getElementById("oil-configuration").innerText);if("boolean"!==typeof y.gdpr_applies)throw Error("Config doesn't contain gdpr_applies");x=y.gdpr_applies?1:0}catch(a){x=null}
			var z=x,A=window.__ATA_PP||u||null,B=w?document.referrer?document.referrer:null:null,C=w?null:document.referrer?document.referrer:null,D=function(){var a=void 0===a?document.cookie:a;return(a=g(a.split("; "),function(c){return-1!=c.indexOf("__ATA_tuuid=")}))?a.split("=")[1]:""}(),E=p({gdpr:z,pp:A,rid:t,src:B,ref:C,tuuid:D?D:null,vp:window.innerWidth+"x"+window.innerHeight},"",".");
			(function(a){var c;k++;var b="callback__"+Date.now().toString(36)+"_"+k.toString(36);a=h(a,void 0===c?"cb":c,b);window[b]=function(d){r(void 0,d)};l(a,function(d){d&&r(d)})})(v+"?"+E);}).call(this);
		</script>
HTML;
	}

	/**
	 * Insert the ad onto the page
	 *
	 * @since 4.5.0
	 */
	function insert_ad( $content ) {
		// Don't insert ads in feeds, or for anything but the main display. (This is required for compatibility with the Publicize module).
		if ( is_feed() || ! is_main_query() || ! in_the_loop() ) {
			return $content;
		}
		/**
		 * Allow third-party tools to disable the display of in post ads.
		 *
		 * @module wordads
		 *
		 * @since 4.5.0
		 *
		 * @param bool true Should the in post unit be disabled. Default to false.
		 */
		$disable = apply_filters( 'wordads_inpost_disable', false );
		if ( ! $this->params->should_show() || $disable ) {
			return $content;
		}

		$ad_type = $this->option( 'wordads_house' ) ? 'house' : 'iponweb';
		return $content . $this->get_ad( 'belowpost', $ad_type );
	}

	/**
	 * Insert an inline ad into a post content
	 * Used for rendering the `wordads` shortcode.
	 *
	 * @since 6.1.0
	 */
	function insert_inline_ad( $content ) {
		// Ad JS won't work in XML feeds.
		if ( is_feed() ) {
			return $content;
		}
		/**
		 * Allow third-party tools to disable the display of in post ads.
		 *
		 * @module wordads
		 *
		 * @since 4.5.0
		 *
		 * @param bool true Should the in post unit be disabled. Default to false.
		 */
		$disable = apply_filters( 'wordads_inpost_disable', false );
		if ( $disable ) {
			return $content;
		}

		$ad_type  = $this->option( 'wordads_house' ) ? 'house' : 'iponweb';
		$content .= $this->get_ad( 'inline', $ad_type );
		return $content;
	}

	/**
	 * Inserts ad into header
	 *
	 * @since 4.5.0
	 */
	function insert_header_ad() {
		/**
		 * Allow third-party tools to disable the display of header ads.
		 *
		 * @module wordads
		 *
		 * @since 4.5.0
		 *
		 * @param bool true Should the header unit be disabled. Default to false.
		 */
		if ( apply_filters( 'wordads_header_disable', false ) ) {
			return;
		}

		$ad_type = $this->option( 'wordads_house' ) ? 'house' : 'iponweb';
		echo $this->get_ad( 'top', $ad_type );
	}

	/**
	 * Special cases for inserting header unit via jQuery
	 *
	 * @since 4.5.0
	 */
	function insert_header_ad_special() {
		/**
		 * Allow third-party tools to disable the display of header ads.
		 *
		 * @module wordads
		 *
		 * @since 4.5.0
		 *
		 * @param bool true Should the header unit be disabled. Default to false.
		 */
		if ( apply_filters( 'wordads_header_disable', false ) ) {
			return;
		}

		$selector = '#content';
		switch ( get_stylesheet() ) {
			case 'twentyseventeen':
				$selector = '#content';
				break;
			case 'twentyfifteen':
				$selector = '#main';
				break;
			case 'twentyfourteen':
				$selector = 'article:first';
				break;
		}

		$ad_type = $this->option( 'wordads_house' ) ? 'house' : 'iponweb';
		echo $this->get_ad( 'top', $ad_type );
		if ( ! self::is_amp() ) {
			echo <<<HTML
		<script type="text/javascript">
			jQuery('.wpcnt-header').insertBefore('$selector');
		</script>
HTML;
		}
	}

	/**
	 * Header unit for AMP
	 *
	 * @param string $content Content of the page.
	 *
	 * @since 7.5.0
	 */
	public function insert_header_ad_amp( $content ) {

		$ad_type = $this->option( 'wordads_house' ) ? 'house' : 'iponweb';
		if ( 'house' === $ad_type ) {
			return $content;
		}
		return $this->get_ad( 'top_amp', $ad_type ) . $content;

	}

	/**
	 * Filter the latest ads.txt to include custom user entries. Strips any tags or whitespace.
	 *
	 * @param  string $adstxt The ads.txt being filtered
	 * @return string         Filtered ads.txt with custom entries, if applicable
	 *
	 * @since 6.5.0
	 */
	function insert_custom_adstxt( $adstxt ) {
		$custom_adstxt = trim( wp_strip_all_tags( $this->option( 'wordads_custom_adstxt' ) ) );
		if ( $custom_adstxt ) {
			$adstxt .= "\n\n#Jetpack - User Custom Entries\n";
			$adstxt .= $custom_adstxt . "\n";
		}

		return $adstxt;
	}

	/**
	 * Get the ad for the spot and type.
	 *
	 * @param  string $spot top, side, inline, or belowpost
	 * @param  string $type iponweb or adsense
	 */
	function get_ad( $spot, $type = 'iponweb' ) {
		$snippet = '';
		if ( 'iponweb' == $type ) {
			// Default to mrec
			$width  = 300;
			$height = 250;

			$section_id       = WORDADS_API_TEST_ID;
			$second_belowpost = '';
			$snippet          = '';
			if ( 'top' == $spot ) {
				// mrec for mobile, leaderboard for desktop
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '2';
				$width      = $this->params->mobile_device ? 300 : 728;
				$height     = $this->params->mobile_device ? 250 : 90;
				$snippet    = $this->get_ad_snippet( $section_id, $height, $width, $spot );
			} elseif ( 'belowpost' == $spot ) {
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '1';
				$width      = 300;
				$height     = 250;

				$snippet = $this->get_ad_snippet( $section_id, $height, $width, $spot, self::$SOLO_UNIT_CSS );
				if ( $this->option( 'wordads_second_belowpost', true ) ) {
					$section_id2 = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID2 : $this->params->blog_id . '4';
					$snippet    .= $this->get_ad_snippet( $section_id2, $height, $width, $spot . '2', 'float:left;margin-top:0px;' );
				}
			} elseif ( 'inline' === $spot ) {
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '5';
				$snippet    = $this->get_ad_snippet( $section_id, $height, $width, $spot, self::$SOLO_UNIT_CSS );
			} elseif ( 'top_amp' === $spot ) {
				// 320x50 unit which can safely be inserted below title, above content in a variety of themes.
				$width   = 320;
				$height  = 50;
				$snippet = $this->get_ad_snippet( null, $height, $width );
			}
		} elseif ( 'house' == $type ) {
			$leaderboard = 'top' == $spot && ! $this->params->mobile_device;
			$snippet     = $this->get_house_ad( $leaderboard ? 'leaderboard' : 'mrec' );
			if ( 'belowpost' == $spot && $this->option( 'wordads_second_belowpost', true ) ) {
				$snippet .= $this->get_house_ad( $leaderboard ? 'leaderboard' : 'mrec' );
			}
		}

		return $this->get_ad_div( $spot, $snippet );
	}


	/**
	 * Returns the snippet to be inserted into the ad unit
	 *
	 * @param  int    $section_id
	 * @param  int    $height
	 * @param  int    $width
	 * @param  int    $location
	 * @param  string $css
	 * @return string
	 *
	 * @since 5.7
	 */
	public function get_ad_snippet( $section_id, $height, $width, $location = '', $css = '' ) {
		$this->ads[] = array(
			'location' => $location,
			'width'    => $width,
			'height'   => $height,
		);

		if ( self::is_amp() ) {
			$height         = esc_attr( $height + 15 ); // this will ensure enough padding for "Report this ad"
			$width          = esc_attr( $width );
			$amp_section_id = esc_attr( self::get_amp_section_id() );
			$site_id        = esc_attr( $this->params->blog_id );
			return <<<HTML
			<amp-ad width="$width" height="$height"
			    type="pubmine"
			    data-siteid="$site_id"
			    data-section="$amp_section_id">
			</amp-ad>
HTML;
		}

		$ad_number = count( $this->ads ) . '-' . uniqid();
		$data_tags = $this->params->cloudflare ? ' data-cfasync="false"' : '';
		$css = esc_attr( $css );

		$loc_id = 100;
		if ( ! empty( self::$ad_location_ids[ $location ] ) ) {
			$loc_id = self::$ad_location_ids[ $location ];
		}

		return <<<HTML
		<div style="padding-bottom:15px;width:{$width}px;height:{$height}px;$css">
			<div id="atatags-{$ad_number}">
				<script$data_tags type="text/javascript">
				__ATA.cmd.push(function() {
					__ATA.initSlot('atatags-{$ad_number}',  {
						collapseEmpty: 'before',
						sectionId: '{$section_id}',
						location: {$loc_id},
						width: {$width},
						height: {$height}
					});
				});
				</script>
			</div>
		</div>
HTML;
	}

	/**
	 * Returns the complete ad div with snippet to be inserted into the page
	 *
	 * @param  string  $spot top, side, inline, or belowpost
	 * @param  string  $snippet The snippet to insert into the div
	 * @param  array  $css_classes
	 * @return string The supporting ad unit div
	 *
	 * @since 7.1
	 */
	function get_ad_div( $spot, $snippet, array $css_classes = array() ) {
		if ( empty( $css_classes ) ) {
			$css_classes = array();
		}

		$css_classes[] = 'wpcnt';
		if ( 'top' == $spot ) {
			$css_classes[] = 'wpcnt-header';
		}

		$spot = esc_attr( $spot );
		$classes = esc_attr( implode( ' ', $css_classes ) );
		$about  = esc_html__( 'Advertisements', 'jetpack' );
		return <<<HTML
		<div class="$classes">
			<div class="wpa">
				<span class="wpa-about">$about</span>
				<div class="u $spot">
					$snippet
				</div>
			</div>
		</div>
HTML;
	}

	/**
	 * Check the reasons to bail before we attempt to insert ads.
	 *
	 * @return true if we should bail (don't insert ads)
	 *
	 * @since 4.5.0
	 */
	public function should_bail() {
		return ! $this->option( 'wordads_approved' ) || (bool) $this->option( 'wordads_unsafe' );
	}

	/**
	 * Returns markup for HTML5 house ad base on unit
	 *
	 * @param  string $unit mrec, widesky, or leaderboard
	 * @return string       markup for HTML5 house ad
	 *
	 * @since 4.7.0
	 */
	public function get_house_ad( $unit = 'mrec' ) {

		switch ( $unit ) {
			case 'widesky':
				$width  = 160;
				$height = 600;
				break;
			case 'leaderboard':
				$width  = 728;
				$height = 90;
				break;
			case 'mrec':
			default:
				$width  = 300;
				$height = 250;
				break;
		}

		return <<<HTML
		<iframe
			src="https://s0.wp.com/wp-content/blog-plugins/wordads/house/html5/$unit/index.html"
			width="$width"
			height="$height"
			frameborder="0"
			scrolling="no"
			marginheight="0"
			marginwidth="0">
		</iframe>
HTML;
	}

	/**
	 * Activation hook actions
	 *
	 * @since 4.5.0
	 */
	public static function activate() {
		WordAds_API::update_wordads_status_from_api();
	}
}

add_action( 'jetpack_activate_module_wordads', array( 'WordAds', 'activate' ) );
add_action( 'jetpack_activate_module_wordads', array( 'WordAds_Cron', 'activate' ) );
add_action( 'jetpack_deactivate_module_wordads', array( 'WordAds_Cron', 'deactivate' ) );

global $wordads;
$wordads = new WordAds();
