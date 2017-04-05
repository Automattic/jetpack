<?php
class Jetpack_RelatedPosts {
	const VERSION = '20150408';
	const SHORTCODE = 'jetpack-related-posts';
	private static $instance = null;
	private static $instance_raw = null;

	/**
	 * Creates and returns a static instance of Jetpack_RelatedPosts.
	 *
	 * @return Jetpack_RelatedPosts
	 */
	public static function init() {
		if ( ! self::$instance ) {
			if ( class_exists('WPCOM_RelatedPosts') && method_exists( 'WPCOM_RelatedPosts', 'init' ) ) {
				self::$instance = WPCOM_RelatedPosts::init();
			} else {
				self::$instance = new Jetpack_RelatedPosts(
					get_current_blog_id(),
					Jetpack_Options::get_option( 'id' )
				);
			}
		}

		return self::$instance;
	}

	/**
	 * Creates and returns a static instance of Jetpack_RelatedPosts_Raw.
	 *
	 * @return Jetpack_RelatedPosts
	 */
	public static function init_raw() {
		if ( ! self::$instance_raw ) {
			if ( class_exists('WPCOM_RelatedPosts') && method_exists( 'WPCOM_RelatedPosts', 'init_raw' ) ) {
				self::$instance_raw = WPCOM_RelatedPosts::init_raw();
			} else {
				self::$instance_raw = new Jetpack_RelatedPosts_Raw(
					get_current_blog_id(),
					Jetpack_Options::get_option( 'id' )
				);
			}
		}

		return self::$instance_raw;
	}

	protected $_blog_id_local;
	protected $_blog_id_wpcom;
	protected $_options;
	protected $_allow_feature_toggle;
	protected $_blog_charset;
	protected $_convert_charset;
	protected $_previous_post_id;
	protected $_found_shortcode = false;

	/**
	 * Constructor for Jetpack_RelatedPosts.
	 *
	 * @param int $blog_id_local
	 * @param int $blog_id_wpcom
	 * @uses get_option, add_action, apply_filters
	 * @return null
	 */
	public function __construct( $blog_id_local, $blog_id_wpcom ) {
		$this->_blog_id_local = $blog_id_local;
		$this->_blog_id_wpcom = $blog_id_wpcom;
		$this->_blog_charset = get_option( 'blog_charset' );
		$this->_convert_charset = ( function_exists( 'iconv' ) && ! preg_match( '/^utf\-?8$/i', $this->_blog_charset ) );

		add_action( 'admin_init', array( $this, 'action_admin_init' ) );
		add_action( 'wp', array( $this, 'action_frontend_init' ) );

		if ( ! class_exists( 'Jetpack_Media_Summary' ) ) {
			jetpack_require_lib( 'class.media-summary' );
		}

		// Add Related Posts to the REST API Post response.
		if ( function_exists( 'register_rest_field' ) ) {
			add_action( 'rest_api_init',  array( $this, 'rest_register_related_posts' ) );
		}
	}

	/**
	 * =================
	 * ACTIONS & FILTERS
	 * =================
	 */

	/**
	 * Add a checkbox field to Settings > Reading for enabling related posts.
	 *
	 * @action admin_init
	 * @uses add_settings_field, __, register_setting, add_action
	 * @return null
	 */
	public function action_admin_init() {

		// Add the setting field [jetpack_relatedposts] and place it in Settings > Reading
		add_settings_field( 'jetpack_relatedposts', '<span id="jetpack_relatedposts">' . __( 'Related posts', 'jetpack' ) . '</span>', array( $this, 'print_setting_html' ), 'reading' );
		register_setting( 'reading', 'jetpack_relatedposts', array( $this, 'parse_options' ) );
		add_action('admin_head', array( $this, 'print_setting_head' ) );

		if( 'options-reading.php' == $GLOBALS['pagenow'] ) {
			// Enqueue style for live preview on the reading settings page
			$this->_enqueue_assets( false, true );
		}
	}

	/**
	 * Load related posts assets if it's a elegiable front end page or execute search and return JSON if it's an endpoint request.
	 *
	 * @global $_GET
	 * @action wp
	 * @uses add_shortcode, get_the_ID
	 * @returns null
	 */
	public function action_frontend_init() {
		// Add a shortcode handler that outputs nothing, this gets overridden later if we can display related content
		add_shortcode( self::SHORTCODE, array( $this, 'get_target_html_unsupported' ) );

		if ( ! $this->_enabled_for_request() )
			return;

		if ( isset( $_GET['relatedposts'] ) ) {
			$excludes = array();
			if ( isset( $_GET['relatedposts_exclude'] ) ) {
				if ( is_string( $_GET['relatedposts_exclude'] ) ) {
					$excludes = explode( ',', $_GET['relatedposts_exclude'] );
				} elseif ( is_array( $_GET['relatedposts_exclude'] ) ) {
					$excludes = array_values( $_GET['relatedposts_exclude'] );
				}

				$excludes = array_unique( array_filter( array_map( 'absint', $excludes ) ) );
			}

			$this->_action_frontend_init_ajax( $excludes );
		} else {
			if ( isset( $_GET['relatedposts_hit'], $_GET['relatedposts_origin'], $_GET['relatedposts_position'] ) ) {
				$this->_log_click( $_GET['relatedposts_origin'], get_the_ID(), $_GET['relatedposts_position'] );
				$this->_previous_post_id = (int) $_GET['relatedposts_origin'];
			}

			$this->_action_frontend_init_page();
		}

	}

	/**
	 * Render insertion point.
	 *
	 * @since 4.2.0
	 *
	 * @return string
	 */
	public function get_headline() {
		$options = $this->get_options();

		if ( $options['show_headline'] ) {
			$headline = sprintf(
				/** This filter is already documented in modules/sharedaddy/sharing-service.php */
				apply_filters( 'jetpack_sharing_headline_html', '<h3 class="jp-relatedposts-headline"><em>%s</em></h3>', esc_html( $options['headline'] ), 'related-posts' ),
				esc_html( $options['headline'] )
			);
		} else {
			$headline = '';
		}
		return $headline;
	}

	/**
	 * Adds a target to the post content to load related posts into if a shortcode for it did not already exist.
	 *
	 * @filter the_content
	 * @param string $content
	 * @returns string
	 */
	public function filter_add_target_to_dom( $content ) {
		if ( !$this->_found_shortcode ) {
			$content .= "\n" . $this->get_target_html();
		}

		return $content;
	}

	/**
	 * Looks for our shortcode on the unfiltered content, this has to execute early.
	 *
	 * @filter the_content
	 * @param string $content
	 * @uses has_shortcode
	 * @returns string
	 */
	public function test_for_shortcode( $content ) {
		$this->_found_shortcode = has_shortcode( $content, self::SHORTCODE );

		return $content;
	}

	/**
	 * Returns the HTML for the related posts section.
	 *
	 * @uses esc_html__, apply_filters
	 * @returns string
	 */
	public function get_target_html() {
		require_once JETPACK__PLUGIN_DIR . '/sync/class.jetpack-sync-settings.php';
		if ( Jetpack_Sync_Settings::is_syncing() ) {
			return '';
		}

		/**
		 * Filter the Related Posts headline.
		 *
		 * @module related-posts
		 *
		 * @since 3.0.0
		 *
		 * @param string $headline Related Posts heading.
		 */
		$headline = apply_filters( 'jetpack_relatedposts_filter_headline', $this->get_headline() );

		if ( $this->_previous_post_id ) {
			$exclude = "data-exclude='{$this->_previous_post_id}'";
		} else {
			$exclude = "";
		}

		return <<<EOT
<div id='jp-relatedposts' class='jp-relatedposts' $exclude>
	$headline
</div>
EOT;
	}

	/**
	 * Returns the HTML for the related posts section if it's running in the loop or other instances where we don't support related posts.
	 *
	 * @returns string
	 */
	public function get_target_html_unsupported() {
		require_once JETPACK__PLUGIN_DIR . '/sync/class.jetpack-sync-settings.php';
		if ( Jetpack_Sync_Settings::is_syncing() ) {
			return '';
		}
		return "\n\n<!-- Jetpack Related Posts is not supported in this context. -->\n\n";
	}

	/**
	 * ========================
	 * PUBLIC UTILITY FUNCTIONS
	 * ========================
	 */

	/**
	 * Gets options set for Jetpack_RelatedPosts and merge with defaults.
	 *
	 * @uses Jetpack_Options::get_option, apply_filters
	 * @return array
	 */
	public function get_options() {
		if ( null === $this->_options ) {
			$this->_options = Jetpack_Options::get_option( 'relatedposts', array() );
			if ( ! is_array( $this->_options ) )
				$this->_options = array();
			if ( ! isset( $this->_options['enabled'] ) )
				$this->_options['enabled'] = true;
			if ( ! isset( $this->_options['show_headline'] ) )
				$this->_options['show_headline'] = true;
			if ( ! isset( $this->_options['show_thumbnails'] ) )
				$this->_options['show_thumbnails'] = false;
			if ( ! isset( $this->_options['show_date'] ) ) {
				$this->_options['show_date'] = true;
			}
			if ( ! isset( $this->_options['show_context'] ) ) {
				$this->_options['show_context'] = true;
			}
			if ( ! isset( $this->_options['layout'] ) ) {
				$this->_options['layout'] = 'grid';
			}
			if ( ! isset( $this->_options['headline'] ) ) {
				$this->_options['headline'] = esc_html__( 'Related', 'jetpack' );
			}
			if ( empty( $this->_options['size'] ) || (int)$this->_options['size'] < 1 )
				$this->_options['size'] = 3;

			/**
			 * Filter Related Posts basic options.
			 *
			 * @module related-posts
			 *
			 * @since 2.8.0
			 *
			 * @param array $this->_options Array of basic Related Posts options.
			 */
			$this->_options = apply_filters( 'jetpack_relatedposts_filter_options', $this->_options );
		}

		return $this->_options;
	}

	public function get_option( $option_name ) {
		$options = $this->get_options();

		if ( isset( $options[ $option_name ] ) ) {
			return $options[ $option_name ];
		}

		return false;
	}

	/**
	 * Parses input and returns normalized options array.
	 *
	 * @param array $input
	 * @uses self::get_options
	 * @return array
	 */
	public function parse_options( $input ) {
		$current = $this->get_options();

		if ( !is_array( $input ) )
			$input = array();

		if (
			! isset( $input['enabled'] )
			|| isset( $input['show_date'] )
			|| isset( $input['show_context'] )
			|| isset( $input['layout'] )
			|| isset( $input['headline'] )
			) {
			$input['enabled'] = '1';
		}

		if ( '1' == $input['enabled'] ) {
			$current['enabled'] = true;
			$current['show_headline'] = ( isset( $input['show_headline'] ) && '1' == $input['show_headline'] );
			$current['show_thumbnails'] = ( isset( $input['show_thumbnails'] ) && '1' == $input['show_thumbnails'] );
			$current['show_date'] = ( isset( $input['show_date'] ) && '1' == $input['show_date'] );
			$current['show_context'] = ( isset( $input['show_context'] ) && '1' == $input['show_context'] );
			$current['layout'] = isset( $input['layout'] ) && in_array( $input['layout'], array( 'grid', 'list' ), true ) ? $input['layout'] : 'grid';
			$current['headline'] = isset( $input['headline'] ) ? $input['headline'] : esc_html__( 'Related', 'jetpack' );
		} else {
			$current['enabled'] = false;
		}

		if ( isset( $input['size'] ) && (int)$input['size'] > 0 )
			$current['size'] = (int)$input['size'];
		else
			$current['size'] = null;

		return $current;
	}

	/**
	 * HTML for admin settings page.
	 *
	 * @uses self::get_options, checked, esc_html__
	 * @returns null
	 */
	public function print_setting_html() {
		$options = $this->get_options();

		$ui_settings_template = <<<EOT
<ul id="settings-reading-relatedposts-customize">
	<li>
		<label><input name="jetpack_relatedposts[show_headline]" type="checkbox" value="1" %s /> %s</label>
	</li>
	<li>
		<label><input name="jetpack_relatedposts[show_thumbnails]" type="checkbox" value="1" %s /> %s</label>
	</li>
	<li>
		<label><input name="jetpack_relatedposts[show_date]" type="checkbox" value="1" %s /> %s</label>
	</li>
	<li>
		<label><input name="jetpack_relatedposts[show_context]" type="checkbox" value="1" %s /> %s</label>
	</li>
</ul>
<div id='settings-reading-relatedposts-preview'>
	%s
	<div id="jp-relatedposts" class="jp-relatedposts"></div>
</div>
EOT;
		$ui_settings = sprintf(
			$ui_settings_template,
			checked( $options['show_headline'], true, false ),
			esc_html__( 'Show a "Related" header to more clearly separate the related section from posts', 'jetpack' ),
			checked( $options['show_thumbnails'], true, false ),
			esc_html__( 'Use a large and visually striking layout', 'jetpack' ),
			checked( $options['show_date'], true, false ),
			esc_html__( 'Show entry date', 'jetpack' ),
			checked( $options['show_context'], true, false ),
			esc_html__( 'Show context (category or tag)', 'jetpack' ),
			esc_html__( 'Preview:', 'jetpack' )
		);

		if ( !$this->_allow_feature_toggle() ) {
			$template = <<<EOT
<input type="hidden" name="jetpack_relatedposts[enabled]" value="1" />
%s
EOT;
			printf(
				$template,
				$ui_settings
			);
		} else {
			$template = <<<EOT
<ul id="settings-reading-relatedposts">
	<li>
		<label><input type="radio" name="jetpack_relatedposts[enabled]" value="0" class="tog" %s /> %s</label>
	</li>
	<li>
		<label><input type="radio" name="jetpack_relatedposts[enabled]" value="1" class="tog" %s /> %s</label>
		%s
	</li>
</ul>
EOT;
			printf(
				$template,
				checked( $options['enabled'], false, false ),
				esc_html__( 'Hide related content after posts', 'jetpack' ),
				checked( $options['enabled'], true, false ),
				esc_html__( 'Show related content after posts', 'jetpack' ),
				$ui_settings
			);
		}
	}

	/**
	 * Head JS/CSS for admin settings page.
	 *
	 * @uses esc_html__
	 * @returns null
	 */
	public function print_setting_head() {

		// only dislay the Related Posts JavaScript on the Reading Settings Admin Page
		$current_screen =  get_current_screen();

		if ( is_null( $current_screen ) ) {
			return;
		}

		if( 'options-reading' != $current_screen->id )
			return;

		$related_headline = sprintf(
			'<h3 class="jp-relatedposts-headline"><em>%s</em></h3>',
			esc_html__( 'Related', 'jetpack' )
		);

		$href_params = 'class="jp-relatedposts-post-a" href="#jetpack_relatedposts" rel="nofollow" data-origin="0" data-position="0"';
		$related_with_images = <<<EOT
<div class="jp-relatedposts-items jp-relatedposts-items-visual">
	<div class="jp-relatedposts-post jp-relatedposts-post0 jp-relatedposts-post-thumbs" data-post-id="0" data-post-format="image">
		<a $href_params>
			<img class="jp-relatedposts-post-img" src="https://jetpackme.files.wordpress.com/2014/08/1-wpios-ipad-3-1-viewsite.png?w=350&amp;h=200&amp;crop=1" width="350" alt="Big iPhone/iPad Update Now Available" scale="0">
		</a>
		<h4 class="jp-relatedposts-post-title">
			<a $href_params>Big iPhone/iPad Update Now Available</a>
		</h4>
		<p class="jp-relatedposts-post-excerpt">Big iPhone/iPad Update Now Available</p>
		<p class="jp-relatedposts-post-context">In "Mobile"</p>
	</div>
	<div class="jp-relatedposts-post jp-relatedposts-post1 jp-relatedposts-post-thumbs" data-post-id="0" data-post-format="image">
		<a $href_params>
			<img class="jp-relatedposts-post-img" src="https://jetpackme.files.wordpress.com/2014/08/wordpress-com-news-wordpress-for-android-ui-update2.jpg?w=350&amp;h=200&amp;crop=1" width="350" alt="The WordPress for Android App Gets a Big Facelift" scale="0">
		</a>
		<h4 class="jp-relatedposts-post-title">
			<a $href_params>The WordPress for Android App Gets a Big Facelift</a>
		</h4>
		<p class="jp-relatedposts-post-excerpt">The WordPress for Android App Gets a Big Facelift</p>
		<p class="jp-relatedposts-post-context">In "Mobile"</p>
	</div>
	<div class="jp-relatedposts-post jp-relatedposts-post2 jp-relatedposts-post-thumbs" data-post-id="0" data-post-format="image">
		<a $href_params>
			<img class="jp-relatedposts-post-img" src="https://jetpackme.files.wordpress.com/2014/08/videopresswedding.jpg?w=350&amp;h=200&amp;crop=1" width="350" alt="Upgrade Focus: VideoPress For Weddings" scale="0">
		</a>
		<h4 class="jp-relatedposts-post-title">
			<a $href_params>Upgrade Focus: VideoPress For Weddings</a>
		</h4>
		<p class="jp-relatedposts-post-excerpt">Upgrade Focus: VideoPress For Weddings</p>
		<p class="jp-relatedposts-post-context">In "Upgrade"</p>
	</div>
</div>
EOT;
		$related_with_images = str_replace( "\n", '', $related_with_images );
		$related_without_images = <<<EOT
<div class="jp-relatedposts-items jp-relatedposts-items-minimal">
	<p class="jp-relatedposts-post jp-relatedposts-post0" data-post-id="0" data-post-format="image">
		<span class="jp-relatedposts-post-title"><a $href_params>Big iPhone/iPad Update Now Available</a></span>
		<span class="jp-relatedposts-post-context">In "Mobile"</span>
	</p>
	<p class="jp-relatedposts-post jp-relatedposts-post1" data-post-id="0" data-post-format="image">
		<span class="jp-relatedposts-post-title"><a $href_params>The WordPress for Android App Gets a Big Facelift</a></span>
		<span class="jp-relatedposts-post-context">In "Mobile"</span>
	</p>
	<p class="jp-relatedposts-post jp-relatedposts-post2" data-post-id="0" data-post-format="image">
		<span class="jp-relatedposts-post-title"><a $href_params>Upgrade Focus: VideoPress For Weddings</a></span>
		<span class="jp-relatedposts-post-context">In "Upgrade"</span>
	</p>
</div>
EOT;
		$related_without_images = str_replace( "\n", '', $related_without_images );

		if ( $this->_allow_feature_toggle() ) {
			$extra_css = '#settings-reading-relatedposts-customize { padding-left:2em; margin-top:.5em; }';
		} else {
			$extra_css = '';
		}

		echo <<<EOT
<style type="text/css">
	#settings-reading-relatedposts .disabled { opacity:.5; filter:Alpha(opacity=50); }
	#settings-reading-relatedposts-preview .jp-relatedposts { background:#fff; padding:.5em; width:75%; }
	$extra_css
</style>
<script type="text/javascript">
	jQuery( document ).ready( function($) {
		var update_ui = function() {
			var is_enabled = true;
			if ( 'radio' == $( 'input[name="jetpack_relatedposts[enabled]"]' ).attr('type') ) {
				if ( '0' == $( 'input[name="jetpack_relatedposts[enabled]"]:checked' ).val() ) {
					is_enabled = false;
				}
			}
			if ( is_enabled ) {
				$( '#settings-reading-relatedposts-customize' )
					.removeClass( 'disabled' )
					.find( 'input' )
					.attr( 'disabled', false );
				$( '#settings-reading-relatedposts-preview' )
					.removeClass( 'disabled' );
			} else {
				$( '#settings-reading-relatedposts-customize' )
					.addClass( 'disabled' )
					.find( 'input' )
					.attr( 'disabled', true );
				$( '#settings-reading-relatedposts-preview' )
					.addClass( 'disabled' );
			}
		};

		var update_preview = function() {
			var html = '';
			if ( $( 'input[name="jetpack_relatedposts[show_headline]"]:checked' ).length ) {
				html += '$related_headline';
			}
			if ( $( 'input[name="jetpack_relatedposts[show_thumbnails]"]:checked' ).length ) {
				html += '$related_with_images';
			} else {
				html += '$related_without_images';
			}
			$( '#settings-reading-relatedposts-preview .jp-relatedposts' ).html( html );
			if ( $( 'input[name="jetpack_relatedposts[show_date]"]:checked' ).length ) {
				$( '.jp-relatedposts-post-title' ).each( function() {
					$( this ).after( $( '<span>August 8, 2005</span>' ) );
				} );
			}
			if ( $( 'input[name="jetpack_relatedposts[show_context]"]:checked' ).length ) {
				$( '.jp-relatedposts-post-context' ).show();
			} else {
				$( '.jp-relatedposts-post-context' ).hide();
			}
			$( '#settings-reading-relatedposts-preview .jp-relatedposts' ).show();
		};

		// Update on load
		update_preview();
		update_ui();

		// Update on change
		$( '#settings-reading-relatedposts-customize input' )
			.change( update_preview );
		$( '#settings-reading-relatedposts' )
			.find( 'input.tog' )
			.change( update_ui );
	});
</script>
EOT;
	}

	/**
	 * Gets an array of related posts that match the given post_id.
	 *
	 * @param int $post_id
	 * @param array $args - params to use when building ElasticSearch filters to narrow down the search domain.
	 * @uses self::get_options, get_post_type, wp_parse_args, apply_filters
	 * @return array
	 */
	public function get_for_post_id( $post_id, array $args ) {
		$options = $this->get_options();

		if ( ! empty( $args['size'] ) )
			$options['size'] = $args['size'];

		if ( ! $options['enabled'] || 0 == (int)$post_id || empty( $options['size'] ) )
			return array();

		$defaults = array(
			'size' => (int)$options['size'],
			'post_type' => get_post_type( $post_id ),
			'post_formats' => array(),
			'has_terms' => array(),
			'date_range' => array(),
			'exclude_post_ids' => array(),
		);
		$args = wp_parse_args( $args, $defaults );
		/**
		 * Filter the arguments used to retrieve a list of Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array $args Array of options to retrieve Related Posts.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$args = apply_filters( 'jetpack_relatedposts_filter_args', $args, $post_id );

		$filters = $this->_get_es_filters_from_args( $post_id, $args );
		/**
		 * Filter ElasticSearch options used to calculate Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array $filters Array of ElasticSearch filters based on the post_id and args.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$filters = apply_filters( 'jetpack_relatedposts_filter_filters', $filters, $post_id );

		$results = $this->_get_related_posts( $post_id, $args['size'], $filters );
		/**
		 * Filter the array of related posts matched by ElasticSearch.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array $results Array of related posts matched by ElasticSearch.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		return apply_filters( 'jetpack_relatedposts_returned_results', $results, $post_id );
	}

	/**
	 * =========================
	 * PRIVATE UTILITY FUNCTIONS
	 * =========================
	 */

	/**
	 * Creates an array of ElasticSearch filters based on the post_id and args.
	 *
	 * @param int $post_id
	 * @param array $args
	 * @uses apply_filters, get_post_types, get_post_format_strings
	 * @return array
	 */
	protected function _get_es_filters_from_args( $post_id, array $args ) {
		$filters = array();

		/**
		 * Filter the terms used to search for Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array $args['has_terms'] Array of terms associated to the Related Posts.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$args['has_terms'] = apply_filters( 'jetpack_relatedposts_filter_has_terms', $args['has_terms'], $post_id );
		if ( ! empty( $args['has_terms'] ) ) {
			foreach( (array)$args['has_terms'] as $term ) {
				if ( mb_strlen( $term->taxonomy ) ) {
					switch ( $term->taxonomy ) {
						case 'post_tag':
							$tax_fld = 'tag.slug';
							break;
						case 'category':
							$tax_fld = 'category.slug';
							break;
						default:
							$tax_fld = 'taxonomy.' . $term->taxonomy . '.slug';
							break;
					}
					$filters[] = array( 'term' => array( $tax_fld => $term->slug ) );
				}
			}
		}

		/**
		 * Filter the Post Types where we search Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array $args['post_type'] Array of Post Types.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$args['post_type'] = apply_filters( 'jetpack_relatedposts_filter_post_type', $args['post_type'], $post_id );
		$valid_post_types = get_post_types();
		if ( is_array( $args['post_type'] ) ) {
			$sanitized_post_types = array();
			foreach ( $args['post_type'] as $pt ) {
				if ( in_array( $pt, $valid_post_types ) )
					$sanitized_post_types[] = $pt;
			}
			if ( ! empty( $sanitized_post_types ) )
				$filters[] = array( 'terms' => array( 'post_type' => $sanitized_post_types ) );
		} else if ( in_array( $args['post_type'], $valid_post_types ) && 'all' != $args['post_type'] ) {
			$filters[] = array( 'term' => array( 'post_type' => $args['post_type'] ) );
		}

		/**
		 * Filter the Post Formats where we search Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 3.3.0
		 *
		 * @param array $args['post_formats'] Array of Post Formats.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$args['post_formats'] = apply_filters( 'jetpack_relatedposts_filter_post_formats', $args['post_formats'], $post_id );
		$valid_post_formats = get_post_format_strings();
		$sanitized_post_formats = array();
		foreach ( $args['post_formats'] as $pf ) {
			if ( array_key_exists( $pf, $valid_post_formats ) ) {
				$sanitized_post_formats[] = $pf;
			}
		}
		if ( ! empty( $sanitized_post_formats ) ) {
			$filters[] = array( 'terms' => array( 'post_format' => $sanitized_post_formats ) );
		}

		/**
		 * Filter the date range used to search Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array $args['date_range'] Array of a month interval where we search Related Posts.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$args['date_range'] = apply_filters( 'jetpack_relatedposts_filter_date_range', $args['date_range'], $post_id );
		if ( is_array( $args['date_range'] ) && ! empty( $args['date_range'] ) ) {
			$args['date_range'] = array_map( 'intval', $args['date_range'] );
			if ( !empty( $args['date_range']['from'] ) && !empty( $args['date_range']['to'] ) ) {
				$filters[] = array(
					'range' => array(
						'date_gmt' => $this->_get_coalesced_range( $args['date_range'] ),
					)
				);
			}
		}

		/**
		 * Filter the Post IDs excluded from appearing in Related Posts.
		 *
		 * @module related-posts
		 *
		 * @since 2.9.0
		 *
		 * @param array $args['exclude_post_ids'] Array of Post IDs.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$args['exclude_post_ids'] = apply_filters( 'jetpack_relatedposts_filter_exclude_post_ids', $args['exclude_post_ids'], $post_id );
		if ( !empty( $args['exclude_post_ids'] ) && is_array( $args['exclude_post_ids'] ) ) {
			foreach ( $args['exclude_post_ids'] as $exclude_post_id) {
				$exclude_post_id = (int)$exclude_post_id;
				$excluded_post_ids = array();
				if ( $exclude_post_id > 0 )
					$excluded_post_ids[] = $exclude_post_id;
			}
			$filters[] = array( 'not' => array( 'terms' => array( 'post_id' => $excluded_post_ids ) ) );
		}

		return $filters;
	}

	/**
	 * Takes a range and coalesces it into a month interval bracketed by a time as determined by the blog_id to enhance caching.
	 *
	 * @param array $date_range
	 * @return array
	 */
	protected function _get_coalesced_range( array $date_range ) {
		$now = time();
		$coalesce_time = $this->_blog_id_wpcom % 86400;
		$current_time = $now - strtotime( 'today', $now );

		if ( $current_time < $coalesce_time && '01' == date( 'd', $now ) ) {
			// Move back 1 period
			return array(
				'from' => date( 'Y-m-01', strtotime( '-1 month', $date_range['from'] ) ) . ' ' . date( 'H:i:s', $coalesce_time ),
				'to'   => date( 'Y-m-01', $date_range['to'] ) . ' ' . date( 'H:i:s', $coalesce_time ),
			);
		} else {
			// Use current period
			return array(
				'from' => date( 'Y-m-01', $date_range['from'] ) . ' ' . date( 'H:i:s', $coalesce_time ),
				'to'   => date( 'Y-m-01', strtotime( '+1 month', $date_range['to'] ) ) . ' ' . date( 'H:i:s', $coalesce_time ),
			);
		}
	}

	/**
	 * Generate and output ajax response for related posts API call.
	 * NOTE: Calls exit() to end all further processing after payload has been outputed.
	 *
	 * @param array $excludes array of post_ids to exclude
	 * @uses send_nosniff_header, self::get_for_post_id, get_the_ID
	 * @return null
	 */
	protected function _action_frontend_init_ajax( array $excludes ) {
		define( 'DOING_AJAX', true );

		header( 'Content-type: application/json; charset=utf-8' ); // JSON can only be UTF-8
		send_nosniff_header();

		$options = $this->get_options();

		if ( isset( $_GET['jetpackrpcustomize'] ) ) {

			// If we're in the customizer, add dummy content.
			$date_now = current_time( get_option( 'date_format' ) );
			$related_posts = array(
				array(
					'id'       => - 1,
					'url'      => 'https://jetpackme.files.wordpress.com/2014/08/1-wpios-ipad-3-1-viewsite.png?w=350&h=200&crop=1',
					'url_meta' => array(
						'origin'   => 0,
						'position' => 0
					),
					'title'    => esc_html__( 'Big iPhone/iPad Update Now Available', 'jetpack' ),
					'date'     => $date_now,
					'format'   => false,
					'excerpt'  => esc_html__( 'It is that time of the year when devices are shiny again.', 'jetpack' ),
					'rel'      => 'nofollow',
					'context'  => esc_html__( 'In "Mobile"', 'jetpack' ),
					'img'      => array(
						'src'    => 'https://jetpackme.files.wordpress.com/2014/08/1-wpios-ipad-3-1-viewsite.png?w=350&h=200&crop=1',
						'width'  => 350,
						'height' => 200
					),
					'classes'  => array()
				),
				array(
					'id'       => - 1,
					'url'      => 'https://jetpackme.files.wordpress.com/2014/08/wordpress-com-news-wordpress-for-android-ui-update2.jpg?w=350&h=200&crop=1',
					'url_meta' => array(
						'origin'   => 0,
						'position' => 0
					),
					'title'    => esc_html__( 'The WordPress for Android App Gets a Big Facelift', 'jetpack' ),
					'date'     => $date_now,
					'format'   => false,
					'excerpt'  => esc_html__( 'Writing is new again in Android with the new WordPress app.', 'jetpack' ),
					'rel'      => 'nofollow',
					'context'  => esc_html__( 'In "Mobile"', 'jetpack' ),
					'img'      => array(
						'src'    => 'https://jetpackme.files.wordpress.com/2014/08/wordpress-com-news-wordpress-for-android-ui-update2.jpg?w=350&h=200&crop=1',
						'width'  => 350,
						'height' => 200
					),
					'classes'  => array()
				),
				array(
					'id'       => - 1,
					'url'      => 'https://jetpackme.files.wordpress.com/2014/08/videopresswedding.jpg?w=350&h=200&crop=1',
					'url_meta' => array(
						'origin'   => 0,
						'position' => 0
					),
					'title'    => esc_html__( 'Upgrade Focus, VideoPress for weddings', 'jetpack' ),
					'date'     => $date_now,
					'format'   => false,
					'excerpt'  => esc_html__( 'Weddings are in the spotlight now with VideoPress for weddings.', 'jetpack' ),
					'rel'      => 'nofollow',
					'context'  => esc_html__( 'In "Mobile"', 'jetpack' ),
					'img'      => array(
						'src'    => 'https://jetpackme.files.wordpress.com/2014/08/videopresswedding.jpg?w=350&h=200&crop=1',
						'width'  => 350,
						'height' => 200
					),
					'classes'  => array()
				),
			);

			for ( $total = 0; $total < $options['size'] - 3; $total++ ) {
				$related_posts[] = $related_posts[ $total ];
			}

			$current_post = get_post();

			// Exclude current post after filtering to make sure it's excluded and not lost during filtering.
			$excluded_posts = array_merge(
				/** This filter is already documented in modules/related-posts/jetpack-related-posts.php */
				apply_filters( 'jetpack_relatedposts_filter_exclude_post_ids', array() ),
				array( $current_post->ID )
			);

			// Fetch posts with featured image.
			$with_post_thumbnails = get_posts( array(
				'posts_per_page'   => $options['size'],
				'post__not_in'     => $excluded_posts,
				'post_type'        => $current_post->post_type,
				'meta_key'         => '_thumbnail_id',
				'suppress_filters' => false,
			) );

			// If we don't have enough, fetch posts without featured image.
			if ( 0 < ( $more = $options['size'] - count( $with_post_thumbnails ) ) ) {
				$no_post_thumbnails = get_posts( array(
					'posts_per_page'  => $more,
					'post__not_in'    => $excluded_posts,
					'post_type'       => $current_post->post_type,
					'meta_query' => array(
						array(
							'key'     => '_thumbnail_id',
							'compare' => 'NOT EXISTS',
						),
					),
					'suppress_filters' => false,
				) );
			} else {
				$no_post_thumbnails = array();
			}

			foreach ( array_merge( $with_post_thumbnails, $no_post_thumbnails ) as $index => $real_post ) {
				$related_posts[ $index ]['id']      = $real_post->ID;
				$related_posts[ $index ]['url']     = esc_url( get_permalink( $real_post ) );
				$related_posts[ $index ]['title']   = $this->_to_utf8( $this->_get_title( $real_post->post_title, $real_post->post_content ) );
				$related_posts[ $index ]['date']    = get_the_date( '', $real_post );
				$related_posts[ $index ]['excerpt'] = html_entity_decode( $this->_to_utf8( $this->_get_excerpt( $real_post->post_excerpt, $real_post->post_content ) ), ENT_QUOTES, 'UTF-8' );
				$related_posts[ $index ]['img']     = $this->_generate_related_post_image_params( $real_post->ID );
				$related_posts[ $index ]['context'] = $this->_generate_related_post_context( $real_post->ID );
			}
		} else {
			$related_posts = $this->get_for_post_id(
				get_the_ID(),
				array(
					'exclude_post_ids' => $excludes,
				)
			);
		}

		$response = array(
			'version' => self::VERSION,
			'show_thumbnails' => (bool) $options['show_thumbnails'],
			'show_date' => (bool) $options['show_date'],
			'show_context' => (bool) $options['show_context'],
			'layout' => (string) $options['layout'],
			'headline' => (string) $options['headline'],
			'items' => array(),
		);

		if ( count( $related_posts ) == $options['size'] )
			$response['items'] = $related_posts;

		echo json_encode( $response );

		exit();
	}

	/**
	 * Returns a UTF-8 encoded array of post information for the given post_id
	 *
	 * @param int $post_id
	 * @param int $position
	 * @param int $origin The post id that this is related to
	 * @uses get_post, get_permalink, remove_query_arg, get_post_format, apply_filters
	 * @return array
	 */
	protected function _get_related_post_data_for_post( $post_id, $position, $origin ) {
		$post = get_post( $post_id );

		return array(
			'id' => $post->ID,
			'url' => get_permalink( $post->ID ),
			'url_meta' => array( 'origin' => $origin, 'position' => $position ),
			'title' => $this->_to_utf8( $this->_get_title( $post->post_title, $post->post_content ) ),
			'date' => get_the_date( '', $post->ID ),
			'format' => get_post_format( $post->ID ),
			'excerpt' => html_entity_decode( $this->_to_utf8( $this->_get_excerpt( $post->post_excerpt, $post->post_content ) ), ENT_QUOTES, 'UTF-8' ),
			/**
			 * Filters the rel attribute for the Related Posts' links.
			 *
			 * @module related-posts
			 *
			 * @since 3.7.0
			 *
			 * @param string nofollow Link rel attribute for Related Posts' link. Default is nofollow.
			 * @param int $post->ID Post ID.
			 */
			'rel' => apply_filters( 'jetpack_relatedposts_filter_post_link_rel', 'nofollow', $post->ID ),
			/**
			 * Filter the context displayed below each Related Post.
			 *
			 * @module related-posts
			 *
			 * @since 3.0.0
			 *
			 * @param string $this->_to_utf8( $this->_generate_related_post_context( $post->ID ) ) Context displayed below each related post.
			 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
			 */
			'context' => apply_filters(
				'jetpack_relatedposts_filter_post_context',
				$this->_to_utf8( $this->_generate_related_post_context( $post->ID ) ),
				$post->ID
			),
			'img' => $this->_generate_related_post_image_params( $post->ID ),
			/**
			 * Filter the post css classes added on HTML markup.
			 *
			 * @module related-posts
			 *
			 * @since 3.8.0
			 *
			 * @param array array() CSS classes added on post HTML markup.
			 * @param string $post_id Post ID.
			 */
			'classes' => apply_filters(
				'jetpack_relatedposts_filter_post_css_classes',
				array(),
				$post->ID
			),
		);
	}

	/**
	 * Returns either the title or a small excerpt to use as title for post.
	 *
	 * @param string $post_title
	 * @param string $post_content
	 * @uses strip_shortcodes, wp_trim_words, __
	 * @return string
	 */
	protected function _get_title( $post_title, $post_content ) {
		if ( ! empty( $post_title ) ) {
			return wp_strip_all_tags( $post_title );
		}

		$post_title = wp_trim_words( wp_strip_all_tags( strip_shortcodes( $post_content ) ), 5, '…' );
		if ( ! empty( $post_title ) ) {
			return $post_title;
		}

		return __( 'Untitled Post', 'jetpack' );
	}

	/**
	 * Returns a plain text post excerpt for title attribute of links.
	 *
	 * @param string $post_excerpt
	 * @param string $post_content
	 * @uses strip_shortcodes, wp_strip_all_tags, wp_trim_words
	 * @return string
	 */
	protected function _get_excerpt( $post_excerpt, $post_content ) {
		if ( empty( $post_excerpt ) )
			$excerpt = $post_content;
		else
			$excerpt = $post_excerpt;

		return wp_trim_words( wp_strip_all_tags( strip_shortcodes( $excerpt ) ), 50, '…' );
	}

	/**
	 * Generates the thumbnail image to be used for the post. Uses the
	 * image as returned by Jetpack_PostImages::get_image()
	 *
	 * @param int $post_id
	 * @uses self::get_options, apply_filters, Jetpack_PostImages::get_image, Jetpack_PostImages::fit_image_url
	 * @return string
	 */
	protected function _generate_related_post_image_params( $post_id ) {
		$options = $this->get_options();
		$image_params = array(
			'src' => '',
			'width' => 0,
			'height' => 0,
		);

		if ( ! $options['show_thumbnails'] ) {
			return $image_params;
		}

		/**
		 * Filter the size of the Related Posts images.
		 *
		 * @module related-posts
		 *
		 * @since 2.8.0
		 *
		 * @param array array( 'width' => 350, 'height' => 200 ) Size of the images displayed below each Related Post.
		 */
		$thumbnail_size = apply_filters(
			'jetpack_relatedposts_filter_thumbnail_size',
			array( 'width' => 350, 'height' => 200 )
		);
		if ( !is_array( $thumbnail_size ) ) {
			$thumbnail_size = array(
				'width' => (int)$thumbnail_size,
				'height' => (int)$thumbnail_size
			);
		}

		// Try to get post image
		if ( class_exists( 'Jetpack_PostImages' ) ) {
			$img_url = '';
			$post_image = Jetpack_PostImages::get_image(
				$post_id,
				$thumbnail_size
			);

			if ( is_array($post_image) ) {
				$img_url = $post_image['src'];
			} elseif ( class_exists( 'Jetpack_Media_Summary' ) ) {
				$media = Jetpack_Media_Summary::get( $post_id );

				if ( is_array($media) && !empty( $media['image'] ) ) {
					$img_url = $media['image'];
				}
			}

			if ( !empty( $img_url ) ) {
				$image_params['width'] = $thumbnail_size['width'];
				$image_params['height'] = $thumbnail_size['height'];
				$image_params['src'] = Jetpack_PostImages::fit_image_url(
					$img_url,
					$thumbnail_size['width'],
					$thumbnail_size['height']
				);
			}
		}

		return $image_params;
	}

	/**
	 * Returns the string UTF-8 encoded
	 *
	 * @param string $text
	 * @return string
	 */
	protected function _to_utf8( $text ) {
		if ( $this->_convert_charset ) {
			return iconv( $this->_blog_charset, 'UTF-8', $text );
		} else {
			return $text;
		}
	}

	/**
	 * =============================================
	 * PROTECTED UTILITY FUNCTIONS EXTENDED BY WPCOM
	 * =============================================
	 */

	/**
	 * Workhorse method to return array of related posts matched by ElasticSearch.
	 *
	 * @param int $post_id
	 * @param int $size
	 * @param array $filters
	 * @uses wp_remote_post, is_wp_error, get_option, wp_remote_retrieve_body, get_post, add_query_arg, remove_query_arg, get_permalink, get_post_format, apply_filters
	 * @return array
	 */
	protected function _get_related_posts( $post_id, $size, array $filters ) {
		$hits = $this->_filter_non_public_posts(
			$this->_get_related_post_ids(
				$post_id,
				$size,
				$filters
			)
		);

		/**
		 * Filter the Related Posts matched by ElasticSearch.
		 *
		 * @module related-posts
		 *
		 * @since 2.9.0
		 *
		 * @param array $hits Array of Post IDs matched by ElasticSearch.
		 * @param string $post_id Post ID of the post for which we are retrieving Related Posts.
		 */
		$hits = apply_filters( 'jetpack_relatedposts_filter_hits', $hits, $post_id );

		$related_posts = array();
		foreach ( $hits as $i => $hit ) {
			$related_posts[] = $this->_get_related_post_data_for_post( $hit['id'], $i, $post_id );
		}
		return $related_posts;
	}

	/**
	 * Get array of related posts matched by ElasticSearch.
	 *
	 * @param int $post_id
	 * @param int $size
	 * @param array $filters
	 * @uses wp_remote_post, is_wp_error, wp_remote_retrieve_body, get_post_meta, update_post_meta
	 * @return array
	 */
	protected function _get_related_post_ids( $post_id, $size, array $filters ) {
		$now_ts = time();
		$cache_meta_key = '_jetpack_related_posts_cache';

		$body = array(
			'size' => (int) $size,
		);

		if ( !empty( $filters ) )
			$body['filter'] = array( 'and' => $filters );

		// Build cache key
		$cache_key = md5( serialize( $body ) );

		// Load all cached values
		if ( wp_using_ext_object_cache() ) {
			$transient_name = "{$cache_meta_key}_{$cache_key}_{$post_id}";
			$cache = get_transient( $transient_name );
			if ( false !== $cache ) {
				return $cache;
			}
		} else {
			$cache = get_post_meta( $post_id, $cache_meta_key, true );

			if ( empty( $cache ) )
				$cache = array();


			// Cache is valid! Return cached value.
			if ( isset( $cache[ $cache_key ] ) && is_array( $cache[ $cache_key ] ) && $cache[ $cache_key ][ 'expires' ] > $now_ts ) {
				return $cache[ $cache_key ][ 'payload' ];
			}
		}

		$response = wp_remote_post(
			"https://public-api.wordpress.com/rest/v1/sites/{$this->_blog_id_wpcom}/posts/$post_id/related/",
			array(
				'timeout' => 10,
				'user-agent' => 'jetpack_related_posts',
				'sslverify' => true,
				'body' => $body,
			)
		);

		// Oh no... return nothing don't cache errors.
		if ( is_wp_error( $response ) ) {
			if ( isset( $cache[ $cache_key ] ) && is_array( $cache[ $cache_key ] ) )
				return $cache[ $cache_key ][ 'payload' ]; // return stale
			else
				return array();
		}

		$results = json_decode( wp_remote_retrieve_body( $response ), true );
		$related_posts = array();
		if ( is_array( $results ) && !empty( $results['hits'] ) ) {
			foreach( $results['hits'] as $hit ) {
				$related_posts[] = array(
					'id' => $hit['fields']['post_id'],
				);
			}
		}

		// An empty array might indicate no related posts or that posts
		// are not yet synced to WordPress.com, so we cache for only 1
		// minute in this case
		if ( empty( $related_posts ) ) {
			$cache_ttl = 60;
		} else {
			$cache_ttl = 12 * HOUR_IN_SECONDS;
		}

		// Update cache
		if ( wp_using_ext_object_cache() ) {
			set_transient( $transient_name, $related_posts, $cache_ttl );
		} else {
			// Copy all valid cache values
			$new_cache = array();
			foreach ( $cache as $k => $v ) {
				if ( is_array( $v ) && $v[ 'expires' ] > $now_ts ) {
					$new_cache[ $k ] = $v;
				}
			}

			// Set new cache value
			$cache_expires = $cache_ttl + $now_ts;
			$new_cache[ $cache_key ] = array(
				'expires' => $cache_expires,
				'payload' => $related_posts,
			);
			update_post_meta( $post_id, $cache_meta_key, $new_cache );
		}

		return $related_posts;
	}

	/**
	 * Filter out any hits that are not public anymore.
	 *
	 * @param array $related_posts
	 * @uses get_post_stati, get_post_status
	 * @return array
	 */
	protected function _filter_non_public_posts( array $related_posts ) {
		$public_stati = get_post_stati( array( 'public' => true ) );

		$filtered = array();
		foreach ( $related_posts as $hit ) {
			if ( in_array( get_post_status( $hit['id'] ), $public_stati ) ) {
				$filtered[] = $hit;
			}
		}
		return $filtered;
	}

	/**
	 * Generates a context for the related content (second line in related post output).
	 * Order of importance:
	 *   - First category (Not 'Uncategorized')
	 *   - First post tag
	 *   - Number of comments
	 *
	 * @param int $post_id
	 * @uses get_the_category, get_the_terms, get_comments_number, number_format_i18n, __, _n
	 * @return string
	 */
	protected function _generate_related_post_context( $post_id ) {
		$categories = get_the_category( $post_id );
		if ( is_array( $categories ) ) {
			foreach ( $categories as $category ) {
				if ( 'uncategorized' != $category->slug && '' != trim( $category->name ) ) {
					$post_cat_context = sprintf(
						_x( 'In "%s"', 'in {category/tag name}', 'jetpack' ),
						$category->name
					);
					/**
					 * Filter the "In Category" line displayed in the post context below each Related Post.
					 *
					 * @module related-posts
					 *
					 * @since 3.2.0
					 *
					 * @param string $post_cat_context "In Category" line displayed in the post context below each Related Post.
					 * @param array $category Array containing information about the category.
					 */
					return apply_filters( 'jetpack_relatedposts_post_category_context', $post_cat_context, $category );
				}
			}
		}

		$tags = get_the_terms( $post_id, 'post_tag' );
		if ( is_array( $tags ) ) {
			foreach ( $tags as $tag ) {
				if ( '' != trim( $tag->name ) ) {
					$post_tag_context = sprintf(
						_x( 'In "%s"', 'in {category/tag name}', 'jetpack' ),
						$tag->name
					);
					/**
					 * Filter the "In Tag" line displayed in the post context below each Related Post.
					 *
					 * @module related-posts
					 *
					 * @since 3.2.0
					 *
					 * @param string $post_tag_context "In Tag" line displayed in the post context below each Related Post.
					 * @param array $tag Array containing information about the tag.
					 */
					return apply_filters( 'jetpack_relatedposts_post_tag_context', $post_tag_context, $tag );
				}
			}
		}

		$comment_count = get_comments_number( $post_id );
		if ( $comment_count > 0 ) {
			return sprintf(
				_n( 'With 1 comment', 'With %s comments', $comment_count, 'jetpack' ),
				number_format_i18n( $comment_count )
			);
		}

		return __( 'Similar post', 'jetpack' );
	}

	/**
	 * Logs clicks for clickthrough analysis and related result tuning.
	 *
	 * @return null
	 */
	protected function _log_click( $post_id, $to_post_id, $link_position ) {

	}

	/**
	 * Determines if the current post is able to use related posts.
	 *
	 * @uses self::get_options, is_admin, is_single, apply_filters
	 * @return bool
	 */
	protected function _enabled_for_request() {
		$enabled = is_single()
			&&
				! is_admin()
			&&
				( !$this->_allow_feature_toggle() || $this->get_option( 'enabled' ) );

		/**
		 * Filter the Enabled value to allow related posts to be shown on pages as well.
		 *
		 * @module related-posts
		 *
		 * @since 3.3.0
		 *
		 * @param bool $enabled Should Related Posts be enabled on the current page.
		 */
		return apply_filters( 'jetpack_relatedposts_filter_enabled_for_request', $enabled );
	}

	/**
	 * Adds filters and enqueues assets.
	 *
	 * @uses self::_enqueue_assets, self::_setup_shortcode, add_filter
	 * @return null
	 */
	protected function _action_frontend_init_page() {
		$this->_enqueue_assets( true, true );
		$this->_setup_shortcode();

		add_filter( 'the_content', array( $this, 'filter_add_target_to_dom' ), 40 );
	}

	/**
	 * Enqueues assets needed to do async loading of related posts.
	 *
	 * @uses wp_enqueue_script, wp_enqueue_style, plugins_url
	 * @return null
	 */
	protected function _enqueue_assets( $script, $style ) {
		$dependencies = is_customize_preview() ? array( 'customize-base' ) : array( 'jquery' );
		if ( $script ) {
			wp_enqueue_script( 'jetpack_related-posts', plugins_url( 'related-posts.js', __FILE__ ), $dependencies, self::VERSION );
			$related_posts_js_options = array(
				/**
				 * Filter each Related Post Heading structure.
				 *
				 * @since 4.0.0
				 *
				 * @param string $str Related Post Heading structure. Default to h4.
				 */
				'post_heading' => apply_filters( 'jetpack_relatedposts_filter_post_heading', esc_attr( 'h4' ) ),
			);
			wp_localize_script( 'jetpack_related-posts', 'related_posts_js_options', $related_posts_js_options );
		}
		if ( $style ){
			if( is_rtl() ) {
				wp_enqueue_style( 'jetpack_related-posts', plugins_url( 'rtl/related-posts-rtl.css', __FILE__ ), array(), self::VERSION );
			} else {
				wp_enqueue_style( 'jetpack_related-posts', plugins_url( 'related-posts.css', __FILE__ ), array(), self::VERSION );
			}
		}
	}

	/**
	 * Sets up the shortcode processing.
	 *
	 * @uses add_filter, add_shortcode
	 * @return null
	 */
	protected function _setup_shortcode() {
		add_filter( 'the_content', array( $this, 'test_for_shortcode' ), 0 );

		add_shortcode( self::SHORTCODE, array( $this, 'get_target_html' ) );
	}

	protected function _allow_feature_toggle() {
		if ( null === $this->_allow_feature_toggle ) {
			/**
			 * Filter the display of the Related Posts toggle in Settings > Reading.
			 *
			 * @module related-posts
			 *
			 * @since 2.8.0
			 *
			 * @param bool false Display a feature toggle. Default to false.
			 */
			$this->_allow_feature_toggle = apply_filters( 'jetpack_relatedposts_filter_allow_feature_toggle', false );
		}
		return $this->_allow_feature_toggle;
	}

	/**
	 * ===================================================
	 * FUNCTIONS EXPOSING RELATED POSTS IN THE WP REST API
	 * ===================================================
	 */

	/**
	 * Add Related Posts to the REST API Post response.
	 *
	 * @since 4.4.0
	 *
	 * @action rest_api_init
	 * @uses register_rest_field, self::rest_get_related_posts
	 * @return null
	 */
	public function rest_register_related_posts() {
		register_rest_field( 'post',
			'jetpack-related-posts',
			array(
				'get_callback' => array( $this, 'rest_get_related_posts' ),
				'update_callback' => null,
				'schema'          => null,
			)
		);
	}

	/**
	 * Build an array of Related Posts.
	 *
	 * @since 4.4.0
	 *
	 * @param array $object Details of current post.
	 * @param string $field_name Name of field.
	 * @param WP_REST_Request $request Current request
	 *
	 * @uses self::get_for_post_id
	 *
	 * @return array
	 */
	public function rest_get_related_posts( $object, $field_name, $request ) {
		return $this->get_for_post_id( $object['id'], array() );
	}
}

class Jetpack_RelatedPosts_Raw extends Jetpack_RelatedPosts {
	protected $_query_name;

	/**
	 * Allows callers of this class to tag each query with a unique name for tracking purposes.
	 *
	 * @param string $name
	 * @return Jetpack_RelatedPosts_Raw
	 */
	public function set_query_name( $name ) {
		$this->_query_name = (string) $name;
		return $this;
	}

	/**
	 * The raw related posts class can be used by other plugins or themes
	 * to get related content. This class wraps the existing RelatedPosts
	 * logic thus we never want to add anything to the DOM or do anything
	 * for event hooks. We will also not present any settings for this
	 * class and keep it enabled as calls to this class is done
	 * programmatically.
	 */
	public function action_admin_init() {}
	public function action_frontend_init() {}
	public function get_options() {
		return array(
			'enabled' => true,
		);
	}

	/**
	 * Workhorse method to return array of related posts ids matched by ElasticSearch.
	 *
	 * @param int $post_id
	 * @param int $size
	 * @param array $filters
	 * @uses wp_remote_post, is_wp_error, wp_remote_retrieve_body
	 * @return array
	 */
	protected function _get_related_posts( $post_id, $size, array $filters ) {
		$hits = $this->_filter_non_public_posts(
			$this->_get_related_post_ids(
				$post_id,
				$size,
				$filters
			)
		);

		/** This filter is already documented in modules/related-posts/related-posts.php */
		$hits = apply_filters( 'jetpack_relatedposts_filter_hits', $hits, $post_id );

		return $hits;
	}
}
