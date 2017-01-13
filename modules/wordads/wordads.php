<?php

define( 'WORDADS_ROOT', dirname( __FILE__ ) );
define( 'WORDADS_BASENAME', plugin_basename( __FILE__ ) );
define( 'WORDADS_FILE_PATH', WORDADS_ROOT . '/' . basename( __FILE__ ) );
define( 'WORDADS_URL', plugins_url( '/', __FILE__ ) );
define( 'WORDADS_API_TEST_ID', '26942' );

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
		$this->insert_extras();
	}

	/**
	 * Check for Jetpack's The_Neverending_Home_Page and use got_infinity
	 * @return boolean true if load came from infinite scroll
	 *
	 * @since 4.5.0
	 */
	public static function is_infinite_scroll() {
		return current_theme_supports( 'infinite-scroll' ) &&
				class_exists( 'The_Neverending_Home_Page' ) &&
				The_Neverending_Home_Page::got_infinity();
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
	 * Add the actions/filters to insert extra-network features.
	 *
	 * @since 4.5.0
	 */
	private function insert_extras() {
		require_once( WORDADS_ROOT . '/php/networks/amazon.php' );
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
		echo "<script$data_tags type='text/javascript' src='//s.pubmine.com/head.js'></script>";
	}

	/**
	 * Insert the ad onto the page
	 *
	 * @since 4.5.0
	 */
	function insert_ad( $content ) {
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
		if ( 'iponweb' == $type ) {
			$section_id = WORDADS_API_TEST_ID;
			$width = 300;
			$height = 250;
			if ( 'top' == $spot ) {
				// mrec for mobile, leaderboard for desktop
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '2';
				$width = $this->params->mobile_device ? 300 : 728;
				$height = $this->params->mobile_device ? 250 : 90;
			} else if ( 'belowpost' ) {
				$section_id = 0 === $this->params->blog_id ? WORDADS_API_TEST_ID : $this->params->blog_id . '1';
				$width = 300;
				$height = 250;
			}
			$data_tags = ( $this->params->cloudflare ) ? ' data-cfasync="false"' : '';
			$snippet = <<<HTML
			<script$data_tags type='text/javascript'>
				(function(g){g.__ATA.initAd({sectionId:$section_id, width:$width, height:$height});})(window);
			</script>
HTML;
		} else if ( 'house' == $type ) {
			$width = 300;
			$height = 250;
			$ad_url = 'https://s0.wp.com/wp-content/blog-plugins/wordads/house/';
			if ( 'top' == $spot && ! $this->params->mobile_device ) {
				$width = 728;
				$height = 90;
				$ad_url .= 'leaderboard.png';
			} else {
				$ad_url .= 'mrec.png';
			}

			$snippet = <<<HTML
			<a href="https://wordpress.com/create/" target="_blank">
				<img src="$ad_url" alt="WordPress.com: Grow Your Business" width="$width" height="$height" />
			</a>
HTML;
		}

		$header = 'top' == $spot ? 'wpcnt-header' : '';
		$about = __( 'About these ads', 'jetpack' );
		return <<<HTML
		<div class="wpcnt $header">
			<div class="wpa">
				<a class="wpa-about" href="https://en.wordpress.com/about-these-ads/" rel="nofollow">$about</a>
				<div class="u $spot">
					$snippet
				</div>
			</div>
		</div>
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
