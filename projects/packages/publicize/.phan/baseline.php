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
    // PhanPluginDuplicateConditionalNullCoalescing : 6 occurrences
    // PhanTypeMismatchArgument : 6 occurrences
    // PhanPluginUnreachableCode : 4 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanDeprecatedFunction : 2 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanImpossibleCondition : 1 occurrence
    // PhanParamSignatureMismatch : 1 occurrence
    // PhanPluginDuplicateExpressionAssignmentOperation : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanSuspiciousMagicConstant : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanTypeSuspiciousNonTraversableForeach : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-connections.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredMethod'],
        'src/class-keyring-helper.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault'],
        'src/class-publicize-base.php' => ['PhanImpossibleCondition', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanSuspiciousMagicConstant', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn'],
        'src/class-publicize-setup.php' => ['PhanNoopNew', 'PhanTypeMismatchArgument'],
        'src/class-publicize-ui.php' => ['PhanPluginDuplicateExpressionAssignmentOperation', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-publicize.php' => ['PhanParamSignatureMismatch', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMissingReturn'],
        'src/class-rest-controller.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal'],
        'src/rest-api/class-connections-controller.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeSuspiciousNonTraversableForeach'],
        'src/rest-api/class-connections-post-field.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/rest-api/class-scheduled-actions-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/rest-api/class-services-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/social-image-generator/class-post-settings.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/social-image-generator/class-rest-settings-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/social-image-generator/class-settings.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/social-image-generator/class-setup.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/Connections_Post_Field_Test.php' => ['PhanPluginUnreachableCode', 'PhanTypeMismatchArgument'],
        'tests/php/Publicize_OG_Optimization_Test.php' => ['PhanDeprecatedFunction'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
