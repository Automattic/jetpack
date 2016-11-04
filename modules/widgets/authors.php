<?php

/*
 * Widget to display blog authors with avatars and recent posts.
 *
 * Configurable parameters include:
 * 1. Whether to display authors who haven't written any posts
 * 2. The number of posts to be displayed per author (defaults to 0)
 * 3. Avatar size
 */
class Widget_Authors extends WP_Widget {
	public function __construct() {
		parent::__construct(
			'authors',
			__( 'Authors' ),
			array( 'classname' => 'widget_authors', 'description' => __( 'Display blogs authors with avatars and recent posts.' ) ),
			array( 'width' => 300 )
		);

		add_action( 'publish_post', array( __CLASS__, 'flush_cache' ) );
		add_action( 'deleted_post', array( __CLASS__, 'flush_cache' ) );
		add_action( 'switch_theme', array( __CLASS__, 'flush_cache' ) );
	}

	public static function flush_cache() {
		wp_cache_delete( 'widget_authors', 'widget' );
		wp_cache_delete( 'widget_authors_ssl', 'widget' );
	}

	public function widget( $args, $instance ) {
		global $wpdb;

		$cache_bucket = is_ssl() ? 'widget_authors_ssl' : 'widget_authors';

		if ( '%BEG_OF_TITLE%' != $args['before_title'] ) {
			if ( $output = wp_cache_get( $cache_bucket, 'widget') ) {
				echo $output;
				return;
			}

			ob_start();
		}

		$instance = wp_parse_args( $instance, array( 'title' => __( 'Authors' ), 'all' => false, 'number' => 5, 'avatar_size' => 48 ) );
		$instance['number'] = min( 10, max( 0, (int) $instance['number'] ) );

		// We need to query at least one post to determine whether an author has written any posts or not
		$query_number = max( $instance['number'], 1 );

		$authors = get_users( array(
			'fields' => 'all',
			'who' => 'authors'
		) );

		echo $args['before_widget'];
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];
		echo '<ul>';

		foreach ( $authors as $author ) {
			$r = new WP_Query( array(
				'author'         => $author->ID,
				'posts_per_page' => $query_number,
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'no_found_rows'  => true,
			) );

			if ( ! $r->have_posts() && ! $instance['all'] )
				continue;

			echo '<li>';

			// Display avatar and author name
			if ( $r->have_posts() ) {
				echo '<a href="' . get_author_posts_url( $author->ID ) . '">';

				if ( $instance['avatar_size'] > 1 )
					echo ' ' . get_avatar( $author->ID, $instance['avatar_size'], '', true ) . ' ';

				echo '<strong>' . esc_html( $author->display_name ) . '</strong>';
				echo '</a>';
			}
			else if ( $instance['all'] ) {
				if ( $instance['avatar_size'] > 1 )
					echo get_avatar( $author->ID, $instance['avatar_size'], '', true ) . ' ';

				echo '<strong>' . esc_html( $author->display_name ) . '</strong>';
			}

			if ( 0 == $instance['number'] ) {
				echo '</li>';
				continue;
			}

			// Display a short list of recent posts for this author


			if ( $r->have_posts() ){
				echo '<ul>';

				while ( $r->have_posts() ) {
					$r->the_post();
					echo '<li><a href="' . get_permalink() . '">';

					if ( get_the_title() )
						echo get_the_title();
					else
						echo get_the_ID();

					echo '</a></li>';
				}

				echo '</ul>';
			}

			echo '</li>';
		}

		echo '</ul>';
		echo $args['after_widget'];

		wp_reset_postdata();

		if ( '%BEG_OF_TITLE%' != $args['before_title'] )
			wp_cache_add( $cache_bucket, ob_get_flush(), 'widget');

		stats_extra( 'widget_view', 'authors' );
	}

	public function form( $instance ) {
		$instance = wp_parse_args( $instance, array( 'title' => '', 'all' => false, 'avatar_size' => 48, 'number' => 0 ) );

		?>
		<p>
			<label>
				<?php _e( 'Title:' ); ?>
				<input class="widefat" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</label>
		</p>
		<p>
			<label>
				<input class="checkbox" type="checkbox" <?php checked( $instance['all'] ); ?> name="<?php echo $this->get_field_name( 'all' ); ?>" />
				<?php _e( 'Display all authors (including those who have not written any posts)' ); ?>
			</label>
		</p>
		<p>
			<label>
				<?php _e( 'Number of posts to show for each author:' ); ?>
				<input style="width: 50px; text-align: center;" name="<?php echo $this->get_field_name( 'number' ); ?>" type="text" value="<?php echo esc_attr( $instance['number'] ); ?>" />
				<?php _e( '(at most 10)' ); ?>
			</label>
		</p>
		<p>
			<label>
				<?php _e( 'Avatar Size (px):' ); ?>
				<select name="<?php echo $this->get_field_name( 'avatar_size' ); ?>">
					<?php foreach( array( '1' => __( 'No Avatars' ), '16' => '16x16', '32' => '32x32', '48' => '48x48', '96' => '96x96', '128' => '128x128' ) as $value => $label ) { ?>
						<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $value, $instance['avatar_size'] ); ?>><?php echo esc_html( $label ); ?></option>
					<?php } ?>
				</select>
			</label>
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ) {
		$new_instance['title'] = strip_tags( $new_instance['title'] );
		$new_instance['all'] = isset( $new_instance['all'] );
		$new_instance['number'] = (int) $new_instance['number'];
		$new_instance['avatar_size'] = (int) $new_instance['avatar_size'];

		Widget_Authors::flush_cache();

		return $new_instance;
	}
}

add_action( 'widgets_init', function () {
	register_widget( 'Widget_Authors' );
} );
