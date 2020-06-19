<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for Twenty Fifteen.
 */

/**
 * Add theme support for infinite scroll
 */
function jetpack_twentyfifteen_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container' => 'main',
		'render'    => 'twentyfifteen_infinite_scroll_render',
		'footer'    => 'page',
	) );
}
add_action( 'after_setup_theme', 'jetpack_twentyfifteen_infinite_scroll_init' );

/**
 * Needs to be defined so AMP logic kicks in.
 */
function twentyfifteen_infinite_scroll_render() {}

/**
 * Enqueue CSS stylesheet with theme styles for Infinite Scroll.
 */
function jetpack_twentyfifteen_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) || class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$dep = wp_script_is( 'the-neverending-homepage' ) ? array( 'the-neverending-homepage' ) : array();
		wp_enqueue_style( 'infinity-twentyfifteen', plugins_url( 'twentyfifteen.css', __FILE__ ), $dep, '20141022' );
		wp_style_add_data( 'infinity-twentyfifteen', 'rtl', 'replace' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentyfifteen_infinite_scroll_enqueue_styles', 25 );

/**
 * Load AMP theme specific hooks for infinite scroll.
 *
 * @return void
 */
function amp_twentyfifteen_infinite_scroll_render_hooks() {
	add_filter( 'jetpack_amp_infinite_footers', 'twentyfifteen_amp_infinite_footers', 10, 2 );
	add_filter( 'jetpack_amp_infinite_output', 'twentyfifteen_amp_infinite_output' );
	add_filter( 'jetpack_amp_infinite_older_posts', 'twentyfifteen_amp_infinite_older_posts' );
}

/**
 * Get the theme specific footers.
 *
 * @param array  $footers The footers of the themes.
 * @param string $buffer  Contents of the output buffer.
 *
 * @return mixed
 */
function twentyfifteen_amp_infinite_footers( $footers, $buffer ) {
	// Collect the footer wrapper.
	preg_match(
		'/<footer id="colophon".*<!-- .site-footer -->/s',
		$buffer,
		$footer
	);
	$footers[] = reset( $footer );

	return $footers;
}

/**
 * Hide and remove various elements from next page load.
 *
 * @param string $buffer Contents of the output buffer.
 *
 * @return string
 */
function twentyfifteen_amp_infinite_output( $buffer ) {
	// Hide site header on next page load.
	$buffer = preg_replace(
		'/<header id="masthead"/',
		'$0 next-page-hide',
		$buffer
	);

	// Hide skip link.
	$buffer = preg_replace(
		'/<a class="skip-link screen-reader-text"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	// Hide below nav bar.
	$buffer = preg_replace(
		'/<nav class="navigation pagination"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	// Remove the footer as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<footer id="colophon".*<!-- .site-footer -->/s',
		'',
		$buffer
	);

	return $buffer;
}

/**
 * Filter the AMP infinite scroll older posts button
 *
 * @return string
 */
function twentyfifteen_amp_infinite_older_posts() {
	ob_start();
	?>
<div id="infinite-handle">
	<span>
		<a href="{{url}}">
			<button>
				{{title}}
			</button>
		</a>
	</span>
</div>
	<?php
	return ob_get_clean();
}
