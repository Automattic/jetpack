<?php
/**
 * Stand-ins for the WordPress.com functions Llms_Txt uses to purge its edge cache.
 *
 * @package automattic/jetpack-seo
 */

if ( ! function_exists( 'wpcom_get_all_blog_domains_with_path' ) ) {
	/**
	 * The site's domains with a path appended; here only the home URL.
	 *
	 * @param int    $blog_id         Blog ID, 0 for the current blog.
	 * @param string $path            Path to append.
	 * @param bool   $include_primary Whether to include the primary domain.
	 * @return string[]
	 */
	function wpcom_get_all_blog_domains_with_path( $blog_id, $path, $include_primary ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( home_url( $path ) );
	}
}

if ( ! function_exists( 'queue_async_job' ) ) {
	/**
	 * Record the job in {@see Wpcom_Test_Async_Jobs::$queued}.
	 *
	 * @param array  $data     Job data.
	 * @param string $type     Job type.
	 * @param int    $priority Priority.
	 * @param int    $delay    Delay in seconds.
	 * @return bool
	 */
	function queue_async_job( $data, $type, $priority = 0, $delay = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		Wpcom_Test_Async_Jobs::$queued[] = array(
			'type' => $type,
			'data' => $data,
		);
		return true;
	}
}
