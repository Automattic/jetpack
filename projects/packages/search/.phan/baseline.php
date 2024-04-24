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
    // PhanUnextractableAnnotation : 45+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 9 occurrences
    // PhanUndeclaredClassMethod : 8 occurrences
    // PhanTypeMismatchArgument : 7 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 7 occurrences
    // PhanUndeclaredTypeProperty : 7 occurrences
    // PhanRedundantCondition : 6 occurrences
    // PhanTypeMismatchProperty : 6 occurrences
    // PhanUndeclaredProperty : 6 occurrences
    // PhanTypeMismatchReturn : 5 occurrences
    // PhanDeprecatedFunction : 4 occurrences
    // PhanImpossibleCondition : 4 occurrences
    // PhanPluginMixedKeyNoKey : 3 occurrences
    // PhanTypeSuspiciousEcho : 3 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanUndeclaredClassProperty : 2 occurrences
    // PhanUndeclaredFunctionInCallable : 2 occurrences
    // PhanUndeclaredTypeParameter : 2 occurrences
    // PhanDeprecatedPartiallySupportedCallable : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeInvalidDimOffset : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchDimAssignment : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'compatibility/jetpack.php' => ['PhanUndeclaredClassMethod'],
        'src/class-cli.php' => ['PhanTypeMismatchArgument'],
        'src/class-helper.php' => ['PhanDeprecatedPartiallySupportedCallable', 'PhanImpossibleCondition', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeParameter'],
        'src/class-options.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/class-plan.php' => ['PhanDeprecatedFunction', 'PhanUnextractableAnnotation'],
        'src/class-rest-controller.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-template-tags.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/classic-search/class-classic-search.php' => ['PhanImpossibleCondition', 'PhanPluginRedundantAssignment', 'PhanRedundantCondition', 'PhanTypeComparisonToArray', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty'],
        'src/customizer/customize-controls/class-excluded-post-types-control.php' => ['PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal'],
        'src/dashboard/class-dashboard.php' => ['PhanUnextractableAnnotation'],
        'src/dashboard/class-initial-state.php' => ['PhanTypeMismatchArgument'],
        'src/initializers/class-initializer.php' => ['PhanNoopNew', 'PhanUndeclaredFunctionInCallable'],
        'src/instant-search/class-instant-search.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUnextractableAnnotation'],
        'src/widgets/class-search-widget.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeSuspiciousEcho', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'src/wpes/class-query-builder.php' => ['PhanImpossibleCondition', 'PhanRedundantCondition', 'PhanTypeMismatchDimAssignment', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredProperty'],
        'src/wpes/class-query-parser.php' => ['PhanUndeclaredProperty'],
        'tests/php/test-get-ios-version.php' => ['PhanUndeclaredFunctionInCallable'],
        'tests/php/test-helpers.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredTypeProperty', 'PhanUnextractableAnnotation'],
        'tests/php/test-plan.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
