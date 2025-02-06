<?php
/**
 * Twitter widget class
 * Display the latest N tweets from a Twitter screenname as a widget
 * Customize screenname, maximum number of tweets displayed, show or hide @replies, and text displayed between tweet text and a timestamp
 *
 * @package widgets
 */

/**
 * Twitter widget class.
 */
class Jetpack_Widget_Twitter extends WP_Widget {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			'twitter',
			apply_filters( 'jetpack_widget_name', __( 'Twitter', 'wpcomsh' ) ),
			array(
				'classname'   => 'widget_twitter',
				'description' => __( 'Display your Tweets from Twitter', 'wpcomsh' ),
			)
		);
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		$account = trim( rawurlencode( $instance['account'] ) );

		if ( empty( $account ) ) {
			if ( current_user_can( 'edit_theme_options' ) ) {
				echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				/* translators: %s is the URL to the widgets page */
				echo '<p>';
				printf(
					wp_kses(
						// translators: %s is a link to the widget settings page.
						__( 'Please configure your Twitter username for the <a href="%s">Twitter Widget</a>.', 'wpcomsh' ),
						array( 'a' => array( 'href' => array() ) )
					),
					esc_url( admin_url( 'widgets.php' ) )
				);
				echo '</p>';
				echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}

			return;
		}

		$title = apply_filters( 'widget_title', $instance['title'] );
		if ( empty( $title ) ) {
			$title = __( 'Twitter Updates', 'wpcomsh' );
		}

		echo "{$args['before_widget']}{$args['before_title']}<a href='" . esc_url( "http://twitter.com/{$account}" ) . "'>" . esc_html( $title ) . "</a>{$args['after_title']}"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		$anchor_text = sprintf(
			/* translators: %s is the Twitter account name */
			__( 'Tweets by %s', 'wpcomsh' ),
			esc_html( $account )
		);

		printf(
			'<a class="twitter-timeline" data-height="600" data-dnt="true" href="https://twitter.com/%1$s">%2$s</a>',
			esc_attr( $account ),
			esc_html( $anchor_text )
		);

		wp_enqueue_script( 'twitter-widgets', 'https://platform.twitter.com/widgets.js', array(), '20111117', true );

		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'twitter' );
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$instance = array();

		$instance['title']   = wp_kses( $new_instance['title'], array() );
		$instance['account'] = trim( wp_kses( $new_instance['account'], array() ) );
		$instance['account'] = str_replace(
			array(
				'http://twitter.com/',
				'/',
				'@',
				'#!',
			),
			array(
				'',
				'',
				'',
				'',
			),
			$instance['account']
		);

		delete_transient( 'widget-twitter-' . $this->number );
		delete_transient( 'widget-twitter-error-' . $this->number );

		return $instance;
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
	public function form( $instance ) {
		// Defaults.
		$account = isset( $instance['account'] ) ? wp_kses( $instance['account'], array() ) : '';
		$title   = $instance['title'] ?? '';

		/*
		 * Urge people to upgrade to the new twitter timeline widget. While this widget will continue working, we may totally remove it in the future.
		 *
		 * @see http://socialp2.wordpress.com/2013/04/19/following-on-from-justins-previous-post-its-time/
		 */
		?>
		<p><em><?php echo esc_html__( "Please switch to the 'Twitter Timeline' widget. This widget will be going away in the future and the new widget allows for more customization.", 'wpcomsh' ); ?></em></p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>">
				<?php esc_html_e( 'Title:', 'wpcomsh' ); ?>
				<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
			</label>
		</p>

		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'account' ) ); ?>">
				<?php esc_html_e( 'Twitter username:', 'wpcomsh' ); ?> <a href="http://support.wordpress.com/widgets/twitter-widget/#twitter-username" target="_blank">( ? )</a>
				<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'account' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'account' ) ); ?>" type="text" value="<?php echo esc_attr( $account ); ?>" />
			</label>
		</p>

		<?php
	}
}

/**
 * Register the widget for use in Appearance -> Widgets
 */
function jetpack_twitter_widget_init() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	// Don't load this Widget for users who don't have preferences for it.
	$widgets = get_option( 'widget_twitter' );
	if ( ! is_array( $widgets ) ) {
		return;
	}

	register_widget( 'Jetpack_Widget_Twitter' );
}
add_action( 'widgets_init', 'jetpack_twitter_widget_init' );
