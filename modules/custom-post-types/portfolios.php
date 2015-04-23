<?php
/**
 * Plugin Name: Jetpack Portfolio
 * Plugin URI:
 * Author: Automattic
 * Version: 0.1
 * License: GPL v2 or later
 * Text Domain: jetpack
 * Domain Path: /languages/
 *
 * @todo
 * - [portfolio] shortcode: filter
 * - dismiss admin notice
 * - *pre 3.8 custom icon fallback
 * - *rewrite filter/option
 * - *drag and drop project order
 */

class Jetpack_Portfolio {
	const CUSTOM_POST_TYPE = 'jetpack-portfolio';
	const CUSTOM_TAXONOMY_TYPE = 'jetpack-portfolio-type';
	const CUSTOM_TAXONOMY_TAG = 'jetpack-portfolio-tag';
	const OPTION_NAME = 'jetpack_portfolio';
	const OPTION_READING_SETTING = 'jetpack_portfolio_posts_per_page';

	var $version = '0.1';

	static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new Jetpack_Portfolio;
		}

		return $instance;
	}

	/**
	 * Conditionally hook into WordPress.
	 *
	 * Setup user option for enabling CPT
	 * If user has CPT enabled, show in admin
	 */
	function __construct() {
		// Add an option to enable the CPT
		add_action( 'admin_init',                                                      array( $this, 'settings_api_init' ) );

		// Check on theme switch if theme supports CPT and setting is disabled
		add_action( 'after_switch_theme',                                              array( $this, 'theme_activation_post_type_support' ) );

		// Make sure the post types are loaded for imports
		add_action( 'import_start',                                                    array( $this, 'register_post_types' ) );

		// Add to REST API post type whitelist
		add_filter( 'rest_api_allowed_post_types',                                     array( $this, 'allow_portfolio_rest_api_type' ) );

		// If called via REST API, we need to register later in lifecycle
		add_action( 'restapi_theme_init',                                              array( $this, 'maybe_register_cpt' ) );

		$this->maybe_register_cpt();
	}

	/**
	 * Registers the custom post types and adds action/filter handlers, but 
	 * only if the site supports it
	 */
	function maybe_register_cpt() {
		$setting = get_option( self::OPTION_NAME, '0' );

		// Bail early if Portfolio option is not set and the theme doesn't declare support
		if ( empty( $setting ) && ! current_theme_supports( self::CUSTOM_POST_TYPE ) ) {
			return;
		}

		if ( post_type_exists( self::CUSTOM_POST_TYPE ) ) {
			exit;
		}

		// CPT magic
		$this->register_post_types();
		add_action( sprintf( 'add_option_%s', self::OPTION_NAME ),                     array( $this, 'flush_rules_on_enable' ), 10 );
		add_action( sprintf( 'update_option_%s', self::OPTION_NAME ),                  array( $this, 'flush_rules_on_enable' ), 10 );
		add_action( sprintf( 'publish_%s', self::CUSTOM_POST_TYPE),                    array( $this, 'flush_rules_on_first_project' ) );

		add_filter( 'post_updated_messages',                                           array( $this, 'updated_messages'   ) );
		add_filter( sprintf( 'manage_%s_posts_columns', self::CUSTOM_POST_TYPE),       array( $this, 'edit_admin_columns' ) );
		add_filter( sprintf( 'manage_%s_posts_custom_column', self::CUSTOM_POST_TYPE), array( $this, 'image_column'       ), 10, 2 );

		// Track all the things
		add_action( sprintf( 'add_option_%s', self::OPTION_NAME ),                     array( $this, 'new_activation_stat_bump' ) );
		add_action( sprintf( 'update_option_%s', self::OPTION_NAME ),                  array( $this, 'update_option_stat_bump' ), 11, 2 );
		add_action( sprintf( 'publish_%s', self::CUSTOM_POST_TYPE),                    array( $this, 'new_project_stat_bump' ) );

		add_image_size( 'jetpack-portfolio-admin-thumb', 50, 50, true );
		add_action( 'admin_enqueue_scripts',                                           array( $this, 'enqueue_admin_styles'  ) );
		add_action( 'after_switch_theme',                                              array( $this, 'flush_rules_on_switch' ) );

		// Portfolio shortcode
		add_shortcode( 'portfolio',                                                    array( $this, 'portfolio_shortcode' ) );

		// Adjust CPT archive and custom taxonomies to obey CPT reading setting
		add_filter( 'pre_get_posts',                                                   array( $this, 'query_reading_setting' ) );

		// Add to Dotcom XML sitemaps
		add_filter( 'wpcom_sitemap_post_types',                                        array( $this, 'add_to_sitemap' ) );

		// If CPT was enabled programatically and no CPT items exist when user switches away, disable
		if ( $setting && current_theme_supports( self::CUSTOM_POST_TYPE ) ) {
			add_action( 'switch_theme',                                                array( $this, 'deactivation_post_type_support' ) );
		}
	}

	/**
	 * Add a checkbox field in 'Settings' > 'Writing'
	 * for enabling CPT functionality.
	 *
	 * @return null
	 */
	function settings_api_init() {
		add_settings_section(
			'jetpack_cpt_section',
			'<span id="cpt-options">' . __( 'Your Custom Content Types' ) . '</span>',
			array( $this, 'jetpack_cpt_section_callback' ),
			'writing'
		);

		add_settings_field(
			self::OPTION_NAME,
			'<span class="cpt-options">' . __( 'Portfolio Projects', 'jetpack' ) . '</span>',
			array( $this, 'setting_html' ),
			'writing',
			'jetpack_cpt_section'
		);

		register_setting(
			'writing',
			self::OPTION_NAME,
			'intval'
		);

		register_setting(
			'writing',
			self::OPTION_READING_SETTING,
			'intval'
		);
	}

	/**
	 * Settings section description
	 *
	 * @todo add link to CPT support docs
	 */
	function jetpack_cpt_section_callback() {
		printf( '<p>%s</p>',
        	sprintf( __( 'Use these settings to display different types of content on your site. <a target="_blank" href="%s">Learn more</a>.' , 'jetpack' ),
        		esc_url( 'http://en.support.wordpress.com/portfolios/' )
        	)
        );
	}

	/**
	 * HTML code to display a checkbox true/false option
	 * for the Portfolio CPT setting.
	 *
	 * @return html
	 */
	function setting_html() {
		printf( '<label for="%1$s"><input name="%1$s" id="%1$s" type="checkbox" value="1" %2$s/>%3$s</label>',
			esc_attr( self::OPTION_NAME ),
			checked( get_option( self::OPTION_NAME, '0' ), true, false ),
			__( 'Enable', 'jetpack' )
		);

		printf( '<p><label for="%1$s">%2$s</label></p>',
			esc_attr( self::OPTION_READING_SETTING ),
			sprintf( __( 'Portfolio pages display at most %1$s projects', 'jetpack' ),
				sprintf( '<input name="%1$s" id="%1$s" type="number" step="1" min="1" value="%2$s" class="small-text" />',
					esc_attr( self::OPTION_READING_SETTING ),
					esc_attr( get_option( self::OPTION_READING_SETTING, '10' ), true, false )
				)
			)
		);
	}

	/*
	 * Bump Portfolio > New Activation stat
	 */
	function new_activation_stat_bump() {
		bump_stats_extras( 'portfolios', 'new-activation' );
	}

	/*
	 * Bump Portfolio > Option On/Off stats to get total active
	 */
	function update_option_stat_bump( $old, $new ) {
		if ( empty( $old ) && ! empty( $new ) ) {
			bump_stats_extras( 'portfolios', 'option-on' );
		}

		if ( ! empty( $old ) && empty( $new ) ) {
			bump_stats_extras( 'portfolios', 'option-off' );
		}
	}

	/*
	 * Bump Portfolio > Published Projects stat when projects are published
	 */
	function new_project_stat_bump() {
		bump_stats_extras( 'portfolios', 'published-projects' );
	}

	/*
	 * Flush permalinks when CPT option is turned on/off
	 */
	function flush_rules_on_enable() {
		flush_rewrite_rules();
	}

	/*
	 * Count published projects and flush permalinks when first projects is published
	 */
	function flush_rules_on_first_project() {
		$projects = get_transient( 'jetpack-portfolio-count-cache' );

		if ( false === $projects ) {
			flush_rewrite_rules();
			$projects = (int) wp_count_posts( self::CUSTOM_POST_TYPE )->publish;

			if ( ! empty( $projects ) ) {
				set_transient( 'jetpack-portfolio-count-cache', $projects, 60*60*12 );
			}
		}
	}

	/**
	 * On plugin activation, check if current theme supports CPT
	 */
	function plugin_activation_post_type_support() {
		if ( current_theme_supports( self::CUSTOM_POST_TYPE ) ) {
			update_option( self::OPTION_NAME, '1' );
		}
	}

	/**
	 * On plugin activation and theme switch, check if theme supports CPT
	 * and user setting is disabled. If so, enable option.
	 *
	 * Plugin activation is for backwards compatibility with old CPT theme support
	 */
	function theme_activation_post_type_support() {
		if ( current_theme_supports( self::CUSTOM_POST_TYPE ) ) {
			update_option( self::OPTION_NAME, '1' );
		}
	}

	/**
	 * On theme switch, check if CPT item exists and disable if not
	 */
	function deactivation_post_type_support() {
		$portfolios = get_posts( array(
			'fields'           => 'ids',
			'posts_per_page'   => 1,
			'post_type'        => self::CUSTOM_POST_TYPE,
			'suppress_filters' => false
		) );

		if ( empty( $portfolios ) ) {
			update_option( self::OPTION_NAME, '0' );
		}
	}

	/*
	 * Flush permalinks when CPT supported theme is activated
	 */
	function flush_rules_on_switch() {
		if ( current_theme_supports( self::CUSTOM_POST_TYPE ) ) {
			flush_rewrite_rules();
		}
	}

	/**
	 * Register Post Type
	 */
	function register_post_types() {
		if ( post_type_exists( self::CUSTOM_POST_TYPE ) ) {
			return;
		}

		register_post_type( self::CUSTOM_POST_TYPE, array(
			'description' => __( 'Portfolio Items', 'jetpack' ),
			'labels' => array(
				'name'               => esc_html__( 'Projects',                   'jetpack' ),
				'singular_name'      => esc_html__( 'Project',                    'jetpack' ),
				'menu_name'          => esc_html__( 'Portfolio',                  'jetpack' ),
				'all_items'          => esc_html__( 'All Projects',               'jetpack' ),
				'add_new'            => esc_html__( 'Add New',                    'jetpack' ),
				'add_new_item'       => esc_html__( 'Add New Project',            'jetpack' ),
				'edit_item'          => esc_html__( 'Edit Project',               'jetpack' ),
				'new_item'           => esc_html__( 'New Project',                'jetpack' ),
				'view_item'          => esc_html__( 'View Project',               'jetpack' ),
				'search_items'       => esc_html__( 'Search Projects',            'jetpack' ),
				'not_found'          => esc_html__( 'No Projects found',          'jetpack' ),
				'not_found_in_trash' => esc_html__( 'No Projects found in Trash', 'jetpack' ),
			),
			'supports' => array(
				'title',
				'editor',
				'thumbnail',
				'post-formats',
			),
			'rewrite' => array(
				'slug'       => 'portfolio',
				'with_front' => false,
				'feeds'      => true,
				'pages'      => true,
			),
			'public'          => true,
			'show_ui'         => true,
			'menu_position'   => 20,                    // below Pages
			'menu_icon'       => 'dashicons-portfolio', // 3.8+ dashicon option
			'capability_type' => 'page',
			'map_meta_cap'    => true,
			'taxonomies'      => array( self::CUSTOM_TAXONOMY_TYPE, self::CUSTOM_TAXONOMY_TAG ),
			'has_archive'     => true,
			'query_var'       => 'portfolio',
		) );

		register_taxonomy( self::CUSTOM_TAXONOMY_TYPE, self::CUSTOM_POST_TYPE, array(
			'hierarchical'      => true,
			'labels'            => array(
				'name'              => esc_html__( 'Project Types',         'jetpack' ),
				'singular_name'     => esc_html__( 'Project Type',          'jetpack' ),
				'menu_name'         => esc_html__( 'Project Types',         'jetpack' ),
				'all_items'         => esc_html__( 'All Project Types',     'jetpack' ),
				'edit_item'         => esc_html__( 'Edit Project Type',     'jetpack' ),
				'view_item'         => esc_html__( 'View Project Type',     'jetpack' ),
				'update_item'       => esc_html__( 'Update Project Type',   'jetpack' ),
				'add_new_item'      => esc_html__( 'Add New Project Type',  'jetpack' ),
				'new_item_name'     => esc_html__( 'New Project Type Name', 'jetpack' ),
				'parent_item'       => esc_html__( 'Parent Project Type',   'jetpack' ),
				'parent_item_colon' => esc_html__( 'Parent Project Type:',  'jetpack' ),
				'search_items'      => esc_html__( 'Search Project Types',  'jetpack' ),
			),
			'public'            => true,
			'show_ui'           => true,
			'show_in_nav_menus' => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'project-type' ),
		) );

		register_taxonomy( self::CUSTOM_TAXONOMY_TAG, self::CUSTOM_POST_TYPE, array(
			'hierarchical'      => false,
			'labels'            => array(
				'name'                       => esc_html__( 'Project Tags',                   'jetpack' ),
				'singular_name'              => esc_html__( 'Project Tag',                    'jetpack' ),
				'menu_name'                  => esc_html__( 'Project Tags',                   'jetpack' ),
				'all_items'                  => esc_html__( 'All Project Tags',               'jetpack' ),
				'edit_item'                  => esc_html__( 'Edit Project Tag',               'jetpack' ),
				'view_item'                  => esc_html__( 'View Project Tag',               'jetpack' ),
				'update_item'                => esc_html__( 'Update Project Tag',             'jetpack' ),
				'add_new_item'               => esc_html__( 'Add New Project Tag',            'jetpack' ),
				'new_item_name'              => esc_html__( 'New Project Tag Name',           'jetpack' ),
				'search_items'               => esc_html__( 'Search Project Tags',            'jetpack' ),
				'popular_items'              => esc_html__( 'Popular Project Tags',           'jetpack' ),
				'separate_items_with_commas' => esc_html__( 'Separate tags with commas',      'jetpack' ),
				'add_or_remove_items'        => esc_html__('Add or remove tags',              'jetpack' ),
				'choose_from_most_used'      => esc_html__( 'Choose from the most used tags', 'jetpack' ),
				'not_found'                  => esc_html__( 'No tags found.',                 'jetpack' ),
			),
			'public'            => true,
			'show_ui'           => true,
			'show_in_nav_menus' => true,
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => 'project-tag' ),
		) );
	}

	/**
	 * Update messages for the Portfolio admin.
	 */
	function updated_messages( $messages ) {
		global $post;

		$messages[self::CUSTOM_POST_TYPE] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => sprintf( __( 'Project updated. <a href="%s">View item</a>', 'jetpack'), esc_url( get_permalink( $post->ID ) ) ),
			2  => esc_html__( 'Custom field updated.', 'jetpack' ),
			3  => esc_html__( 'Custom field deleted.', 'jetpack' ),
			4  => esc_html__( 'Project updated.', 'jetpack' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( esc_html__( 'Project restored to revision from %s', 'jetpack'), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			6  => sprintf( __( 'Project published. <a href="%s">View project</a>', 'jetpack' ), esc_url( get_permalink( $post->ID ) ) ),
			7  => esc_html__( 'Project saved.', 'jetpack' ),
			8  => sprintf( __( 'Project submitted. <a target="_blank" href="%s">Preview project</a>', 'jetpack'), esc_url( add_query_arg( 'preview', 'true', get_permalink( $post->ID ) ) ) ),
			9  => sprintf( __( 'Project scheduled for: <strong>%1$s</strong>. <a target="_blank" href="%2$s">Preview project</a>', 'jetpack' ),
			// translators: Publish box date format, see http://php.net/date
			date_i18n( __( 'M j, Y @ G:i', 'jetpack' ), strtotime( $post->post_date ) ), esc_url( get_permalink( $post->ID ) ) ),
			10 => sprintf( __( 'Project item draft updated. <a target="_blank" href="%s">Preview project</a>', 'jetpack' ), esc_url( add_query_arg( 'preview', 'true', get_permalink( $post->ID ) ) ) ),
		);

		return $messages;
	}

	/**
	 * Change ‘Title’ column label
	 * Add Featured Image column
	 */
	function edit_admin_columns( $columns ) {
		// change 'Title' to 'Project'
		$columns['title'] = __( 'Project', 'jetpack' );

		// add featured image before 'Project'
		$columns = array_slice( $columns, 0, 1, true ) + array( 'thumbnail' => '' ) + array_slice( $columns, 1, NULL, true );

		return $columns;
	}

	/**
	 * Add featured image to column
	 */
	function image_column( $column, $post_id ) {
		global $post;
		switch ( $column ) {
			case 'thumbnail':
				echo get_the_post_thumbnail( $post_id, 'jetpack-portfolio-admin-thumb' );
				break;
		}
	}

	/**
	 * Adjust image column width
	 */
	function enqueue_admin_styles( $hook ) {
    	$screen = get_current_screen();

    	if( 'edit.php' == $hook && self::CUSTOM_POST_TYPE == $screen->post_type ) {
			wp_add_inline_style( 'wp-admin', '.manage-column.column-thumbnail { width: 50px; }' );
		}
	}

	/**
	 * Follow CPT reading setting on CPT archive and taxonomy pages
	 */
	function query_reading_setting( $query ) {
		if ( ! is_admin() &&
			$query->is_main_query() &&
			( $query->is_post_type_archive( 'jetpack-portfolio' ) || $query->is_tax( 'jetpack-portfolio-type' ) || $query->is_tax( 'jetpack-portfolio-tag' ) )
		) {
			$query->set( 'posts_per_page', get_option( self::OPTION_READING_SETTING, '10' ) );
		}
	}

	/**
	 * Add Projects to Dotcom sitemap
	 */
	function add_to_sitemap( $post_types ) {
		$post_types[] = self::CUSTOM_POST_TYPE;

		return $post_types;
	}

	/**
	 * Add to REST API post type whitelist
	 */
	function allow_portfolio_rest_api_type( $post_types ) {
		$post_types[] = self::CUSTOM_POST_TYPE;

		return $post_types;
	}

	/**
	 * Our [portfolio] shortcode.
	 * Prints Portfolio data styled to look good on *any* theme.
	 *
	 * @return portfolio_shortcode_html
	 */
	static function portfolio_shortcode( $atts ) {
		// Default attributes
		$atts = shortcode_atts( array(
			'display_types'   => true,
			'display_tags'    => true,
			'display_content' => true,
			'show_filter'     => false,
			'include_type'    => false,
			'include_tag'     => false,
			'columns'         => 2,
			'showposts'       => -1,
		), $atts, 'portfolio' );

		// A little sanitization
		if ( $atts['display_types'] && 'true' != $atts['display_types'] ) {
			$atts['display_types'] = false;
		}

		if ( $atts['display_tags'] && 'true' != $atts['display_tags'] ) {
			$atts['display_tags'] = false;
		}

		if ( $atts['display_content'] && 'true' != $atts['display_content'] ) {
			$atts['display_content'] = false;
		}

		if ( $atts['include_type'] ) {
			$atts['include_type'] = explode( ',', str_replace( ' ', '', $atts['include_type'] ) );
		}

		if ( $atts['include_tag'] ) {
			$atts['include_tag'] = explode( ',', str_replace( ' ', '', $atts['include_tag'] ) );
		}

		$atts['columns'] = absint( $atts['columns'] );

		$atts['showposts'] = intval( $atts['showposts'] );

		// enqueue shortcode styles when shortcode is used
		wp_enqueue_style( 'jetpack-portfolio-style', plugins_url( 'portfolio-shortcode.css', __FILE__ ), array(), '20140326' );

		return self::portfolio_shortcode_html( $atts );
	}

	/**
	 * Query to retrieve entries from the Portfolio post_type.
	 *
	 * @return object
	 */
	static function portfolio_query( $atts ) {
		// Default query arguments
		$args = array(
			'post_type'      => self::CUSTOM_POST_TYPE,
			'order'          => 'ASC',
			'posts_per_page' => $atts['showposts'],
		);

		if ( false != $atts['include_type'] || false != $atts['include_tag'] ) {
			$args['tax_query'] = array();
		}

		// If 'include_type' has been set use it on the main query
		if ( false != $atts['include_type'] ) {
			array_push( $args['tax_query'], array(
				'taxonomy' => self::CUSTOM_TAXONOMY_TYPE,
				'field'    => 'slug',
				'terms'    => $atts['include_type'],
			) );
		}

		// If 'include_tag' has been set use it on the main query
		if ( false != $atts['include_tag'] ) {
			array_push( $args['tax_query'], array(
				'taxonomy' => self::CUSTOM_TAXONOMY_TAG,
				'field'    => 'slug',
				'terms'    => $atts['include_tag'],
			) );
		}

		if ( false != $atts['include_type'] && false != $atts['include_tag'] ) {
			$args['tax_query']['relation'] = 'AND';
		}

		// Run the query and return
		$query = new WP_Query( $args );
		return $query;
	}

	/**
	 * The Portfolio shortcode loop.
	 *
	 * @todo add theme color styles
	 * @return html
	 */
	static function portfolio_shortcode_html( $atts ) {

		$query = self::portfolio_query( $atts );
		$html = false;
		$i = 0;

		// If we have posts, create the html
		// with hportfolio markup
		if ( $query->have_posts() ) {

			// Render styles
			//self::themecolor_styles();

			$html = '<div class="jetpack-portfolio-shortcode column-' . esc_attr( $atts['columns'] ) . '">'; // open .jetpack-portfolio

			// Construct the loop...
			while ( $query->have_posts() ) {
				$query->the_post();
				$post_id = get_the_ID();

				$html .= '<div class="portfolio-entry' . self::get_project_class( $i, $atts['columns'] ) . '">'; // open .portfolio-entry

				$html .= '<header class="portfolio-entry-header">';

				// Featured image
				$html .= self::get_thumbnail( $post_id );

				// The title
				$html .= '<h2 class="portfolio-entry-title"><a href="' . esc_url( get_permalink() ) . '">' . get_the_title() . '</a></h2>';

					$html .= '<div class="portfolio-entry-meta">';

					if ( false != $atts['display_types'] ) {
						$html .= self::get_project_type( $post_id );
					}

					if ( false != $atts['display_tags'] ) {
						$html .= self::get_project_tags( $post_id );
					}

					$html .= '</div>';

				$html .= '</header>';

				// The content
				if ( false != $atts['display_content'] ) {
					$html .= '<div class="portfolio-entry-content">' . apply_filters( 'the_excerpt', get_the_excerpt() ) . '</div>';
				}

				$html .= '</div>';  // close .portfolio-entry

				$i++;
			}

			wp_reset_postdata();

			$html .= '</div>'; // close .jetpack-portfolio
		}
		else {
			$html .= '<p><em>' . __( 'Your Portfolio Archive currently has no entries. You can start creating them on your dashboard.' ) . '</p></em>';
		}

		// If there is a [portfolio] within a [portfolio], remove the shortcode
		if ( has_shortcode( $html, 'portfolio' ) ) {
			remove_shortcode( 'portfolio' );
		}

		// Return the HTML block
		return $html;
	}

	/**
	 * Individual project class
	 *
	 * @return string
	 */
	static function get_project_class( $i, $columns ) {
		$project_types = wp_get_object_terms( get_the_ID(), self::CUSTOM_TAXONOMY_TYPE, array( 'fields' => 'slugs' ) );
		$class = '';

		// add a type- class for each project type
		foreach ( $project_types as $project_type ) {
			$class .= ' type-' . esc_html( $project_type );
		}

		// add first and last classes to first and last items in a row
		if ( ($i % $columns) == 0 ) {
			$class .= ' first-item-row';
		} elseif ( ($i % $columns) == ( $columns - 1 ) ) {
			$class .= ' last-item-row';
		}

		return esc_attr( $class );
	}

	/**
	 * Displays the project type that a project belongs to.
	 *
	 * @return html
	 */
	static function get_project_type( $post_id ) {
		$project_types = get_the_terms( $post_id, self::CUSTOM_TAXONOMY_TYPE );

		// If no types, return empty string
		if ( empty( $project_types ) || is_wp_error( $project_types ) ) {
			return;
		}

		$html = '<div class="project-types"><span>' . __( 'Types', 'jetpack' ) . '</span>';

		// Loop thorugh all the types
		foreach ( $project_types as $project_type ) {
			$project_type_link = get_term_link( $project_type, self::CUSTOM_TAXONOMY_TYPE );

			if ( is_wp_error( $project_type_link ) ) {
				return $project_type_link;
			}

			$html .= '<a href="' . esc_url( $project_type_link ) . '" rel="tag">' . esc_html( $project_type->name ) . '</a>';
		}

		$html .= '</div>';

		return $html;
	}

	/**
	 * Displays the project tags that a project belongs to.
	 *
	 * @return html
	 */
	static function get_project_tags( $post_id ) {
		$project_tags = get_the_terms( $post_id, self::CUSTOM_TAXONOMY_TAG );

		// If no tags, return empty string
		if ( empty( $project_tags ) || is_wp_error( $project_tags ) ) {
			return false;
		}

		$html = '<div class="project-tags"><span>' . __( 'Tags', 'jetpack' ) . '</span>';

		// Loop thorugh all the tags
		foreach ( $project_tags as $project_tag ) {
			$project_tag_link = get_term_link( $project_tag, self::CUSTOM_TAXONOMY_TYPE );

			if ( is_wp_error( $project_tag_link ) ) {
				return $project_tag_link;
			}

			$html .= '<a href="' . esc_url( $project_tag_link ) . '" rel="tag">' . esc_html( $project_tag->name ) . '</a>';
		}

		$html .= '</div>';

		return $html;
	}

	/**
	 * Display the featured image if it's available
	 *
	 * @return html
	 */
	static function get_thumbnail( $post_id ) {
		if ( has_post_thumbnail( $post_id ) ) {
			return '<a class="portfolio-featured-image" href="' . esc_url( get_permalink( $post_id ) ) . '">' . get_the_post_thumbnail( $post_id, 'full' ) . '</a>';
		}
	}
}

add_action( 'init', array( 'Jetpack_Portfolio', 'init' ) );

// Check on plugin activation if theme supports CPT
register_activation_hook( __FILE__, array( 'Jetpack_Portfolio', 'plugin_activation_post_type_support' ) );