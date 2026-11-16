<?php
/**
 * Test stub for the host plugin's Jetpack_SEO_Posts class.
 *
 * The real class lives in projects/plugins/jetpack and is not autoloaded in the
 * SEO package test context. Schema_Builder guards on it with class_exists(), so
 * this controllable stand-in lets tests drive the per-post schema override and
 * description it returns.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Jetpack_SEO_Posts' ) ) {

	/**
	 * Stub of the host plugin's Jetpack_SEO_Posts.
	 */
	class Jetpack_SEO_Posts {

		/**
		 * Per-post schema override returned to Schema_Builder.
		 *
		 * @var string
		 */
		public static $schema_type = '';

		/**
		 * Description returned to Schema_Builder.
		 *
		 * @var string
		 */
		public static $description = '';

		/**
		 * Custom SEO description returned to Llms_Txt.
		 *
		 * @var string
		 */
		public static $custom_description = '';

		/**
		 * Stub for the host plugin's per-post schema-type override.
		 *
		 * @param mixed $post Post (ignored by the stub).
		 * @return string
		 */
		public static function get_post_schema_type( $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- mirrors the host method signature.
			return self::$schema_type;
		}

		/**
		 * Stub for the host plugin's per-post description.
		 *
		 * @param mixed $post Post (ignored by the stub).
		 * @return string
		 */
		public static function get_post_description( $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- mirrors the host method signature.
			return self::$description;
		}

		/**
		 * Stub for the host plugin's custom SEO description.
		 *
		 * @param mixed $post Post (ignored by the stub).
		 * @return string
		 */
		public static function get_post_custom_description( $post ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- mirrors the host method signature.
			return self::$custom_description;
		}
	}
}
