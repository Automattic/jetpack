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

		echo $args['before_title'] . esc_html( $title ) . $args['after_title'];

		if ( ! empty( $active_buckets ) ) {
			echo '<h3>' . esc_html__( 'Current Filters', 'jetpack' ) . '</h3>';

			echo '<ul>';

			foreach ( $active_buckets as $item ) {
				echo '<li><a href="' . esc_url( $item['remove_url'] ) . '">' . sprintf( _x( '(X) %1$s: %2$s', 'aggregation widget: active filter type and name', 'jetpack' ), esc_html( $item['type_label'] ), esc_html( $item['name'] ) ) . '</a></li>';
			}

			if ( count( $active_buckets ) > 1 ) {
				echo '<li><a href="' . esc_url( add_query_arg( 's', get_query_var( 's' ), home_url() ) ) . '">' . esc_html__( 'Remove All Filters', 'jetpack' ) . '</a></li>';
			}

			echo '</ul>';
		}

		foreach ( $filters as $label => $filter ) {
			if ( count( $filter['buckets'] ) < 2 ) {
				continue;
			}

			echo '<h3>' . esc_html( $label ) . '</h3>';

			echo '<ul>';

			foreach ( $filter['buckets'] as $item ) {
				if ( $item['active'] ) {
					continue;
				}

				echo '<li><a href="' . esc_url( $item['url'] ) . '">' . esc_html( $item['name'] ) . '</a> (' . number_format_i18n( absint( $item['count'] ) ) . ')</li>';
			}

			echo '</ul>';
		}

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
}
