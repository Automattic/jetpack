<?php

/**
 * Singleton class instantiated by Jetpack_Searc_Debug_Bar::instance() that handles
 * rendering the Jetpack Search debug bar menu item and panel.
 */
class Jetpack_Search_Debug_Bar extends Debug_Bar_Panel {
	/**
	 * Holds singleton instance
	 *
	 * @var Jetpack_Search_Debug_Bar
	 */
	protected static $instance = null;

	/**
	 * Holds an instance of Jetpack_Search
	 *
	 * @var Jetpack_Search
	 */
	private $jetpack_search;

	/**
	 * The title to use in the debug bar navigation
	 *
	 * @var string
	 */
	public $title;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->title( esc_html__( 'Jetpack Search', 'jetpack' ) );
		$this->jetpack_search = Jetpack_Search::instance();
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Returns the singleton instance of Jetpack_Search_Debug_Bar
	 *
	 * @return Jetpack_Search_Debug_Bar
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Search_Debug_Bar();
		}
		return self::$instance;
	}

	/**
	 * Enqueues styles for our panel in the debug bar
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		wp_enqueue_style(
			'jetpack-search-debug-bar',
			plugins_url( '3rd-party/debug-bar/debug-bar.css', JETPACK__PLUGIN_FILE )
		);
		wp_enqueue_script(
			'jetpack-search-debug-bar',
			plugins_url( '3rd-party/debug-bar/debug-bar.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' )
		);
	}

	/**
	 * Should the Jetpack Search Debug Bar show?
	 *
	 * Since we've previously done a check for the search module being activated, let's just return true.
	 * Later on, we can update this to only show when `is_search()` is true.
	 *
	 * @return boolean
	 */
	public function is_visible() {
		return true;
	}

	/**
	 * Renders the panel content
	 *
	 * @return void
	 */
	public function render() {
		$last_query_failure_info = $this->jetpack_search->get_last_query_failure_info();
		$last_query_info = $this->jetpack_search->get_last_query_info();

		// If not empty, let's reshuffle the order of some things.
		if ( ! empty( $last_query_info ) ) {
			$args = $last_query_info['args'];
			$response = $last_query_info['response'];
			unset( $last_query_info['args'] );
			unset( $last_query_info['response'] );
			$last_query_info['response'] = $response;
			$last_query_info['args'] = $args;
		}
		?>
		<div class="jetpack-search-debug-bar">
			<h2><?php esc_html_e( 'Last query failure information:', 'jetpack' ); ?></h2>
			<?php if ( empty( $last_query_failure_info ) ) : ?>
				<?php echo esc_html_x( 'None', 'Text displayed when there is no information', 'jetpack' ); ?>
			<?php
				else :
					foreach ( $last_query_failure_info as $key => $info ) :
					?>
						<h3><?php echo esc_html( $key ); ?></h3>
						<pre><?php print_r( $info ); ?></pre>
					<?php
					endforeach;
			endif;
			?>

			<h2><?php esc_html_e( 'Last query information:', 'jetpack' ); ?></h2>
			<?php if ( empty( $last_query_info ) ) : ?>
					<?php echo esc_html_x( 'None', 'Text displayed when there is no information', 'jetpack' ); ?>
			<?php
				else :
					foreach ( $last_query_info as $key => $info ) :
					?>
						<h3><?php echo esc_html( $key ); ?></h3>
					<?php
					if ( 'response' !== $key && 'args' !== $key ) :
					?>
						<pre><?php print_r( $info ); ?></pre>
					<?php
					else :
					?>
						<div class="json-toggle-wrap">
							<pre class="json"><?php echo wp_json_encode( $info ); ?></pre>
							<span class="pretty toggle"><?php echo esc_html_x( 'Pretty', 'label for formatting JSON', 'jetpack' ); ?></span>
							<span class="ugly toggle"><?php echo esc_html_x( 'Minify', 'label for formatting JSON', 'jetpack' ); ?></span>
						</div>
					<?php
					endif;
					?>
					<?php
					endforeach;
			endif;
			?>
		</div><!-- Closes .jetpack-search-debug-bar -->
		<?php
	}
}
