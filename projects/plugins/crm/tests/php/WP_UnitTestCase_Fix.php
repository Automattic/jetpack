<?php // phpcs:ignore WordPress.Files.FileName
/**
 * A trait to fix WP_UnitTestCase so it'll work with PHPUnit 10+.
 *
 * @package automattic/jetpack-crm
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

		/**
		 * Obsolete method where PHPUnit is mis-processing the doc comment to see a `@group` that doesn't exist.
		 * This redefinition hides the "bad" doc comment from PHPUnit.
		 */
		protected function checkRequirements() { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found, WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
			parent::checkRequirements();
		}
	}

	// Also define these removed classes that nothing uses except a `class_alias()` from core's `tests/phpunit/includes/phpunit6/compat.php`.
	/** Unusable dummy class. */
	final class Bogus {
		private function __construct() {}
	}
	class_alias( Bogus::class, \PHPUnit\Framework\Error\Deprecated::class );
	class_alias( Bogus::class, \PHPUnit\Framework\Error\Notice::class );
	class_alias( Bogus::class, \PHPUnit\Framework\Error\Warning::class );
	class_alias( Bogus::class, \PHPUnit\Framework\Warning::class );
	class_alias( Bogus::class, \PHPUnit\Framework\TestListener::class );

} else {
	trait WP_UnitTestCase_Fix {
	}
}
