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
		'mrec'           => array(
			'tag'    => '300x250_mediumrectangle',
			'height' => '250',
			'width'  => '300',
		),
		'lrec'           => array(
			'tag'    => '336x280_largerectangle',
			'height' => '280',
			'width'  => '336',
		),
		'leaderboard'    => array(
			'tag'    => '728x90_leaderboard',
			'height' => '90',
			'width'  => '728',
		),
		'wideskyscraper' => array(
			'tag'    => '160x600_wideskyscraper',
			'height' => '600',
			'width'  => '160',
		),
	);

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
	 * Instantiate the plugin
	 *
	 * @since 4.5.0
	 */
	function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Code to run on WordPress 'init' hook
	 *
	 * @since 4.5.0
	 */
	function init() {
		// bail on infinite scroll
		if ( self::is_infinite_scroll() ) {
			return;
		}

		require_once WORDADS_ROOT . '/php/params.php';
		$this->params = new WordAds_Params();

		if ( is_admin() ) {
			require_once WORDADS_ROOT . '/php/admin.php';
			return;
		}

		if ( $this->should_bail() ) {
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
	 * IPONWEB metadata used by the various scripts
	 *
	 * @return [type] [description]
	 */
	function insert_head_meta() {
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
		$data_tags = ( $this->params->cloudflare ) ? ' data-cfasync="false"' : '';
		echo <<<HTML
		<link rel='dns-prefetch' href='//s.pubmine.com' />
		<link rel='dns-prefetch' href='//x.bidswitch.net' />
		<link rel='dns-prefetch' href='//static.criteo.net' />
		<link rel='dns-prefetch' href='//ib.adnxs.com' />
		<link rel='dns-prefetch' href='//aax.amazon-adsystem.com' />
		<link rel='dns-prefetch' href='//bidder.criteo.com' />
		<link rel='dns-prefetch' href='//cas.criteo.com' />
		<link rel='dns-prefetch' href='//gum.criteo.com' />
		<link rel='dns-prefetch' href='//ads.pubmatic.com' />
		<link rel='dns-prefetch' href='//gads.pubmatic.com' />
		<link rel='dns-prefetch' href='//tpc.googlesyndication.com' />
		<link rel='dns-prefetch' href='//ad.doubleclick.net' />
		<link rel='dns-prefetch' href='//googleads.g.doubleclick.net' />
		<link rel='dns-prefetch' href='//www.googletagservices.com' />
		<script$data_tags async type="text/javascript" src="//s.pubmine.com/head.js"></script>
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
		echo <<<HTML
		<script type="text/javascript">
			jQuery('.wpcnt-header').insertBefore('$selector');
		</script>
HTML;
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

				$snippet = $this->get_ad_snippet( $section_id, $height, $width, $spot, 'float:left;margin-right:5px;margin-top:0px;' );
				if ( $this->option( 'wordads_second_belowpost', true ) ) {
					$section_id2 = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID2 : $this->params->blog_id . '4';
					$snippet    .= $this->get_ad_snippet( $section_id2, $height, $width, $spot, 'float:left;margin-top:0px;' );
				}
			} elseif ( 'inline' === $spot ) {
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '5';
				$snippet    = $this->get_ad_snippet( $section_id, $height, $width, $spot, 'mrec', 'float:left;margin-right:5px;margin-top:0px;' );
			}
		} elseif ( 'house' == $type ) {
			$leaderboard = 'top' == $spot && ! $this->params->mobile_device;
			$snippet     = $this->get_house_ad( $leaderboard ? 'leaderboard' : 'mrec' );
			if ( 'belowpost' == $spot && $this->option( 'wordads_second_belowpost', true ) ) {
				$snippet .= $this->get_house_ad( $leaderboard ? 'leaderboard' : 'mrec' );
			}
		}

		$header = 'top' == $spot ? 'wpcnt-header' : '';
		$about  = __( 'Advertisements', 'jetpack' );
		return <<<HTML
		<div class="wpcnt $header">
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
	function get_ad_snippet( $section_id, $height, $width, $location = '', $css = '' ) {
		$this->ads[] = array(
			'location' => $location,
			'width'    => $width,
			'height'   => $height,
		);
		$ad_number   = count( $this->ads );
		// Max 6 ads per page.
		if ( $ad_number > 5 && 'top' !== $location ) {
			return;
		}
		$data_tags = $this->params->cloudflare ? ' data-cfasync="false"' : '';

		return <<<HTML
		<div style="padding-bottom:15px;width:{$width}px;height:{$height}px;$css">
			<div id="atatags-{$ad_number}">
				<script$data_tags type="text/javascript">
				__ATA.cmd.push(function() {
					__ATA.initSlot('atatags-{$ad_number}',  {
						collapseEmpty: 'before',
						sectionId: '{$section_id}',
						location: '{$location}',
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
