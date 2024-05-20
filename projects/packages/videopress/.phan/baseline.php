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
    // PhanPluginDuplicateConditionalNullCoalescing : 20+ occurrences
    // PhanUndeclaredProperty : 8 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 7 occurrences
    // PhanTypeMismatchReturnProbablyReal : 7 occurrences
    // PhanTypeArraySuspicious : 6 occurrences
    // PhanTypeMismatchReturn : 6 occurrences
    // PhanUndeclaredClassMethod : 6 occurrences
    // PhanCommentOverrideOnNonOverrideMethod : 4 occurrences
    // PhanNonClassMethodCall : 4 occurrences
    // PhanTypeArraySuspiciousNullable : 4 occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanNoopNew : 3 occurrences
    // PhanParamTooMany : 3 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeInvalidDimOffset : 2 occurrences
    // PhanUndeclaredExtendedClass : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanUndeclaredMethodInCallable : 2 occurrences
    // PhanUndeclaredTypeThrowsType : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanPluginUnreachableCode : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredClass : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-access-control.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-attachment-handler.php' => ['PhanNonClassMethodCall', 'PhanTypeArraySuspicious'],
        'src/class-block-editor-content.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-block-editor-extensions.php' => ['PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-data.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious', 'PhanTypeMismatchReturn'],
        'src/class-divi.php' => ['PhanUndeclaredProperty'],
        'src/class-initializer.php' => ['PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-jwt-token-bridge.php' => ['PhanTypeMismatchReturn'],
        'src/class-plan.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-stats.php' => ['PhanTypeArraySuspiciousNullable'],
        'src/class-uploader-rest-endpoints.php' => ['PhanParamTooMany'],
        'src/class-uploader.php' => ['PhanTypeMismatchArgument'],
        'src/class-utils.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-videopresstoken.php' => ['PhanTypeMismatchReturn'],
        'src/class-wpcom-rest-api-v2-attachment-field-videopress.php' => ['PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-wpcom-rest-api-v2-endpoint-videopress.php' => ['PhanAccessMethodInternal', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-xmlrpc.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/tus/class-transient-store.php' => ['PhanParamTooMany'],
        'src/tus/class-tus-abstract-cache.php' => ['PhanTypeMismatchArgumentInternal'],
        'src/tus/class-tus-client.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'src/tus/class-tus-file.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeArraySuspiciousNullable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeThrowsType'],
        'src/utility-functions.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginUnreachableCode', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/videopress-divi/class-videopress-divi-extension.php' => ['PhanCommentOverrideOnNonOverrideMethod', 'PhanUndeclaredClass', 'PhanUndeclaredClassMethod', 'PhanUndeclaredExtendedClass', 'PhanUndeclaredMethod', 'PhanUndeclaredMethodInCallable', 'PhanUndeclaredProperty'],
        'src/videopress-divi/class-videopress-divi-module.php' => ['PhanUndeclaredExtendedClass', 'PhanUndeclaredProperty'],
        'tests/php/test-class-initializer.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test-uploader.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
