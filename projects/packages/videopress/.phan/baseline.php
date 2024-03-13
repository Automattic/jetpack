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
    // PhanUndeclaredClassMethod : 20+ occurrences
    // PhanUndeclaredTypeParameter : 15+ occurrences
    // PhanTypeArraySuspicious : 10+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 10+ occurrences
    // PhanTypeMismatchReturn : 10+ occurrences
    // PhanUndeclaredClassProperty : 10+ occurrences
    // PhanUndeclaredFunction : 10+ occurrences
    // PhanTypeMismatchArgument : 8 occurrences
    // PhanUndeclaredProperty : 8 occurrences
    // PhanUndeclaredConstant : 7 occurrences
    // PhanTypeMismatchReturnProbablyReal : 5 occurrences
    // PhanUnextractableAnnotation : 5 occurrences
    // PhanCommentOverrideOnNonOverrideMethod : 4 occurrences
    // PhanNonClassMethodCall : 4 occurrences
    // PhanTypeArraySuspiciousNullable : 4 occurrences
    // PhanNoopNew : 3 occurrences
    // PhanParamTooMany : 3 occurrences
    // PhanUndeclaredMethod : 3 occurrences
    // PhanUndeclaredTypeReturnType : 3 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeInvalidDimOffset : 2 occurrences
    // PhanUndeclaredClassConstant : 2 occurrences
    // PhanUndeclaredExtendedClass : 2 occurrences
    // PhanUndeclaredMethodInCallable : 2 occurrences
    // PhanUndeclaredTypeProperty : 2 occurrences
    // PhanUndeclaredTypeThrowsType : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanPluginUnreachableCode : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredClass : 1 occurrence
    // PhanUndeclaredClassInstanceof : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-access-control.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredClassReference', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-admin-ui.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod'],
        'src/class-ajax.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredFunction'],
        'src/class-attachment-handler.php' => ['PhanNonClassMethodCall', 'PhanTypeArraySuspicious', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/class-block-editor-content.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter'],
        'src/class-block-editor-extensions.php' => ['PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-data.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious', 'PhanTypeMismatchReturn', 'PhanUndeclaredFunction'],
        'src/class-divi.php' => ['PhanUndeclaredProperty'],
        'src/class-initializer.php' => ['PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredClassProperty', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeParameter'],
        'src/class-jwt-token-bridge.php' => ['PhanTypeMismatchReturn'],
        'src/class-plan.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant', 'PhanUnextractableAnnotation'],
        'src/class-site.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-stats.php' => ['PhanTypeArraySuspiciousNullable'],
        'src/class-status.php' => ['PhanUndeclaredClassMethod'],
        'src/class-uploader-rest-endpoints.php' => ['PhanParamTooMany'],
        'src/class-uploader.php' => ['PhanTypeMismatchArgument'],
        'src/class-utils.php' => ['PhanUnextractableAnnotation'],
        'src/class-videopress-rest-api-v1-settings.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'src/class-videopress-rest-api-v1-site.php' => ['PhanTypeMismatchReturn', 'PhanUndeclaredTypeReturnType'],
        'src/class-videopresstoken.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod'],
        'src/class-wpcom-rest-api-v2-attachment-field-videopress.php' => ['PhanTypeMismatchReturn', 'PhanUndeclaredClassProperty', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-wpcom-rest-api-v2-attachment-videopress-data.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassProperty', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-wpcom-rest-api-v2-endpoint-videopress.php' => ['PhanAccessMethodInternal', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-xmlrpc.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredClassInstanceof', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'src/tus/class-transient-store.php' => ['PhanParamTooMany'],
        'src/tus/class-tus-abstract-cache.php' => ['PhanTypeMismatchArgumentInternal'],
        'src/tus/class-tus-client.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/tus/class-tus-file.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeThrowsType'],
        'src/utility-functions.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginUnreachableCode', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant'],
        'src/videopress-divi/class-videopress-divi-extension.php' => ['PhanCommentOverrideOnNonOverrideMethod', 'PhanUndeclaredClass', 'PhanUndeclaredClassMethod', 'PhanUndeclaredExtendedClass', 'PhanUndeclaredMethod', 'PhanUndeclaredMethodInCallable', 'PhanUndeclaredProperty'],
        'src/videopress-divi/class-videopress-divi-module.php' => ['PhanUndeclaredExtendedClass', 'PhanUndeclaredProperty'],
        'tests/php/test-class-initializer.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test-uploader.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
