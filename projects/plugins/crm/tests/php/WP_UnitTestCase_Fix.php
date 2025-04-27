<?php // phpcs:ignore WordPress.Files.FileName
/**
 * A trait to fix WP_UnitTestCase so it'll work with PHPUnit 10+.
 *
 * @package automattic/jetpack-crm
 */

// phpcs:disable Generic.Classes.DuplicateClassName.Found, Generic.Files.OneObjectStructurePerFile.MultipleFound
// phpcs:disable WordPress.NamingConventions.ValidFunctionName, WordPress.NamingConventions.ValidVariableName

namespace Automattic\Jetpack\PHPUnit;

use PHPUnit\Metadata\Annotation\Parser\Registry as AnnotationRegistry;
use ReflectionClass;
use ReflectionFunctionAbstract;
use ReflectionMethod;

if ( explode( '.', \PHPUnit\Runner\Version::id() )[0] >= 10 ) {
	if ( ! class_exists( AnnotationRegistry::class ) ) {

		/**
		 * Doc block annotation extraction for getAnnotations in PHPUnit 12.
		 *
		 * Adapted from code in PHPUnit 11 `PHPUnit\Metadata\Annotation\Parser\Registry` and `PHPUnit\Metadata\Annotation\Parser\DocBlock`.
		 */
		class WP_UnitTestCase_Fix_GetAnnotations {
			/**
			 * Cache.
			 * @var array
			 */
			private static $cache;

			/**
			 * Get annotations for a class method.
			 *
			 * @param string $className Class name.
			 * @param string $methodName Method name.
			 * @return array Annotation data.
			 */
			public static function getAnnotations( $className, $methodName ) {
				if ( ! isset( self::$cache['class'][ $className ] ) ) {
					self::$cache['class'][ $className ] = self::getForReflector( new ReflectionClass( $className ) );
				}
				if ( ! isset( self::$cache['method'][ $className ][ $methodName ] ) ) {
					self::$cache['method'][ $className ][ $methodName ] = self::getForReflector( new ReflectionMethod( $className, $methodName ) );
				}
				return array(
					'method' => self::$cache['method'][ $className ][ $methodName ],
					'class'  => self::$cache['class'][ $className ],
				);
			}

			/**
			 * Extract annotations from a Reflection object.
			 *
			 * @param ReflectionClass|ReflectionFunctionAbstract $reflector Reflection object.
			 * @return array Annotation data.
			 */
			private static function getForReflector( $reflector ) {
				$annotations = array();

				if ( $reflector instanceof ReflectionClass ) {
					$annotations = array_merge(
						$annotations,
						...array_map(
							static function ( $trait ) {
								return self::parseDocBlock( (string) $trait->getDocComment() ); },
							array_values( $reflector->getTraits() )
						)
					);
				}

				return array_merge(
					$annotations,
					self::parseDocBlock( (string) $reflector->getDocComment() )
				);
			}

			/**
			 * Extract annotations from a doc block comment.
			 *
			 * @param string $docblock Doc block.
			 * @return array Annotation data for `@expectedDeprecated` and `@expectedIncorrectUsage`.
			 */
			private static function parseDocBlock( $docblock ) {
				$annotations = array();
				$docblock    = substr( (string) $docblock, 3, -2 );
				if ( preg_match_all( '/@(?P<name>expectedDeprecated|expectedIncorrectUsage)(?:[ \t]+(?P<value>.*?))?[ \t]*\r?$/m', $docblock, $matches, PREG_SET_ORDER ) ) {
					foreach ( $matches as $m ) {
						$annotations[ $m['name'] ][] = $m['value'];
					}
				}
				return $annotations;
			}
		}
	}

	trait WP_UnitTestCase_Fix {

		/**
		 * For `WP_UnitTestCase::expectDeprecated()` to call.
		 *
		 * @return array Method and class annotations, at minimum `@expectedDeprecated` and `@expectedIncorrectUsage`.
		 */
		public function getAnnotations() {
			if ( class_exists( AnnotationRegistry::class ) ) {
				return array(
					'method' => AnnotationRegistry::getInstance()->forMethod( static::class, $this->name() )->symbolAnnotations(),
					'class'  => AnnotationRegistry::getInstance()->forClassName( static::class )->symbolAnnotations(),
				);
			}

			return WP_UnitTestCase_Fix_GetAnnotations::getAnnotations( static::class, $this->name() );
		}

		/**
		 * Obsolete method where PHPUnit is mis-processing the doc comment to see a `@group` that doesn't exist.
		 * This redefinition hides the "bad" doc comment from PHPUnit.
		 */
		protected function checkRequirements() { // phpcs:ignore Generic.CodeAnalysis.UselessOverridingMethod.Found
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
