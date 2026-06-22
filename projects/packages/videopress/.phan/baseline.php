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
    // PhanTypeMismatchReturnProbablyReal : 7 occurrences
    // PhanTypeMismatchReturn : 6 occurrences
    // PhanUndeclaredClassMethod : 5 occurrences
    // PhanCommentOverrideOnNonOverrideMethod : 4 occurrences
    // PhanNonClassMethodCall : 4 occurrences
    // PhanTypeArraySuspiciousNullable : 4 occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanTypeArraySuspicious : 3 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 3 occurrences
    // PhanTypeInvalidDimOffset : 2 occurrences
    // PhanUndeclaredExtendedClass : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanUndeclaredMethodInCallable : 2 occurrences
    // PhanPluginUnreachableCode : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredClass : 1 occurrence
    // PhanUndeclaredTypeThrowsType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-attachment-handler.php' => ['PhanNonClassMethodCall'],
        'src/class-block-editor-extensions.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-data.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchReturn'],
        'src/class-jwt-token-bridge.php' => ['PhanTypeMismatchReturn'],
        'src/class-plan.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-stats.php' => ['PhanTypeArraySuspiciousNullable'],
        'src/class-uploader.php' => ['PhanTypeMismatchArgument'],
        'src/class-utils.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-videopresstoken.php' => ['PhanTypeMismatchReturn'],
        'src/class-wpcom-rest-api-v2-attachment-field-videopress.php' => ['PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-wpcom-rest-api-v2-endpoint-videopress.php' => ['PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/tus/class-tus-client.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'src/tus/class-tus-file.php' => ['PhanTypeArraySuspiciousNullable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeThrowsType'],
        'src/utility-functions.php' => ['PhanPluginUnreachableCode', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable'],
        'src/videopress-divi/class-videopress-divi-extension.php' => ['PhanCommentOverrideOnNonOverrideMethod', 'PhanUndeclaredClass', 'PhanUndeclaredClassMethod', 'PhanUndeclaredExtendedClass', 'PhanUndeclaredMethod', 'PhanUndeclaredMethodInCallable'],
        'src/videopress-divi/class-videopress-divi-module.php' => ['PhanUndeclaredExtendedClass'],
        'tests/php/VideoPress_Uploader_Test.php' => ['PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
