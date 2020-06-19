<?php
/**
 * Infinite Scroll Theme Assets
 *
 * Register support for Twenty Sixteen.
 */

/**
 * Add theme support for infinite scroll
 */
function jetpack_twentysixteen_infinite_scroll_init() {
	add_theme_support( 'infinite-scroll', array(
		'container' => 'main',
		'render'    => 'jetpack_twentysixteen_infinite_scroll_render',
		'footer'    => 'content',
	) );
}
add_action( 'after_setup_theme', 'jetpack_twentysixteen_infinite_scroll_init' );

/**
 * Custom render function for Infinite Scroll.
 */
function jetpack_twentysixteen_infinite_scroll_render() {
	while ( have_posts() ) {
		the_post();
		if ( is_search() ) {
			get_template_part( 'template-parts/content', 'search' );
		} else {
			get_template_part( 'template-parts/content', get_post_format() );
		}
	}
}

/**
 * Enqueue CSS stylesheet with theme styles for Infinite Scroll.
 */
function jetpack_twentysixteen_infinite_scroll_enqueue_styles() {
	if ( wp_script_is( 'the-neverending-homepage' ) || class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$dep = wp_script_is( 'the-neverending-homepage' ) ? array( 'the-neverending-homepage' ) : array();
		wp_enqueue_style( 'infinity-twentysixteen', plugins_url( 'twentysixteen.css', __FILE__ ), $dep, '20151102' );
		wp_style_add_data( 'infinity-twentysixteen', 'rtl', 'replace' );
	}
}
add_action( 'wp_enqueue_scripts', 'jetpack_twentysixteen_infinite_scroll_enqueue_styles', 25 );

/**
 * Load AMP theme specific hooks for infinite scroll.
 *
 * @return void
 */
function amp_jetpack_twentysixteen_infinite_scroll_render_hooks() {
	add_filter( 'jetpack_amp_infinite_footers', 'twentysixteen_amp_infinite_footers', 10, 2 );
	add_filter( 'jetpack_amp_infinite_output', 'twentysixteen_amp_infinite_output' );
	add_filter( 'jetpack_amp_infinite_older_posts', 'twentysixteen_amp_infinite_older_posts' );
}

/**
 * Get the theme specific footers.
 *
 * @param array  $footers The footers of the themes.
 * @param string $buffer  Contents of the output buffer.
 *
 * @return mixed
 */
function twentysixteen_amp_infinite_footers( $footers, $buffer ) {
	// Collect the sidebar wrapper.
	preg_match(
		'/<aside id="secondary".*<!-- .sidebar .widget-area -->/s',
		$buffer,
		$footer
	);
	$footers[] = reset( $footer );

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
function twentysixteen_amp_infinite_output( $buffer ) {
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

	// Remove the sidebar as it will be added back to amp next page footer.
	$buffer = preg_replace(
		'/<aside id="secondary".*<!-- .sidebar .widget-area -->/s',
		'',
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
function twentysixteen_amp_infinite_older_posts() {
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
