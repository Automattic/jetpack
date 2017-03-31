<?php
/**
 * Generate sitemap files in base XML as well as some namespace extensions.
 *
 * This module generates two different base sitemaps.
 *
 * 1. sitemap.xml
 *    The basic sitemap is updated regularly by wp-cron. It is stored in the
 *    database and retrieved when requested. This sitemap aims to include canonical
 *    URLs for all published content and abide by the sitemap spec. This is the root
 *    of a tree of sitemap and sitemap index xml files, depending on the number of URLs.
 *
 *    By default the sitemap contains published posts of type 'post' and 'page', as
 *    well as the home url. To include other post types use the 'jetpack_sitemap_post_types'
 *    filter.
 *
 * @link http://sitemaps.org/protocol.php Base sitemaps protocol.
 * @link https://support.google.com/webmasters/answer/178636 Image sitemap extension.
 * @link https://developers.google.com/webmasters/videosearch/sitemaps Video sitemap extension.
 *
 * 2. news-sitemap.xml
 *    The news sitemap is generated on the fly when requested. It does not aim for
 *    completeness, instead including at most 1000 of the most recent published posts
 *    from the previous 2 days, per the news-sitemap spec.
 *
 * @link http://www.google.com/support/webmasters/bin/answer.py?answer=74288 News sitemap extension.
 *
 * @package Jetpack
 * @since 3.9.0
 * @since 4.8.0 Remove 1000 post limit.
 * @author Automattic
 */

require_once dirname( __FILE__ ) . '/sitemap-constants.php';
require_once dirname( __FILE__ ) . '/sitemap-buffer.php';
require_once dirname( __FILE__ ) . '/sitemap-stylist.php';
require_once dirname( __FILE__ ) . '/sitemap-librarian.php';
require_once dirname( __FILE__ ) . '/sitemap-finder.php';
require_once dirname( __FILE__ ) . '/sitemap-builder.php';

if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	require_once dirname( __FILE__ ) . '/sitemap-logger.php';
}

/**
 * Governs the generation, storage, and serving of sitemaps.
 *
 * @since 4.8.0
 */
class Jetpack_Sitemap_Manager {

	/**
	 * @see Jetpack_Sitemap_Librarian
	 * @since 4.8.0
	 * @var Jetpack_Sitemap_Librarian $librarian Librarian object for storing and retrieving sitemap data.
	 */
	private $librarian;

	/**
	 * @see Jetpack_Sitemap_Logger
	 * @since 4.8.0
	 * @var Jetpack_Sitemap_Logger $logger Logger object for reporting debug messages.
	 */
	private $logger;

	/**
	 * @see Jetpack_Sitemap_Finder
	 * @since 4.8.0
	 * @var Jetpack_Sitemap_Finder $finder Finder object for dealing with sitemap URIs.
	 */
	private $finder;

	/**
	 * Construct a new Jetpack_Sitemap_Manager.
	 *
	 * @access public
	 * @since 4.8.0
	 */
	public function __construct() {
		$this->librarian = new Jetpack_Sitemap_Librarian();
		$this->finder = new Jetpack_Sitemap_Finder();

		if ( defined( 'WP_DEBUG' ) && ( true === WP_DEBUG ) ) {
			$this->logger = new Jetpack_Sitemap_Logger();
		}

		// Add callback for sitemap URL handler.
		add_action(
			'init',
			array( $this, 'callback_action_catch_sitemap_urls' )
		);

		// Add generator to wp_cron task list.
		$this->schedule_sitemap_generation();

		// Add sitemap to robots.txt.
		add_action(
			'do_robotstxt',
			array( $this, 'callback_action_do_robotstxt' ),
			20
		);

		// The news sitemap is cached; here we add a callback to
		// flush the cached news sitemap when a post is published.
		add_action(
			'publish_post',
			array( $this, 'callback_action_flush_news_sitemap_cache' ),
			10
		);

		/*
		 * Module parameters are stored as options in the database.
		 * This allows us to avoid having to process all of init
		 * before serving the sitemap data. The following actions
		 * process and store these filters.
		 */

		// Process filters and store location string for sitemap.
		add_action(
			'init',
			array( $this, 'callback_action_filter_sitemap_location' ),
			999
		);

		return;
	}

	/**
	 * Echo a raw string of given content-type.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @param string $the_content_type The content type to be served.
	 * @param string $the_content The string to be echoed.
	 */
	private function serve_raw_and_die( $the_content_type, $the_content ) {
		header( 'Content-Type: ' . $the_content_type . '; charset=UTF-8' );

		if ( '' === $the_content ) {
			http_response_code( 404 );
			wp_die(
				esc_html__( "No sitemap found. Maybe it's being generated. Please try again later.", 'jetpack' ),
				esc_html__( 'Sitemaps', 'jetpack' ),
				array(
					'response' => 404,
				)
			);
		}

		echo $the_content;

		die();
	}

	/**
	 * Callback to intercept sitemap url requests and serve sitemap files.
	 *
	 * @access public
	 * @since 4.8.0
	 */
	public function callback_action_catch_sitemap_urls() {
		// Regular expressions for sitemap URL routing.
		$regex = array(
			'master'        => '/^sitemap\.xml$/',
			'sitemap'       => '/^sitemap-[1-9][0-9]*\.xml$/',
			'index'         => '/^sitemap-index-[1-9][0-9]*\.xml$/',
			'sitemap-style' => '/^sitemap\.xsl$/',
			'index-style'   => '/^sitemap-index\.xsl$/',
			'image'         => '/^image-sitemap-[1-9][0-9]*\.xml$/',
			'image-index'   => '/^image-sitemap-index-[1-9][0-9]*\.xml$/',
			'image-style'   => '/^image-sitemap\.xsl$/',
			'video'         => '/^video-sitemap-[1-9][0-9]*\.xml$/',
			'video-index'   => '/^video-sitemap-index-[1-9][0-9]*\.xml$/',
			'video-style'   => '/^video-sitemap\.xsl$/',
			'news'          => '/^news-sitemap\.xml$/',
			'news-style'    => '/^news-sitemap\.xsl$/',
		);

		// The raw path(+query) of the requested URI.
		if ( isset( $_SERVER['REQUEST_URI'] ) ) { // WPCS: Input var okay.
			$raw_uri = sanitize_text_field(
				wp_unslash( $_SERVER['REQUEST_URI'] ) // WPCS: Input var okay.
			);
		} else {
			$raw_uri = '';
		}

		$request = $this->finder->recognize_sitemap_uri( $raw_uri );

		if ( isset( $request['sitemap_name'] ) ) {

			/**
			 * Filter the content type used to serve the sitemap XML files.
			 *
			 * @module sitemaps
			 *
			 * @since 3.9.0
			 *
			 * @param string $xml_content_type By default, it's 'text/xml'.
			 */
			$xml_content_type = apply_filters( 'jetpack_sitemap_content_type', 'text/xml' );

			// Catch master sitemap xml.
			if ( preg_match( $regex['master'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						jp_sitemap_filename( JP_MASTER_SITEMAP_TYPE, 0 ),
						JP_MASTER_SITEMAP_TYPE
					)
				);
			}

			// Catch sitemap xml.
			if ( preg_match( $regex['sitemap'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						$request['sitemap_name'],
						JP_PAGE_SITEMAP_TYPE
					)
				);
			}

			// Catch sitemap index xml.
			if ( preg_match( $regex['index'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						$request['sitemap_name'],
						JP_PAGE_SITEMAP_INDEX_TYPE
					)
				);
			}

			// Catch sitemap xsl.
			if ( preg_match( $regex['sitemap-style'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					'application/xml',
					Jetpack_Sitemap_Stylist::sitemap_xsl()
				);
			}

			// Catch sitemap index xsl.
			if ( preg_match( $regex['index-style'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					'application/xml',
					Jetpack_Sitemap_Stylist::sitemap_index_xsl()
				);
			}

			// Catch image sitemap xml.
			if ( preg_match( $regex['image'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						$request['sitemap_name'],
						JP_IMAGE_SITEMAP_TYPE
					)
				);
			}

			// Catch image sitemap index xml.
			if ( preg_match( $regex['image-index'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						$request['sitemap_name'],
						JP_IMAGE_SITEMAP_INDEX_TYPE
					)
				);
			}

			// Catch image sitemap xsl.
			if ( preg_match( $regex['image-style'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					'application/xml',
					Jetpack_Sitemap_Stylist::image_sitemap_xsl()
				);
			}

			// Catch video sitemap xml.
			if ( preg_match( $regex['video'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						$request['sitemap_name'],
						JP_VIDEO_SITEMAP_TYPE
					)
				);
			}

			// Catch video sitemap index xml.
			if ( preg_match( $regex['video-index'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					$xml_content_type,
					$this->librarian->get_sitemap_text(
						$request['sitemap_name'],
						JP_VIDEO_SITEMAP_INDEX_TYPE
					)
				);
			}

			// Catch video sitemap xsl.
			if ( preg_match( $regex['video-style'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					'application/xml',
					Jetpack_Sitemap_Stylist::video_sitemap_xsl()
				);
			}

			// Catch news sitemap xml.
			if ( preg_match( $regex['news'], $request['sitemap_name'] ) ) {
				$sitemap_builder = new Jetpack_Sitemap_Builder();
				$this->serve_raw_and_die(
					$xml_content_type,
					$sitemap_builder->news_sitemap_xml()
				);
			}

			// Catch news sitemap xsl.
			if ( preg_match( $regex['news-style'], $request['sitemap_name'] ) ) {
				$this->serve_raw_and_die(
					'application/xml',
					Jetpack_Sitemap_Stylist::news_sitemap_xsl()
				);
			}
		}

		// URL did not match any sitemap patterns.
		return;
	}

	/**
	 * Callback for adding sitemap-interval to the list of schedules.
	 *
	 * @access public
	 * @since 4.8.0
	 *
	 * @param array $schedules The array of WP_Cron schedules.
	 *
	 * @return array The updated array of WP_Cron schedules.
	 */
	public function callback_add_sitemap_schedule( $schedules ) {
		$schedules['sitemap-interval'] = array(
			'interval' => JP_SITEMAP_INTERVAL,
			'display'  => __( 'Sitemap Interval', 'jetpack' ),
		);
		return $schedules;
	}

	/**
	 * Add actions to schedule sitemap generation.
	 * Should only be called once, in the constructor.
	 *
	 * @access private
	 * @since 4.8.0
	 */
	private function schedule_sitemap_generation() {
		// Add cron schedule.
		add_filter( 'cron_schedules', array( $this, 'callback_add_sitemap_schedule' ) );

		$sitemap_builder = new Jetpack_Sitemap_Builder();

		add_action(
			'jp_sitemap_cron_hook',
			array( $sitemap_builder, 'update_sitemap' )
		);

		if ( ! wp_next_scheduled( 'jp_sitemap_cron_hook' ) ) {
			wp_schedule_event(
				time(),
				'sitemap-interval',
				'jp_sitemap_cron_hook'
			);
		}

		return;
	}

	/**
	 * Callback to add sitemap to robots.txt.
	 *
	 * @access public
	 * @since 4.8.0
	 */
	public function callback_action_do_robotstxt() {

		/**
		 * Filter whether to make the default sitemap discoverable to robots or not. Default true.
		 *
		 * @module sitemaps
		 * @since 3.9.0
		 *
		 * @param bool $discover_sitemap Make default sitemap discoverable to robots.
		 */
		$discover_sitemap = apply_filters( 'jetpack_sitemap_generate', true );

		if ( true === $discover_sitemap ) {
			$sitemap_url      = $this->finder->construct_sitemap_url( 'sitemap.xml' );
			echo 'Sitemap: ' . esc_url( $sitemap_url ) . "\n";
		}

		/**
		 * Filter whether to make the news sitemap discoverable to robots or not. Default true.
		 *
		 * @module sitemaps
		 * @since 3.9.0
		 *
		 * @param bool $discover_news_sitemap Make default news sitemap discoverable to robots.
		 */
		$discover_news_sitemap = apply_filters( 'jetpack_news_sitemap_generate', true );

		if ( true === $discover_news_sitemap ) {
			$news_sitemap_url = $this->finder->construct_sitemap_url( 'news-sitemap.xml' );
			echo 'Sitemap: ' . esc_url( $news_sitemap_url ) . "\n";
		}

		return;
	}

	/**
	 * Callback to delete the news sitemap cache.
	 *
	 * @access public
	 * @since 4.8.0
	 */
	public function callback_action_flush_news_sitemap_cache() {
		delete_transient( 'jetpack_news_sitemap_xml' );
	}

	/**
	 * Callback to set the sitemap location.
	 *
	 * @access public
	 * @since 4.8.0
	 */
	public function callback_action_filter_sitemap_location() {
		update_option(
			'jetpack_sitemap_location',
			/**
			 * Additional path for sitemap URIs. Default value is empty.
			 *
			 * This string is any additional path fragment you want included between
			 * the home URL and the sitemap filenames. Exactly how this fragment is
			 * interpreted depends on your permalink settings. For example:
			 *
			 *   Pretty permalinks:
			 *     home_url() . jetpack_sitemap_location . '/sitemap.xml'
			 *
			 *   Plain ("ugly") permalinks:
			 *     home_url() . jetpack_sitemap_location . '/?jetpack-sitemap=sitemap.xml'
			 *
			 *   PATHINFO permalinks:
			 *     home_url() . '/index.php' . jetpack_sitemap_location . '/sitemap.xml'
			 *
			 * where 'sitemap.xml' is the name of a specific sitemap file.
			 * The value of this filter must be a valid path fragment per RFC 3986;
			 * in particular it must either be empty or begin with a '/'.
			 * Also take care that any restrictions on sitemap location imposed by
			 * the sitemap protocol are satisfied.
			 *
			 * The result of this filter is stored in an option, 'jetpack_sitemap_location';
			 * that option is what gets read when the sitemap location is needed.
			 * This way we don't have to wait for init to finish before building sitemaps.
			 *
			 * @link https://tools.ietf.org/html/rfc3986#section-3.3 RFC 3986
			 * @link http://www.sitemaps.org/ The sitemap protocol
			 *
			 * @since 4.8.0
			 */
			apply_filters(
				'jetpack_sitemap_location',
				''
			)
		);

		return;
	}

} // End Jetpack_Sitemap_Manager class.

new Jetpack_Sitemap_Manager();
