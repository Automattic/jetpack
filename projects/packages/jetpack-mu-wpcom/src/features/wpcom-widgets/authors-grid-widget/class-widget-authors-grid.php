<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

/**
 * Widget to display a grid of author avatar images
 * Default size is 32px
 */
class Widget_Authors_Grid extends WP_Widget {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			'author_grid',
			__( 'Author Grid', 'wpcomsh' ),
			array(
				'classname'   => 'widget_author_grid',
				'description' => __( 'Show a grid of author avatar images.', 'wpcomsh' ),
			)
		);

		add_action( 'publish_post', array( __CLASS__, 'flush_cache' ) );
		add_action( 'deleted_post', array( __CLASS__, 'flush_cache' ) );
		add_action( 'switch_theme', array( __CLASS__, 'flush_cache' ) );

		add_action( 'customize_controls_print_styles', array( $this, 'form_styles' ) );

		if ( ! is_admin() && is_active_widget( false, false, 'author_grid' ) ) {
			add_action( 'wp_head', array( $this, 'add_styles' ) );
		}
	}

	/**
	 * Flush cache.
	 */
	public static function flush_cache() {
		wp_cache_delete( 'widget_author_grid', 'widget' );
		wp_cache_delete( 'widget_author_grid_ssl', 'widget' );
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		$cache_bucket = is_ssl() ? 'widget_author_grid_ssl' : 'widget_author_grid';

		if ( '%BEG_OF_TITLE%' !== $args['before_title'] ) {
			$output = wp_cache_get( $cache_bucket, 'widget' );
			if ( $output ) {
				echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				return;
			}

			ob_start();
		}

		$instance = wp_parse_args(
			$instance,
			array(
				'title'       => __( 'Authors', 'wpcomsh' ),
				'all'         => false,
				'avatar_size' => 32,
			)
		);

		$authors = get_users(
			array(
				'fields' => 'all',
				'who'    => 'authors',
			)
		);

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<ul>';

		foreach ( $authors as $author ) {
			// Unless we're displaying all authors, check to make sure the author has some posts.
			if ( ! $instance['all'] ) {
				$r = new WP_Query(
					array(
						'author'       => $author->ID,
						'showposts'    => 1,
						'what_to_show' => 'posts',
						'nopaging'     => 0,
						'post_status'  => 'publish',
					)
				);

				if ( ! $r->have_posts() ) {
					continue;
				}
			}

			echo '<li>';
			echo '<a href="' . esc_url( get_author_posts_url( $author->ID ) ) . '"> ';
			echo get_avatar( $author->ID, $instance['avatar_size'], '', '', array( 'force_display' => true ) );
			echo '</a>';
			echo '</li>';
		}

		echo '</ul>';
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		wp_reset_postdata();

		if ( '%BEG_OF_TITLE%' !== $args['before_title'] ) {
			wp_cache_add( $cache_bucket, ob_get_flush(), 'widget' );
		}
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
				'title'       => '',
				'all'         => false,
				'avatar_size' => 32,
			)
		);
		?>
		<p>
			<label>
				<?php esc_html_e( 'Title:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</label>
		</p>
		<p>
			<label class="widget_form-author_grid-checkbox-label">
				<input class="checkbox" type="checkbox" <?php checked( $instance['all'] ); ?> name="<?php echo esc_attr( $this->get_field_name( 'all' ) ); ?>" /><?php esc_html_e( 'Display all authors (including those who have not written any posts)', 'wpcomsh' ); ?>
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Avatar Size (px):', 'wpcomsh' ); ?>
				<select name="<?php echo esc_attr( $this->get_field_name( 'avatar_size' ) ); ?>">
					<?php
					foreach ( array(
						'16'  => '16x16',
						'32'  => '32x32',
						'48'  => '48x48',
						'96'  => '96x96',
						'128' => '128x128',
					) as $value => $label ) {
						?>
						<option value="<?php echo esc_attr( (string) $value ); ?>" <?php selected( $value, $instance['avatar_size'] ); ?>><?php echo esc_html( $label ); ?></option>
					<?php } ?>
				</select>
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
		$new_instance['title']       = wp_strip_all_tags( $new_instance['title'] );
		$new_instance['all']         = isset( $new_instance['all'] );
		$new_instance['avatar_size'] = (int) $new_instance['avatar_size'];

		self::flush_cache();

		return $new_instance;
	}

	/**
	 * Enqueue widget styles.
	 */
	public function add_styles() {
		wp_enqueue_style( 'widget-author_grid', plugins_url( 'author-grid/author-grid.css', __FILE__ ), array(), WPCOMSH_VERSION );
	}

	/**
	 * Enqueue customizer styles.
	 */
	public function form_styles() {
		wp_enqueue_style( 'widget-author_grid_customizer', plugins_url( 'author-grid/author-grid-customizer.css', __FILE__ ), array(), WPCOMSH_VERSION );
	}
}

add_action(
	'widgets_init',
	function () {
		// Don't load this Widget for users who don't have preferences for it
		$widgets = get_option( 'widget_author_grid' );
		if ( ! is_array( $widgets ) ) {
			return;
		}
		register_widget( 'Widget_Authors_Grid' );
	}
);
