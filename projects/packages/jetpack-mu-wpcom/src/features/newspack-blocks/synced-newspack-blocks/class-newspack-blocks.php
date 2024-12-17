<?php
/**
 * Newspack blocks functionality
 *
 * @package Newspack_Blocks
 */

/**
 * Newspack blocks functionality
 */
class Newspack_Blocks {

	/**
	 * Script handles.
	 */
	const SCRIPT_HANDLES = [
		'modal-checkout'       => 'newspack-blocks-donate-modal-checkout',
		'modal-checkout-block' => 'newspack-blocks-donate-modal-checkout-block',
		'frequency-based'      => 'newspack-blocks-donate-frequency-based',
		'tiers-based'          => 'newspack-blocks-donate-tiers-based',
	];

	/**
	 * Add hooks and filters.
	 */
	public static function init() {
		add_action( 'after_setup_theme', [ __CLASS__, 'add_image_sizes' ] );
		add_post_type_support( 'post', 'newspack_blocks' );
		add_post_type_support( 'page', 'newspack_blocks' );
		add_action( 'jetpack_register_gutenberg_extensions', [ __CLASS__, 'disable_jetpack_donate' ], 99 );
		add_filter( 'the_content', [ __CLASS__, 'hide_post_content_when_iframe_block_is_fullscreen' ] );

		/**
		 * Disable NextGEN's `C_NextGen_Shortcode_Manager`.
		 *
		 * The way it currently parses `the_content` conflicts with the REST API
		 * request to save a post containing a Homepage Posts block. This is due to
		 * how it uses output buffering through `ob_start()` on REST requests.
		 *
		 * @link https://plugins.trac.wordpress.org/browser/nextgen-gallery/tags/3.23/non_pope/class.nextgen_shortcode_manager.php#L193.
		 */
		if ( ! defined( 'NGG_DISABLE_SHORTCODE_MANAGER' ) ) {
			define( 'NGG_DISABLE_SHORTCODE_MANAGER', true ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound
		}
	}

	/**
	 * Hide the post content when it contains an iframe block that is set to fullscreen mode.
	 *
	 * @param string $content post content from the_content hook.
	 * @return string the post content.
	 */
	public static function hide_post_content_when_iframe_block_is_fullscreen( $content ) {
		if ( has_block( 'newspack-blocks/iframe' ) ) {
			$blocks = parse_blocks( get_post()->post_content );

			foreach ( $blocks as $block ) {
				if ( 'newspack-blocks/iframe' === $block['blockName']
					&& is_array( $block['attrs'] )
					&& array_key_exists( 'isFullScreen', $block['attrs'] )
					&& $block['attrs']['isFullScreen']
					) {
					// we don't need the post content since the iframe will be fullscreen.
					$content = render_block( $block );

					add_filter(
						'body_class',
						function( $classes ) {
							$classes[] = 'newspack-post-with-fullscreen-iframe';
							return $classes;
						}
					);

					// we don't need to show Newspack popups since the iframe will take over them.
					add_filter( 'newspack_popups_assess_has_disabled_popups', '__return_true' );
				}
			}
		}

		return $content;
	}

	/**
	 * Gather dependencies and paths needed for script enqueuing.
	 *
	 * @param string $script_path Path to the script relative to plugin root.
	 *
	 * @return array Associative array including dependency array, version, and web path to the script. Returns false if script doesn't exist.
	 */
	public static function script_enqueue_helper( $script_path ) {
		$local_path = NEWSPACK_BLOCKS__PLUGIN_DIR . $script_path;
		if ( ! file_exists( $local_path ) ) {
			return false;
		}

		$path_info   = pathinfo( $local_path );
		$asset_path  = $path_info['dirname'] . '/' . $path_info['filename'] . '.asset.php';
		$script_data = file_exists( $asset_path )
			? require $asset_path
			: array(
				'dependencies' => [ 'wp-a11y', 'wp-escape-html', 'wp-i18n', 'wp-polyfill' ],
				'version'      => filemtime( $local_path ),
			);

		$script_data['script_path'] = plugins_url( $script_path, NEWSPACK_BLOCKS__PLUGIN_FILE );
		return $script_data;
	}

	/**
	 * Enqueue placeholder blocks assets.
	 */
	public static function enqueue_placeholder_blocks_assets() {
		$script_data = self::script_enqueue_helper( NEWSPACK_BLOCKS__BLOCKS_DIRECTORY . 'placeholder_blocks.js' );
		if ( $script_data ) {
			wp_enqueue_script(
				'newspack-blocks-placeholder-blocks',
				$script_data['script_path'],
				$script_data['dependencies'],
				$script_data['version'],
				true
			);
			wp_set_script_translations(
				'newspack-blocks-placeholder-blocks',
				'jetpack-mu-wpcom',
				plugin_dir_path( NEWSPACK_BLOCKS__PLUGIN_FILE ) . 'languages'
			);
		}
	}

	/**
	 * Gets the list of custom taxonomies that will be available for filtering in the blocks
	 *
	 * @return array Array of custom taxonomies where each taxonomy is an array with slug and label keys.
	 */
	public static function get_custom_taxonomies() {
		$custom_taxonomies = array_map(
			function( $tax ) {
				if ( ! empty( array_intersect( [ 'post', 'page' ], $tax->object_type ) ) ) {
					return [
						'slug'  => $tax->name,
						'label' => $tax->label,
					];
				}
			},
			get_taxonomies(
				[
					'public'       => true,
					'_builtin'     => false,
					'show_in_rest' => true,
				],
				'objects'
			)
		);
		$custom_taxonomies = array_values(
			array_filter(
				$custom_taxonomies,
				function( $tax ) {
					return ! empty( $tax );
				}
			)
		);

		/**
		 * Filters the custom taxonomies that will be available in the Home Page block.
		 *
		 * By default, on the top of category and tags, will display any public taxonomy applied to post or pages
		 *
		 * @param array $custom_taxonomies Array of custom taxonomies where each taxonomy is an array with slug and label keys.
		 */
		return apply_filters( 'newspack_blocks_home_page_block_custom_taxonomies', $custom_taxonomies );
	}

	/**
	 * Check if the Name Your Price extension is available.
	 *
	 * @return bool True if available, false if not.
	 */
	public static function can_use_name_your_price() {
		// If the donation platform is NRH, the Donate block should behave as if Name Your Price is available.
		if ( method_exists( 'Newspack\Donations', 'is_platform_nrh' ) && \Newspack\Donations::is_platform_nrh() ) {
			return true;
		}
		return class_exists( 'WC_Name_Your_Price_Helpers' );
	}

	/**
	 * Enqueue block scripts and styles for editor.
	 */
	public static function enqueue_block_editor_assets() {
		$script_data = static::script_enqueue_helper( NEWSPACK_BLOCKS__BLOCKS_DIRECTORY . 'editor.js' );

		if ( $script_data ) {
			wp_enqueue_script(
				'newspack-blocks-editor',
				$script_data['script_path'],
				$script_data['dependencies'],
				$script_data['version'],
				true
			);

			$localized_data = [
				'patterns'                   => self::get_patterns_for_post_type( get_post_type() ),
				'posts_rest_url'             => rest_url( 'newspack-blocks/v1/newspack-blocks-posts' ),
				'specific_posts_rest_url'    => rest_url( 'newspack-blocks/v1/newspack-blocks-specific-posts' ),
				'authors_rest_url'           => rest_url( 'newspack-blocks/v1/authors' ),
				'assets_path'                => plugins_url( '/src/assets', NEWSPACK_BLOCKS__PLUGIN_FILE ),
				'post_subtitle'              => get_theme_support( 'post-subtitle' ),
				'iframe_accepted_file_mimes' => WP_REST_Newspack_Iframe_Controller::iframe_accepted_file_mimes(),
				'iframe_can_upload_archives' => WP_REST_Newspack_Iframe_Controller::can_upload_archives(),
				'supports_recaptcha'         => class_exists( 'Newspack\Recaptcha' ),
				'has_recaptcha'              => class_exists( 'Newspack\Recaptcha' ) && \Newspack\Recaptcha::can_use_captcha(),
				'recaptcha_url'              => admin_url( 'admin.php?page=newspack-connections-wizard' ),
				'custom_taxonomies'          => self::get_custom_taxonomies(),
				'can_use_name_your_price'    => self::can_use_name_your_price(),
				'tier_amounts_template'      => self::get_formatted_amount(),
			];

			if ( class_exists( 'WP_REST_Newspack_Author_List_Controller' ) ) {
				$localized_data['can_use_cap']    = class_exists( 'CoAuthors_Guest_Authors' );
				$author_list_controller           = new WP_REST_Newspack_Author_List_Controller();
				$localized_data['editable_roles'] = $author_list_controller->get_editable_roles();
			}

			if ( class_exists( '\Newspack\Authors_Custom_Fields' ) ) {
				$localized_data['author_custom_fields'] = \Newspack\Authors_Custom_Fields::get_custom_fields();
			}

			wp_localize_script(
				'newspack-blocks-editor',
				'newspack_blocks_data',
				$localized_data
			);

			wp_set_script_translations(
				'newspack-blocks-editor',
				'jetpack-mu-wpcom',
				plugin_dir_path( NEWSPACK_BLOCKS__PLUGIN_FILE ) . 'languages'
			);
		}

		$editor_style = plugins_url( NEWSPACK_BLOCKS__BLOCKS_DIRECTORY . 'editor.css', NEWSPACK_BLOCKS__PLUGIN_FILE );

		wp_enqueue_style(
			'newspack-blocks-editor',
			$editor_style,
			array(),
			NEWSPACK_BLOCKS__VERSION
		);
	}

	/**
	 * Enqueue block scripts and styles for view.
	 */
	public static function manage_view_scripts() {
		if ( is_admin() ) {
			// In editor environment, do nothing.
			return;
		}
		$src_directory  = NEWSPACK_BLOCKS__PLUGIN_DIR . 'src/blocks/';
		$dist_directory = NEWSPACK_BLOCKS__PLUGIN_DIR . 'dist/';
		$iterator       = new DirectoryIterator( $src_directory );
		foreach ( $iterator as $block_directory ) {
			if ( ! $block_directory->isDir() || $block_directory->isDot() ) {
				continue;
			}
			$type = $block_directory->getFilename();

			/* If view.php is found, include it and use for block rendering. */
			$view_php_path = $src_directory . $type . '/view.php';

			if ( file_exists( $view_php_path ) ) {
				include_once $view_php_path;
				continue;
			}

			/* If view.php is missing but view Javascript file is found, do generic view asset loading. */
			$view_js_path = $dist_directory . $type . '/view.js';
			if ( file_exists( $view_js_path ) ) {
				register_block_type(
					"newspack-blocks/{$type}",
					array(
						'render_callback' => function( $attributes, $content ) use ( $type ) {
							self::enqueue_view_assets( $type );
							return $content;
						},
					)
				);
			}
		}
	}

	/**
	 * Enqueue block styles stylesheet.
	 */
	public static function enqueue_block_styles_assets() {
		$style_path = NEWSPACK_BLOCKS__BLOCKS_DIRECTORY . 'block_styles' . ( is_rtl() ? '.rtl' : '' ) . '.css';
		if ( file_exists( NEWSPACK_BLOCKS__PLUGIN_DIR . $style_path ) ) {
			wp_enqueue_style(
				'newspack-blocks-block-styles-stylesheet',
				plugins_url( $style_path, NEWSPACK_BLOCKS__PLUGIN_FILE ),
				array(),
				NEWSPACK_BLOCKS__VERSION
			);
		}
	}

	/**
	 * Enqueue view scripts and styles for a single block.
	 *
	 * @param string $type The block's type.
	 */
	public static function enqueue_view_assets( $type ) {
		$style_path = apply_filters(
			'newspack_blocks_enqueue_view_assets',
			NEWSPACK_BLOCKS__BLOCKS_DIRECTORY . $type . '/view' . ( is_rtl() ? '.rtl' : '' ) . '.css',
			$type,
			is_rtl()
		);

		if ( file_exists( NEWSPACK_BLOCKS__PLUGIN_DIR . $style_path ) ) {
			wp_enqueue_style(
				"newspack-blocks-{$type}",
				plugins_url( $style_path, NEWSPACK_BLOCKS__PLUGIN_FILE ),
				array(),
				NEWSPACK_BLOCKS__VERSION
			);
		}
		$script_data = static::script_enqueue_helper( NEWSPACK_BLOCKS__BLOCKS_DIRECTORY . $type . '/view.js' );
		if ( $script_data ) {
			wp_enqueue_script(
				"newspack-blocks-{$type}",
				$script_data['script_path'],
				$script_data['dependencies'],
				$script_data['version'],
				true
			);
		}
	}

	/**
	 * Utility to assemble the class for a server-side rendered block.
	 *
	 * @param string $type The block type.
	 * @param array  $attributes Block attributes.
	 * @param array  $extra Additional classes to be added to the class list.
	 *
	 * @return string Class list separated by spaces.
	 */
	public static function block_classes( $type, $attributes = array(), $extra = array() ) {
		$classes = [ "wp-block-newspack-blocks-{$type}" ];

		if ( ! empty( $attributes['align'] ) ) {
			$classes[] = 'align' . $attributes['align'];
		}
		if ( ! empty( $attributes['hideControls'] ) ) {
			$classes[] = 'hide-controls';
		}
		if ( isset( $attributes['className'] ) ) {
			array_push( $classes, $attributes['className'] );
		}
		if ( is_array( $extra ) && ! empty( $extra ) ) {
			$classes = array_merge( $classes, $extra );
		}

		return implode( ' ', $classes );
	}

	/**
	 * Utility to assemble the styles for a server-side rendered block.
	 *
	 * @param array $attributes Block attributes.
	 * @param array $extra      Additional styles to be added to the style list.
	 *
	 * @return string style list.
	 */
	public static function block_styles( $attributes = [], $extra = [] ) {
		$styles = [];
		if ( isset( $attributes['style'] ) && is_array( $attributes['style'] ) ) {
			$engine_styles = wp_style_engine_get_styles( $attributes['style'], [ 'context' => 'block-supports' ] );
			if ( isset( $engine_styles['css'] ) ) {
				$styles[] = $engine_styles['css'];
			}
		}

		if ( is_array( $extra ) && ! empty( $extra ) ) {
			$styles = array_merge( $styles, $extra );
		}

		return implode( '', $styles );
	}

	/**
	 * Return the most appropriate thumbnail size to display.
	 *
	 * @param string $orientation The block's orientation settings: landscape|portrait|square.
	 *
	 * @return string Returns the thumbnail key to use.
	 */
	public static function image_size_for_orientation( $orientation = 'landscape' ) {
		$sizes = array(
			'landscape' => array(
				'large'        => array(
					1200,
					900,
				),
				'medium'       => array(
					800,
					600,
				),
				'intermediate' => array(
					600,
					450,
				),
				'small'        => array(
					400,
					300,
				),
				'tiny'         => array(
					200,
					150,
				),
			),
			'portrait'  => array(
				'large'        => array(
					900,
					1200,
				),
				'medium'       => array(
					600,
					800,
				),
				'intermediate' => array(
					450,
					600,
				),
				'small'        => array(
					300,
					400,
				),
				'tiny'         => array(
					150,
					200,
				),
			),
			'square'    => array(
				'large'        => array(
					1200,
					1200,
				),
				'medium'       => array(
					800,
					800,
				),
				'intermediate' => array(
					600,
					600,
				),
				'small'        => array(
					400,
					400,
				),
				'tiny'         => array(
					200,
					200,
				),
			),
		);

		if ( isset( $sizes[ $orientation ] ) ) {
			foreach ( $sizes[ $orientation ] as $key => $dimensions ) {
				$attachment = wp_get_attachment_image_src(
					get_post_thumbnail_id( get_the_ID() ),
					'newspack-article-block-' . $orientation . '-' . $key
				);
				if ( ! empty( $attachment ) && $dimensions[0] === $attachment[1] && $dimensions[1] === $attachment[2] ) {
					return 'newspack-article-block-' . $orientation . '-' . $key;
				}
			}
		}

		return 'large';
	}

	/**
	 * Registers image sizes required for Newspack Blocks.
	 */
	public static function add_image_sizes() {
		add_image_size( 'newspack-article-block-landscape-large', 1200, 900, true );
		add_image_size( 'newspack-article-block-portrait-large', 900, 1200, true );
		add_image_size( 'newspack-article-block-square-large', 1200, 1200, true );

		add_image_size( 'newspack-article-block-landscape-medium', 800, 600, true );
		add_image_size( 'newspack-article-block-portrait-medium', 600, 800, true );
		add_image_size( 'newspack-article-block-square-medium', 800, 800, true );

		add_image_size( 'newspack-article-block-landscape-intermediate', 600, 450, true );
		add_image_size( 'newspack-article-block-portrait-intermediate', 450, 600, true );
		add_image_size( 'newspack-article-block-square-intermediate', 600, 600, true );

		add_image_size( 'newspack-article-block-landscape-small', 400, 300, true );
		add_image_size( 'newspack-article-block-portrait-small', 300, 400, true );
		add_image_size( 'newspack-article-block-square-small', 400, 400, true );

		add_image_size( 'newspack-article-block-landscape-tiny', 200, 150, true );
		add_image_size( 'newspack-article-block-portrait-tiny', 150, 200, true );
		add_image_size( 'newspack-article-block-square-tiny', 200, 200, true );

		add_image_size( 'newspack-article-block-uncropped', 1200, 9999, false );
	}

	/**
	 * Whether the block should be included in the deduplication logic.
	 *
	 * @param array $attributes Block attributes.
	 *
	 * @return bool
	 */
	public static function should_deduplicate_block( $attributes ) {
		/**
		 * Filters whether to use deduplication while rendering the given block.
		 *
		 * @param bool   $deduplicate Whether to deduplicate.
		 * @param array  $attributes  The block attributes.
		 */
		return apply_filters( 'newspack_blocks_should_deduplicate', $attributes['deduplicate'] ?? true, $attributes );
	}

	/**
	 * Get all "specificPosts" ids from given blocks.
	 *
	 * @param array  $blocks     An array of blocks.
	 * @param string $block_name Name of the block requesting the query.
	 *
	 * @return array All "specificPosts" ids from all eligible blocks.
	 */
	private static function get_specific_posts_from_blocks( $blocks, $block_name ) {
		$specific_posts = [];
		foreach ( $blocks as $block ) {
			if ( ! empty( $block['innerBlocks'] ) ) {
				$specific_posts = array_merge(
					$specific_posts,
					self::get_specific_posts_from_blocks( $block['innerBlocks'], $block_name )
				);
				continue;
			}
			if (
				$block_name === $block['blockName'] &&
				self::should_deduplicate_block( $block['attrs'] ) &&
				! empty( $block['attrs']['specificMode'] ) &&
				! empty( $block['attrs']['specificPosts'] )
			) {
				$specific_posts = array_merge(
					$specific_posts,
					$block['attrs']['specificPosts']
				);
			}
		}
		return $specific_posts;
	}

	/**
	 * Builds and returns query args based on block attributes.
	 *
	 * @param array $attributes An array of block attributes.
	 * @param array $block_name Name of the block requesting the query.
	 *
	 * @return array
	 */
	public static function build_articles_query( $attributes, $block_name ) {
		global $newspack_blocks_post_id;
		if ( ! $newspack_blocks_post_id ) {
			$newspack_blocks_post_id = array();
		}

		// Get all blocks and gather specificPosts ids of all eligible blocks.
		global $newspack_blocks_all_specific_posts_ids;
		if ( ! is_array( $newspack_blocks_all_specific_posts_ids ) ) {
			$blocks                                 = parse_blocks( get_the_content() );
			$newspack_blocks_all_specific_posts_ids = self::get_specific_posts_from_blocks( $blocks, $block_name );
		}

		$post_type              = isset( $attributes['postType'] ) ? $attributes['postType'] : [ 'post' ];
		$included_post_statuses = [ 'publish' ];
		if ( current_user_can( 'edit_others_posts' ) && isset( $attributes['includedPostStatuses'] ) ) {
			$included_post_statuses = $attributes['includedPostStatuses'];
		}
		$authors                    = isset( $attributes['authors'] ) ? $attributes['authors'] : array();
		$categories                 = isset( $attributes['categories'] ) ? $attributes['categories'] : array();
		$include_subcategories      = isset( $attributes['includeSubcategories'] ) ? intval( $attributes['includeSubcategories'] ) : false;
		$tags                       = isset( $attributes['tags'] ) ? $attributes['tags'] : array();
		$custom_taxonomies          = isset( $attributes['customTaxonomies'] ) ? $attributes['customTaxonomies'] : array();
		$tag_exclusions             = isset( $attributes['tagExclusions'] ) ? $attributes['tagExclusions'] : array();
		$category_exclusions        = isset( $attributes['categoryExclusions'] ) ? $attributes['categoryExclusions'] : array();
		$custom_taxonomy_exclusions = isset( $attributes['customTaxonomyExclusions'] ) ? $attributes['customTaxonomyExclusions'] : array();
		$specific_posts             = isset( $attributes['specificPosts'] ) ? $attributes['specificPosts'] : array();
		$posts_to_show              = intval( $attributes['postsToShow'] );
		$specific_mode              = isset( $attributes['specificMode'] ) ? intval( $attributes['specificMode'] ) : false;
		$args                       = array(
			'post_type'           => $post_type,
			'post_status'         => $included_post_statuses,
			'suppress_filters'    => false,
			'ignore_sticky_posts' => true,
			'has_password'        => false,
			'is_newspack_query'   => true,
			'tax_query'           => [], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
		);
		if ( $specific_mode && $specific_posts ) {
			$args['posts_per_page'] = count( $specific_posts );
			$args['post__in']       = $specific_posts;
			$args['orderby']        = 'post__in';
		} else {
			$args['posts_per_page'] = $posts_to_show;
			if ( ! self::should_deduplicate_block( $attributes ) ) {
				$args['post__not_in'] = [ get_the_ID() ]; // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
			} else {
				if ( count( $newspack_blocks_all_specific_posts_ids ) ) {
					$args['post__not_in'] = $newspack_blocks_all_specific_posts_ids; // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
				}
				$current_post_id = get_the_ID();
				$args['post__not_in'] = array_merge( // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
					$args['post__not_in'] ?? [],
					array_keys( $newspack_blocks_post_id ),
					is_singular() && $current_post_id ? [ $current_post_id ] : []
				);
			}
			if ( $categories && count( $categories ) ) {
				if ( 1 === $include_subcategories ) {
					$children = [];
					foreach ( $categories as $parent ) {
						$children = array_merge( $children, get_categories( [ 'child_of' => $parent ] ) );
						foreach ( $children as $child ) {
							$categories[] = $child->term_id;
						}
					}
				}
				$args['category__in'] = $categories;
			}
			if ( $tags && count( $tags ) ) {
				$args['tag__in'] = $tags;
			}
			if ( $tag_exclusions && count( $tag_exclusions ) ) {
				$args['tag__not_in'] = $tag_exclusions;
			}
			if ( $category_exclusions && count( $category_exclusions ) ) {
				$args['category__not_in'] = $category_exclusions;
			}
			if ( ! empty( $custom_taxonomies ) ) {
				foreach ( $custom_taxonomies as $taxonomy ) {
					if ( ! empty( $taxonomy['slug'] ) && ! empty( $taxonomy['terms'] ) ) {
						$args['tax_query'][] = [
							'taxonomy'         => $taxonomy['slug'],
							'field'            => 'term_id',
							'terms'            => $taxonomy['terms'],
							'include_children' => false,
						];
					}
				}
			}
			if ( $custom_taxonomy_exclusions && count( $custom_taxonomy_exclusions ) ) {
				foreach ( $custom_taxonomy_exclusions as $exclusion ) {
					$args['tax_query'][] = [
						'field'            => 'term_id',
						'include_children' => false,
						'operator'         => 'NOT IN',
						'taxonomy'         => $exclusion['slug'],
						'terms'            => $exclusion['terms'],
					];
				}
			}

			if ( $authors && count( $authors ) ) {
				global $coauthors_plus;
				$is_co_authors_plus_active = is_object( $coauthors_plus ) && method_exists( $coauthors_plus, 'get_coauthor_by' );

				if ( ! $is_co_authors_plus_active ) {
					$args['author__in'] = $authors;
				} else {
					/**
					 * When CoAuthors Plus is active, we ignore the 'author__in' parameter and search only by the author taxonomy.
					 *
					 * If CAP has been activated recently, the author taxonomy may not have been populated yet. You'll need to run
					 * wp co-authors-plus create-author-terms-for-posts to make sure all posts have the author terms in place.
					 */
					$authors_term_ids = [];
					foreach ( $authors as $author_id ) {
						$co_author = $coauthors_plus->get_coauthor_by( 'id', $author_id );
						if ( is_object( $co_author ) ) {
							$term = $coauthors_plus->get_author_term( $co_author );
							if ( $term ) {
								$authors_term_ids[] = $term->term_id;
							}

							// If it's a guest author, also check the linked author.
							if ( 'guest-author' === $co_author->type && ! empty( $co_author->wp_user ) && $co_author->wp_user instanceof \WP_User ) {
								$term = $coauthors_plus->get_author_term( $co_author->wp_user );
								if ( $term ) {
									$authors_term_ids[] = $term->term_id;
								}
							}

							// If it's a regular wp user, check and include any linked guest authors.
							if ( 'wpuser' === $co_author->type ) {
								$authors_controller = new WP_REST_Newspack_Authors_Controller();
								$linked_guest_author_post = $authors_controller->get_linked_guest_author( $co_author->user_login );
								if ( $linked_guest_author_post ) {
									$linked_guest_author_object = $coauthors_plus->get_coauthor_by( 'id', $author_id );
									if ( is_object( $linked_guest_author_object ) ) {
										$term = $coauthors_plus->get_author_term( $linked_guest_author_object );
										if ( $term ) {
											$authors_term_ids[] = $term->term_id;
										}
									}
								}
							}
						}
					}
					if ( count( $authors_term_ids ) ) {
						$args['tax_query'][] = [
							'taxonomy' => 'author',
							'field'    => 'term_id',
							'terms'    => $authors_term_ids,
						];
					}
				}
			}
		}

		/**
		 * Customize the WP_Query arguments to fetch post articles before the actual query is executed.
		 *
		 * The filter is called after the build_articles_query() function is called by a Newspack block to
		 * build the WP_Query arguments based on the given attributes and block requesting the query.
		 *
		 * @param array     $args       WP_Query arguments as created by build_articles_query()
		 * @param array     $attributes The attributes initial passed to build_articles_query()
		 * @param string    $block_name The name of the requesting block to create the query args for
		 */
		return apply_filters( 'newspack_blocks_build_articles_query', $args, $attributes, $block_name );
	}

	/**
	 * Loads a template with given data in scope.
	 *
	 * @param string $template full Path to the template to be included.
	 * @param array  $data          Data to be passed into the template to be included.
	 * @return string
	 */
	public static function template_inc( $template, $data = array() ) { //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable, Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( ! strpos( $template, '.php' ) ) {
			$template = $template . '.php';
		}
		if ( ! is_file( $template ) ) {
			return '';
		}
		ob_start();
		include $template;
		$contents = ob_get_contents();
		ob_end_clean();
		return $contents;
	}

	/**
	 * Prepare an array of authors, taking presence of CoAuthors Plus into account.
	 *
	 * @return array Array of WP_User objects.
	 */
	public static function prepare_authors() {
		if ( function_exists( 'coauthors_posts_links' ) && ! empty( get_coauthors() ) ) {
			$authors = get_coauthors();
			foreach ( $authors as $author ) {
				$author->avatar = coauthors_get_avatar( $author, 48 );
				$author->url    = get_author_posts_url( $author->ID, $author->user_nicename );
			}
			return $authors;
		}
		$id = get_the_author_meta( 'ID' );
		return array(
			(object) array(
				'ID'            => $id,
				'avatar'        => get_avatar( $id, 48 ),
				'url'           => get_author_posts_url( $id ),
				'user_nicename' => get_the_author(),
				'display_name'  => get_the_author_meta( 'display_name' ),
			),
		);
	}

	/**
	 * Prepare a list of classes based on assigned tags, categories, post formats and types.
	 *
	 * @param string $post_id Post ID.
	 * @return string CSS classes.
	 */
	public static function get_term_classes( $post_id ) {
		$classes = [];

		$tags = get_the_terms( $post_id, 'post_tag' );
		if ( ! empty( $tags ) ) {
			foreach ( $tags as $tag ) {
				$classes[] = 'tag-' . $tag->slug;
			}
		}

		$categories = get_the_terms( $post_id, 'category' );
		if ( ! empty( $categories ) ) {
			foreach ( $categories as $cat ) {
				$classes[] = 'category-' . $cat->slug;
			}
		}

		foreach ( self::get_custom_taxonomies() as $tax ) {
			$terms = get_the_terms( $post_id, $tax['slug'] );
			if ( ! empty( $terms ) ) {
				foreach ( $terms as $term ) {
					$classes[] = $term->taxonomy . '-' . $term->slug;
				}
			}
		}

		$post_type = get_post_type( $post_id );
		if ( false !== $post_type ) {
			$classes[] = 'type-' . $post_type;
		}

		/**
		 * Filter the array of class names before applying them to the HTML.
		 *
		 * @param array $classes Array of term class names.
		 *
		 * @return array Filtered array of term class names.
		 */
		$classes = apply_filters( 'newspack_blocks_term_classes', $classes );

		return implode( ' ', $classes );
	}

	/**
	 * Get patterns for post type.
	 *
	 * @param string $post_type Post type.
	 * @return array Array of patterns.
	 */
	public static function get_patterns_for_post_type( $post_type = null ) {
		$patterns    = apply_filters( 'newspack_blocks_patterns', [], $post_type );
		$categorized = [];
		$clean       = [];
		foreach ( $patterns as $pattern ) {
			if ( ! isset( $pattern['image'] ) || ! $pattern['image'] ) {
				continue;
			}
			$category = isset( $pattern['category'] ) ? $pattern['category'] : __( 'Common', 'jetpack-mu-wpcom' );
			if ( ! isset( $categorized[ $category ] ) ) {
				$categorized[ $category ] = [];
			}
			$categorized[ $category ][] = $pattern;
		}
		$categories = array_keys( $categorized );
		sort( $categories );
		foreach ( $categories as $category ) {
			$clean[] = [
				'title' => $category,
				'items' => $categorized[ $category ],
			];
		}
		return $clean;
	}

	/**
	 * Function to check if plugin is enabled, and if there are sponsors.
	 *
	 * @see https://github.com/Automattic/newspack-sponsors/blob/8ebf72ec4fe744bca405a1f6fe8cd5bce3a29e6a/includes/newspack-sponsors-theme-helpers.php#L35
	 *
	 * @param int|null    $id    ID of the post or archive term to get sponsors for.
	 *                           If not provided, we will try to guess based on context.
	 * @param string|null $scope Scope of the sponsors to get. Can be 'native' or
	 *                           'underwritten'. If provided, only sponsors with the
	 *                           matching scope will be returned. If not, all sponsors
	 *                           will be returned regardless of scope.
	 * @param string|null $type  Type of the $id given: 'post' or 'archive'. If not
	 *                           provided, we will try to guess based on context.
	 * @param array       $logo_options Optional array of logo options. Valid options:
	 *                                  maxwidth: max width of the logo image, in pixels.
	 *                                  maxheight: max height of the logo image, in pixels.
	 * @return array Array of sponsors.
	 */
	public static function get_all_sponsors( $id = null, $scope = 'native', $type = 'post', $logo_options = array(
		'maxwidth'  => 80,
		'maxheight' => 40,
	) ) {
		if ( function_exists( '\Newspack_Sponsors\get_sponsors_for_post' ) ) {
			if ( is_singular() ) {
				$scope_override = get_post_meta( $id, 'newspack_sponsor_sponsorship_scope', true );

				// Scope override: if post is set to display as native-sponsored, return all sponsors.
				if ( 'native' === $scope_override ) {
					$scope = null;
				}

				// Scope override: if post is set to display as underwritten, return nothing.
				if ( 'underwritten' === $scope_override ) {
					return [];
				}
			}

			return \Newspack_Sponsors\get_all_sponsors( $id, $scope, $type, $logo_options ); // phpcs:ignore PHPCompatibility.LanguageConstructs.NewLanguageConstructs.t_ns_separatorFound
		}

		return false;
	}

	/**
	 * Function to return sponsor 'flag' from first sponsor.
	 *
	 * @param array  $sponsors Array of sponsors.
	 * @param string $id Post ID.
	 * @return string|boolean Sponsor flag label, or false if none found.
	 */
	public static function get_sponsor_label( $sponsors = null, $id = null ) {
		if ( null === $sponsors && ! empty( $id ) ) {
			$sponsors = self::get_all_sponsors( $id );
		}

		if ( ! empty( $sponsors ) ) {
			$sponsor_flag = $sponsors[0]['sponsor_flag'];
			return $sponsor_flag;
		}

		return false;
	}

	/**
	 * Outputs the sponsor byline markup for the theme.
	 *
	 * @param array  $sponsors Array of sponsors.
	 * @param string $id Post ID.
	 * @return array|boolean Array of Sponsor byline information, or false if none found.
	 */
	public static function get_sponsor_byline( $sponsors = null, $id = null ) {
		if ( null === $sponsors & ! empty( $id ) ) {
			$sponsors = self::get_all_sponsors( $id );
		}

		if ( ! empty( $sponsors ) ) {
			$sponsor_count = count( $sponsors );
			$i             = 1;
			$sponsor_list  = [];

			foreach ( $sponsors as $sponsor ) {
				$i++;
				if ( $sponsor_count === $i ) :
					/* translators: separates last two sponsor names; needs a space on either side. */
					$sep = esc_html__( ' and ', 'jetpack-mu-wpcom' );
				elseif ( $sponsor_count > $i ) :
					/* translators: separates all but the last two sponsor names; needs a space at the end. */
					$sep = esc_html__( ', ', 'jetpack-mu-wpcom' );
				else :
					$sep = '';
				endif;

				$sponsor_list[] = array(
					'byline' => $sponsor['sponsor_byline'],
					'url'    => $sponsor['sponsor_url'],
					'name'   => $sponsor['sponsor_name'],
					'sep'    => $sep,
				);
			}
			return $sponsor_list;
		}

		return false;
	}

	/**
	 * Outputs set of sponsor logos with links.
	 *
	 * @param array  $sponsors Array of sponsors.
	 * @param string $id Post ID.
	 * @return array Array of sponsor logo images, or false if none found.
	 */
	public static function get_sponsor_logos( $sponsors = null, $id = null ) {
		if ( null === $sponsors && ! empty( $id ) ) {
			$sponsors = self::get_all_sponsors(
				$id,
				'native',
				'post',
				array(
					'maxwidth'  => 80,
					'maxheight' => 40,
				)
			);
		}

		if ( ! empty( $sponsors ) ) {
			$sponsor_logos = [];
			foreach ( $sponsors as $sponsor ) {
				if ( ! empty( $sponsor['sponsor_logo'] ) ) :
					$sponsor_logos[] = array(
						'url'    => $sponsor['sponsor_url'],
						'src'    => esc_url( $sponsor['sponsor_logo']['src'] ),
						'alt'    => esc_attr( $sponsor['sponsor_name'] ),
						'width'  => esc_attr( $sponsor['sponsor_logo']['img_width'] ),
						'height' => esc_attr( $sponsor['sponsor_logo']['img_height'] ),
					);
				endif;
			}

			return $sponsor_logos;
		}

		return false;
	}

	/**
	 * If at least one native sponsor is set to display both sponsors and authors, show the authors.
	 *
	 * @param array $sponsors Array of sponsors.
	 *
	 * @return boolean True if we should display both sponsors and categories, false if we should display only sponsors.
	 */
	public static function newspack_display_sponsors_and_authors( $sponsors ) {
		if ( function_exists( '\Newspack_Sponsors\newspack_display_sponsors_and_authors' ) ) {
			return \Newspack_Sponsors\newspack_display_sponsors_and_authors( $sponsors );
		}
		return false;
	}

	/**
	 * If at least one native sponsor is set to display both sponsors and categories, show the categories.
	 *
	 * @param array $sponsors Array of sponsors.
	 *
	 * @return boolean True if we should display both sponsors and categories, false if we should display only sponsors.
	 */
	public static function newspack_display_sponsors_and_categories( $sponsors ) {
		if ( function_exists( '\Newspack_Sponsors\newspack_display_sponsors_and_categories' ) ) {
			return \Newspack_Sponsors\newspack_display_sponsors_and_categories( $sponsors );
		}
		return false;
	}

	/**
	 * Closure for excerpt filtering that can be added and removed.
	 *
	 * @var Closure
	 */
	public static $newspack_blocks_excerpt_closure = null;

	/**
	 * Closure for excerpt length filtering that can be added and removed.
	 *
	 * @var Closure
	 * @deprecated
	 */
	public static $newspack_blocks_excerpt_length_closure = null;

	/**
	 * Function to override WooCommerce Membership's Excerpt Length filter.
	 *
	 * @return string Current post's original excerpt.
	 */
	public static function remove_wc_memberships_excerpt_limit() {
		$excerpt = get_the_excerpt( get_the_id() );
		return $excerpt;
	}

	/**
	 * Filter for excerpt length.
	 *
	 * @param array $attributes The block's attributes.
	 */
	public static function filter_excerpt( $attributes ) {
		if ( empty( $attributes['excerptLength'] ) || ! $attributes['showExcerpt'] ) {
			return;
		}

		self::$newspack_blocks_excerpt_closure = function( $text = '', $post = null ) use ( $attributes ) {
			// If we have a manually entered excerpt, use that and allow some tags.
			if ( ! empty( $post->post_excerpt ) ) {
				$excerpt      = $post->post_excerpt;
				$allowed_tags = '<em>,<i>,<strong>,<b>,<u>,<ul>,<ol>,<li>,<h1>,<h2>,<h3>,<h4>,<h5>,<h6>,<img>,<a>,<p>';
			} else {
				// If we don't, built an excerpt but allow no tags.
				$excerpt      = $post->post_content;
				$allowed_tags = '';
			}

			// Recreate logic from wp_trim_excerpt (https://developer.wordpress.org/reference/functions/wp_trim_excerpt/).
			$excerpt = strip_shortcodes( $excerpt );
			$excerpt = excerpt_remove_blocks( $excerpt );
			$excerpt = wpautop( $excerpt );
			$excerpt = str_replace( ']]>', ']]&gt;', $excerpt );

			// Strip HTML tags except for the explicitly allowed tags.
			$excerpt = strip_tags( $excerpt, $allowed_tags ); // phpcs:ignore WordPressVIPMinimum.Functions.StripTags.StripTagsTwoParameters

			// Get excerpt length. If not provided a valid length, use the default excerpt length.
			if ( empty( $attributes['excerptLength'] ) || ! is_numeric( $attributes['excerptLength'] ) ) {
				$excerpt_length = 55;
			} else {
				$excerpt_length = $attributes['excerptLength'];
			}

			// Set excerpt length (https://core.trac.wordpress.org/ticket/29533#comment:3).
			$excerpt = force_balance_tags( html_entity_decode( wp_trim_words( htmlentities( $excerpt, ENT_COMPAT ), $excerpt_length, static::more_excerpt(), ENT_COMPAT ) ) );

			return $excerpt;
		};
		add_filter( 'get_the_excerpt', self::$newspack_blocks_excerpt_closure, 11, 2 );
	}

	/**
	 * Remove excerpt filter after Homepage Posts block loop.
	 */
	public static function remove_excerpt_filter() {
		if ( static::$newspack_blocks_excerpt_closure ) {
			remove_filter( 'get_the_excerpt', static::$newspack_blocks_excerpt_closure, 11 );
		}
	}

	/**
	 * Filter for excerpt length.
	 *
	 * @deprecated
	 * @param array $attributes The block's attributes.
	 */
	public static function filter_excerpt_length( $attributes ) {
		// If showing excerpt, filter the length using the block attribute.
		if ( isset( $attributes['excerptLength'] ) && $attributes['showExcerpt'] ) {
			self::$newspack_blocks_excerpt_length_closure = add_filter(
				'excerpt_length',
				function() use ( $attributes ) {
					if ( $attributes['excerptLength'] ) {
						return $attributes['excerptLength'];
					}
					return 55;
				},
				999
			);
			add_filter( 'wc_memberships_trimmed_restricted_excerpt', [ 'Newspack_Blocks', 'remove_wc_memberships_excerpt_limit' ], 999 );
		}
	}

	/**
	 * Remove excerpt length filter after Homepage Posts block loop.
	 *
	 * @deprecated
	 */
	public static function remove_excerpt_length_filter() {
		if ( self::$newspack_blocks_excerpt_length_closure ) {
			remove_filter(
				'excerpt_length',
				self::$newspack_blocks_excerpt_length_closure,
				999
			);
			remove_filter( 'wc_memberships_trimmed_restricted_excerpt', [ 'Newspack_Blocks', 'remove_wc_memberships_excerpt_limit' ] );
		}
	}

	/**
	 * Return a excerpt more replacement when using the 'Read More' link.
	 */
	public static function more_excerpt() {
		return '…';
	}

	/**
	 * Filter for excerpt ellipsis.
	 *
	 * @deprecated
	 * @param array $attributes The block's attributes.
	 */
	public static function filter_excerpt_more( $attributes ) {
		// If showing the 'Read More' link, modify the ellipsis.
		if ( $attributes['showReadMore'] ) {
			add_filter( 'excerpt_more', [ __CLASS__, 'more_excerpt' ], 999 );
		}
	}

	/**
	 * Remove excerpt ellipsis filter after Homepage Posts block loop.
	 *
	 * @deprecated
	 */
	public static function remove_excerpt_more_filter() {
		remove_filter( 'excerpt_more', [ __CLASS__, 'more_excerpt' ], 999 );
	}

	/**
	 * Utility to get the link for the given post ID. If the post has an external URL meta value, use that.
	 * Otherwise, use the permalink. But if the post type doesn't have a public singular view, don't link.
	 *
	 * @param int $post_id Post ID for which to get the link. Will default to current post if none given.
	 * @return string|boolean The URL for the post, or false if it can't be linked to.
	 */
	public static function get_post_link( $post_id = null ) {
		if ( null === $post_id ) {
			$post_id = get_the_ID();
		}

		$post_type        = get_post_type( $post_id );
		$sponsor_url      = get_post_meta( $post_id, 'newspack_sponsor_url', true );
		$supporter_url    = get_post_meta( $post_id, 'newspack_supporter_url', true );
		$external_url     = ! empty( $sponsor_url ) ? $sponsor_url : $supporter_url;
		$post_type_info   = get_post_type_object( $post_type );
		$link             = ! empty( $external_url ) ? $external_url : get_permalink();
		$should_have_link = ! empty( $post_type_info->public ) || ! empty( $external_url ); // False if a sponsor or supporter without an external URL.

		return $should_have_link ? $link : false;
	}

	/**
	 * Sanitize SVG markup for front-end display.
	 *
	 * @param string $svg SVG markup to sanitize.
	 * @return string Sanitized markup.
	 */
	public static function sanitize_svg( $svg = '' ) {
		$allowed_html = [
			'svg'  => [
				'xmlns'       => [],
				'fill'        => [],
				'viewbox'     => [],
				'role'        => [],
				'aria-hidden' => [],
				'focusable'   => [],
				'height'      => [],
				'width'       => [],
			],
			'path' => [
				'd'    => [],
				'fill' => [],
			],
		];

		return wp_kses( $svg, $allowed_html );
	}

	/**
	 * Disable Jetpack's donate block when using Newspack donations.
	 */
	public static function disable_jetpack_donate() {
		// Do nothing if Jetpack's blocks or Newspack aren't being used.
		if ( ! class_exists( 'Jetpack_Gutenberg' ) || ! class_exists( 'Newspack' ) ) {
			return;
		}

		// Allow Jetpack donations if Newspack donations isn't set up.
		$donate_settings = Newspack\Donations::get_donation_settings();
		if ( is_wp_error( $donate_settings ) ) {
			return;
		}

		// Tell Jetpack to mark the donations feature as unavailable.
		Jetpack_Gutenberg::set_extension_unavailable(
			'jetpack/donations',
			esc_html__( 'Jetpack donations is disabled in favour of Newspack donations.', 'jetpack-mu-wpcom' )
		);
	}

	/**
	 * Loads a template with given data in scope.
	 *
	 * @param string $template Name of the template to be included.
	 * @param array  $data     Data to be passed into the template to be included.
	 * @param string $path     (Optional) Path to the folder containing the template.
	 * @return string
	 */
	public static function template_include( $template, $data = [], $path = NEWSPACK_BLOCKS__PLUGIN_DIR . 'src/templates/' ) {
		if ( ! strpos( $template, '.php' ) ) {
			$template = $template . '.php';
		}
		$path .= $template;
		if ( ! is_file( $path ) ) {
			return '';
		}
		ob_start();
		include $path;
		$contents = ob_get_contents();
		ob_end_clean();
		return $contents;
	}

	/**
	 * Get post status label.
	 */
	public static function get_post_status_label() {
		$post_status          = get_post_status();
		$post_statuses_labels = [
			'draft'  => __( 'Draft', 'jetpack-mu-wpcom' ),
			'future' => __( 'Scheduled', 'jetpack-mu-wpcom' ),
		];
		if ( 'publish' !== $post_status ) {
			ob_start();
			?>
				<div class="newspack-preview-label"><?php echo esc_html( $post_statuses_labels[ $post_status ] ); ?></div>
			<?php
			return ob_get_clean();
		}
	}

	/**
	 * Pick either white or black, whatever has sufficient contrast with the color being passed to it.
	 * From Newspack Theme functions.
	 *
	 * @param  string $hex Hexidecimal value of the color to adjust.
	 * @return string Either black or white hexidecimal values.
	 *
	 * @ref https://stackoverflow.com/questions/1331591/given-a-background-color-black-or-white-text
	 */
	public static function get_color_for_contrast( $hex ) {
		// Hex RGB.
		$r1 = hexdec( substr( $hex, 1, 2 ) );
		$g1 = hexdec( substr( $hex, 3, 2 ) );
		$b1 = hexdec( substr( $hex, 5, 2 ) );
		// Black RGB.
		$black_color    = '#000';
		$r2_black_color = hexdec( substr( $black_color, 1, 2 ) );
		$g2_black_color = hexdec( substr( $black_color, 3, 2 ) );
		$b2_black_color = hexdec( substr( $black_color, 5, 2 ) );
		// Calc contrast ratio.
		$l1             = 0.2126 * pow( $r1 / 255, 2.2 ) +
		0.7152 * pow( $g1 / 255, 2.2 ) +
		0.0722 * pow( $b1 / 255, 2.2 );
		$l2             = 0.2126 * pow( $r2_black_color / 255, 2.2 ) +
		0.7152 * pow( $g2_black_color / 255, 2.2 ) +
		0.0722 * pow( $b2_black_color / 255, 2.2 );
		$contrast_ratio = 0;
		if ( $l1 > $l2 ) {
			$contrast_ratio = (int) ( ( $l1 + 0.05 ) / ( $l2 + 0.05 ) );
		} else {
			$contrast_ratio = (int) ( ( $l2 + 0.05 ) / ( $l1 + 0.05 ) );
		}
		if ( $contrast_ratio > 5 ) {
			// If contrast is more than 5, return black color.
			return 'black';
		} else {
			// if not, return white color.
			return 'white';
		}
	}

	/**
	 * Get an array of allowed HTML attributes for sanitizing image markup.
	 * For use with wp_kses: https://developer.wordpress.org/reference/functions/wp_kses/
	 *
	 * @return array
	 */
	public static function get_sanitized_image_attributes() {
		return [
			'img'      => [
				'alt'      => true,
				'class'    => true,
				'data-*'   => true,
				'decoding' => true,
				'height'   => true,
				'loading'  => true,
				'sizes'    => true,
				'src'      => true,
				'srcset'   => true,
				'width'    => true,
			],
			'noscript' => [],
			'a'        => [
				'href' => true,
			],
		];
	}

	/**
	 * Get post date to be displayed.
	 *
	 * @param WP_Post $post Post object.
	 * @return string Date string.
	 */
	public static function get_displayed_post_date( $post = null ) {
		if ( $post === null ) {
			$post = get_post();
		}
		return apply_filters( 'newspack_blocks_displayed_post_date', mysql_to_rfc3339( $post->post_date ), $post );
	}

	/**
	 * Get post date to be displayed, formatted.
	 *
	 * @param WP_Post $post Post object.
	 * @return string Formatted date.
	 */
	public static function get_formatted_displayed_post_date( $post = null ) {
		if ( $post === null ) {
			$post = get_post();
		}
		$date           = self::get_displayed_post_date( $post );
		$date           = new DateTime( $date );
		$date_format    = get_option( 'date_format' );
		$date_formatted = date_i18n( $date_format, $date->getTimestamp() );
		return apply_filters( 'newspack_blocks_formatted_displayed_post_date', $date_formatted, $post );
	}

	/**
	 * Get article meta footer.
	 *
	 * @param WP_Post $post Post object.
	 */
	public static function get_article_meta_footer( $post = null ) {
		if ( $post === null ) {
			$post = get_post();
		}
		$meta_footer = apply_filters( 'newspack_blocks_article_meta_footer', '', $post );
		if ( strlen( $meta_footer ) > 0 ) {
			return '<span style="margin: 0 6px;" class="newspack_blocks__article-meta-footer__separator">|</span>' . $meta_footer;
		}
	}

	/**
	 * Get a formatted HTML string containing amount and frequency of a donation.
	 *
	 * @param float  $amount Amount.
	 * @param string $frequency Frequency.
	 * @param bool   $hide_once_label Whether to hide the "once" label.
	 *
	 * @return string
	 */
	public static function get_formatted_amount( $amount = 0, $frequency = 'day', $hide_once_label = false ) {
		if ( ! function_exists( 'wc_price' ) || ( method_exists( 'Newspack\Donations', 'is_platform_wc' ) && ! \Newspack\Donations::is_platform_wc() ) ) {
			if ( 0 === $amount ) {
				return false;
			}

			// Translators: %s is the %s is the frequency.
			$frequency_string = 'once' === $frequency ? $frequency : sprintf( __( 'per %s', 'jetpack-mu-wpcom' ), $frequency );
			$formatter        = new NumberFormatter( \get_locale(), NumberFormatter::CURRENCY );
			$formatted_price  = '<span class="price-amount">' . $formatter->formatCurrency( $amount, 'USD' ) . '</span> <span class="tier-frequency">' . $frequency_string . '</span>';
			return str_replace( '.00', '', $formatted_price );
		}
		if ( ! function_exists( 'wcs_price_string' ) ) {
			return \wc_price( $amount );
		}
		$price_args          = [
			'recurring_amount'    => $amount,
			'subscription_period' => 'once' === $frequency ? 'day' : $frequency,
		];
		$wc_formatted_amount = \wcs_price_string( $price_args );

		// A '0' value means we want a placeholder string to replace in the editor.
		if ( 0 === $amount ) {
			preg_match( '/<\/span>(.*)<\/bdi>/', $wc_formatted_amount, $matches );
			if ( ! empty( $matches[1] ) ) {
				$wc_formatted_amount = str_replace( $matches[1], 'AMOUNT_PLACEHOLDER', $wc_formatted_amount );
			}
		}

		// A 'day' frequency means we want a placeholder string to replace in the editor.
		if ( 'day' === $frequency ) {
			$wc_formatted_amount = preg_replace( '/ \/ ?.*/', 'FREQUENCY_PLACEHOLDER', $wc_formatted_amount );
		} elseif ( 'once' === $frequency ) {
			$once_label          = $hide_once_label ? '' : __( ' once', 'jetpack-mu-wpcom' );
			$wc_formatted_amount = preg_replace( '/ \/ ?.*/', $once_label, $wc_formatted_amount );
		}
		$wc_formatted_amount = str_replace( ' / ', __( ' per ', 'jetpack-mu-wpcom' ), $wc_formatted_amount );

		return '<span class="wpbnbd__tiers__amount__value">' . $wc_formatted_amount . '</span>';
	}

	/**
	 * Get an image caption, optionally with credit appended.
	 *
	 * @param int  $attachment_id Attachment ID of the image.
	 * @param bool $include_caption Whether to include the caption.
	 * @param bool $include_credit Whether to include the credit.
	 *
	 * @return string
	 */
	public static function get_image_caption( $attachment_id = null, $include_caption = true, $include_credit = false ) {
		if ( ! $attachment_id || ( ! $include_caption && ! $include_credit ) ) {
			return '';
		}

		$caption = $include_caption ? wp_get_attachment_caption( $attachment_id ) : '';
		$credit  = '';

		if ( $include_credit && method_exists( 'Newspack\Newspack_Image_Credits', 'get_media_credit_string' ) ) {
			$credit = \Newspack\Newspack_Image_Credits::get_media_credit_string( $attachment_id );
		}

		$full_caption = trim( $caption . ' ' . $credit );
		if ( empty( $full_caption ) ) {
			return '';
		}

		$combined_caption = sprintf(
			'<figcaption%1$s>%2$s</figcaption>',
			! empty( $credit ) ? ' class="has-credit"' : '',
			$full_caption
		);

		return $combined_caption;
	}
}
Newspack_Blocks::init();
