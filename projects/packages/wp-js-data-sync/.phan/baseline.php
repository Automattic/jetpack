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
    // PhanUndeclaredClassMethod : 8 occurrences
    // PhanCommentParamWithoutRealParam : 6 occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanUndeclaredMethod : 4 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanUndeclaredTypeParameter : 2 occurrences
    // PhanUnreferencedUseNormal : 2 occurrences
    // PhanImpossibleCondition : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanParamTooFew : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMissingReturn : 1 occurrence
    // PhanUnextractableAnnotation : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-data-sync-entry-adapter.php' => ['PhanUndeclaredMethod', 'PhanUnextractableAnnotation', 'PhanUnreferencedUseNormal'],
        'src/class-data-sync.php' => ['PhanCommentParamWithoutRealParam', 'PhanParamTooFew', 'PhanTypeMissingReturn', 'PhanUndeclaredMethod'],
        'src/class-ds-utils.php' => ['PhanImpossibleCondition', 'PhanRedundantCondition'],
        'src/class-registry.php' => ['PhanUndeclaredTypeParameter'],
        'src/contracts/interface-lazy-entry.php' => ['PhanUnreferencedUseNormal'],
        'src/endpoints/class-action-endpoint.php' => ['PhanCommentParamWithoutRealParam', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchProperty'],
        'src/endpoints/class-endpoint.php' => ['PhanCommentParamWithoutRealParam', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool'],
        'src/schema/class-schema.php' => ['PhanParamTooMany'],
        'src/schema/types/class-type-assoc-array.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn'],
        'src/schema/types/class-type-string.php' => ['PhanImpossibleTypeComparison'],
        'tests/php/schema/integration/test-integration-fallback-values.php' => ['PhanNonClassMethodCall'],
        'tests/php/schema/integration/test-integration-parsing-errors.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'tests/php/schema/type/test-type-assoc-array.php' => ['PhanTypeMismatchArgumentProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
