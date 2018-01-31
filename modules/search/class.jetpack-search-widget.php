<?php
/**
 * Jetpack Search: Jetpack_Search_Widget class
 *
 * @package    Jetpack
 * @subpackage Jetpack Search
 * @since      5.0.0
 */

/**
 * Provides a widget to show available/selected filters on searches.
 *
 * @since 5.0.0
 *
 * @see   WP_Widget
 */
class Jetpack_Search_Widget extends WP_Widget {

	/**
	 * The Jetpack_Search instance.
	 *
	 * @since 5.7.0
	 * @var Jetpack_Search
	 */
	protected $jetpack_search;

	/**
	 * Number of aggregations (filters) to show by default.
	 *
	 * @since 5.8.0
	 * @var int
	 */
	const DEFAULT_FILTER_COUNT = 5;

	/**
	 * Default sort order for search results.
	 *
	 * @since 5.8.0
	 * @var string
	 */
	const DEFAULT_SORT = 'relevance_desc';

	/**
	 * Jetpack_Search_Widget constructor.
	 *
	 * @since 5.0.0
	 */
	function __construct() {
		if ( ! class_exists( 'Jetpack_Search' ) ) {
			return;
		}

		parent::__construct(
			Jetpack_Search_Helpers::FILTER_WIDGET_BASE,
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
		} else {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_scripts' ) );
		}

		add_action( 'jetpack_search_render_filters_widget_title', array( 'Jetpack_Search_Template_Tags', 'render_widget_title' ), 10, 3 );
		add_action( 'jetpack_search_render_filters', array( 'Jetpack_Search_Template_Tags', 'render_available_filters' ), 10, 2 );
	}

	/**
	 * Enqueues the scripts and styles needed for the customizer.
	 *
	 * @since 5.7.0
	 */
	function widget_admin_setup() {
		wp_enqueue_style( 'widget-jetpack-search-filters', plugins_url( 'css/search-widget-admin-ui.css', __FILE__ ) );

		// Required for Tracks
		wp_register_script(
			'jp-tracks',
			'//stats.wp.com/w.js',
			array(),
			gmdate( 'YW' ),
			true
		);

		wp_register_script(
			'jp-tracks-functions',
			plugins_url( '_inc/lib/tracks/tracks-callables.js', JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION,
			false
		);

		wp_register_script(
			'jetpack-search-widget-admin',
			plugins_url( 'js/search-widget-admin.js', __FILE__ ),
			array( 'jquery', 'jquery-ui-sortable', 'jp-tracks', 'jp-tracks-functions' ),
			JETPACK__VERSION
		);

		wp_localize_script( 'jetpack-search-widget-admin', 'jetpack_search_filter_admin', array(
			'defaultFilterCount' => self::DEFAULT_FILTER_COUNT,
			'tracksUserData'     => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'tracksEventData'    => array(
				'is_customizer' => ( function_exists( 'is_customize_preview' ) && is_customize_preview() ) ? 1 : 0,
			),
			'i18n'               => array(
				'month'        => Jetpack_Search_Helpers::get_date_filter_type_name( 'month', false ),
				'year'         => Jetpack_Search_Helpers::get_date_filter_type_name( 'year', false ),
				'monthUpdated' => Jetpack_Search_Helpers::get_date_filter_type_name( 'month', true ),
				'yearUpdated'  => Jetpack_Search_Helpers::get_date_filter_type_name( 'year', true ),
			),
		) );

		wp_enqueue_script( 'jetpack-search-widget-admin' );
	}

	/**
	 * Enqueue scripts and styles for the frontend.
	 *
	 * @since 5.8.0
	 */
	public function enqueue_frontend_scripts() {
		if ( ! is_active_widget( false, false, $this->id_base, true ) ) {
			return;
		}

		wp_enqueue_script(
			'jetpack-search-widget',
			plugins_url( 'js/search-widget.js', __FILE__ ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_enqueue_style( 'jetpack-search-widget', plugins_url( 'modules/search/css/search-widget-frontend.css', JETPACK__PLUGIN_FILE ) );
	}

	/**
	 * Get the list of valid sort types/orders.
	 *
	 * @since 5.8.0
	 *
	 * @return array The sort orders.
	 */
	private function get_sort_types() {
		return array(
			'relevance|DESC' => is_admin() ? esc_html__( 'Relevance (recommended)', 'jetpack' ) : esc_html__( 'Relevance', 'jetpack' ),
			'date|DESC'      => esc_html__( 'Newest first', 'jetpack' ),
			'date|ASC'       => esc_html__( 'Oldest first', 'jetpack' )
		);
	}

	/**
	 * Callback for an array_filter() call in order to only get filters for the current widget.
	 *
	 * @see   Jetpack_Search_Widget::widget()
	 *
	 * @since 5.7.0
	 *
	 * @param array $item Filter item.
	 *
	 * @return bool Whether the current filter item is for the current widget.
	 */
	function is_for_current_widget( $item ) {
		return isset( $item['widget_id'] ) && $this->id == $item['widget_id'];
	}

	/**
	 * This method returns a boolean for whether the widget should show site-wide filters for the site.
	 *
	 * This is meant to provide backwards-compatibility for VIP, and other professional plan users, that manually
	 * configured filters via `Jetpack_Search::set_filters()`.
	 *
	 * @since 5.7.0
	 *
	 * @return bool Whether the widget should display site-wide filters or not.
	 */
	function should_display_sitewide_filters() {
		$filter_widgets = get_option( 'widget_jetpack-search-filters' );

		// This shouldn't be empty, but just for sanity
		if ( empty( $filter_widgets ) ) {
			return false;
		}

		// If any widget has any filters, return false
		foreach ( $filter_widgets as $number => $widget ) {
			$widget_id = sprintf( '%s-%d', $this->id_base, $number );
			if ( ! empty( $widget['filters'] ) && is_active_widget( false, $widget_id, $this->id_base ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Responsible for rendering the widget on the frontend.
	 *
	 * @since 5.0.0
	 *
	 * @param array $args     Widgets args supplied by the theme.
	 * @param array $instance The current widget instance.
	 */
	public function widget( $args, $instance ) {
		$display_filters = false;

		if ( is_search() ) {
			if ( Jetpack_Search_Helpers::should_rerun_search_in_customizer_preview() ) {
				$this->jetpack_search->update_search_results_aggregations();
			}

			$filters = $this->jetpack_search->get_filters();

			if ( ! $this->jetpack_search->are_filters_by_widget_disabled() && ! $this->should_display_sitewide_filters() ) {
				$filters = array_filter( $filters, array( $this, 'is_for_current_widget' ) );
			}

			if ( ! empty( $filters ) ) {
				$display_filters = true;
			}
		}

		if ( ! $display_filters && empty( $instance['search_box_enabled'] ) && empty( $instance['user_sort_enabled'] ) ) {
			return;
		}

		$title = isset( $instance['title'] ) ? $instance['title'] : '';

		if ( empty( $title ) ) {
			$title = '';
		}

		/** This filter is documented in core/src/wp-includes/default-widgets.php */
		$title = apply_filters( 'widget_title', $title, $instance, $this->id_base );

		echo $args['before_widget'];

		if ( ! empty( $title ) ) {
			/**
			 * Responsible for displaying the title of the Jetpack Search filters widget.
			 *
			 * @module search
			 *
			 * @since  5.7.0
			 *
			 * @param string $title                The widget's title
			 * @param string $args['before_title'] The HTML tag to display before the title
			 * @param string $args['after_title']  The HTML tag to display after the title
			 */
			do_action( 'jetpack_search_render_filters_widget_title', $title, $args['before_title'], $args['after_title'] );
		}

		$default_sort = isset( $instance['sort'] ) ? $instance['sort'] : self::DEFAULT_SORT;
		list( $orderby, $order ) = $this->sorting_to_wp_query_param( $default_sort );
		$current_sort = "{$orderby}|{$order}";

		// we need to dynamically inject the sort field into the search box when the search box is enabled, and display
		// it separately when it's not.
		if ( ! empty( $instance['search_box_enabled'] ) ) {
			Jetpack_Search_Template_Tags::render_widget_search_form( $instance['post_types'], $orderby, $order );
		}

		if ( ! empty( $instance['search_box_enabled'] ) && ! empty( $instance['user_sort_enabled'] ) ): ?>
			<h4 class="jetpack-search-filters-widget__sub-heading"><?php esc_html_e( 'Sort by', 'jetpack' ); ?></h4>
			<div class="jetpack-search-sort-wrapper">
				<select class="jetpack-search-sort">
					<?php foreach ( $this->get_sort_types() as $sort => $label ) { ?>
						<option value="<?php echo esc_attr( $sort ); ?>" <?php selected( $current_sort, $sort ); ?>>
							<?php echo esc_html( $label ); ?>
						</option>
					<?php } ?>
				</select>
			</div>
		<?php endif;

		if ( $display_filters ) {
			/**
			 * Responsible for rendering filters to narrow down search results.
			 *
			 * @module search
			 *
			 * @since  5.8.0
			 *
			 * @param array $filters    The possible filters for the current query.
			 * @param array $post_types An array of post types to limit filtering to.
			 */
			do_action(
				'jetpack_search_render_filters',
				$filters,
				isset( $instance['post_types'] ) ? $instance['post_types'] : null
			);
		}

		$this->maybe_render_sort_javascript( $instance, $order, $orderby );

		echo $args['after_widget'];
	}

	/**
	 * Renders JavaScript for the sorting controls on the frontend.
	 *
	 * This JS is a bit complicated, but here's what it's trying to do:
	 * - find the search form
	 * - find the orderby/order fields and set default values
	 * - detect changes to the sort field, if it exists, and use it to set the order field values
	 *
	 * @since 5.8.0
	 *
	 * @param array  $instance The current widget instance.
	 * @param string $order    The order to initialize the select with.
	 * @param string $orderby  The orderby to initialize the select with.
	 */
	private function maybe_render_sort_javascript( $instance, $order, $orderby ) {
		if ( ! empty( $instance['user_sort_enabled'] ) ) :
		?>
		<script type="text/javascript">
				jQuery( document ).ready( function( $ ) {
					var orderByDefault = <?php echo wp_json_encode( $orderby ); ?>,
						orderDefault   = <?php echo wp_json_encode( $order ); ?>,
						widgetId       = <?php echo wp_json_encode( $this->id ); ?>;

					var container = $('#' + widgetId);
					var form = container.find('.jetpack-search-form form');
					var orderBy = form.find( 'input[name=orderby]');
					var order = form.find( 'input[name=order]');
					orderBy.val(orderByDefault);
					order.val(orderDefault);

					container.find( '.jetpack-search-sort' ).change( function( event ) {
						var values  = event.target.value.split( '|' );
						orderBy.val( values[0] );
						order.val( values[1] );

						form.submit();
					});
				} );
			</script>
		<?php
		endif;
	}

	/**
	 * Convert a sort string into the separate order by and order parts.
	 *
	 * @since 5.8.0
	 *
	 * @param string $sort A sort string.
	 *
	 * @return array Order by and order.
	 */
	private function sorting_to_wp_query_param( $sort ) {
		$parts   = explode( '|', $sort );
		$orderby = isset( $_GET['orderby'] )
			? $_GET['orderby']
			: $parts[0];

		$order = isset( $_GET['order'] )
			? strtoupper( $_GET['order'] )
			: ( ( isset( $parts[1] ) && 'ASC' === strtoupper( $parts[1] ) ) ? 'ASC' : 'DESC' );

		return array( $orderby, $order );
	}

	/**
	 * Updates a particular instance of the widget. Validates and sanitizes the options.
	 *
	 * @since 5.0.0
	 *
	 * @param array $new_instance New settings for this instance as input by the user via Jetpack_Search_Widget::form().
	 * @param array $old_instance Old settings for this instance.
	 *
	 * @return array Settings to save.
	 */
	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title']              = sanitize_text_field( $new_instance['title'] );
		$instance['search_box_enabled'] = empty( $new_instance['search_box_enabled'] ) ? '0' : '1';
		$instance['user_sort_enabled']  = empty( $new_instance['user_sort_enabled'] ) ? '0' : '1';
		$instance['sort']               = $new_instance['sort'];
		$instance['post_types']         = empty( $new_instance['post_types'] ) || empty( $instance['search_box_enabled'] )
			? array()
			: array_map( 'sanitize_key', $new_instance['post_types'] );

		$filters = array();
		foreach ( (array) $new_instance['filter_type'] as $index => $type ) {
			$count = intval( $new_instance['num_filters'][ $index ] );
			$count = min( 50, $count ); // Set max boundary at 20
			$count = max( 1, $count );  // Set min boundary at 1

			switch ( $type ) {
				case 'taxonomy':
					$filters[] = array(
						'name'     => sanitize_text_field( $new_instance['filter_name'][ $index ] ),
						'type'     => 'taxonomy',
						'taxonomy' => sanitize_key( $new_instance['taxonomy_type'][ $index ] ),
						'count'    => $count,
					);
					break;
				case 'post_type':
					$filters[] = array(
						'name'  => sanitize_text_field( $new_instance['filter_name'][ $index ] ),
						'type'  => 'post_type',
						'count' => $count,
					);
					break;
				case 'date_histogram':
					$filters[] = array(
						'name'     => sanitize_text_field( $new_instance['filter_name'][ $index ] ),
						'type'     => 'date_histogram',
						'count'    => $count,
						'field'    => sanitize_key( $new_instance['date_histogram_field'][ $index ] ),
						'interval' => sanitize_key( $new_instance['date_histogram_interval'][ $index ] ),
					);
					break;
			}
		}

		if ( ! empty( $filters ) ) {
			$instance['filters'] = $filters;
		}

		return $instance;
	}

	/**
	 * Outputs the settings update form.
	 *
	 * @since 5.0.0
	 *
	 * @param array $instance Current settings.
	 */
	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array(
			'title'   => '',
			'filters' => array( array() )
		) );

		$title = strip_tags( $instance['title'] );

		$hide_filters       = $this->jetpack_search->are_filters_by_widget_disabled();
		$search_box_enabled = ! isset( $instance['search_box_enabled'] ) || ! empty( $instance['search_box_enabled'] );
		$user_sort_enabled  = ! empty( $instance['user_sort_enabled'] );
		$sort               = isset( $instance['sort'] ) ? $instance['sort'] : self::DEFAULT_SORT;
		$classes            = sprintf(
			'jetpack-search-filters-widget %s %s %s',
			$hide_filters ? 'hide-filters' : '',
			$search_box_enabled ? '' : 'hide-post-types',
			$this->id
		);
		?>
		<div class="<?php echo esc_attr( $classes ); ?>">
			<p>
				<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
					<?php esc_html_e( 'Title (optional):', 'jetpack' ); ?>
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
				<label>
					<input
						type="checkbox"
						class="jetpack-search-filters-widget__search-box-enabled"
						name="<?php echo esc_attr( $this->get_field_name( 'search_box_enabled' ) ); ?>"
						<?php checked( $search_box_enabled ); ?>
					/>
					<?php esc_html_e( 'Show search box', 'jetpack' ); ?>
				</label>
			</p>
			<p>
				<label>
					<input
						type="checkbox"
						class="jetpack-search-filters-widget__sort-controls-enabled"
						name="<?php echo esc_attr( $this->get_field_name( 'user_sort_enabled' ) ); ?>"
						<?php checked( $user_sort_enabled ); ?>
					/>
					<?php esc_html_e( 'Show sort selection dropdown', 'jetpack' ); ?>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__post-types-select">
				<label><?php esc_html_e( 'Post types to search (minimum of 1):', 'jetpack' ); ?></label>
				<?php foreach ( get_post_types( array( 'exclude_from_search' => false ), 'objects' ) as $post_type ) : ?>
					<label>
						<input
							type="checkbox"
							value="<?php echo esc_attr( $post_type->name ); ?>"
							name="<?php echo esc_attr( $this->get_field_name( 'post_types' ) ); ?>[]"
							<?php checked( empty( $instance['post_types'] ) || in_array( $post_type->name, $instance['post_types'] ) ); ?>
						/>&nbsp;
						<?php echo esc_html( $post_type->label ); ?>
					</label>
				<?php endforeach; ?>
			</p>

			<p>
				<label>
					<?php esc_html_e( 'Default sort order:', 'jetpack' ); ?>
					<select
						name="<?php echo esc_attr( $this->get_field_name( 'sort' ) ); ?>"
						class="widefat jetpack-search-filters-widget__sort-order">
						<?php foreach ( $this->get_sort_types() as $sort_type => $label ) { ?>
							<option value="<?php echo esc_attr( $sort_type ); ?>" <?php selected( $sort, $sort_type ); ?>>
								<?php echo esc_html( $label ); ?>
							</option>
						<?php } ?>
					</select>
				</label>
			</p>

			<?php if ( ! $hide_filters ): ?>
				<script class="jetpack-search-filters-widget__filter-template" type="text/template">
					<?php echo $this->render_widget_edit_filter( array(), true ); ?>
				</script>
				<div class="jetpack-search-filters-widget__filters">
					<?php foreach ( (array) $instance['filters'] as $filter ) : ?>
						<?php $this->render_widget_edit_filter( $filter ); ?>
					<?php endforeach; ?>
				</div>
				<p class="jetpack-search-filters-widget__add-filter-wrapper">
					<a class="button jetpack-search-filters-widget__add-filter" href="#">
						<?php esc_html_e( 'Add a filter', 'jetpack' ); ?>
					</a>
				</p>
				<noscript>
					<p class="jetpack-search-filters-help">
						<?php echo esc_html_e( 'Adding filters requires JavaScript!', 'jetpack' ); ?>
					</p>
				</noscript>
				<?php if ( is_customize_preview() ) : ?>
					<p class="jetpack-search-filters-help">
						<a href="https://jetpack.com/support/search/#filters-not-showing-up" target="_blank">
							<?php esc_html_e( "Why aren't my filters appearing?", 'jetpack' ); ?>
						</a>
					</p>
				<?php endif; ?>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * We need to render HTML in two formats: an Underscore template (client-size)
	 * and native PHP (server-side). This helper function allows for easy rendering
	 * of attributes in both formats.
	 *
	 * @since 5.8.0
	 *
	 * @param string $name        Attribute name.
	 * @param string $value       Attribute value.
	 * @param bool   $is_template Whether this is for an Underscore template or not.
	 */
	private function render_widget_attr( $name, $value, $is_template ) {
		echo $is_template ? "<%= $name %>" : esc_attr( $value );
	}

	/**
	 * We need to render HTML in two formats: an Underscore template (client-size)
	 * and native PHP (server-side). This helper function allows for easy rendering
	 * of the "selected" attribute in both formats.
	 *
	 * @since 5.8.0
	 *
	 * @param string $name        Attribute name.
	 * @param string $value       Attribute value.
	 * @param string $compare     Value to compare to the attribute value to decide if it should be selected.
	 * @param bool   $is_template Whether this is for an Underscore template or not.
	 */
	private function render_widget_option_selected( $name, $value, $compare, $is_template ) {
		$compare_json = wp_json_encode( $compare );
		echo $is_template ? "<%= $compare_json === $name ? 'selected=\"selected\"' : '' %>" : selected( $value, $compare );
	}

	/**
	 * Responsible for rendering a single filter in the customizer or the widget administration screen in wp-admin.
	 *
	 * We use this method for two purposes - rendering the fields server-side, and also rendering a script template for Underscore.
	 *
	 * @since 5.7.0
	 *
	 * @param array $filter      The filter to render.
	 * @param bool  $is_template Whether this is for an Underscore template or not.
	 */
	function render_widget_edit_filter( $filter, $is_template = false ) {
		$args = wp_parse_args( $filter, array(
			'name'      => '',
			'type'      => 'taxonomy',
			'taxonomy'  => '',
			'post_type' => '',
			'field'     => '',
			'interval'  => '',
			'count'     => self::DEFAULT_FILTER_COUNT,
		) );

		$args['name_placeholder'] = Jetpack_Search_Helpers::generate_widget_filter_name( $args );

		?>
		<div class="jetpack-search-filters-widget__filter is-<?php $this->render_widget_attr( 'type', $args['type'], $is_template ); ?>">
			<p class="jetpack-search-filters-widget__type-select">
				<label>
					<?php esc_html_e( 'Filter Type:', 'jetpack' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'filter_type' ) ); ?>[]" class="widefat filter-select">
						<option value="taxonomy" <?php $this->render_widget_option_selected( 'type', $args['type'], 'taxonomy', $is_template ); ?>>
							<?php esc_html_e( 'Taxonomy', 'jetpack' ); ?>
						</option>
						<option value="post_type" <?php $this->render_widget_option_selected( 'type', $args['type'], 'post_type', $is_template ); ?>>
							<?php esc_html_e( 'Post Type', 'jetpack' ); ?>
						</option>
						<option value="date_histogram" <?php $this->render_widget_option_selected( 'type', $args['type'], 'date_histogram', $is_template ); ?>>
							<?php esc_html_e( 'Date', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__taxonomy-select">
				<label>
					<?php
						esc_html_e( 'Choose a taxonomy:', 'jetpack' );
						$seen_taxonomy_labels = array();
					?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'taxonomy_type' ) ); ?>[]" class="widefat taxonomy-select">
						<?php foreach ( get_taxonomies( array( 'public' => true ), 'objects' ) as $taxonomy ) : ?>
							<option value="<?php echo esc_attr( $taxonomy->name ); ?>" <?php $this->render_widget_option_selected( 'taxonomy', $args['taxonomy'], $taxonomy->name, $is_template ); ?>>
								<?php
									$label = in_array( $taxonomy->label, $seen_taxonomy_labels )
										? sprintf(
											/* translators: %1$s is the taxonomy name, %2s is the name of its type to help distinguish between several taxonomies with the same name, e.g. category and tag. */
											_x( '%1$s (%2$s)', 'A label for a taxonomy selector option', 'jetpack' ),
											$taxonomy->label,
											$taxonomy->name
										)
										: $taxonomy->label;
									echo esc_html( $label );
									$seen_taxonomy_labels[] = $taxonomy->label;
								?>
							</option>
						<?php endforeach; ?>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__date-histogram-select">
				<label>
					<?php esc_html_e( 'Choose a field:', 'jetpack' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'date_histogram_field' ) ); ?>[]" class="widefat date-field-select">
						<option value="post_date" <?php $this->render_widget_option_selected( 'field', $args['field'], 'post_date', $is_template ); ?>>
							<?php esc_html_e( 'Date', 'jetpack' ); ?>
						</option>
						<option value="post_date_gmt" <?php $this->render_widget_option_selected( 'field', $args['field'], 'post_date_gmt', $is_template ); ?>>
							<?php esc_html_e( 'Date GMT', 'jetpack' ); ?>
						</option>
						<option value="post_modified" <?php $this->render_widget_option_selected( 'field', $args['field'], 'post_modified', $is_template ); ?>>
							<?php esc_html_e( 'Modified', 'jetpack' ); ?>
						</option>
						<option value="post_modified_gmt" <?php $this->render_widget_option_selected( 'field', $args['field'], 'post_modified_gmt', $is_template ); ?>>
							<?php esc_html_e( 'Modified GMT', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__date-histogram-select">
				<label>
					<?php esc_html_e( 'Choose an interval:' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'date_histogram_interval' ) ); ?>[]" class="widefat date-interval-select">
						<option value="month" <?php $this->render_widget_option_selected( 'interval', $args['interval'], 'month', $is_template ); ?>>
							<?php esc_html_e( 'Month', 'jetpack' ); ?>
						</option>
						<option value="year" <?php $this->render_widget_option_selected( 'interval', $args['interval'], 'year', $is_template ); ?>>
							<?php esc_html_e( 'Year', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__title">
				<label>
					<?php esc_html_e( 'Title:', 'jetpack' ); ?>
					<input
						class="widefat"
						type="text"
						name="<?php echo esc_attr( $this->get_field_name( 'filter_name' ) ); ?>[]"
						value="<?php $this->render_widget_attr( 'name', $args['name'], $is_template ); ?>"
						placeholder="<?php $this->render_widget_attr( 'name_placeholder', $args['name_placeholder'], $is_template ); ?>"
					/>
				</label>
			</p>

			<p>
				<label>
					<?php esc_html_e( 'Maximum number of filters (1-50):', 'jetpack' ); ?>
					<input
						class="widefat filter-count"
						name="<?php echo esc_attr( $this->get_field_name( 'num_filters' ) ); ?>[]"
						type="number"
						value="<?php $this->render_widget_attr( 'count', $args['count'], $is_template ); ?>"
						min="1"
						max="50"
						step="1"
						required
					/>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__controls">
				<a href="#" class="delete"><?php esc_html_e( 'Remove', 'jetpack' ); ?></a>
			</p>
		</div>
	<?php }
}
