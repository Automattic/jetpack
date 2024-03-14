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
    // PhanUndeclaredClassMethod : 45+ occurrences
    // PhanUnextractableAnnotation : 45+ occurrences
    // PhanTypeMismatchArgument : 20+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 10+ occurrences
    // PhanUndeclaredTypeParameter : 10+ occurrences
    // PhanUndeclaredTypeProperty : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 9 occurrences
    // PhanRedundantCondition : 6 occurrences
    // PhanTypeMismatchProperty : 6 occurrences
    // PhanTypeMismatchReturn : 6 occurrences
    // PhanUndeclaredProperty : 6 occurrences
    // PhanUndeclaredClassProperty : 5 occurrences
    // PhanDeprecatedFunction : 4 occurrences
    // PhanImpossibleCondition : 4 occurrences
    // PhanPluginMixedKeyNoKey : 3 occurrences
    // PhanTypeSuspiciousEcho : 3 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanUndeclaredFunctionInCallable : 2 occurrences
    // PhanDeprecatedPartiallySupportedCallable : 1 occurrence
    // PhanParamSignatureMismatch : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanRedefinedUsedTrait : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeInvalidDimOffset : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchDimAssignment : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredConstant : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredTypeReturnType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'compatibility/jetpack.php' => ['PhanUndeclaredClassMethod'],
        'src/class-cli.php' => ['PhanTypeMismatchArgument'],
        'src/class-helper.php' => ['PhanDeprecatedPartiallySupportedCallable', 'PhanImpossibleCondition', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-module-control.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'src/class-options.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/class-plan.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUnextractableAnnotation'],
        'src/class-rest-controller.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-stats.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-template-tags.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/classic-search/class-classic-search.php' => ['PhanImpossibleCondition', 'PhanPluginRedundantAssignment', 'PhanRedundantCondition', 'PhanTypeComparisonToArray', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter'],
        'src/customizer/class-customizer.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'src/customizer/customize-controls/class-excluded-post-types-control.php' => ['PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal'],
        'src/dashboard/class-dashboard.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUnextractableAnnotation'],
        'src/dashboard/class-initial-state.php' => ['PhanTypeMismatchArgument'],
        'src/initializers/class-initializer.php' => ['PhanNoopNew', 'PhanUndeclaredFunctionInCallable'],
        'src/instant-search/class-instant-search.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeParameter', 'PhanUnextractableAnnotation'],
        'src/widgets/class-search-widget.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeSuspiciousEcho', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'src/wpes/class-query-builder.php' => ['PhanImpossibleCondition', 'PhanRedundantCondition', 'PhanTypeMismatchDimAssignment', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredProperty'],
        'src/wpes/class-query-parser.php' => ['PhanUndeclaredProperty'],
        'tests/php/test-get-ios-version.php' => ['PhanUndeclaredFunctionInCallable'],
        'tests/php/test-helpers.php' => ['PhanPluginMixedKeyNoKey', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredTypeProperty', 'PhanUnextractableAnnotation'],
        'tests/php/test-module-control.php' => ['PhanTypeMismatchArgument'],
        'tests/php/test-plan.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test-rest-controller.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeReturnType'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
