<?php

/**
 * Provides a widget to show available/selected filters on searches
 */
class Jetpack_Search_Widget_Filters extends WP_Widget {

	function __construct() {
		if ( ! class_exists( 'Jetpack_Search' ) ) {
			return;
		}

		parent::__construct(
			'jetpack-search-filters',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', esc_html__( 'Search Filters', 'jetpack' ) ),
			array(
				'classname'   => 'jetpack-filters',
				'description' => __( 'Displays search result filters when viewing search results.', 'jetpack' ),
			)
		);

		add_action( 'jetpack_search_render_filters_widget_title', array( $this, 'render_widget_title' ), 10, 3 );
		add_action( 'jetpack_search_render_filters_widget_contents', array( $this, 'render_widget_contents' ), 10, 2 );
	}

	function widget( $args, $instance ) {
		if ( ! class_exists( 'Jetpack_Search' ) || ! is_search() ) {
			return;
		}

		$search = Jetpack_Search::instance();

		$filters = $search->get_filters();

		$active_buckets = $search->get_active_filter_buckets();

		if ( empty( $filters ) && empty( $active_buckets ) ) {
			return;
		}

		$buckets_found = false;

		foreach ( $filters as $filter ) {
			if ( isset( $filter['buckets'] ) && count( $filter['buckets'] ) > 1 ) {
				$buckets_found = true;

				break;
			}
		}

		if ( ! $buckets_found && empty( $active_buckets ) ) {
			return;
		}

		$title = $instance['title'];

		if ( empty( $title ) ) {
			$title = __( 'Filter By', 'jetpack' );
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

		/**
		 * Responsible for displaying the contents of the Jetpack Search filters widget.
		 *
		 * @module search
		 *
		 * @since 5.7.0
		 *
		 * @param array $filters         The possible filters for the current query
		 * @param array $active_buckets  The selected filters for the current query
		 * @param Jetpack_Search $search The Jetpack_Search instance
		 */
		do_action( 'jetpack_search_render_filters_widget_contents', $filters, $active_buckets, $search );

		echo $args['after_widget'];
	}

	function update( $new_instance, $old_instance ) {
		$instance = array();

		$instance['title'] = sanitize_text_field( $new_instance['title'] );

		return $instance;
	}

	function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, array(
			'title' => '',
		) );

		$title = strip_tags( $instance['title'] );

		?>
		<p><label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'jetpack' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" /></p>
		<?php
	}

	function render_widget_contents( $filters, $active_buckets ) {
		if ( ! empty( $active_buckets ) ) {
			$this->render_current_filters( $active_buckets );
		}

		foreach ( $filters as $label => $filter ) {
			if ( count( $filter['buckets'] ) < 2 ) {
				continue;
			}

			$this->render_filter( $label, $filter );
		}
	}

	function render_widget_title( $title, $before_title, $after_title ) {
		echo $before_title . esc_html( $title ) . $after_title;
	}

	function render_current_filters( $active_buckets ) { ?>
		<h3><?php echo esc_html__( 'Current Filters', 'jetpack' ); ?></h3>
		<ul>
			<?php $this->render_active_buckets( $active_buckets ); ?>
			<?php if ( count( $active_buckets ) > 1 ) : ?>
				<li>
					<a href="<?php echo esc_url( add_query_arg( 's', get_query_var( 's' ), home_url() ) ); ?>">
						<?php echo esc_html__( 'Remove All Filters', 'jetpack' ); ?>
					</a>
				</li>
			<?php endif; ?>
		</ul>
	<?php }

	function render_active_buckets( $active_buckets ) {
		foreach ( $active_buckets as $item ) : ?>
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
		<?php endforeach;
	}

	function render_filter( $label, $filter ) { ?>
		<h3><?php echo esc_html( $label ); ?></h3>
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
	<?php }
}
