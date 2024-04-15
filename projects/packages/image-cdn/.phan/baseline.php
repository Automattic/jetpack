<?php
/**
 * This is an automatically generated baseline for Phan issues.
 * When Phan is invoked with --load-baseline=path/to/baseline.php,
 * The pre-existing issues listed in this file won't be emitted.
 *
 * This file can be updated by invoking Phan with --save-baseline=path/to/baseline.php
 * (can be combined with --load-baseline)
 */
return [
    // # Issue statistics:
    // PhanTypePossiblyInvalidDimOffset : 10+ occurrences
    // PhanPluginSimplifyExpressionBool : 6 occurrences
    // PhanParamTooMany : 5 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 4 occurrences
    // PhanUndeclaredFunctionInCallable : 4 occurrences
    // PhanPossiblyUndeclaredVariable : 3 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanTypeMismatchPropertyProbablyReal : 2 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanNonClassMethodCall : 1 occurrence
    // PhanTypeArraySuspicious : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence
    // PhanTypeObjectUnsetDeclaredProperty : 1 occurrence
    // PhanUndeclaredClassInCallable : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence
    // PhanUndeclaredStaticMethod : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-image-cdn-core.php' => ['PhanTypeMismatchReturn'],
        'src/class-image-cdn-image-sizes.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'src/class-image-cdn.php' => ['PhanNonClassMethodCall', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod'],
        'src/compatibility/photon.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredFunctionInCallable'],
        'tests/php/test_class.image_cdn.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod', 'PhanUndeclaredStaticMethod'],
        'tests/php/test_class.image_cdn_core.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeObjectUnsetDeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
