<?php

add_action( 'widgets_init', 'wpcom_widget_category_cloud', 11 );

function wpcom_widget_category_cloud() {
	register_widget( 'WPCOM_Category_Cloud_Widget' );
}

class WPCOM_Category_Cloud_Widget extends WP_Widget {
	private $min_font_per = 100;
	private $max_font_per = 275;

	function __construct() {
		parent::__construct(
			'wpcom_category_cloud',
			__( 'Category Cloud', 'wpcomsh' ),
			array(
				'description' => __( 'Your most used categories in cloud format.', 'wpcomsh' ),
				'classname'   => 'widget_tag_cloud',
			)
		);

		add_action( 'delete_category', array( $this, 'flush_cache' ) );
		add_action( 'edit_category', array( $this, 'flush_cache' ) );
		add_action( 'create_category', array( $this, 'flush_cache' ) );
	}

	public function flush_cache() {
		wp_cache_delete( 'widget_cat_cloud_cache' . $this->id, 'widget' );
	}

	public function widget( $args, $instance ) {
		$instance = wp_parse_args(
			$instance,
			array(
				'parent_pad'   => 0,
				'max_tags'     => 30,
				'exclude'      => '',
				'min_font_per' => $this->min_font_per,
				'max_font_per' => $this->max_font_per,
			)
		);

		if ( empty( $instance['title'] ) ) {
			$instance['title'] = __( 'Category Cloud', 'wpcomsh' );
		}

		$tags_info = wp_cache_get( 'widget_cat_cloud_cache' . $this->id, 'widget' );

		if ( ! $tags_info ) {
			$categories = get_categories(
				array(
					'orderby'      => 'count',
					'order'        => 'DESC',
					'hierarchical' => 0,
					'pad_counts'   => $instance['parent_pad'],
					'number'       => $instance['max_tags'],
					'exclude'      => $instance['exclude'],
				)
			);

			$tags     = array();
			$tag_urls = array();

			foreach ( $categories as $cat ) {
				$tags[ $cat->name ]     = $cat->count;
				$tag_urls[ $cat->name ] = get_category_link( $cat->term_id );
			}

			uksort( $tags, 'strnatcasecmp' ); // case insensitive alphabetical sort

			// Cache only if we're not in the customizer view. That view can add some garbage to the urls, which we then cache and display to other users.
			if ( ! $this->is_preview() ) {
				wp_cache_add(
					'widget_cat_cloud_cache' . $this->id,
					array(
						'tags'     => $tags,
						'tag_urls' => $tag_urls,
					),
					'widget'
				);
			}
		} else {
			$tags     = $tags_info['tags'];
			$tag_urls = $tags_info['tag_urls'];
		}

		if ( empty( $tags ) ) {
			return;
		}

		$min_value = min( array_values( $tags ) );
		$max_value = max( array_values( $tags ) );

		$spread = $max_value - $min_value;

		if ( $spread < 1 ) {
			$spread = 1;
		}

		$step = ( $instance['max_font_per'] - $instance['min_font_per'] ) / $spread;

		echo $args['before_widget'];
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];

		echo '<div style="overflow: hidden;">';

		foreach ( $tags as $tag_name => $num_posts ) {
			$font_size = $instance['min_font_per'] + ( ( $num_posts - $min_value ) * $step );
			echo '<a href="' . esc_attr( $tag_urls[ $tag_name ] ) . '" style="font-size: ' . $font_size . '%; padding: 1px; margin: 1px;" '
				 . ' title="' . esc_attr( $tag_name . ' (' . $num_posts . ')' ) . '">' . esc_html( $tag_name ) . '</a> ';
		}

		echo '</div>';

		if ( 1 >= count( $tags ) && current_user_can( 'edit_theme_options' ) ) {
			echo '<p>' . sprintf( __( 'If you use more <a href="%s">categories</a> on your site, they will appear here.', 'wpcomsh' ), 'http://en.support.wordpress.com/posts/categories/' ) . '</p>';
		}

		echo $args['after_widget'];
	}

	public function form( $instance ) {
		$instance = wp_parse_args(
			$instance,
			array(
				'title'        => '',
				'parent_pad'   => false,
				'max_tags'     => 30,
				'exclude'      => '',
				'min_font_per' => $this->min_font_per,
				'max_font_per' => $this->max_font_per,
			)
		);

		?>
		<p>
			<label>
				<?php _e( 'Title:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text"
					   value="<?php echo esc_attr( $instance['title'] ); ?>"/>
			</label>
		</p>
		<p>
			<label>
				<?php _e( 'Maximum number of categories to show:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo $this->get_field_name( 'max_tags' ); ?>" type="number"
					   value="<?php echo esc_attr( $instance['max_tags'] ); ?>"/>
			</label>
		</p>
		<p>
			<label>
				<?php _e( 'Exclude:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo $this->get_field_name( 'exclude' ); ?>" type="text"
					   value="<?php echo esc_attr( $instance['exclude'] ); ?>"/>
				<small><?php _e( 'Category IDs, separated by commas', 'wpcomsh' ); ?></small>
			</label>
		</p>
		<p>
			<label>
				<?php _e( 'Minimum font percentage:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo $this->get_field_name( 'min_font_per' ); ?>" type="number"
					   value="<?php echo esc_attr( $instance['min_font_per'] ); ?>" min="10" max="1000" maxlength="4"/>
			</label>
		</p>
		<p>
			<label>
				<?php _e( 'Maximum font percentage:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo $this->get_field_name( 'max_font_per' ); ?>" type="number"
					   value="<?php echo esc_attr( $instance['max_font_per'] ); ?>" min="10" max="9999" maxlength="4"/>
			</label>
		</p>
		<p>
			<label>
				<input type="checkbox"
					   name="<?php echo $this->get_field_name( 'parent_pad' ); ?>" <?php checked( $instance['parent_pad'] ); ?>
					   value="1"/>
				<?php _e( 'Count items in sub-categories toward parent total.', 'wpcomsh' ); ?>
				(<?php echo sprintf( '<a href="%s" target="_blank" title="%s">?</a>', 'https://en.support.wordpress.com/widgets/category-cloud-widget/#settings', __( 'Click for more information', 'wpcomsh' ) ); ?>
				)
			</label>
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$new_instance['title']        = strip_tags( $new_instance['title'] );
		$new_instance['parent_pad']   = isset( $new_instance['parent_pad'] );
		$new_instance['max_tags']     = (int) $new_instance['max_tags'];
		$new_instance['exclude']      = strip_tags( $new_instance['exclude'] );
		$new_instance['min_font_per'] = $this->normalize_int_value( (int) $new_instance['min_font_per'], $this->min_font_per, 1000, 10 );
		$new_instance['max_font_per'] = $this->normalize_int_value( (int) $new_instance['max_font_per'], $this->max_font_per, 9999, 10 );

		$this->flush_cache();

		return $new_instance;
	}

	private function normalize_int_value( $value, $default = 0, $max = 0, $min = 0 ) {
		$value = (int) $value;

		if ( $value > $max || $value < $min ) {
			$value = $default;
		}

		return (int) $value;
	}
}
