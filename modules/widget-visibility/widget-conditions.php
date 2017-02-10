<?php


/**
 * Hide or show widgets conditionally.
 */

class Jetpack_Widget_Conditions {
	static $passed_template_redirect = false;

	public static function init() {
		if ( is_admin() ) {
			add_action( 'sidebar_admin_setup', array( __CLASS__, 'widget_admin_setup' ) );
			add_filter( 'widget_update_callback', array( __CLASS__, 'widget_update' ), 10, 3 );
			add_action( 'in_widget_form', array( __CLASS__, 'widget_conditions_admin' ), 10, 3 );
		} else if ( ! in_array( $GLOBALS['pagenow'], array( 'wp-login.php', 'wp-register.php' ) ) ) {
			add_filter( 'widget_display_callback', array( __CLASS__, 'filter_widget' ) );
			add_filter( 'sidebars_widgets', array( __CLASS__, 'sidebars_widgets' ) );
			add_action( 'template_redirect', array( __CLASS__, 'template_redirect' ) );
		}

		/**
		 * The widget_visibility_major_conditions filter accepts an array of existing conditions
		 * and should add new conditions in this format:
		 *
		 * $existing_conditions['my_unique_key'] = array(
		 *     'title' => 'User-facing label for this condition type',
		 *     'callback' => callable that accepts two arguments: a major condition (e.g., 'my_unique_key')
		 *                   and optional minor value (e.g., 'one_of_several_values')
		 */
		add_filter( 'widget_visibility_major_conditions', array( __CLASS__, 'major_conditions' ) );

		/**
		 * The widget_visibility_minor_conditions filter accepts two arguments: a major condition (e.g.,
		 * 'my_unique_key') and an array of exisiting minor values. It should add new minor conditions in
		 * this format:
		 *
		 * $existing_minor_conditions['a_unique_key'] = 'User-facing label for this condition type'
		 */
		add_filter( 'widget_visibility_minor_conditions', array( __CLASS__, 'minor_conditions' ), 10, 2 );
	}

	public static function widget_admin_setup() {
		if( is_rtl() ) {
			wp_enqueue_style( 'widget-conditions', plugins_url( 'widget-conditions/rtl/widget-conditions-rtl.css', __FILE__ ) );
		} else {
			wp_enqueue_style( 'widget-conditions', plugins_url( 'widget-conditions/widget-conditions.css', __FILE__ ) );
		}
		wp_enqueue_style( 'widget-conditions', plugins_url( 'widget-conditions/widget-conditions.css', __FILE__ ) );
		wp_enqueue_script( 'widget-conditions', plugins_url( 'widget-conditions/widget-conditions.js', __FILE__ ), array( 'jquery', 'jquery-ui-core' ), 20140721, true );

		// Set up a single copy of all of the data that Widget Visibility needs.
		// This allows all widget conditions to reuse the same data, keeping page size down
		// and eliminating the AJAX calls we used to have to use to fetch the minor rule options.
		$widget_conditions_data = array();

		$widget_conditions_data['category'] = array();
		$widget_conditions_data['category'][] = array( '', __( 'All category pages', 'jetpack' ) );

		$categories = get_categories( array( 'number' => 1000, 'orderby' => 'count', 'order' => 'DESC' ) );
		usort( $categories, array( __CLASS__, 'strcasecmp_name' ) );

		foreach ( $categories as $category ) {
			$widget_conditions_data['category'][] = array( (string) $category->term_id, $category->name );
		}

		$widget_conditions_data['loggedin'] = array();
		$widget_conditions_data['loggedin'][] = array( 'loggedin', __( 'Logged In', 'jetpack' ) );
		$widget_conditions_data['loggedin'][] = array( 'loggedout', __( 'Logged Out', 'jetpack' ) );

		$widget_conditions_data['author'] = array();
		$widget_conditions_data['author'][] = array( '', __( 'All author pages', 'jetpack' ) );

		$authors = get_users( array( 'orderby' => 'name', 'exclude_admin' => true ) );

		foreach ( $authors as $author ) {
			$widget_conditions_data['author'][] = array( (string) $author->ID, $author->display_name );
		}

		$widget_conditions_data['role'] = array();

		global $wp_roles;

		foreach ( $wp_roles->roles as $role_key => $role ) {
			$widget_conditions_data['role'][] = array( (string) $role_key, $role['name'] );
		}

		$widget_conditions_data['tag'] = array();
		$widget_conditions_data['tag'][] = array( '', __( 'All tag pages', 'jetpack' ) );

		$tags = get_tags( array( 'number' => 1000, 'orderby' => 'count', 'order' => 'DESC' ) );
		usort( $tags, array( __CLASS__, 'strcasecmp_name' ) );

		foreach ( $tags as $tag ) {
			$widget_conditions_data['tag'][] = array( (string) $tag->term_id, $tag->name );
		}

		$widget_conditions_data['date'] = array();
		$widget_conditions_data['date'][] = array( '', __( 'All date archives', 'jetpack' ) );
		$widget_conditions_data['date'][] = array( 'day', __( 'Daily archives', 'jetpack' ) );
		$widget_conditions_data['date'][] = array( 'month', __( 'Monthly archives', 'jetpack' ) );
		$widget_conditions_data['date'][] = array( 'year', __( 'Yearly archives', 'jetpack' ) );

		$widget_conditions_data['page'] = array();
		$widget_conditions_data['page'][] = array( 'front', __( 'Front page', 'jetpack' ) );
		$widget_conditions_data['page'][] = array( 'posts', __( 'Posts page', 'jetpack' ) );
		$widget_conditions_data['page'][] = array( 'archive', __( 'Archive page', 'jetpack' ) );
		$widget_conditions_data['page'][] = array( '404', __( '404 error page', 'jetpack' ) );
		$widget_conditions_data['page'][] = array( 'search', __( 'Search results', 'jetpack' ) );

		$post_types = get_post_types( array( 'public' => true ), 'objects' );

		$widget_conditions_post_types = array();

		foreach ( $post_types as $post_type ) {
			$widget_conditions_post_types[] = array( 'post_type-' . $post_type->name, $post_type->labels->singular_name );
		}

		$widget_conditions_data['page'][] = array( __( 'Post type:', 'jetpack' ), $widget_conditions_post_types );

		$pages_dropdown = preg_replace( '/<\/?select[^>]*?>/i', '', wp_dropdown_pages( array( 'echo' => false ) ) );

		preg_match_all( '/value=.([0-9]+).[^>]*>([^<]+)</', $pages_dropdown, $page_ids_and_titles, PREG_SET_ORDER );

		$static_pages = array();

		foreach ( $page_ids_and_titles as $page_id_and_title ) {
			$static_pages[] = array( (string) $page_id_and_title[1], $page_id_and_title[2] );
		}

		$widget_conditions_data['page'][] = array( __( 'Static page:', 'jetpack' ), $static_pages );

		$widget_conditions_data['taxonomy'] = array();
		$widget_conditions_data['taxonomy'][] = array( '', __( 'All taxonomy pages', 'jetpack' ) );

		$taxonomies = get_taxonomies( array( '_builtin' => false ), 'objects' );
		usort( $taxonomies, array( __CLASS__, 'strcasecmp_name' ) );

		foreach ( $taxonomies as $taxonomy ) {
			$taxonomy_terms = get_terms( array( $taxonomy->name ), array( 'number' => 250, 'hide_empty' => false ) );

			$widget_conditions_terms = array();
			$widget_conditions_terms[] = array( $taxonomy->name, __( 'All pages', 'jetpack' ) );

			foreach ( $taxonomy_terms as $term ) {
				$widget_conditions_terms[] = array( $taxonomy->name . '_tax_' . $term->term_id, $term->name );
			}

			$widget_conditions_data['taxonomy'][] = array( $taxonomy->labels->name . ':', $widget_conditions_terms );
		}

		wp_localize_script( 'widget-conditions', 'widget_conditions_data', $widget_conditions_data );

		// Save a list of the IDs of all pages that have children for dynamically showing the "Include children" checkbox.
		$all_pages = get_pages();
		$all_parents = array();

		foreach ( $all_pages as $page ) {
			if ( $page->post_parent ) {
				$all_parents[ (string) $page->post_parent ] = true;
			}
		}

		$front_page_id = get_option( 'page_on_front' );

		if ( isset( $all_parents[ $front_page_id ] ) ) {
			$all_parents[ 'front' ] = true;
		}

		wp_localize_script( 'widget-conditions', 'widget_conditions_parent_pages', $all_parents );
	}

	/**
	 * Register the major condition types that we'll support by default.
	 */
	public static function major_conditions( $major_conditions ) {
		return array_merge( $major_conditions, array(
			'category' => array(
				'title' => __( 'Category', 'jetpack' ),
				'callback' => array( __CLASS__, 'condition_callback' ),
			),
			'author' => array(
				'title' => _x( 'Author', 'Noun, as in: "The author of this post is..."', 'jetpack' ),
				'callback' => array( __CLASS__, 'condition_callback' ),
			),
			'tag' => array(
				'title' => _x( 'Tag', 'Noun, as in: "This post has one tag."', 'jetpack' ),
				'callback' => array( __CLASS__, 'condition_callback' ),
			),
			'date' => array(
				'title' => _x( 'Date', 'Noun, as in: "This page is a date archive."', 'jetpack' ),
				'callback' => array( __CLASS__, 'condition_callback' ),
			),
			'page' => array(
				'title' => _x( 'Page', 'Example: The user is looking at a page, not a post.', 'jetpack' ),
				'callback' => array( __CLASS__, 'condition_callback' ),
			),
			'taxonomy' => array(
				'title' => _x( 'Taxonomy', 'Noun, as in: "This post has one taxonomy."', 'jetpack' ),
				'callback' => array( __CLASS__, 'condition_callback' ),
			),
		) );
	}

	/**
	 * Register the possible values for the major conditions that we support.
	 *
	 * This takes `$minor_conditions` as the first parameter as it's a filter
	 * on that value.
	 *
	 * @param array $minor_conditions An associative array of possible values.
	 * @param string $major_condition The condition for these values.
	 * @return array
	 */
	public static function minor_conditions( $minor_conditions, $major_condition ) {
		switch ( $major_condition ) {
			case 'category':
				$minor_conditions[''] = __( 'All category pages', 'jetpack' );

				$categories = get_categories( array( 'number' => 1000, 'orderby' => 'count', 'order' => 'DESC' ) );
				usort( $categories, array( __CLASS__, 'strcasecmp_name' ) );

				foreach ( $categories as $category ) {
					$minor_conditions[$category->term_id] = $category->name;
				}
			break;
			case 'author':
				$minor_conditions[''] = __( 'All author pages', 'jetpack' );

				foreach ( get_users( array( 'orderby' => 'name', 'exclude_admin' => true ) ) as $author ) {
					$minor_conditions[$author->ID] = $author->display_name;
				}
			break;
			case 'tag':
				$minor_conditions[''] = __( 'All tag pages', 'jetpack' );

				$tags = get_tags( array( 'number' => 1000, 'orderby' => 'count', 'order' => 'DESC' ) );
				usort( $tags, array( __CLASS__, 'strcasecmp_name' ) );

				foreach ( $tags as $tag ) {
					$minor_conditions[$tag->term_id] = $tag->name;
				}
			break;
			case 'date':
				$minor_conditions[''] = __( 'All date archives', 'jetpack' );
				$minor_conditions['day'] = __( 'Daily archives', 'jetpack' );
				$minor_conditions['month'] = __( 'Monthly archives', 'jetpack' );
				$minor_conditions['year'] = __( 'Yearly archives', 'jetpack' );
			break;
			case 'page':
				$minor_conditions['front'] = __( 'Front page', 'jetpack' );
				$minor_conditions['posts'] = __( 'Posts page', 'jetpack' );
				$minor_conditions['archive'] = __( 'Archive page', 'jetpack' );
				$minor_conditions['404'] = __( '404 error page', 'jetpack' );
				$minor_conditions['search'] = __( 'Search results', 'jetpack' );

				$post_type_values = array();
				$post_types = get_post_types( array( 'public' => true ), 'objects' );

				foreach ( $post_types as $post_type ) {
					$post_type_values[ 'post_type-' . $post_type->name ] = $post_type->labels->singular_name;
				}

				$minor_conditions[ __( 'Post type:', 'jetpack' ) ] = $post_type_values;

				$static_pages = array();

				$pages = get_pages( array( 'sort_order' => 'menu_order' ) );
				$parent_depths = array();

				foreach ( $pages as $page ) {
					if ( isset( $parent_depths[ $page->post_parent ] ) ) {
						$depth = $parent_depths[ $page->post_parent ] + 1;
					}
					else {
						$depth = 0;
					}

					$parent_depths[ $page->ID ] = $depth;

					$static_pages[ $page->ID ] = str_repeat( "&nbsp;", $depth * 2 ) . $page->post_title;
				}

				$minor_conditions[ __( 'Static page:', 'jetpack' ) ] = $static_pages;
			break;
			case 'taxonomy':
				$minor_conditions[''] = __( 'All taxonomy pages', 'jetpack' );

				$taxonomies = get_taxonomies( array( '_builtin' => false ), 'objects' );
				usort( $taxonomies, array( __CLASS__, 'strcasecmp_name' ) );

				foreach ( $taxonomies as $taxonomy ) {
					$sub_taxonomies = array(
						$taxonomy->name => sprintf( __( 'All %s pages', 'jetpack' ), $taxonomy->name ),
					);

					$terms = get_terms( array( $taxonomy->name ), array( 'number' => 1000, 'hide_empty' => false ) );
					foreach ( $terms as $term ) {
						$sub_taxonomies[ $taxonomy->name . '_tax_' . $term->term_id ] = $term->name;
					}

					$minor_conditions[ $taxonomy->labels->name . ':' ] = $sub_taxonomies;
				}
			break;
		}

		return $minor_conditions;
	}

	/**
	 * The callback that does the actual filtering.
	 *
	 * @param string $major The "major" filter category.
	 * @param string $minor The "minor" filter value.
	 * @return boolean Whether this condition is met in the current context.
	 */
	public static function condition_callback( $major, $minor ) {
		switch ( $major ) {
			case 'date':
				switch ( $minor ) {
					case '':
						return is_date();
					break;
					case 'month':
						return is_month();
					break;
					case 'day':
						return is_day();
					break;
					case 'year':
						return is_year();
					break;
				}
			break;
			case 'page':
				// Previously hardcoded post type options.
				if ( 'post' == $minor )
					$minor = 'post_type-post';
				else if ( ! $minor )
					$minor = 'post_type-page';

				switch ( $minor ) {
					case '404':
						return is_404();
					break;
					case 'search':
						return is_search();
					break;
					case 'archive':
						return is_archive();
					break;
					case 'posts':
						return $wp_query->is_posts_page;
					break;
					case 'home':
						return is_home();
					break;
					case 'front':
						if ( current_theme_supports( 'infinite-scroll' ) )
							return is_front_page();
						else {
							return is_front_page() && !is_paged();
						}
					break;
					default:
						if ( substr( $minor, 0, 10 ) == 'post_type-' )
							return is_singular( substr( $minor, 10 ) );
						else {
							// $minor is a page ID -- check if we're either looking at that particular page itself OR looking at the posts page, with the correct conditions
							return ( is_page( $minor ) || ( get_option( 'show_on_front' ) == 'page' && $wp_query->is_posts_page && get_option( 'page_for_posts' ) == $minor ) );
						}
					break;
				}
			break;
			case 'tag':
				if ( ! $minor && is_tag() )
					return true;
				else if ( is_singular() && $minor && has_tag( $minor ) )
					return true;
				else {
					$tag = get_tag( $minor );

					if ( $tag && is_tag( $tag->slug ) )
						return true;
				}
			break;
			case 'category':
				if ( ! $minor && is_category() )
					return true;
				else if ( is_category( $minor ) )
					return true;
				else if ( is_singular() && $minor && in_array( 'category', get_post_taxonomies() ) &&  has_category( $minor ) )
					return true;
			break;
			case 'author':
				if ( ! $minor && is_author() )
					return true;
				else if ( $minor && is_author( $minor ) )
					return true;
				else if ( is_singular() && $minor && $minor == $post->post_author )
					return true;
			break;
			case 'taxonomy':
				$term = explode( '_tax_', $minor ); // $term[0] = taxonomy name; $term[1] = term id
				$terms = get_the_terms( $post->ID, $minor ); // Does post have terms in taxonomy?
				if ( is_tax( $term[0], $term[1] ) )
					return true;
				else if ( is_singular() && $term[1] && has_term( $term[1], $term[0] ) )
					return true;
				else if ( is_singular() && $terms & !is_wp_error( $terms ) )
					return true;
			break;
		}

		return false;
	}

	/**
	 * Provided a second level of granularity for widget conditions.
	 */
	public static function widget_conditions_options_echo( $major = '', $selected_value = '' ) {
		if ( $major ) {
			$minor_conditions = apply_filters( 'widget_visibility_minor_conditions', array(), $major );

			foreach ( $minor_conditions as $key => $val ) {
				self::do_widget_conditions_options_echo( $selected_value, $key, $val );
			}
		}
	}

	private static function do_widget_conditions_options_echo( $selected_value, $minor_key, $minor_value ) {
		if ( is_array( $minor_value ) ) {
			?>
			<optgroup label="<?php echo esc_attr( $minor_key ); ?>">
				<?php

				foreach ( $minor_value as $grouped_minor_key => $grouped_minor_value ) {
					self::do_widget_conditions_options_echo( $selected_value, $grouped_minor_key, $grouped_minor_value );
				}

				?>
			</optgroup>
			<?php
		}
		else {
			?>
			<option value="<?php echo esc_attr( $minor_key ); ?>" <?php selected( $minor_key, $selected_value ); ?>><?php echo esc_html( $minor_value ); ?></option>
			<?php
		}
	}

	/**
	 * Add the widget conditions to each widget in the admin.
	 *
	 * @param $widget unused.
	 * @param $return unused.
	 * @param array $instance The widget settings.
	 */
	public static function widget_conditions_admin( $widget, $return, $instance ) {
		$conditions = array();

		if ( isset( $instance['conditions'] ) )
			$conditions = $instance['conditions'];

		if ( ! isset( $conditions['action'] ) )
			$conditions['action'] = 'show';

		if ( empty( $conditions['rules'] ) )
			$conditions['rules'][] = array( 'major' => '', 'minor' => '', 'has_children' => '' );

		$major_conditions = apply_filters( 'widget_visibility_major_conditions', array() );

		?>
		<div class="widget-conditional <?php if ( empty( $_POST['widget-conditions-visible'] ) || $_POST['widget-conditions-visible'] == '0' ) { ?>widget-conditional-hide<?php } ?>">
			<input type="hidden" name="widget-conditions-visible" value="<?php if ( isset( $_POST['widget-conditions-visible'] ) ) { echo esc_attr( $_POST['widget-conditions-visible'] ); } else { ?>0<?php } ?>" />
			<?php if ( ! isset( $_POST['widget-conditions-visible'] ) ) { ?><a href="#" class="button display-options"><?php _e( 'Visibility', 'jetpack' ); ?></a><?php } ?>
			<div class="widget-conditional-inner">
				<div class="condition-top">
					<?php printf( _x( '%s if:', 'placeholder: dropdown menu to select widget visibility; hide if or show if', 'jetpack' ), '<select name="conditions[action]"><option value="show" ' . selected( $conditions['action'], 'show', false ) . '>' . esc_html_x( 'Show', 'Used in the "%s if:" translation for the widget visibility dropdown', 'jetpack' ) . '</option><option value="hide" ' . selected( $conditions['action'], 'hide', false ) . '>' . esc_html_x( 'Hide', 'Used in the "%s if:" translation for the widget visibility dropdown', 'jetpack' ) . '</option></select>' ); ?>
				</div><!-- .condition-top -->

				<div class="conditions">
					<?php

					foreach ( $conditions['rules'] as $rule_index => $rule ) {
						$rule = wp_parse_args( $rule, array( 'major' => '', 'minor' => '', 'has_children' => '' ) );
						?>
						<div class="condition" data-rule-major="<?php echo esc_attr( $rule['major'] ); ?>" data-rule-minor="<?php echo esc_attr( $rule['minor'] ); ?>" data-rule-has-children="<?php echo esc_attr( $rule['has_children'] ); ?>">
							<div class="selection alignleft">
								<select class="conditions-rule-major" name="conditions[rules_major][]">
									<option value="" <?php selected( "", $rule['major'] ); ?>><?php echo esc_html_x( '-- Select --', 'Used as the default option in a dropdown list', 'jetpack' ); ?></option>
									<?php foreach ( $major_conditions as $major_condition_key => $major_condition_meta ) { ?>
										<option value="<?php echo esc_attr( $major_condition_key ); ?>" <?php selected( $major_condition_key, $rule['major'] ); ?>><?php echo esc_html( $major_condition_meta['title'] ); ?></option>
									<?php } ?>
								</select>

								<?php _ex( 'is', 'Widget Visibility: {Rule Major [Page]} is {Rule Minor [Search results]}', 'jetpack' ); ?>

								<select class="conditions-rule-minor" name="conditions[rules_minor][]" <?php if ( ! $rule['major'] ) { ?> disabled="disabled"<?php } ?>>
									<?php /* Include the currently selected value so that if the widget is saved without
									         expanding the Visibility section, we don't lose the minor part of the rule.
									         If it is opened, this list is cleared out and populated with all the values. */ ?>
									<option value="<?php echo esc_attr( $rule['minor'] ); ?>" selected="selected"></option>
								</select>

								<span class="conditions-rule-has-children" <?php if ( ! $rule['has_children'] ) { ?> style="display: none;"<?php } ?>>
									<label>
										<input type="checkbox" name="conditions[page_children][<?php echo $rule_index; ?>]" value="has" <?php checked( $rule['has_children'], true ); ?> />
										<?php echo esc_html_x( "Include children", 'Checkbox on Widget Visibility if children of the selected page should be included in the visibility rule.', 'jetpack' ); ?>
									</label>
								</span>
							</div>

							<div class="condition-control">
								<span class="condition-conjunction"><?php echo esc_html_x( 'or', 'Shown between widget visibility conditions.', 'jetpack' ); ?></span>
								<div class="actions alignright">
									<a href="#" class="delete-condition dashicons dashicons-no"><?php esc_html_e( 'Delete', 'jetpack' ); ?></a><a href="#" class="add-condition dashicons dashicons-plus"><?php esc_html_e( 'Add', 'jetpack' ); ?></a>
								</div>
							</div>

						</div><!-- .condition -->
						<?php
					}

					?>
				</div><!-- .conditions -->
			</div><!-- .widget-conditional-inner -->
		</div><!-- .widget-conditional -->
		<?php
	}

	/**
	 * On an AJAX update of the widget settings, process the display conditions.
	 *
	 * @param array $new_instance New settings for this instance as input by the user.
	 * @param array $old_instance Old settings for this instance.
	 * @return array Modified settings.
	 */
	public static function widget_update( $instance, $new_instance, $old_instance ) {
		if ( empty( $_POST['conditions'] ) ) {
			return $instance;
		}

		$conditions = array();
		$conditions['action'] = $_POST['conditions']['action'];
		$conditions['rules'] = array();

		foreach ( $_POST['conditions']['rules_major'] as $index => $major_rule ) {
			if ( ! $major_rule )
				continue;

			$conditions['rules'][] = array(
				'major' => $major_rule,
				'minor' => isset( $_POST['conditions']['rules_minor'][$index] ) ? $_POST['conditions']['rules_minor'][$index] : '',
				'has_children' => isset( $_POST['conditions']['page_children'][$index] ) ? true : false,
			);
		}

		if ( ! empty( $conditions['rules'] ) )
			$instance['conditions'] = $conditions;
		else
			unset( $instance['conditions'] );

		if (
				( isset( $instance['conditions'] ) && ! isset( $old_instance['conditions'] ) )
				||
				(
					isset( $instance['conditions'], $old_instance['conditions'] )
					&&
					serialize( $instance['conditions'] ) != serialize( $old_instance['conditions'] )
				)
			) {

			/**
			 * Fires after the widget visibility conditions are saved.
			 *
			 * @module widget-visibility
			 *
			 * @since 2.4.0
			 */
			do_action( 'widget_conditions_save' );
		}
		else if ( ! isset( $instance['conditions'] ) && isset( $old_instance['conditions'] ) ) {

			/**
			 * Fires after the widget visibility conditions are deleted.
			 *
			 * @module widget-visibility
			 *
			 * @since 2.4.0
			 */
			do_action( 'widget_conditions_delete' );
		}

		return $instance;
	}

	/**
	 * Filter the list of widgets for a sidebar so that active sidebars work as expected.
	 *
	 * @param array $widget_areas An array of widget areas and their widgets.
	 * @return array The modified $widget_area array.
	 */
	public static function sidebars_widgets( $widget_areas ) {
		$settings = array();

		foreach ( $widget_areas as $widget_area => $widgets ) {
			if ( empty( $widgets ) )
				continue;

			if ( ! is_array( $widgets ) )
				continue;

			if ( 'wp_inactive_widgets' == $widget_area )
				continue;

			foreach ( $widgets as $position => $widget_id ) {
				// Find the conditions for this widget.
				if ( preg_match( '/^(.+?)-(\d+)$/', $widget_id, $matches ) ) {
					$id_base = $matches[1];
					$widget_number = intval( $matches[2] );
				}
				else {
					$id_base = $widget_id;
					$widget_number = null;
				}

				if ( ! isset( $settings[$id_base] ) ) {
					$settings[$id_base] = get_option( 'widget_' . $id_base );
				}

				// New multi widget (WP_Widget)
				if ( ! is_null( $widget_number ) ) {
					if ( isset( $settings[$id_base][$widget_number] ) && false === self::filter_widget( $settings[$id_base][$widget_number] ) ) {
						unset( $widget_areas[$widget_area][$position] );
					}
				}

				// Old single widget
				else if ( ! empty( $settings[ $id_base ] ) && false === self::filter_widget( $settings[$id_base] ) ) {
					unset( $widget_areas[$widget_area][$position] );
				}
			}
		}

		return $widget_areas;
	}

	public static function template_redirect() {
		self::$passed_template_redirect = true;
	}

	/**
	 * Generates a condition key based on the rule array
	 *
	 * @param array $rule
	 * @return string key used to retrieve the condition.
	 */
	static function generate_condition_key( $rule ) {
		if ( isset( $rule['has_children'] ) ) {
			return $rule['major'] . ":" . $rule['minor'] . ":" . $rule['has_children'];
		}
		return $rule['major'] . ":" . $rule['minor'];
	}

	/**
	 * Determine whether the widget should be displayed based on conditions set by the user.
	 *
	 * @param array $instance The widget settings.
	 * @return array Settings to display or bool false to hide.
	 */
	public static function filter_widget( $instance ) {
		global $wp_query;

		if ( empty( $instance['conditions'] ) || empty( $instance['conditions']['rules'] ) )
			return $instance;

		// Store the results of all in-page condition lookups so that multiple widgets with
		// the same visibility conditions don't result in duplicate DB queries.
		static $condition_result_cache = array();

		$condition_result = false;

		$major_conditions = apply_filters( 'widget_visibility_major_conditions', array() );
		foreach ( $instance['conditions']['rules'] as $rule ) {
			if ( isset( $major_conditions[ $rule['major'] ] ) ) {
				$condition_result = call_user_func( $major_conditions[ $rule['major'] ]['callback'], $rule['major'], $rule['minor'] );
			}

			if ( $condition_result )
				break;
		}

		if ( ( 'show' == $instance['conditions']['action'] && ! $condition_result ) || ( 'hide' == $instance['conditions']['action'] && $condition_result ) )
			return false;

		return $instance;
	}

	public static function strcasecmp_name( $a, $b ) {
		return strcasecmp( $a->name, $b->name );
	}

	public static function maybe_get_split_term( $old_term_id = '', $taxonomy = '' ) {
		$term_id = $old_term_id;

		if ( 'tag' == $taxonomy ) {
			$taxonomy = 'post_tag';
		}

		if ( function_exists( 'wp_get_split_term' ) && $new_term_id = wp_get_split_term( $old_term_id, $taxonomy ) ) {
			$term_id = $new_term_id;
		}

		return $term_id;
	}
}

add_action( 'init', array( 'Jetpack_Widget_Conditions', 'init' ) );
