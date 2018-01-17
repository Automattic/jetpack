<?php

/**
 * Provides a widget to show available/selected filters on searches
 */
class Jetpack_Search_Widget_Filters extends WP_Widget {

	protected $jetpack_search;

	const DEFAULT_FILTER_COUNT = 5;

	function __construct() {
		if ( ! class_exists( 'Jetpack_Search' ) ) {
			return;
		}

		parent::__construct(
			'jetpack-search-filters',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', esc_html__( 'Search', 'jetpack' ) ),
			array(
				'classname'   => 'jetpack-filters widget_search',
				'description' => __( 'Displays Jetpack Search box and filters.', 'jetpack' ),
			)
		);

		$this->jetpack_search = Jetpack_Search::instance();

		if ( is_admin() ) {
			add_action( 'sidebar_admin_setup', array( $this, 'widget_admin_setup' ) );
		}

		add_action( 'jetpack_search_render_filters_widget_title', array( $this, 'render_widget_title' ), 10, 3 );
		add_action( 'jetpack_search_render_active_filters', array( $this, 'render_current_filters' ), 10, 2 );
		add_action( 'jetpack_search_render_filters', array( $this, 'render_available_filters' ), 10, 1 );
	}

	function widget_admin_setup() {
		wp_register_script( 'widget-jetpack-search-filters', plugins_url( 'js/search-widget-filters-admin.js', __FILE__ ), array( 'jquery' ) );
		wp_enqueue_style( 'widget-jetpack-search-filters', plugins_url( 'css/search-widget-filters-admin-ui.css', __FILE__ ) );

		wp_localize_script( 'widget-jetpack-search-filters', 'jetpack_search_filter_admin', array(
			'defaultFilterCount' => self::DEFAULT_FILTER_COUNT,
		) );

		wp_enqueue_script( 'widget-jetpack-search-filters' );
	}

	function is_for_current_widget( $item ) {
		return isset( $item['widget_id'] ) && $this->id == $item['widget_id'];
	}

	/**
	 * Given the widget instance, will return true when selected post types differ from searchable post types.
	 *
	 * @since 5.8.0
	 *
	 * @param array $instance
	 * @return bool
	 */
	function post_types_differ_searchable( $instance ) {
		if ( empty( $instance['post_types'] ) ) {
			return false;
		}

		$searchable_post_types = get_post_types( array( 'exclude_from_search' => false ) );
		$diff_of_searchable = array_diff( $searchable_post_types, (array) $instance['post_types'] );

		return ! empty( $diff_of_searchable );
	}

	/**
	 * Given the widget instance, will return true when selected post types differ from the post type filters
	 * applied to the search.
	 *
	 * @since 5.8.0
	 *
	 * @param array $instance
	 * @return bool
	 */
	function post_types_differ_query( $instance ) {
		if ( empty( $instance['post_types'] ) ) {
			return false;
		}

		$diff_query = array_diff( (array) $instance['post_types'], (array) $_GET['post_type'] );
		return ! empty( $diff_query );
	}

	/**
	 * This method returns a boolean for whether the widget should show site-wide filters for the site.
	 *
	 * This is meant to provide backwards-compatibility for VIP, and other professional plan users, that manually
	 * configured filters via `Jetpack_Search::set_filters()`.
	 *
	 * @since 5.7.0
	 *
	 * @return bool Whether the widget should display site-wide filters or not
	 */
	function should_display_sitewide_filters() {
		$filter_widgets = get_option( 'widget_jetpack-search-filters' );

		// This shouldn't be empty, but just for sanity
		if ( empty( $filter_widgets ) )  {
			return false;
		}

		// If any widget has checked add filters, return false
		foreach ( $filter_widgets as $number => $widget ) {
			$widget_id = sprintf( 'jetpack-search-filters-%d', $number );
			if ( ! empty( $widget['use_filters'] ) && is_active_widget( false, $widget_id, 'jetpack-search-filters' ) ) {
				return false;
			}
		}

		return true;
	}

	function widget( $args, $instance ) {

		$display_filters = false;
		if ( is_search() ) {
			$filters = $this->jetpack_search->get_filters();
			$active_buckets = $this->jetpack_search->get_active_filter_buckets();

			if ( ! empty( $filters ) || ! empty( $active_buckets ) ) {

				if ( ! $this->jetpack_search->are_filters_by_widget_disabled() && ! $this->should_display_sitewide_filters() ) {
					$filters = array_filter( $filters, array( $this, 'is_for_current_widget' ) );
					$active_buckets = array_filter( $active_buckets, array( $this, 'is_for_current_widget' ) );
				}

				foreach ( $filters as $filter ) {
					if ( isset( $filter['buckets'] ) && count( $filter['buckets'] ) > 1 ) {
						$display_filters = true;

						break;
					}
				}

				if ( ! empty( $active_buckets ) ) {
					$display_filters = true;
				}
			}
		}

		if ( ! $display_filters && empty( $instance['search_box_enabled'] ) ) {
			return;
		}

		$title = $instance['title'];

		if ( empty( $title ) ) {
			$title = '';
		}

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $title, $instance, $this->id_base );

		echo $args['before_widget'];

		/**
		 * Responsible for displaying the title of the Jetpack Search filters widget.
		 *
		 * @module search
		 *
		 * @since 5.7.0
		 *
		 * @param string $title                The widget's title
		 * @param string $args['before_title'] The HTML tag to display before the title
		 * @param string $args['after_title']  The HTML tag to display after the title
		 */
		do_action( 'jetpack_search_render_filters_widget_title', esc_html( $title ), $args['before_title'], $args['after_title'] );

		if ( ! empty( $instance['search_box_enabled'] ) ) {
			$this->render_widget_search_form( $instance );
		}

		if ( $display_filters ) {

			/**
			 * Responsible for rendering the widget's active filters that are applied to the search.
			 *
			 * @module search
			 *
			 * @since 5.8.0
			 *
			 * @param $active_bucket                       The selected filters for the currenet query
			 * @param $instance                            The current widget instance
			 * @param Jetpack_Search $this->jetpack_search The Jetpack_Search instance
			 */
			do_action( 'jetpack_search_render_active_filters', $active_buckets, $instance, $this->jetpack_search );

			/**
			 * Responsible for rendering filters to narrow down search results.
			 *
			 * @module search
			 *
			 * @since 5.8.0
			 *
			 * @param array $filters                       The possible filters for the current query
			 * @param $instance                            The current widget instance
			 * @param Jetpack_Search $this->jetpack_search The Jetpack_Search instance
			 */
			do_action( 'jetpack_search_render_filters', $filters, $instance, $this->jetpack_search );
		}

		echo $args['after_widget'];
	}

	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title'] = sanitize_text_field( $new_instance['title'] );
		$instance['use_filters'] = empty( $new_instance['use_filters'] ) ? '0' : '1';
		$instance['search_box_enabled'] = empty( $new_instance['search_box_enabled'] ) ? '0' : '1';
		$instance['post_types'] = empty( $new_instance['post_types'] )
			? array()
			: array_map( 'sanitize_key', $new_instance['post_types'] );

		if ( $instance['use_filters'] ) {
			$filters = array();
			foreach ( (array) $new_instance['filter_type'] as $index => $type ) {
				$count = intval( $new_instance['num_filters'][ $index ] );
				$count = min( 50, $count ); // Set max boundary at 20
				$count = max( 1, $count );  // Set min boundary at 1

				switch ( $type ) {
					case 'taxonomy':
						$filters[] = array(
							'name' => sanitize_text_field( $new_instance['filter_name'][ $index ] ),
							'type' => 'taxonomy',
							'taxonomy' => sanitize_key( $new_instance['taxonomy_type'][ $index ] ),
							'count' => $count,
						);
						break;
					case 'post_type':
						$filters[] = array(
							'name' => sanitize_text_field( $new_instance['filter_name'][ $index ] ),
							'type' => 'post_type',
							'count' => $count,
						);
						break;
					case 'date_histogram':
						$filters[] = array(
							'name' => sanitize_text_field( $new_instance['filter_name'][ $index ] ),
							'type' => 'date_histogram',
							'count' => $count,
							'field' => sanitize_key( $new_instance['date_histogram_field'][ $index ] ),
							'interval' => sanitize_key( $new_instance['date_histogram_interval'][ $index ] ),
						);
						break;
				}
			}

			if ( ! empty( $filters ) ) {
				$instance['filters'] = $filters;
			}
		}

		return $instance;
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array(
			'title' => '',
			'filters' => array( array() )
		) );

		$title = strip_tags( $instance['title'] );

		$hide_filters = $this->jetpack_search->are_filters_by_widget_disabled();
		$use_filters = ! empty( $instance['use_filters'] ) && ! $hide_filters;
		$search_box_enabled = ! empty( $instance['search_box_enabled'] );
		$classes = sprintf(
			'jetpack-search-filters-widget %s',
			$use_filters ? '' : 'hide-filters'
		);
		?>
		<div class="<?php echo esc_attr( $classes ); ?>">
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
					<?php esc_html_e( 'Title:', 'jetpack' ); ?>
				</label>
				<input
					class="widefat"
					id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"
					name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>"
					type="text"
					value="<?php echo esc_attr( $title ); ?>"
				/>
			</p>

			<p>
				<label><?php esc_html_e( 'Post types included in results:' ); ?></label>
				<select class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'post_types' ) ); ?>[]" multiple="multiple">
					<?php foreach ( get_post_types( array( 'exclude_from_search' => false ), 'objects' ) as $post_type ) : ?>
						<option
							value="<?php echo esc_attr( $post_type->name ); ?>"
							<?php selected( empty( $instance['post_types'] ) || in_array( $post_type->name, $instance['post_types'] ) ); ?>
						>
							<?php echo esc_html( $post_type->label ); ?>
						</option>
					<?php endforeach; ?>
				</select>
			</p>

			<p>
				<label>
					<input
						type="checkbox"
						class="jetpack-search-filters-widget__search-box-enabled"
						name="<?php echo esc_attr( $this->get_field_name( 'search_box_enabled' ) ); ?>"
						<?php checked( $search_box_enabled ); ?>
					/>
					<?php esc_html_e( 'Show search box' ); ?>
				</label>
			</p>

			<?php if ( ! $hide_filters ): ?>
				<p>
					<label>
						<input
							type="checkbox"
							class="jetpack-search-filters-widget__use-filters"
							name="<?php echo esc_attr( $this->get_field_name( 'use_filters' ) ); ?>"
							<?php checked( $use_filters ); ?>
						/>
						<?php esc_html_e( 'Show filters when a search has multiple results' ); ?>
					</label>
				</p>
				<?php foreach ( (array) $instance['filters'] as $filter ) : ?>
					<?php $this->render_widget_filter( $filter ); ?>
				<?php endforeach; ?>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Responsible for rendering a single filter in the customizer or the widget administration screen in wp-admin.
	 *
	 * @since 5.7.0
	 *
	 * @param array $filter
	 */
	function render_widget_filter( $filter ) {
		$args = wp_parse_args( $filter, array(
			'name' => '',
			'type' => 'taxonomy',
			'taxonomy' => '',
			'post_type' => '',
			'date_histogram_field' => '',
			'date_histogram_interval' => '',
			'count' => self::DEFAULT_FILTER_COUNT,
		) );

		$classes = sprintf(
			'jetpack-search-filters-widget__filter is-%s',
			sanitize_key( $args['type'] )
		);

		?>
		<div class="<?php echo esc_attr( $classes ); ?>">
			<p>
				<label>
					<?php esc_html_e( 'Filter Name:', 'jetpack' ); ?>
					<input
						class="widefat"
						type="text"
						name="<?php echo esc_attr( $this->get_field_name( 'filter_name' ) ); ?>[]"
						value="<?php
							echo ! empty( $args['name'] )
								? esc_attr( $args['name'] )
								: '';
						?>"
					/>
				</label>
			</p>

			<p>
				<label>
					<?php esc_html_e( 'Filter Type:', 'jetpack' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'filter_type' ) ); ?>[]" class="widefat filter-select">
						<option value="taxonomy" <?php selected( $args['type'], 'taxonomy' ); ?>>
							<?php esc_html_e( 'Taxonomy', 'jetpack' ); ?>
						</option>
						<option value="post_type" <?php selected( $args['type'], 'post_type' ); ?>>
							<?php esc_html_e( 'Post Type', 'jetpack' ); ?>
						</option>
						<option value="date_histogram" <?php selected( $args['type'], 'date_histogram' ); ?>>
							<?php esc_html_e( 'Date', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__taxonomy-select">
				<label>
					<?php esc_html_e( 'Choose a taxonomy:', 'jetpack' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'taxonomy_type' ) ); ?>[]" class="widefat">
						<?php foreach ( get_taxonomies( false, 'objects' ) as $taxonomy ) : ?>
							<option value="<?php echo esc_attr( $taxonomy->name ); ?>" <?php selected( $taxonomy->name, $args['taxonomy'] ); ?>>
								<?php echo esc_html( $taxonomy->label ); ?>
							</option>
						<?php endforeach; ?>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__date-histogram-select">
				<label>
					<?php esc_html_e( 'Choose a field:', 'jetpack' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'date_histogram_field' ) ); ?>[]" class="widefat">
						<option value="post_date" <?php selected( 'post_date', $args['date_histogram_field'] ); ?>>
							<?php esc_html_e( 'Date', 'jetpack' ); ?>
						</option>
						<option value="post_date_gmt" <?php selected( 'post_date_gmt', $args['date_histogram_field'] ); ?>>
							<?php esc_html_e( 'Date GMT', 'jetpack' ); ?>
						</option>
						<option value="post_modified" <?php selected( 'post_modified', $args['date_histogram_field'] ); ?>>
							<?php esc_html_e( 'Modified', 'jetpack' ); ?>
						</option>
						<option value="post_modified" <?php selected( 'post_modified_gmt', $args['date_histogram_field'] ); ?>>
							<?php esc_html_e( 'Modified GMT', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__date-histogram-select">
				<label>
					<?php esc_html_e( 'Choose an interval:' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'date_histogram_interval' ) ); ?>[]" class="widefat">
						<option value="month" <?php selected( 'month', $args['date_histogram_interval'] ); ?>>
							<?php esc_html_e( 'Month', 'jetpack' ); ?>
						</option>
						<option value="year" <?php selected( 'year', $args['date_histogram_interval'] ); ?>>
							<?php esc_html_e( 'Year', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p>
				<label>
					<?php esc_html_e( 'Maximum number of filters (1-50):', 'jetpack' ); ?>
					<input
						class="widefat"
						name="<?php echo esc_attr( $this->get_field_name( 'num_filters' ) ); ?>[]"
						type="number"
						value="<?php echo intval( $args['count'] ); ?>"
						min="1"
						max="50"
						step="1"
						required
					/>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__controls">
				<a href="#" class="delete"><?php esc_html_e( 'Remove', 'jetpack' ); ?></a>
				<span class="control-separator">|</span>
				<a href="#" class="add"><?php esc_html_e( 'Add', 'jetpack' ); ?></a>
			</p>
		</div>
	<?php }

	/**
	 * Responsible for rendering the search box within our widget on the frontend.
	 *
	 * @param array $instance
	 */
	function render_widget_search_form( $instance ) {
		$form = get_search_form( false );

		// If the widget has specified post types to search within and IF the post types differ
		// from the default post types that would have been searched, set the selected post
		// types via hidden inputs.
		if ( $this->post_types_differ_searchable( $instance ) ) {
			$post_type_inputs = '';
			foreach ( $instance['post_types'] as $post_type ) {
				$post_type_inputs .= sprintf( '<input type="hidden" name="post_type[]" value="%s" />', esc_attr( $post_type ) );
			}

			// The form should have a closing form tag, so let's add our hidden inputs before that
			$form = str_replace(
				'</form>',
				sprintf( '%s</form>', $post_type_inputs ),
				$form
			);
		}

		// This shouldn't need to be escaped since we escaped above when we imploded the selected post types
		echo $form;

		echo '<br />';
	}

	/**
	 * Renders all available filters that can be used to filter down search results on the frontend.
	 *
	 * @param array $filters
	 */
	function render_available_filters( $filters ) {
		foreach ( (array) $filters as $filter ) {
			if ( count( $filter['buckets'] ) < 2 ) {
				continue;
			}
			$this->render_filter( $filter );
		}
	}

	function render_widget_title( $title, $before_title, $after_title ) {
		echo $before_title . esc_html( $title ) . $after_title;
	}

	/**
	 * Responsible for removing all active buckets with a type of post_type.
	 *
	 * If the current post type filters match the post type filters that the widget has restricted the
	 * search too, then we don't want to show the post type buckets. Otherwise, when a user first search, we
	 * would end up showing an active filters and a post types section that look very similar.
	 *
	 * See: https://github.com/Automattic/jetpack/pull/8471#issuecomment-355711814
	 *
	 * @param array $active_bucket
	 */
	function filter_post_types_from_active_buckets( $active_bucket ) {
		return empty( $active_bucket['type'] ) || 'post_type' != $active_bucket['type'];
	}

	/**
	 * Since we provide support for the widget restricting post types by adding the selected post types as
	 * active filters, if removing a post type filter would result in there no longer be post_type args in the URL,
	 * we need to be sure to add them back.
	 *
	 * @param array $active_buckets
	 * @param array $post_types
	 */
	function ensure_post_types_on_remove_url( $active_buckets, $post_types ) {
		$modified = array();

		foreach ( (array) $active_buckets as $active_bucket ) {
			if ( 'post_type' != $active_bucket['type'] ) {
				$modified[] = $active_bucket;
				continue;
			}

			$parsed = wp_parse_url( $active_bucket['remove_url'] );
			if ( ! $parsed ) {
				$modified[] = $active_bucket;
			}

			$query = array();
			wp_parse_str( $parsed['query'], $query );

			if ( empty( $query['post_type'] ) ) {
				$active_bucket['remove_url'] = $this->add_post_types_to_url( $active_bucket['remove_url'], $post_types );
			}

			$modified[] = $active_bucket;
		}

		return $modified;
	}

	/**
	 * Given a url and an array of post types, will ensure that the post types are properly applied to the URL as args.
	 *
	 * @param string $url
	 * @param array $post_types
	 */
	function add_post_types_to_url( $url, $post_types ) {
		$url = remove_query_arg( 'post_type', $url );
		foreach ( (array) $post_types as $post_type ) {
			$url = add_query_arg( 'post_type[]', $post_type, $url );
		}

		return $url;
	}

	/**
	 * Renders the current filters applied to the search.
	 *
	 * @param array $active_buckets
	 * @param array $instance
	 */
	function render_current_filters( $active_buckets, $instance ) {
		if ( ! $this->post_types_differ_query( $instance, true ) ) {
			$active_buckets = array_filter( $active_buckets, array( $this, 'filter_post_types_from_active_buckets' ) );
		}

		if ( empty( $active_buckets ) ) {
			return;
		}

		$remove_all_filters = add_query_arg( 's', get_query_var( 's' ), home_url() );
		if ( $this->post_types_differ_searchable( $instance ) ) {
			$remove_all_filters = $this->add_post_types_to_url( $remove_all_filters, $instance['post_types'] );
			$active_buckets = $this->ensure_post_types_on_remove_url( $active_buckets, $instance['post_types'] );
		}

		?>
		<h4 class="widget-title"><?php echo esc_html__( 'Current Filters', 'jetpack' ); ?></h4>
		<ul>
			<?php foreach ( $active_buckets as $item ) : ?>
				<li>
					<a href="<?php echo esc_url( $item['remove_url'] ); ?>">
						<?php
							echo sprintf(
								_x( '&larr; %1$s: %2$s', 'aggregation widget: active filter type and name', 'jetpack' ),
								esc_html( $item['type_label'] ),
								esc_html( $item['name'] )
							);
						?>
					</a>
				</li>
			<?php endforeach; ?>
			<?php if ( count( $active_buckets ) > 1 ) : ?>
				<li>
					<a href="<?php echo esc_url( $remove_all_filters ); ?>">
						<?php echo esc_html__( 'Remove All Filters', 'jetpack' ); ?>
					</a>
				</li>
			<?php endif; ?>
		</ul>
		<br />
	<?php }

	/**
	 * Renders a single filter that can be applied to the current search.
	 *
	 * @param array $filter
	 */
	function render_filter( $filter ) { ?>
		<h4  class="widget-title"><?php echo esc_html( $filter['name'] ); ?></h4>
		<ul>
			<?php foreach ( $filter['buckets'] as $item ) : ?>
				<li>
					<a href="<?php echo esc_url( $item['url'] ); ?>">
						<?php echo esc_html( $item['name'] ); ?>
					</a>

					(<?php echo number_format_i18n( absint( $item['count'] ) ); ?>)
				</li>
			<?php endforeach;?>
		</ul>
		<br />
	<?php }
}
