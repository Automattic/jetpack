<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for @Twenty Eleven and enqueue relevant styles.
 */

/**
 * Add theme support for infinity scroll
 */
function jetpack_twentyeleven_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container'      => 'content',
		'render'         => 'twentyeleven_infinite_scroll_render',
		'footer'         => 'page',
		'footer_widgets' => jetpack_twentyeleven_has_footer_widgets(),
	) );
}
add_action( 'init', 'jetpack_twentyeleven_infinite_scroll_init' );

/**
 * Needs to be defined so AMP logic kicks in.
 */
function twentyeleven_infinite_scroll_render() {}

/**
 * Enqueue CSS stylesheet with theme styles for infinity.
 */
function jetpack_twentyeleven_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) || class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$dep = wp_script_is( 'the-neverending-homepage' ) ? array( 'the-neverending-homepage' ) : array();
		// Add theme specific styles.
		wp_enqueue_style( 'infinity-twentyeleven', plugins_url( 'twentyeleven.css', __FILE__ ), $dep, '20121002' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentyeleven_infinite_scroll_enqueue_styles', 25 );

/**
 * Do we have footer widgets?
 */
function jetpack_twentyeleven_has_footer_widgets() {
	// Are any of the "Footer Area" sidebars active?
	if ( is_active_sidebar( 'sidebar-3' ) || is_active_sidebar( 'sidebar-4' ) || is_active_sidebar( 'sidebar-5' ) )
		return true;

	// If we're on mobile and the Main Sidebar has widgets, it falls below the content, so we have footer widgets.
	if ( function_exists( 'jetpack_is_mobile' ) && jetpack_is_mobile() && is_active_sidebar( 'sidebar-1' ) )
		return true;

	return false;
}

/**
 * Load AMP theme specific hooks for infinite scroll.
 *
 * @return void
 */
function amp_twentyeleven_infinite_scroll_render_hooks() {
	add_filter( 'jetpack_amp_infinite_footers', 'twentyeleven_amp_infinite_footers', 10, 2 );
	add_filter( 'jetpack_amp_infinite_output', 'twentyeleven_amp_infinite_output' );
	add_filter( 'jetpack_amp_infinite_older_posts', 'twentyeleven_amp_infinite_older_posts' );
}

/**
 * Get the theme specific footers.
 *
 * @param array  $footers The footers of the themes.
 * @param string $buffer  Contents of the output buffer.
 *
 * @return mixed
 */
function twentyeleven_amp_infinite_footers( $footers, $buffer ) {
	// Collect the sidebar wrapper.
	preg_match(
		'/<div id="secondary".*<!-- #secondary .widget-area -->/s',
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
function twentyeleven_amp_infinite_output( $buffer ) {
	// Hide site header on next page load.
	$buffer = preg_replace(
		'/<header id="branding"/',
		'$0 next-page-hide',
		$buffer
	);

	// Hide skip links on next page load.
	$buffer = preg_replace(
		'/<div class="skip-link"/',
		'$0 next-page-hide',
		$buffer
	);

	// Hide pagination on next page load.
	$buffer = preg_replace(
		'/<nav id="nav-above"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	$buffer = preg_replace(
		'/<nav id="nav-below"/',
		'$0 next-page-hide hidden',
		$buffer
	);

	// Remove the sidebar as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<div id="secondary".*<!-- #secondary .widget-area -->/s',
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
function twentyeleven_amp_infinite_older_posts() {
	ob_start();
	?>
<div id="infinite-handle" style="background-color: #fff; padding: 1em 7.6%">
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
