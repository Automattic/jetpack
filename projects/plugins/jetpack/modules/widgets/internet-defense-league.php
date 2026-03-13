<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

/**
 * Jetpack_Internet_Defense_League_Widget main class.
 */
class Jetpack_Internet_Defense_League_Widget extends WP_Widget {
	/**
	 * Default widget settings.
	 *
	 * @var array
	 */
	public $defaults = array();

	/**
	 * Selected badge to display.
	 *
	 * @var string
	 */
	public $badge;
	/**
	 * Badge display options.
	 *
	 * @var array
	 */
	public $badges = array();

	/**
	 * Jetpack_Internet_Defense_League_Widget constructor.
	 */
	public function __construct() {
		parent::__construct(
			'internet_defense_league_widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', esc_html__( 'Internet Defense League', 'jetpack' ) ),
			array(
				'description'                 => esc_html__( 'Show your support for the Internet Defense League.', 'jetpack' ),
				'customize_selective_refresh' => true,
			)
		);

		$this->badges = array(
			'shield_badge'   => esc_html__( 'Shield Badge', 'jetpack' ),
			'super_badge'    => esc_html__( 'Super Badge', 'jetpack' ),
			'side_bar_badge' => esc_html__( 'Red Cat Badge', 'jetpack' ),
		);

		$this->defaults = array(
			'badge' => key( $this->badges ),
		);

		add_filter( 'widget_types_to_hide_from_legacy_widget_block', array( $this, 'hide_widget_in_block_editor' ) );
	}

	/**
	 * Remove the "Internet Defense League" widget from the Legacy Widget block
	 *
	 * @param array $widget_types List of widgets that are currently removed from the Legacy Widget block.
	 * @return array $widget_types New list of widgets that will be removed.
	 */
	public function hide_widget_in_block_editor( $widget_types ) {
		$widget_types[] = 'internet_defense_league_widget';
		return $widget_types;
	}

	/**
	 * Display the Widget.
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args     Display arguments.
	 * @param array $instance The settings for the particular instance of the widget.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		if ( 'none' !== $instance['badge'] ) {
			if ( ! isset( $this->badges[ $instance['badge'] ] ) ) {
				$instance['badge'] = $this->defaults['badge'];
			}
			$badge_url = 'internet-defense-league/' . $instance['badge'] . '.png';

			echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			printf(
				'<p><a href="%1$s" target="_blank" rel="noopener noreferrer"><img src="%2$s" alt="%3$s" style="max-width: 100%%; height: auto;" /></a></p>',
				esc_url( 'https://www.fightforthefuture.org/' ),
				esc_url( plugins_url( $badge_url, __FILE__ ) ),
				esc_attr__( 'Member of The Internet Defense League', 'jetpack' )
			);

			echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}

		/** This action is already documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'internet_defense_league' );
	}

	/**
	 * Inline footer script.
	 *
	 * @deprecated 12.5 This widget does not enqueue scripts anymore.
	 */
	public function footer_script() {
		_deprecated_function( __METHOD__, 'jetpack-12.5' );
	}

	/**
	 * Widget form in the dashboard.
	 *
	 * @see WP_Widget::form()
	 *
	 * @param array $instance Previously saved values from database.
	 * @return string|void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		echo '<p><label>';
		echo esc_html__( 'Which badge would you like to display?', 'jetpack' ) . '<br />';

		echo '<select class="widefat" name="' . esc_attr( $this->get_field_name( 'badge' ) ) . '">';
		foreach ( $this->badges as $option_slug => $option_name ) {
			echo '<option value="' . esc_attr( $option_slug ) . '"' . selected( $option_slug, $instance['badge'], false ) . '>' . esc_html( $option_name ) . '</option>';
		}
		echo '</select>';
		echo '</label></p>';

		echo '<p>' . wp_kses(
			sprintf(
				/* translators: %s is an HTML link to the website of an internet campaign called the "Internet Defense League" */
				_x( 'Learn more about the %s', 'the Internet Defense League', 'jetpack' ),
				'<a href="https://www.fightforthefuture.org/" target="_blank" rel="noopener noreferrer">Internet Defense League</a>'
			),
			array(
				'a' => array(
					'href'   => array(),
					'rel'    => array(),
					'target' => array(),
				),
			)
		) . '</p>';
	}

	/**
	 * Display a select form field.
	 *
	 * @deprecated 12.5 This widget only has one option now, no need for an extracted method.
	 *
	 * @param string $field_name Name of the field.
	 * @param array  $options Array of options.
	 * @param string $default Default option.
	 */
	public function select( $field_name, $options, $default = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-12.5' );
	}

	/**
	 * Update widget.
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance New widget instance data.
	 * @param array $old_instance Old widget instance data.
	 */
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$instance = array();

		$instance['badge'] = ( isset( $new_instance['badge'] ) && isset( $this->badges[ $new_instance['badge'] ] ) )
			? $new_instance['badge']
			: $this->defaults['badge'];

		return $instance;
	}
}

/**
 * Register the widget.
 */
function jetpack_internet_defense_league_init() {
	register_widget( 'Jetpack_Internet_Defense_League_Widget' );
}
add_action( 'widgets_init', 'jetpack_internet_defense_league_init' );
