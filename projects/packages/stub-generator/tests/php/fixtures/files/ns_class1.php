<?php

namespace Some\NS;

/**
 * Class documentation.
 */
class Class1 {
	/**
	 * Public constant.
	 * @var string
	 */
	public const PUBLIC_CONST = 'public';

	/**
	 * Protected constant.
	 * @var string
	 */
	protected const PROTECTED_CONST = 'protected';

	/**
	 * Private constant.
	 * @var string
	 */
	private const PRIVATE_CONST = 'private';

	public const UNDOCUMENTED_CONST = 'undocumented';

	/**
	 * Public property
	 * @var string
	 */
	public $publicProperty = 'public';

	/**
	 * Protected property
	 * @var string
	 */
	protected $protectedProperty = 'protected';

	/**
	 * Private property
	 * @var string
	 */
	private $privateProperty = 'private';

	public $undocumentedProperty = 'undocumented';

	/**
	 * Public static property
	 * @var string
	 */
	public static $publicStaticProperty = 'public';

	/**
	 * Protected static property
	 * @var string
	 */
	protected static $protectedStaticProperty = 'protected';

	/**
	 * Private static property
	 * @var string
	 */
	private static $privateStaticProperty = 'private';

	public static $undocumentedStaticProperty = 'undocumented';

	/**
	 * Constructor.
	 *
	 * @param string $var Something
	 * @param int $var2 Something else
	 */
	public function __construct( $var, $var2 ) {
		$this->var = $var;
		$this->var2 = $var2;
	}

	/**
	 * Public method.
	 *
	 * @param string $var Something
	 * @return string A value
	 */
	public function publicMethod( $var ) {
		return strtoupper( $var );
	}

	/**
	 * Protected method.
	 */
	protected function protectedMethod() {
	}

	/**
	 * Private method.
	 */
	private function privateMethod() {
	}

	public function undocumentedMethod() {
	}

	/**
	 * Public static method.
	 *
	 * @param string $var Something
	 * @return string A value
	 */
	public static function publicStaticMethod( $var ) {
		return strtoupper( $var );
	}

	/**
	 * Protected static method.
	 */
	protected static function protectedStaticMethod() {
	}

	/**
	 * Private static method.
	 */
	private static function privateStaticMethod() {
	}

	public static function undocumentedStaticStaticMethod() {
	}
}
