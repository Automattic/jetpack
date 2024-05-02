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
    // PhanNonClassMethodCall : 10+ occurrences
    // PhanParamTooFew : 10+ occurrences
    // PhanUndeclaredMethod : 3 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanImpossibleCondition : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanUndeclaredTypeParameter : 1 occurrence
    // PhanUnreferencedUseNormal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-data-sync-entry-adapter.php' => ['PhanParamTooFew'],
        'src/class-data-sync.php' => ['PhanParamTooFew', 'PhanUndeclaredMethod'],
        'src/class-ds-utils.php' => ['PhanImpossibleCondition', 'PhanRedundantCondition'],
        'src/class-registry.php' => ['PhanUndeclaredTypeParameter'],
        'src/contracts/interface-lazy-entry.php' => ['PhanUnreferencedUseNormal'],
        'src/endpoints/class-action-endpoint.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchProperty'],
        'src/endpoints/class-endpoint.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool'],
        'src/schema/class-schema.php' => ['PhanParamTooMany'],
        'src/schema/types/class-type-assoc-array.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn'],
        'src/schema/types/class-type-string.php' => ['PhanImpossibleTypeComparison'],
        'tests/php/schema/integration/test-integration-fallback-values.php' => ['PhanNonClassMethodCall'],
        'tests/php/schema/integration/test-integration-parsing-errors.php' => ['PhanNonClassMethodCall', 'PhanParamTooFew'],
        'tests/php/schema/type/test-type-assoc-array.php' => ['PhanTypeMismatchArgumentProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
