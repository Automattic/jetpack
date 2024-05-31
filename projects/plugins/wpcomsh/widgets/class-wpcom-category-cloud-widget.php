<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

/**
 * Category Cloud widget from WordPress.com
 */
class WPCOM_Category_Cloud_Widget extends WP_Widget {
	/**
	 * Minimum font percentage.
	 *
	 * @var int $min_font_per
	 */
	private $min_font_per = 100;

	/**
	 * Maximum font percentage.
	 *
	 * @var int $max_font_per
	 */
	private $max_font_per = 275;

	/**
	 * Constructor.
	 */
	public function __construct() {
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

	/**
	 * Flush cache.
	 */
	public function flush_cache() {
		wp_cache_delete( 'widget_cat_cloud_cache' . $this->id, 'widget' );
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
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

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		echo '<div style="overflow: hidden;">';

		foreach ( $tags as $tag_name => $num_posts ) {
			$font_size = $instance['min_font_per'] + ( ( $num_posts - $min_value ) * $step );
			echo '<a href="' . esc_url( $tag_urls[ $tag_name ] ) . '" style="font-size: ' . esc_attr( $font_size . '%' ) . '; padding: 1px; margin: 1px;" title="' . esc_attr( $tag_name . ' (' . $num_posts . ')' ) . '">' . esc_html( $tag_name ) . '</a> ';
		}

		echo '</div>';

		if ( 1 >= count( $tags ) && current_user_can( 'edit_theme_options' ) ) {
			/* translators: Link to post category documentation. */
			echo '<p>';
			printf(
				wp_kses(
					// translators: link to support doc about categories
					__( 'If you use more <a href="%s">categories</a> on your site, they will appear here.', 'wpcomsh' ),
					array(
						'a' => array( 'href' => array() ),
					)
				),
				'http://en.support.wordpress.com/posts/categories/'
			);
			echo '</p>';
		}

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
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
				<?php esc_html_e( 'Title:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>"/>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Maximum number of categories to show:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'max_tags' ) ); ?>" type="number" value="<?php echo esc_attr( $instance['max_tags'] ); ?>"/>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Exclude:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'exclude' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['exclude'] ); ?>"/>
				<small><?php esc_html_e( 'Category IDs, separated by commas', 'wpcomsh' ); ?></small>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Minimum font percentage:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'min_font_per' ) ); ?>" type="number" value="<?php echo esc_attr( $instance['min_font_per'] ); ?>" min="10" max="1000" maxlength="4"/>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Maximum font percentage:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'max_font_per' ) ); ?>" type="number" value="<?php echo esc_attr( $instance['max_font_per'] ); ?>" min="10" max="9999" maxlength="4"/>
			</label>
		</p>
		<p>
			<label>
				<input type="checkbox" name="<?php echo esc_attr( $this->get_field_name( 'parent_pad' ) ); ?>" <?php checked( $instance['parent_pad'] ); ?> value="1"/>
				<?php
				esc_html_e( 'Count items in sub-categories toward parent total.', 'wpcomsh' );
				?>
				(<a href="https://en.support.wordpress.com/widgets/category-cloud-widget/#settings" target="_blank" title="<?php esc_attr_e( 'Click for more information', 'wpcomsh' ); ?>">?</a>)
			</label>
		</p>
		<?php
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$new_instance['title']        = wp_strip_all_tags( $new_instance['title'] );
		$new_instance['parent_pad']   = isset( $new_instance['parent_pad'] );
		$new_instance['max_tags']     = (int) $new_instance['max_tags'];
		$new_instance['exclude']      = wp_strip_all_tags( $new_instance['exclude'] );
		$new_instance['min_font_per'] = $this->normalize_int_value( (int) $new_instance['min_font_per'], $this->min_font_per, 1000, 10 );
		$new_instance['max_font_per'] = $this->normalize_int_value( (int) $new_instance['max_font_per'], $this->max_font_per, 9999, 10 );

		$this->flush_cache();

		return $new_instance;
	}

	/**
	 * Normalize int value.
	 *
	 * @param int $value Provided value.
	 * @param int $default Default value used if provided value is not between $min and $max.
	 * @param int $max Maximum value.
	 * @param int $min Minimum value.
	 *
	 * @return int Normalized value.
	 */
	private function normalize_int_value( $value, $default = 0, $max = 0, $min = 0 ) {
		$value = (int) $value;

		if ( $value > $max || $value < $min ) {
			$value = $default;
		}

		return (int) $value;
	}
}

/**
 * Register the widget.
 */
function wpcom_widget_category_cloud() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	register_widget( 'WPCOM_Category_Cloud_Widget' );
}
add_action( 'widgets_init', 'wpcom_widget_category_cloud', 11 );
