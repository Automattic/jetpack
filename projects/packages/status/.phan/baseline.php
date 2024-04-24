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
    // PhanTypeMismatchArgument : 10+ occurrences
    // PhanUndeclaredClassMethod : 10+ occurrences
    // PhanUndeclaredConstant : 6 occurrences
    // PhanTypeMismatchArgumentInternal : 4 occurrences
    // PhanUndeclaredFunction : 4 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 3 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanPluginSimplifyExpressionBool : 2 occurrences
    // PhanRedefineFunction : 2 occurrences
    // PhanUndeclaredClassInCallable : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanMisspelledAnnotation : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeArraySuspicious : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUnextractableAnnotation : 1 occurrence
    // PhanUnextractableAnnotationSuffix : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-cache.php' => ['PhanMisspelledAnnotation'],
        'src/class-cookiestate.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentNullableInternal'],
        'src/class-errors.php' => ['PhanTypeMismatchArgumentInternal', 'PhanUndeclaredClassInCallable'],
        'src/class-host.php' => ['PhanTypeMismatchArgumentNullable', 'PhanUnextractableAnnotationSuffix'],
        'src/class-modules.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUnextractableAnnotation'],
        'src/class-status.php' => ['PhanRedundantCondition', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunction', 'PhanUndeclaredMethod'],
        'tests/php/bootstrap.php' => ['PhanRedefineFunction', 'PhanTypeMismatchReturnProbablyReal'],
        'tests/php/test-host.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgument'],
        'tests/php/test-status.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentInternal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
