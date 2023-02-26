<?php // phpcs:ignoreFile

declare(strict_types=1);

use Rector\Config\RectorConfig;

return static function ( RectorConfig $rectorConfig ): void {
	$rectorConfig->paths(
		array(
			__DIR__ . '/projects',
			__DIR__ . '/tools',
		)
	);

	// register a single rule
	// register a single rule
	$rectorConfig->rule( Rector\Php55\Rector\FuncCall\GetCalledClassToStaticClassRector::class );
	$rectorConfig->rule( Rector\Php56\Rector\FunctionLike\AddDefaultValueForUndefinedVariableRector::class );

	$rectorConfig->rule( Rector\Php72\Rector\Assign\ListEachRector::class );
	$rectorConfig->rule( Rector\Php72\Rector\FuncCall\StringifyDefineRector::class );
	$rectorConfig->rule( Rector\Php72\Rector\Unset_\UnsetCastRector::class );
	$rectorConfig->rule( Rector\Php72\Rector\While_\WhileEachToForeachRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\FuncCall\CallUserMethodRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\List_\EmptyListRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\Assign\ListSplitStringRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\Switch_\ReduceMultipleDefaultSwitchRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\FuncCall\RenameMktimeWithoutArgsToTimeRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\MethodCall\ThisCallOnStaticMethodToStaticCallRector::class );
	$rectorConfig->rule( Rector\Php70\Rector\FuncCall\MultiDirnameRector::class );
	// $rectorConfig->rule(Rector\Php70\Rector\FuncCall\NonVariableToVariableOnFunctionCallRector::class);
	$rectorConfig->rule( Rector\Php71\Rector\Assign\AssignArrayToStringRector::class );
	$rectorConfig->rule( Rector\Php71\Rector\BinaryOp\BinaryOpBetweenNumberAndStringRector::class );
	$rectorConfig->rule( Rector\Php71\Rector\FuncCall\CountOnNullRector::class );
	$rectorConfig->rule( Rector\Php71\Rector\BooleanOr\IsIterableRector::class );
	$rectorConfig->rule( Rector\Php71\Rector\FuncCall\RemoveExtraParametersRector::class );
	$rectorConfig->rule( Rector\Php72\Rector\FuncCall\GetClassOnNullRector::class );
	$rectorConfig->rule( Rector\Php73\Rector\FuncCall\ArrayKeyFirstLastRector::class );
	$rectorConfig->rule( Rector\Php73\Rector\BooleanOr\IsCountableRector::class );
	$rectorConfig->rule( Rector\Php73\Rector\FuncCall\RegexDashEscapeRector::class );
	$rectorConfig->rule( Rector\Php73\Rector\ConstFetch\SensitiveConstantNameRector::class );
	// 7.4
	$rectorConfig->rule( Rector\Php74\Rector\FuncCall\ArrayKeyExistsOnPropertyRector::class );
	$rectorConfig->rule( Rector\Php74\Rector\ArrayDimFetch\CurlyToSquareBracketArrayStringRector::class );
	$rectorConfig->rule( Rector\Php74\Rector\Double\RealToFloatTypeCastRector::class );
	$rectorConfig->rule( Rector\Php74\Rector\FuncCall\MbStrrposEncodingArgumentPositionRector::class );
	// 8.0
	$rectorConfig->rule( Rector\Php80\Rector\ClassMethod\AddParamBasedOnParentClassMethodRector::class );
	$rectorConfig->rule( Rector\Php80\Rector\ClassConstFetch\ClassOnThisVariableObjectRector::class );
	$rectorConfig->rule( Rector\Php80\Rector\Ternary\GetDebugTypeRector::class );
	$rectorConfig->rule( Rector\Php80\Rector\FuncCall\Php8ResourceReturnToObjectRector::class );
	$rectorConfig->rule( Rector\Php80\Rector\ClassMethod\SetStateToStaticRector::class );
	$rectorConfig->rule( Rector\CodeQuality\Rector\ClassMethod\OptionalParametersAfterRequiredRector::class );
	$rectorConfig->rule( Rector\CodingStyle\Rector\FuncCall\CountArrayToEmptyArrayComparisonRector::class );
	// 8.1
	$rectorConfig->rule( Rector\Php81\Rector\FuncCall\Php81ResourceReturnToObjectRector::class );
	// misc
	$rectorConfig->rule( Rector\CodeQuality\Rector\NotEqual\CommonNotEqualRector::class );

	$rectorConfig->ruleWithConfiguration(
		\Rector\Renaming\Rector\FuncCall\RenameFunctionRector::class,
		array(
			'split'        => 'explode',
			'join'         => 'implode',
			'sizeof'       => 'count',
			// https://www.php.net/manual/en/aliases.php
			'chop'         => 'rtrim',
			'doubleval'    => 'floatval',
			'gzputs'       => 'gzwrites',
			'fputs'        => 'fwrite',
			'ini_alter'    => 'ini_set',
			'is_double'    => 'is_float',
			'is_integer'   => 'is_int',
			'is_long'      => 'is_int',
			'is_real'      => 'is_float',
			'is_writeable' => 'is_writable',
			'key_exists'   => 'array_key_exists',
			'pos'          => 'current',
			'strchr'       => 'strstr',
			// mb
			'mbstrcut'     => 'mb_strcut',
			'mbstrlen'     => 'mb_strlen',
			'mbstrpos'     => 'mb_strpos',
			'mbstrrpos'    => 'mb_strrpos',
			'mbsubstr'     => 'mb_substr',
		)
	);

	// $rectorConfig->sets([
	// LevelSetList::UP_TO_PHP_81
	// ]);
};
