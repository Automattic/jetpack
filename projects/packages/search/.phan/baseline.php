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
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 9 occurrences
    // PhanTypeMismatchArgument : 7 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 7 occurrences
    // PhanRedundantCondition : 6 occurrences
    // PhanUndeclaredProperty : 6 occurrences
    // PhanTypeMismatchReturn : 5 occurrences
    // PhanDeprecatedFunction : 4 occurrences
    // PhanImpossibleCondition : 4 occurrences
    // PhanTypeMismatchProperty : 4 occurrences
    // PhanPluginMixedKeyNoKey : 3 occurrences
    // PhanTypeSuspiciousEcho : 3 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanDeprecatedPartiallySupportedCallable : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeInvalidDimOffset : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchDimAssignment : 1 occurrence
    // PhanTypePossiblyInvalidDimOffset : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-cli.php' => ['PhanTypeMismatchArgument'],
        'src/class-helper.php' => ['PhanDeprecatedPartiallySupportedCallable', 'PhanImpossibleCondition', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod'],
        'src/class-options.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/class-plan.php' => ['PhanDeprecatedFunction'],
        'src/class-rest-controller.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-template-tags.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/classic-search/class-classic-search.php' => ['PhanImpossibleCondition', 'PhanPluginRedundantAssignment', 'PhanRedundantCondition', 'PhanTypeComparisonToArray', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/customizer/customize-controls/class-excluded-post-types-control.php' => ['PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal'],
        'src/dashboard/class-initial-state.php' => ['PhanTypeMismatchArgument'],
        'src/initializers/class-initializer.php' => ['PhanNoopNew'],
        'src/instant-search/class-instant-search.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/widgets/class-search-widget.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeSuspiciousEcho'],
        'src/wpes/class-query-builder.php' => ['PhanImpossibleCondition', 'PhanRedundantCondition', 'PhanTypeMismatchDimAssignment', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredProperty'],
        'src/wpes/class-query-parser.php' => ['PhanUndeclaredProperty'],
        'tests/php/test-helpers.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeMismatchArgument'],
        'tests/php/test-plan.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
