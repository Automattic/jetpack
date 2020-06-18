<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for Twenty Twelve and enqueue relevant styles.
 */

/**
 * Add theme support for infinite scroll
 */
function jetpack_twentytwelve_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container'      => 'content',
		'render'         => 'twentytwelve_infinite_scroll_render',
		'footer'         => 'page',
		'footer_widgets' => jetpack_twentytwelve_has_footer_widgets(),
	) );
}
add_action( 'after_setup_theme', 'jetpack_twentytwelve_infinite_scroll_init' );

/**
 * Needs to be defined so AMP logic kicks in.
 */
function twentytwelve_infinite_scroll_render() {}

/**
 * Enqueue CSS stylesheet with theme styles for infinity.
 */
function jetpack_twentytwelve_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) || class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$dep = wp_script_is( 'the-neverending-homepage' ) ? array( 'the-neverending-homepage' ) : array();
		// Add theme specific styles.
		wp_enqueue_style( 'infinity-twentytwelve', plugins_url( 'twentytwelve.css', __FILE__ ), $dep, '20120817' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentytwelve_infinite_scroll_enqueue_styles', 25 );

/**
 * Do we have footer widgets?
 */
function jetpack_twentytwelve_has_footer_widgets() {
	if ( function_exists( 'jetpack_is_mobile' ) && jetpack_is_mobile() ) {
		if ( is_front_page() && ( is_active_sidebar( 'sidebar-2' ) || is_active_sidebar( 'sidebar-3' ) ) )
			return true;
		elseif ( is_active_sidebar( 'sidebar-1' ) )
			return true;
	}

	return false;
}

/**
 * Load AMP theme specific hooks for infinite scroll.
 *
 * @return void
 */
function amp_twentytwelve_infinite_scroll_render_hooks() {
	add_filter( 'jetpack_amp_infinite_footers', 'twentytwelve_amp_infinite_footers', 10, 2 );
	add_filter( 'jetpack_amp_infinite_output', 'twentytwelve_amp_infinite_output' );
	add_filter( 'jetpack_amp_infinite_older_posts', 'twentytwelve_amp_infinite_older_posts' );
}

/**
 * Get the theme specific footers.
 *
 * @param array  $footers The footers of the themes.
 * @param string $buffer  Contents of the output buffer.
 *
 * @return mixed
 */
function twentytwelve_amp_infinite_footers( $footers, $buffer ) {
	// Collect the sidebar wrapper.
	preg_match(
		'/<div id="secondary".*<!-- #secondary -->/s',
		$buffer,
		$footer
	);
	$footers[] = reset( $footer );

	// Collect the footer wrapper.
	preg_match(
		'/<footer id="colophon".*<!-- #colophon -->/s',
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
function twentytwelve_amp_infinite_output( $buffer ) {
	// Hide site header on next page load.
	$buffer = preg_replace(
		'/<header id="masthead"/',
		'$0 next-page-hide',
		$buffer
	);

	// Hide below nav bar.
	$buffer = preg_replace(
		'/<nav id="nav-below"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	// Remove the sidebar as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<div id="secondary".*<!-- #secondary -->/s',
		'',
		$buffer
	);

	// Remove the footer as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<footer id="colophon".*<!-- #colophon -->/s',
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
function twentytwelve_amp_infinite_older_posts() {
	ob_start();
	?>
<div id="infinite-handle" style="padding: 1.714285714rem 0; margin: 0 1.714285714rem;">
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
