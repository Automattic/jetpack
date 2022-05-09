<?php
/**
 * PollDaddy Top Rated Widget
 *
 * Copied from WordPress.com (retired)
 */
class PD_Top_Rated extends WP_Widget {

	function __construct() {
		$widget_ops = array(
			'classname'   => 'top_rated',
			'description' => __( 'A list of your top rated posts, pages or comments.', 'wpcomsh' ),
		);
		parent::__construct( 'PD_Top_Rated', __( 'Top Rated', 'wpcomsh' ), $widget_ops );
	}

	function PD_Top_Rated() {
		$this->__construct();
	}


	function widget( $args, $instance ) {
		$defaults = array(
			'show_posts'         => 1,
			'show_pages'         => 1,
			'show_comments'      => 1,
			'filter_by_category' => 0,
			'item_count'         => 5,
		);
		$instance = wp_parse_args( $instance, $defaults );

		extract( $args, EXTR_SKIP );

		echo $before_widget;
		$title              = empty( $instance['title'] ) ? __( 'Top Rated', 'wpcomsh' ) : apply_filters( 'widget_title', $instance['title'] );
		$posts_rating_id    = (int) get_option( 'pd-rating-posts-id' );
		$pages_rating_id    = (int) get_option( 'pd-rating-pages-id' );
		$comments_rating_id = (int) get_option( 'pd-rating-comments-id' );

		if ( ! empty( $posts_rating_id ) || ! empty( $pages_rating_id ) || ! empty( $comments_rating_id ) ) {
			echo $before_title . $title . $after_title;

			if ( $instance['show_posts'] == 1 ) {
				$top_class = 'posts';
			} elseif ( $instance['show_pages'] == 1 ) {
				$top_class = 'pages';
			} elseif ( $instance['show_comments'] == 1 ) {
				$top_class = 'comments';
			}

			echo '<div id="pd_top_rated_holder" class="pd_top_rated_holder_' . $top_class . '"></div>';
			$top_rated_url = is_ssl() ? 'https://polldaddy.com/js/rating/top-rated.js' : 'http://i0.poll.fm/js/rating/top-rated.js';
			echo '<script language="javascript" src="' . esc_url( $top_rated_url ) . '"></script>';
			echo '<script language="javascript" type="text/javascript">';
			$rating_seq = $instance['show_posts'] . $instance['show_pages'] . $instance['show_comments'];

			echo 'PDRTJS_TOP = new PDRTJS_RATING_TOP( ' . $posts_rating_id . ', ' . $pages_rating_id . ', ' . $comments_rating_id . ", '" . $rating_seq . "', " . $instance['item_count'] . ' );';

			if ( $instance['show_posts'] == 1 && $instance['filter_by_category'] == 1 ) {
				if ( is_single() ) { // get all posts in current category
					global $post;
					if ( ! empty( $post ) ) {
						$current_category = get_the_category( $post->ID );
					}
				}

				if ( is_category() ) { // get all posts in category archive page
					global $posts;
					if ( ! empty( $posts ) ) {
						$current_category = get_the_category( $posts[0]->ID );
					}
				}

				if ( is_array( $current_category ) && (int) $current_category[0]->cat_ID > 0 ) {
					$args     = array( 'category' => $current_category[0]->cat_ID );
					$post_ids = '';
					foreach ( get_posts( $args ) as $p ) {
						$post_ids .= $p->ID . ',';
					}
					$post_ids = substr( $post_ids, 0, -1 );
				}

				if ( ! empty( $post_ids ) ) { // set variable
					echo 'PDRTJS_TOP.filters = [' . $post_ids . '];';
				}
			}

			if ( $instance['show_posts'] == 1 ) {
				echo "PDRTJS_TOP.get_top( 'posts', '0' );";
			} elseif ( $instance['show_pages'] == 1 ) {
				echo "PDRTJS_TOP.get_top( 'pages', '0' );";
			} elseif ( $instance['show_comments'] == 1 ) {
				echo "PDRTJS_TOP.get_top( 'comments', '0' );";
			}

			echo '</script>';
		}
			echo $after_widget;
			do_action( 'jetpack_stats_extra', 'widget_view', 'top_rated' );
	}

	function update( $new_instance, $old_instance ) {

		$instance                       = $old_instance;
		$instance['title']              = strip_tags( $new_instance['title'] );
		$instance['show_posts']         = (int) $new_instance['show_posts'];
		$instance['show_pages']         = (int) $new_instance['show_pages'];
		$instance['show_comments']      = (int) $new_instance['show_comments'];
		$instance['filter_by_category'] = (int) $new_instance['filter_by_category'];
		$instance['item_count']         = (int) $new_instance['item_count'];
		return $instance;
	}

	function form( $instance ) {

		$instance           = wp_parse_args(
			(array) $instance,
			array(
				'title'              => '',
				'show_posts'         => '1',
				'show_pages'         => '1',
				'show_comments'      => '1',
				'item_count'         => '5',
				'filter_by_category' => '',
			)
		);
		$title              = strip_tags( $instance['title'] );
		$show_posts         = (int) $instance['show_posts'];
		$show_pages         = (int) $instance['show_pages'];
		$show_comments      = (int) $instance['show_comments'];
		$filter_by_category = (int) $instance['filter_by_category'];
		$item_count         = (int) $instance['item_count'];
		?>
			<p><label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:', 'wpcomsh' ); ?><input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" /></label></p>
			<p>
				<label for="<?php echo $this->get_field_id( 'show_posts' ); ?>">
				<input type="checkbox" class="checkbox"  id="<?php echo $this->get_field_id( 'show_posts' ); ?>" name="<?php echo $this->get_field_name( 'show_posts' ); ?>" value="1" <?php echo $show_posts == 1 ? 'checked="checked"' : ''; ?> />
				 <?php _e( 'Show for posts', 'wpcomsh' ); ?>
				</label>
			</p>
				<p>
					<label for="<?php echo $this->get_field_id( 'show_pages' ); ?>">
					<input type="checkbox" class="checkbox"  id="<?php echo $this->get_field_id( 'show_pages' ); ?>" name="<?php echo $this->get_field_name( 'show_pages' ); ?>" value="1" <?php echo $show_pages == 1 ? 'checked="checked"' : ''; ?> />
					 <?php _e( 'Show for pages', 'wpcomsh' ); ?>
					</label>
				</p>
				<p>
					<label for="<?php echo $this->get_field_id( 'show_comments' ); ?>">
							<input type="checkbox" class="checkbox" id="<?php echo $this->get_field_id( 'show_comments' ); ?>" name="<?php echo $this->get_field_name( 'show_comments' ); ?>" value="1" <?php echo $show_comments == 1 ? 'checked="checked"' : ''; ?>/>
					 <?php _e( 'Show for comments', 'wpcomsh' ); ?>
					</label>
				</p>
				<p>
					<label for="<?php echo $this->get_field_id( 'filter_by_category' ); ?>">
							<input type="checkbox" class="checkbox" id="<?php echo $this->get_field_id( 'filter_by_category' ); ?>" name="<?php echo $this->get_field_name( 'filter_by_category' ); ?>" value="1" <?php echo $filter_by_category == 1 ? 'checked="checked"' : ''; ?>/>
					 <?php _e( 'Filter by category', 'wpcomsh' ); ?>
				</label>
			</p>
				<p>
					<label for="rss-items-<?php echo $item_count; ?>"><?php _e( 'How many items would you like to display?', 'wpcomsh' ); ?>
							<select id="<?php echo $this->get_field_id( 'item_count' ); ?>" name="<?php echo $this->get_field_name( 'item_count' ); ?>">
					<?php
					for ( $i = 1; $i <= 20; ++$i ) {
						echo "<option value='$i' " . ( $item_count == $i ? "selected='selected'" : '' ) . ">$i</option>";
					}
					?>
					</select>
				</label>
			</p>
		<?php
	}

}

add_action( 'widgets_init', 'wpcomsh_pdtoprated_widget_init' );
function wpcomsh_pdtoprated_widget_init() {
	if ( get_option( 'pd-rating-usercode' ) && is_active_widget( false, false, 'pd_top_rated' ) ) {
		register_widget( 'PD_Top_Rated' );
	}
}
