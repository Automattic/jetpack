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
    // PhanPluginMixedKeyNoKey : 7 occurrences
    // PhanPluginUnreachableCode : 4 occurrences
    // PhanTypeMismatchArgument : 3 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanParamSignatureMismatch : 1 occurrence
    // PhanSuspiciousMagicConstant : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeSuspiciousNonTraversableForeach : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-connections.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredMethod'],
        'src/class-keyring-helper.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault'],
        'src/class-publicize-base.php' => ['PhanDeprecatedFunction', 'PhanSuspiciousMagicConstant', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchDimFetch'],
        'src/class-publicize-ui.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-publicize.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMissingReturn'],
        'src/class-rest-controller.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/rest-api/class-connections-controller.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeSuspiciousNonTraversableForeach'],
        'src/rest-api/class-scheduled-actions-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/rest-api/class-services-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/rest-api/class-share-status-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/social-image-generator/class-rest-settings-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/social-image-generator/class-setup.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/Connections_Post_Field_Test.php' => ['PhanPluginUnreachableCode', 'PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
