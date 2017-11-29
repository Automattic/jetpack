<?php

define( 'WORDADS_ROOT', dirname( __FILE__ ) );
define( 'WORDADS_BASENAME', plugin_basename( __FILE__ ) );
define( 'WORDADS_FILE_PATH', WORDADS_ROOT . '/' . basename( __FILE__ ) );
define( 'WORDADS_URL', plugins_url( '/', __FILE__ ) );
define( 'WORDADS_API_TEST_ID', '26942' );
define( 'WORDADS_API_TEST_ID2', '114160' );

require_once( WORDADS_ROOT . '/php/widgets.php' );
require_once( WORDADS_ROOT . '/php/api.php' );
require_once( WORDADS_ROOT . '/php/cron.php' );

class WordAds {

	public $params = null;

	/**
	 * The different supported ad types.
	 * v0.1 - mrec only for now
	 * @var array
	 */
	public static $ad_tag_ids = array(
		'mrec' => array(
			'tag'       => '300x250_mediumrectangle',
			'height'    => '250',
			'width'     => '300',
		),
		'lrec' => array(
			'tag'       => '336x280_largerectangle',
			'height'    => '280',
			'width'     => '336',
		),
		'leaderboard' => array(
			'tag'       => '728x90_leaderboard',
			'height'    => '90',
			'width'     => '728',
		),
		'wideskyscraper' => array(
			'tag'       => '160x600_wideskyscraper',
			'height'    => '600',
			'width'     => '160',
		),
	);

	/**
	 * Convenience function for grabbing options from params->options
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

		require_once( WORDADS_ROOT . '/php/params.php' );
		$this->params = new WordAds_Params();

		if ( is_admin() ) {
			require_once( WORDADS_ROOT . '/php/admin.php' );
			return;
		}

		if ( $this->should_bail() ) {
			return;
		}

		$this->insert_adcode();
	}

	/**
	 * Check for Jetpack's The_Neverending_Home_Page and use got_infinity
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
		add_filter( 'the_content', array( $this, 'insert_ad' ) );
		add_filter( 'the_excerpt', array( $this, 'insert_ad' ) );

		if ( $this->option( 'enable_header_ad' ) ) {
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
	 * @return [type] [description]
	 */
	function insert_head_meta() {
		$domain = $this->params->targeting_tags['Domain'];
		$pageURL = $this->params->targeting_tags['PageURL'];
		$adsafe = $this->params->targeting_tags['AdSafe'];
		$data_tags = ( $this->params->cloudflare ) ? ' data-cfasync="false"' : '';
		echo <<<HTML
		<script$data_tags type="text/javascript">
			var _ipw_custom = {
				wordAds: '1',
				domain: '$domain',
				pageURL: '$pageURL',
				adSafe: '$adsafe'
			};
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
		<link rel='dns-prefetch' href='//cdn.switchadhub.com' />
		<link rel='dns-prefetch' href='//delivery.g.switchadhub.com' />
		<link rel='dns-prefetch' href='//delivery.swid.switchadhub.com' />
		<script$data_tags type="text/javascript" src="//s.pubmine.com/head.js"></script>
		<script$data_tags type="text/javascript" src="//static.criteo.net/js/ld/publishertag.js"></script>
HTML;
	}

	/**
	 * Insert the ad onto the page
	 *
	 * @since 4.5.0
	 */
	function insert_ad( $content ) {
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
		if ( ! $this->params->should_show() || $disable ) {
			return $content;
		}

		$ad_type = $this->option( 'wordads_house' ) ? 'house' : 'iponweb';
		return $content . $this->get_ad( 'belowpost', $ad_type );
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
	 * Get the ad for the spot and type.
	 * @param  string $spot top, side, or belowpost
	 * @param  string $type iponweb or adsense
	 */
	function get_ad( $spot, $type = 'iponweb' ) {
		$snippet = '';
		$blocker_unit = 'mrec';
		if ( 'iponweb' == $type ) {
			$section_id = WORDADS_API_TEST_ID;
			$width = 300;
			$height = 250;
			$second_belowpost = '';
			if ( 'top' == $spot ) {
				// mrec for mobile, leaderboard for desktop
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '2';
				$width = $this->params->mobile_device ? 300 : 728;
				$height = $this->params->mobile_device ? 250 : 90;
				$blocker_unit = $this->params->mobile_device ? 'top_mrec' : 'top';
			} else if ( 'belowpost' == $spot ) {
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '1';
				$width = 300;
				$height = 250;
				if ( $this->option( 'wordads_second_belowpost', true ) ) {
					$section_id2 = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID2 : $this->params->blog_id . '4';
					$second_belowpost =
						"g.__ATA.initAd({collapseEmpty:'after', sectionId:$section_id2, width:$width, height:$height});";
				}
			}

			$data_tags = ( $this->params->cloudflare ) ? ' data-cfasync="false"' : '';
			$snippet = <<<HTML
			<script$data_tags id='s$section_id' type='text/javascript'>
				(function(g){if('undefined'!=typeof g.__ATA){
					g.__ATA.initAd({collapseEmpty:'after', sectionId:$section_id, width:$width, height:$height});
					$second_belowpost
				}})(window);
			</script>
HTML;
		} else if ( 'house' == $type ) {
			$leaderboard = 'top' == $spot && ! $this->params->mobile_device;
			$snippet = $this->get_house_ad( $leaderboard ? 'leaderboard' : 'mrec' );
			if ( 'belowpost' == $spot && $this->option( 'wordads_second_belowpost', true ) ) {
				$snippet .= $this->get_house_ad( $leaderboard ? 'leaderboard' : 'mrec' );
			}
		}

		$ad_blocker_ad = 'iponweb' == $type ? $this->get_adblocker_ad( $blocker_unit ) : '';
		$second_belowpost_css = '';
		$double_mrec = '';
		if ( 'belowpost' == $spot && $this->option( 'wordads_second_belowpost', true ) ) {
			if ( 'iponweb' == $type ) {
				$ad_blocker_ad .= $this->get_adblocker_ad( 'mrec2' );
			}

			$double_mrec = 'wpmrec2x';
			$second_belowpost_css = <<<HTML
			<style type="text/css">
			div.wpmrec2x{max-width:610px;}
			div.wpmrec2x div.u > div{float:left;margin-right:10px;}
			div.wpmrec2x div.u > div:nth-child(3n){margin-right:0px;}
			</style>
HTML;
		}

		$header = 'top' == $spot ? 'wpcnt-header' : '';
		$about = __( 'Advertisements', 'jetpack' );
		return <<<HTML
		$second_belowpost_css
		<div class="wpcnt $header $double_mrec">
			<div class="wpa">
				<span class="wpa-about">$about</span>
				<div class="u $spot">
					$snippet
				</div>
				$ad_blocker_ad
			</div>
		</div>
HTML;
	}

	/**
	 * Get Criteo Acceptable Ad unit
	 * @param  string $unit mrec, mrec2, widesky, top, top_mrec
	 *
	 * @since 5.3
	 */
	public function get_adblocker_ad( $unit = 'mrec' ) {
		$criteo_id = mt_rand();
		$height = 250;
		$width = 300;
		$zone_id = 388248;
		if ( 'mrec2' == $unit ) { // 2nd belowpost
			$zone_id = 837497;
		} else if ( 'widesky' == $unit ) { // sidebar
			$zone_id = 563902;
			$width = 160;
			$height= 600;
		} else if ( 'top' == $unit ) { // top leaderboard
			$zone_id = 563903;
			$width = 728;
			$height = 90;
		} else if ( 'top_mrec' == $unit ) { // top mrec
			$zone_id = 563903;
		}

		return <<<HTML
		<div id="crt-$criteo_id" style="width:{$width}px;height:{$height}px;"></div>
		<script type="text/javascript">
		var o = document.getElementById('crt-$criteo_id');
		if ("undefined"!=typeof Criteo) {
			var p = o.parentNode;
			p.style.setProperty('display', 'inline-block', 'important');
			o.style.setProperty('display', 'block', 'important');
			Criteo.DisplayAcceptableAdIfAdblocked({zoneid:$zone_id,containerid:"crt-$criteo_id",collapseContainerIfNotAdblocked:true,"callifnotadblocked": function () {var o = document.getElementById('crt-$criteo_id'); o.style.setProperty('display','none','important');o.style.setProperty('visbility','hidden','important'); } });
		} else {
			o.style.setProperty('display', 'none', 'important');
			o.style.setProperty('visibility', 'hidden', 'important');
		}
		</script>
HTML;
	}

	/**
	 * Check the reasons to bail before we attempt to insert ads.
	 * @return true if we should bail (don't insert ads)
	 *
	 * @since 4.5.0
	 */
	public function should_bail() {
		return ! $this->option( 'wordads_approved' );
	}

	/**
	 * Returns markup for HTML5 house ad base on unit
	 * @param  string $unit mrec, widesky, or leaderboard
	 * @return string       markup for HTML5 house ad
	 *
	 * @since 4.7.0
	 */
	public function get_house_ad( $unit = 'mrec' ) {
		if ( ! in_array( $unit, array( 'mrec', 'widesky', 'leaderboard' ) ) ) {
			$unit = 'mrec';
		}

		$width  = 300;
		$height = 250;
		if ( 'widesky' == $unit ) {
			$width  = 160;
			$height = 600;
		} else if ( 'leaderboard' == $unit ) {
			$width  = 728;
			$height = 90;
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
