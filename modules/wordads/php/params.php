<?php

class WordAds_Params {

	/**
	 * Setup parameters for serving the ads
	 *
	 * @since 4.5.0
	 */
	public function __construct() {
		$this->options = array(
			'wordads_approved' => (bool) get_option( 'wordads_approved', false ),
			'wordads_active'   => (bool) get_option( 'wordads_active',   false ),
			'wordads_house'    => (bool) get_option( 'wordads_house',    true ),
			'enable_header_ad' => (bool) get_option( 'enable_header_ad', false )
		);

		$host = 'localhost';
		if ( isset( $_SERVER['HTTP_HOST'] ) ) {
			$host = $_SERVER['HTTP_HOST'];
		}

		$this->url = ( is_ssl() ? 'https' : 'http' ) . '://' . $host . $_SERVER['REQUEST_URI'];
		if ( ! ( false === strpos( $this->url, '?' ) ) && ! isset( $_GET['p'] ) ) {
			$this->url = substr( $this->url, 0, strpos( $this->url, '?' ) );
		}

		$this->cloudflare = self::is_cloudflare();
		$this->blog_id = Jetpack::get_option( 'id', 0 );
		$this->mobile_device = jetpack_is_mobile( 'any', true );
		$this->targeting_tags = array(
			'WordAds'   => 1,
			'BlogId'    => Jetpack::is_development_mode() ? 0 : Jetpack_Options::get_option( 'id' ),
			'Domain'    => esc_js( parse_url( home_url(), PHP_URL_HOST ) ),
			'PageURL'   => esc_js( $this->url ),
			'LangId'    => false !== strpos( get_bloginfo( 'language' ), 'en' ) ? 1 : 0, // TODO something else?
			'AdSafe'    => 1, // TODO
		);
	}

	/**
	 * @return boolean true if the user is browsing on a mobile device (iPad not included)
	 *
	 * @since 4.5.0
	 */
	public function is_mobile() {
		return ! empty( $this->mobile_device );
	}

	/**
	 * @return boolean true if site is being served via CloudFlare
	 *
	 * @since 4.5.0
	 */
	public static function is_cloudflare() {
		if ( defined( 'WORDADS_CLOUDFLARE' ) ) {
			return true;
		}
		if ( isset( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ) {
			return true;
		}
		if ( isset( $_SERVER['HTTP_CF_IPCOUNTRY'] ) ) {
			return true;
		}
		if ( isset( $_SERVER['HTTP_CF_VISITOR'] ) ) {
			return true;
		}

		return false;
	}

	/**
	 * @return boolean true if user is browsing in iOS device
	 *
	 * @since 4.5.0
	 */
	public function is_ios() {
		return in_array( $this->get_device(), array( 'ipad', 'iphone', 'ipod' ) );
	}

	/**
	 * Returns the user's device (see user-agent.php) or 'desktop'
	 * @return string user device
	 *
	 * @since 4.5.0
	 */
	public function get_device() {
		global $agent_info;

		if ( ! empty( $this->mobile_device ) ) {
			return $this->mobile_device;
		}

		if ( $agent_info->is_ipad() ) {
			return 'ipad';
		}

		return 'desktop';
	}

	/**
	 * @return string The type of page that is being loaded
	 *
	 * @since 4.5.0
	 */
	public function get_page_type() {
		if ( ! empty( $this->page_type ) ) {
			return $this->page_type;
		}

		if ( self::is_static_home() ) {
			$this->page_type = 'static_home';
		} else if ( is_home() ) {
			$this->page_type = 'home';
		} else if ( is_page() ) {
			$this->page_type = 'page';
		} else if ( is_single() ) {
			$this->page_type = 'post';
		} else if ( is_search() ) {
			$this->page_type = 'search';
		} else if ( is_category() ) {
			$this->page_type = 'category';
		} else if ( is_archive() ) {
			$this->page_type = 'archive';
		} else {
			$this->page_type = 'wtf';
		}

		return $this->page_type;
	}

	/**
	 * Returns true if page is static home
	 * @return boolean true if page is static home
	 *
	 * @since 4.5.0
	 */
	public static function is_static_home() {
		return is_front_page() &&
			'page' == get_option( 'show_on_front' ) &&
			get_option( 'page_on_front' );
	}

	/**
	 * Logic for if we should show an ad
	 *
	 * @since 4.5.0
	 */
	public static function should_show() {
		global $wp_query;
		if ( is_single() || ( is_page() && ! is_home() ) ) {
			return true;
		}

		// TODO this would be a good place for allowing the user to specify
		if ( ( is_home() || is_archive() || is_search() ) && 0 == $wp_query->current_post ) {
			return true;
		}

		return false;
	}

	/**
	 * Logic for if we should show a mobile ad
	 *
	 * @since 4.5.0
	 */
	public static function should_show_mobile() {
		global $wp_query;

		if ( ! in_the_loop() || ! did_action( 'wp_head' ) ) {
			return false;
		}

		if ( is_single() || ( is_page() && ! is_home() ) ) {
			return true;
		}

		if ( ( is_home() || is_archive() ) && 0 == $wp_query->current_post ) {
			return true;
		}

		return false;
	}
}
