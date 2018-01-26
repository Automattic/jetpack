<?php

/**
 * Provides a widget to show available/selected filters on searches
 */
class Jetpack_Search_Widget_Filters extends WP_Widget {

	protected $jetpack_search;

	const DEFAULT_FILTER_COUNT = 5;
	const DEFAULT_SORT = 'relevance_desc';

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
		} else {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_scripts' ) );
		}

		add_action( 'jetpack_search_render_filters_widget_title', array( $this, 'render_widget_title' ), 10, 3 );
		add_action( 'jetpack_search_render_filters', array( $this, 'render_available_filters' ), 10, 2 );
	}

	function widget_admin_setup() {
		wp_enqueue_style( 'widget-jetpack-search-filters', plugins_url( 'css/search-widget-filters-admin-ui.css', __FILE__ ) );

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
			'widget-jetpack-search-filters',
			plugins_url( 'js/search-widget-filters-admin.js', __FILE__ ),
			array( 'jquery', 'jquery-ui-sortable', 'jp-tracks', 'jp-tracks-functions' )

		);

		wp_localize_script( 'widget-jetpack-search-filters', 'jetpack_search_filter_admin', array(
			'defaultFilterCount' => self::DEFAULT_FILTER_COUNT,
			'tracksUserData'     => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'tracksEventData'    => array(
				'is_customizer'   => ( function_exists( 'is_customize_preview' ) && is_customize_preview() ) ? 1 : 0,
			),
		) );

		wp_enqueue_script( 'widget-jetpack-search-filters' );
	}

	/**
	 * Enqueue scripts and styles for the frontend
	 */
	public function enqueue_frontend_scripts() {
		wp_enqueue_script( 'jquery' );
		wp_enqueue_style( 'jetpack-search-widget', plugins_url( 'modules/search/css/search-widget-frontend.css', JETPACK__PLUGIN_FILE ) );
	}

	private function get_sort_types() {
		return array(
			'relevance|DESC' => esc_html__( 'Relevance', 'jetpack' ),
			'date|DESC' => esc_html__( 'Newest first', 'jetpack' ),
			'date|ASC' => esc_html__( 'Oldest first', 'jetpack' )
		);
	}

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

	/**
	 * Responsible for rendering the widget on the frontend
	 *
	 * @param array $args     Widgets args supplied by the theme.
	 * @param array $instance The current widget instance.
	 *
	 * @return void
	 */
	public function widget( $args, $instance ) {
		$display_filters = false;

		if ( is_search() ) {
			if ( Jetpack_Search_Helpers::should_rerun_search_in_customizer_preview( $instance, $this->id ) ) {
				$this->jetpack_search->update_search_results_aggregations();
			}
			$filters = $this->jetpack_search->get_filters();

			if ( ! empty( $filters ) ) {
				$display_filters = true;

				if ( ! $this->jetpack_search->are_filters_by_widget_disabled() && ! $this->should_display_sitewide_filters() ) {
					$filters = array_filter( $filters, array( $this, 'is_for_current_widget' ) );
				}

				foreach ( $filters as $filter ) {
					if ( isset( $filter['buckets'] ) && count( $filter['buckets'] ) > 1 ) {
						$display_filters = true;

						break;
					}
				}
			}
		}

		if ( ! $display_filters && empty( $instance['search_box_enabled'] ) && empty( $instance['user_sort_enabled'] ) ) {
			return;
		}

		$title = $instance['title'];

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
			 * @since 5.7.0
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
			$this->render_widget_search_form( $instance, $orderby, $order );
		}

		if ( ! empty( $instance['search_box_enabled'] ) && ! empty( $instance['user_sort_enabled'] ) ): ?>
			<h4 class="jetpack-search-filters-widget__sub-heading"><?php esc_html_e( 'Sort by', 'jetpack' ); ?></h4>
			<div class="jetpack-search-sort-wrapper">
				<select class="jetpack-search-sort">
					<?php foreach( $this->get_sort_types() as $sort => $label ) { ?>
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
			 * @since 5.8.0
			 *
			 * @param array $filters                       The possible filters for the current query.
			 * @param $instance                            The current widget instance.
			 * @param Jetpack_Search $this->jetpack_search The Jetpack_Search instance.
			 */
			do_action(
				'jetpack_search_render_filters',
				$filters,
				$instance,
				$this->jetpack_search
			);
		}

		$this->maybe_render_sort_javascript( $instance, $order, $orderby );
		$this->render_filter_interaction_javascript();

		echo $args['after_widget'];
	}

	/**
	 * Renders JavaScript for the sorting controls on the frontend
	 *
	 * @param array  $instance The current widget instance.
	 * @param string $order   The order to initialize the select with.
	 * @param string $orderby The orderby to initialize the select with.
	 * @return void
	 */
	private function maybe_render_sort_javascript( $instance, $order, $orderby ) {
		if ( ! empty( $instance['user_sort_enabled'] ) ) :
		?>
		<!--
		This JS is a bit complicated, but here's what it's trying to do:
		- find or create a search form
		- find or create the orderby/order fields with default values
		- detect changes to the sort field, if it exists, and use it to set the order field values
		-->
		<script type="text/javascript">
				jQuery( document ).ready( function( $ ) {
					var actionUrl      = <?php echo json_encode( home_url( '/' ) ); ?>,
						orderByDefault = <?php echo json_encode( $orderby ); ?>,
						orderDefault   = <?php echo json_encode( $order ); ?>,
						widgetId       = <?php echo json_encode( $this->id ); ?>,
						currentSearch  = <?php echo json_encode( isset( $_GET['s'] ) ? $_GET['s'] : '' ); ?>

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

						if ( currentSearch ) {
							form.submit();
						}
					});
				} );
			</script>
		<?php endif;
	}

	/**
	 * Renders JavaScript to support checkbox filters.
	 *
	 * @return void
	 */
	private function render_filter_interaction_javascript() {
		?>
		<script type="text/javascript">
			jQuery( document ).ready( function() {
				var checkboxSelector = '.jetpack-search-filters-widget__filter-list input[type="checkbox"]',
					checkboxes = jQuery( checkboxSelector );

				jQuery( checkboxSelector ).prop( 'disabled', false ).css( 'cursor', 'inherit' );
				jQuery( checkboxSelector ).on( 'click change', function( e ) {
					var anchor;
					e.preventDefault();

					anchor = jQuery( this ).closest( 'a' );
					if ( anchor.length ) {
						window.location.href = anchor.prop( 'href' );
					}
				} );
			} );
		</script>
		<?php
	}

	private function sorting_to_wp_query_param( $sort ) {
		$parts = explode( '|', $sort );
		$orderby = isset( $_GET['orderby'] )
			? $_GET['orderby']
			: $parts[0];

		$order   = isset( $_GET['order'] )
			? strtoupper( $_GET['order'] )
			: ( ( isset( $parts[1] ) && 'ASC' === strtoupper( $parts[1] ) ) ? 'ASC' : 'DESC' );

		return array( $orderby, $order );
	}

	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title'] = sanitize_text_field( $new_instance['title'] );
		$instance['use_filters'] = empty( $new_instance['use_filters'] ) ? '0' : '1';
		$instance['search_box_enabled'] = empty( $new_instance['search_box_enabled'] ) ? '0' : '1';
		$instance['user_sort_enabled'] = empty( $new_instance['user_sort_enabled'] ) ? '0' : '1';
		$instance['sort'] = $new_instance['sort'];
		$instance['post_types'] = empty( $new_instance['post_types'] ) || empty( $instance['search_box_enabled'] )
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
		$user_sort_enabled = ! empty( $instance['user_sort_enabled'] );
		$sort = isset( $instance['sort'] ) ? $instance['sort'] : self::DEFAULT_SORT;
		$classes = sprintf(
			'jetpack-search-filters-widget %s %s',
			$use_filters ? '' : 'hide-filters',
			$search_box_enabled ? '' : 'hide-post-types'
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
					<?php esc_html_e( 'Show sorting controls', 'jetpack' ); ?>
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
		 				<?php foreach( $this->get_sort_types() as $sort_type => $label ) { ?>
							<option value="<?php echo esc_attr( $sort_type ); ?>" <?php selected( $sort, $sort_type ); ?>>
								<?php echo esc_html( $label ); ?>
							</option>
						<?php } ?>
					</select>
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
						<?php esc_html_e( 'Show extra filtering options', 'jetpack' ); ?>
					</label>
				</p>
				<div class="jetpack-search-filters-widget__filters">
					<?php foreach ( (array) $instance['filters'] as $filter ) : ?>
						<?php $this->render_widget_filter( $filter ); ?>
					<?php endforeach; ?>
				</div>
				<div class="jetpack-search-filters-help">
					<a href="https://jetpack.com/support/search/#filters-not-showing-up" target="_blank"><?php esc_html_e( "Why aren't my filters appearing?", 'jetpack' ); ?></a>
				</div>
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
			'field' => '',
			'interval' => '',
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
					<?php esc_html_e( 'Choose a taxonomy:', 'jetpack' ); $seen_taxonomy_labels = array(); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'taxonomy_type' ) ); ?>[]" class="widefat">
						<?php foreach ( get_taxonomies( false, 'objects' ) as $taxonomy ) : ?>
							<option value="<?php echo esc_attr( $taxonomy->name ); ?>" <?php selected( $taxonomy->name, $args['taxonomy'] ); ?>>
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
					<select name="<?php echo esc_attr( $this->get_field_name( 'date_histogram_field' ) ); ?>[]" class="widefat">
						<option value="post_date" <?php selected( 'post_date', $args['field'] ); ?>>
							<?php esc_html_e( 'Date', 'jetpack' ); ?>
						</option>
						<option value="post_date_gmt" <?php selected( 'post_date_gmt', $args['field'] ); ?>>
							<?php esc_html_e( 'Date GMT', 'jetpack' ); ?>
						</option>
						<option value="post_modified" <?php selected( 'post_modified', $args['field'] ); ?>>
							<?php esc_html_e( 'Modified', 'jetpack' ); ?>
						</option>
						<option value="post_modified_gmt" <?php selected( 'post_modified_gmt', $args['field'] ); ?>>
							<?php esc_html_e( 'Modified GMT', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p class="jetpack-search-filters-widget__date-histogram-select">
				<label>
					<?php esc_html_e( 'Choose an interval:' ); ?>
					<select name="<?php echo esc_attr( $this->get_field_name( 'date_histogram_interval' ) ); ?>[]" class="widefat">
						<option value="month" <?php selected( 'month', $args['interval'] ); ?>>
							<?php esc_html_e( 'Month', 'jetpack' ); ?>
						</option>
						<option value="year" <?php selected( 'year', $args['interval'] ); ?>>
							<?php esc_html_e( 'Year', 'jetpack' ); ?>
						</option>
					</select>
				</label>
			</p>

			<p>
				<label>
					<?php esc_html_e( 'Maximum number of filters (1-50):', 'jetpack' ); ?>
					<input
						class="widefat filter-count"
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
				<a href="#" class="add"><?php esc_html_e( 'Add another', 'jetpack' ); ?></a>
			</p>
		</div>
	<?php }

	/**
	 * Responsible for rendering the search box within our widget on the frontend.
	 *
	 * @param array $instance
	 */
	function render_widget_search_form( $instance, $orderby, $order ) {
		$form = get_search_form( false );

		$fields_to_inject = array(
			'orderby' => $orderby,
			'order' => $order
		);

		// If the widget has specified post types to search within and IF the post types differ
		// from the default post types that would have been searched, set the selected post
		// types via hidden inputs.
		if ( Jetpack_Search_Helpers::post_types_differ_searchable( $instance ) ) {
			$fields_to_inject['post_type'] = implode( ',', $instance['post_types'] );
		}

		$form = $this->inject_hidden_form_fields( $form, $fields_to_inject );

		// This shouldn't need to be escaped since we escaped above when we imploded the selected post types
		echo '<div class="jetpack-search-form">';
		echo $form;
		echo '</div>';
	}

	private function inject_hidden_form_fields( $form, $fields ) {
		$form_injection = '';

		foreach( $fields as $field_name => $field_value ) {
			$form_injection .= sprintf(
				'<input type="hidden" name="%s" value="%s" />',
				$field_name,
				esc_attr( $field_value )
			);
		}

		// This shouldn't need to be escaped since we've escaped above as we built $form_injection
		$form = str_replace(
			'</form>',
			sprintf(
				'%s</form>',
				$form_injection
			),
			$form
		);

		return $form;
	}

	/**
	 * Renders all available filters that can be used to filter down search results on the frontend.
	 *
	 * @param array $filters  The available filters for the current query.
	 * @param array $instance The current widget instance.
	 *
	 * @return void
	 */
	public function render_available_filters( $filters, $instance ) {
		$post_types_differ_searchable = Jetpack_Search_Helpers::post_types_differ_searchable( $instance );
		$post_types_differ_query      = Jetpack_Search_Helpers::post_types_differ_query( $instance );
		$this->jetpack_search->get_active_filter_buckets();
		$active_buckets               = $this->jetpack_search->get_active_filter_buckets();

		if ( ! $post_types_differ_query ) {
			$active_buckets = Jetpack_Search_Helpers::filter_post_types( $active_buckets );
		}

		$remove_all_filters           = ( count( $active_buckets ) > 1 )
			? add_query_arg( 's', get_query_var( 's' ), home_url() )
			: '';

		if ( $post_types_differ_searchable ) {
			$remove_all_filters = empty( $remove_all_filters )
				? ''
				: Jetpack_Search_Helpers::add_post_types_to_url( $remove_all_filters, $instance['post_types'] );

			if ( $post_types_differ_query ) {
				$filters = Jetpack_Search_Helpers::ensure_post_types_on_remove_url( $filters, $instance['post_types'] );
			} else {
				$filters = Jetpack_Search_Helpers::remove_active_from_post_type_buckets( $filters );
			}
		}

		if ( $remove_all_filters ) :
		?>
			<p>
				<a href="<?php echo esc_url( $remove_all_filters ); ?>">
					<?php esc_html_e( 'Remove All Filters', 'jetpack' ); ?>
				</a>
			</p>
		<?php
		endif;

		foreach ( (array) $filters as $filter ) {
			$this->render_filter( $filter );
		}
	}

	function render_widget_title( $title, $before_title, $after_title ) {
		echo $before_title . esc_html( $title ) . $after_title;
	}

	/**
	 * Renders a single filter that can be applied to the current search.
	 *
	 * @param array $filter The filter to render.
	 */
	public function render_filter( $filter ) {
		if ( empty( $filter ) || empty( $filter['buckets'] ) ) {
			return;
		}

		?>
		<h4 class="jetpack-search-filters-widget__sub-heading">
			<?php echo esc_html( $filter['name'] ); ?>
		</h4>
		<ul class="jetpack-search-filters-widget__filter-list">
			<?php foreach ( $filter['buckets'] as $item ) : ?>
				<li>
					<label>
					<?php if ( empty( $item['active'] ) ) : ?>
						<a href="<?php echo esc_url( $item['url'] ); ?>">
					<?php else : ?>
						<a href="<?php echo esc_url( $item['remove_url'] ); ?>">
					<?php endif; ?>
							<input
								type="checkbox"
								<?php checked( ! empty( $item['active'] ) ); ?>
								disabled
							/>&nbsp;
							<?php echo esc_html( $item['name'] ); ?>&nbsp;
							<?php
								echo esc_html( sprintf(
									'(%s)',
									number_format_i18n( absint( $item['count'] ) )
								) );
							?>
						</a>
					</label>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php
	}
}
