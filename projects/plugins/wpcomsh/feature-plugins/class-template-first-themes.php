<?php
/**
 * Template_First_Themes file.
 * This file started from wp-content/mu-plugins/full-site-editing/class-template-first-themes.php in order to bring
 * theme homepage switch to Atomic.
 *
 * @package wpcomsh
 */

/**
 * "Template-first themes" are themes which set the homepage as a static page
 * defined in the Headstart annotation.
 */
class Template_First_Themes {

	/**
	 * Class instance.
	 *
	 * @var Template_First_Themes
	 */
	private static $instance = null;

	/**
	 * Creates instance.
	 *
	 * @return Template_First_Themes
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Returns whether the theme supports automatically setting up a static home page
	 * from Headstart annotation when it is activated.
	 *
	 * @param \WP_Theme $theme WP_Theme the theme.
	 */
	public function has_auto_loading_homepage( $theme ) {
		return (bool) $this->get_front_page_template( $theme->get_stylesheet() ) &&
			in_array( 'auto-loading-homepage', $theme->tags, true );
	}

	/**
	 * Updates the front-page with the new theme's homepage template.
	 *
	 * @return bool True if the homepage is changed, false is not.
	 */
	public function switch_homepage_to_static_page() {
		$stylesheet = get_stylesheet();

		// See if a homepage template already exists for this theme
		// or a tracked previous homepage for legacy themes.
		$new_front_page_id = $this->get_existing_homepage_template_id( $stylesheet );

		// Create homepage template if it doesn't already exist.
		if ( ! $new_front_page_id ) {
			$new_front_page_id = $this->create_front_page_template( $stylesheet );
		}

		// Something failed when getting the front-page ID.
		if ( ! $new_front_page_id || is_wp_error( $new_front_page_id ) ) {
			return false;
		}

		$this->apply_stylesheet_front_page_meta_to_id( $stylesheet, $new_front_page_id );
		return $this->setup_static_front_page_theme( $new_front_page_id );
	}

	/**
	 * Look inside $stylesheet for special meta attributes defined on the front
	 * page inside the headstart annotation, then apply those to $page_id.
	 * Looks for: 'page_template'.
	 * Used to apply finishing touches to the homepage on theme switch with
	 * "change my homepage" option.
	 *
	 * @param string $stylesheet  Theme's stylesheet.
	 * @param int    $page_id  ID of static front-page to change meta on.
	 */
	public function apply_stylesheet_front_page_meta_to_id( $stylesheet, $page_id ) {
		$front_page = $this->get_front_page_template( $stylesheet );
		if ( ! empty( $front_page->page_template ) ) {
			update_post_meta( $page_id, '_wp_page_template', $front_page->page_template );
		}
	}

	/**
	 * Cleans up old posts page that was generated
	 * when activating the old theme.
	 */
	public function clean_up_old_posts_page() {
		// Draft previously created "Blog" page if exists
		$page_for_posts = $this->get_existing_posts_page_id();
		if ( $page_for_posts ) {
			$old_posts_page                = get_post( $page_for_posts, ARRAY_A );
			$old_posts_page['post_status'] = 'draft';
			wp_update_post( $old_posts_page );
		}
	}

	/**
	 * Create a page using the theme's front-page template.
	 *
	 * @param string $stylesheet  Theme's stylesheet.
	 */
	public function create_front_page_template( $stylesheet ) {
		$new_theme_home_template = $this->get_front_page_template( $stylesheet );

		// No template for this locale yet.
		if ( ! $new_theme_home_template ) {
			return false;
		}

		$new_front_page_id = wp_insert_post(
			array(
				'post_author'  => get_current_user_id(),
				'post_content' => $new_theme_home_template->post_content,
				'post_title'   => $new_theme_home_template->post_title,
				'post_type'    => $new_theme_home_template->post_type,
			)
		);

		if ( ! $new_front_page_id || is_wp_error( $new_front_page_id ) ) {
			return false; // Bail. If there's no new page, there's nothing to update.
		}

		update_post_meta( $new_front_page_id, '_tft_homepage_template', $stylesheet );

		return $new_front_page_id;
	}

	/**
	 * Create a page using the theme's front-page template.
	 *
	 * @param int $front_page_id  ID of static front-page.
	 */
	public function setup_static_front_page_theme( $front_page_id ) {
		if ( ! $front_page_id ) {
			return false;
		}

		$old_front_page_id = (int) get_option( 'page_on_front' );
		$old_show_on_front = get_option( 'show_on_front' );

		// Make sure the front-page is published.
		wp_publish_post( $front_page_id );

		$page_for_posts = (int) get_option( 'page_for_posts' );

		// If we're switching from a blog to static front-page theme
		// and a previous blog page exists, make sure it's published.
		if ( 'posts' === $old_show_on_front && $page_for_posts ) {
			wp_publish_post( $page_for_posts );
		}

		// If we're switching from a blog to static front-page theme
		// and we don't have a place for blog posts, create one and assign it.
		if ( 'posts' === $old_show_on_front && ! $page_for_posts ) {
			$page_for_posts = $this->get_existing_posts_page_id();

			if ( ! $page_for_posts ) {
				// Create a blog page.
				$page_for_posts = wp_insert_post(
					array(
						'post_author'  => get_current_user_id(),
						'post_content' => '',
						'post_title'   => __( 'Blog' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
						'post_type'    => 'page',
						'post_status'  => 'publish',
						'meta_input'   => array( '_tft_posts_page' => '1' ),
					)
				);
			} else {
				// Publish the blog page if it was previously drafted.
				wp_publish_post( $page_for_posts );
			}

			if ( ! is_wp_error( $page_for_posts ) ) {
				update_option( 'page_for_posts', $page_for_posts );
			}
		}

		// Set new static front-page.
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $front_page_id );

		// Block-based themes seem to do better with this.
		set_theme_mod( 'hide_front_page_title', true );

		// Set old front-page to draft.
		if ( $old_front_page_id !== $front_page_id ) {
			$old_front_page                = get_post( $old_front_page_id, ARRAY_A );
			$old_front_page['post_status'] = 'draft';
			wp_update_post( $old_front_page );
		}

		// Update menu items.
		$this->update_menus( $old_front_page_id, $front_page_id );
	}

	/**
	 * Returns the home page template of the current theme.
	 *
	 * @param string $theme  Slug of the theme to check.
	 * @param string $locale Optional. Locale to fetch. Default: Current locale.
	 * @return bool|object Front-page on success, false on failure.
	 */
	public function get_front_page_template( $theme, $locale = '' ) {
		if ( empty( $locale ) ) {
			$locale = get_locale();
		}

		$cache_key = 'template_first_theme_front_page_' . $theme . '_' . $locale;
		$cache     = wp_cache_get( $cache_key, 'themes' );
		if ( false !== $cache ) {
			return $cache;
		}

		$front_page = $this->get_homepage( $theme, $locale, 'en' );
		if ( $front_page === false ) {
			return false;
		}

		$front_page['post_slug'] = sanitize_title_with_dashes( $front_page['post_title'] );

		wp_cache_set( $cache_key, (object) $front_page, 'themes', DAY_IN_SECONDS );

		return (object) $front_page;
	}

	/**
	 * Retrieves the homepage for a specific theme in the selected locale.
	 *
	 * @param string $theme_name The name of the theme.
	 * @param string $locale The preferred locale.
	 * @param string $fallback_locale The locale that's preferred if $locale is not found.
	 *
	 * @return array|bool It will return an associative array that represents the homepage or
	 * false if it doesn't exist.
	 */
	protected function get_homepage( $theme_name, $locale, $fallback_locale ) {
		$annotation = wpcomsh_headstart_get_annotation( $theme_name, $locale, $fallback_locale );

		// 1. Bail if there isn't a static front page.
		if ( ! isset( $annotation['settings']['options']['show_on_front'] ) ) {
			return false;
		}

		// 2. Find the actual content.
		foreach ( $annotation['content'] as $el ) {
			if ( isset( $el['hs_custom_meta'] ) && $el['hs_custom_meta'] === '_hs_front_page' ) {
				return $el;
			}
		}

		return false;
	}

	/**
	 * Looks for a stored homepage template and returns its ID.
	 *
	 * @param string $stylesheet Slug of the theme to check.
	 * @return bool|int Front-page ID on success, false on failure.
	 */
	public function get_existing_homepage_template_id( $stylesheet = '' ) {
		if ( ! $stylesheet ) {
			return false;
		}

		$args = array(
			'fields'         => 'ids',
			'no_found_rows'  => true,
			// phpcs:ignore WordPress.VIP.PostsPerPage.posts_per_page_nopaging
			'nopaging'       => true,
			'post_type'      => 'page',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_key'       => '_tft_homepage_template',
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'meta_value'     => $stylesheet,
		);

		$ids = ( new \WP_Query() )->query( $args );

		return $ids[0] ?? false;
	}

	/**
	 * Looks if a posts page has already been created and returns its ID.
	 *
	 * @return bool|int Posts page on success, false on failure.
	 */
	public function get_existing_posts_page_id() {
		$args = array(
			'fields'         => 'ids',
			'no_found_rows'  => true,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'nopaging'       => true,
			'post_type'      => 'page',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_key'       => '_tft_posts_page',
			// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'meta_value'     => '1',
		);

		$ids = ( new \WP_Query() )->query( $args );

		return $ids[0] ?? false;
	}

	/**
	 * Update menu items.
	 *
	 * @param int $old_page_id ID of the old front-page.
	 * @param int $new_page_id ID of the new front-page.
	 */
	public function update_menus( $old_page_id, $new_page_id ) {
		$new_page = get_post( $new_page_id );

		foreach ( wp_get_nav_menus() as $menu ) {
			foreach ( wp_get_nav_menu_items( $menu ) as $menu_item ) {
				if ( (int) $menu_item->object_id === $old_page_id ) {
					wp_update_nav_menu_item(
						$menu->term_id,
						$menu_item->ID,
						array(
							'menu-item-attr-title' => $new_page->post_excerpt,
							'menu-item-object'     => 'page',
							'menu-item-object-id'  => $new_page_id,
							'menu-item-position'   => $menu_item->menu_order,
							'menu-item-title'      => $new_page->post_title,
							'menu-item-type'       => 'post_type',
						)
					);
				}
			}
		}
	}
}
