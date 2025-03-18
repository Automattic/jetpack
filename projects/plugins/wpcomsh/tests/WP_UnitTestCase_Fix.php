<?php // phpcs:ignore WordPress.Files.FileName
/**
 * A trait to fix WP_UnitTestCase so it'll work with PHPUnit 10+.
 *
 * @package automattic/wpcomsh
 */

// phpcs:disable Generic.Classes.DuplicateClassName.Found, Generic.Files.OneObjectStructurePerFile.MultipleFound

namespace Automattic\Jetpack\PHPUnit;

use PHPUnit\Metadata\Annotation\Parser\Registry as AnnotationRegistry;

if ( explode( '.', \PHPUnit\Runner\Version::id() )[0] >= 10 ) {
	trait WP_UnitTestCase_Fix {

		/**
		 * For `WP_UnitTestCase::expectDeprecated()` to call.
		 *
		 * @return array Method and class annotations, at minimum `@expectedDeprecated` and `@expectedIncorrectUsage`.
		 */
		public function getAnnotations() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
			return array(
				'method' => AnnotationRegistry::getInstance()->forMethod( static::class, $this->name() )->symbolAnnotations(),
				'class'  => AnnotationRegistry::getInstance()->forClassName( static::class )->symbolAnnotations(),
			);
		}
	}
} else {
	trait WP_UnitTestCase_Fix {
	}
}
