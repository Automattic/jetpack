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
    // PhanUndeclaredClassMethod : 20+ occurrences
    // PhanTypeMismatchArgument : 15+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 10+ occurrences
    // PhanDeprecatedFunction : 9 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 7 occurrences
    // PhanTypeMismatchProperty : 6 occurrences
    // PhanUndeclaredStaticMethod : 6 occurrences
    // PhanTypeMismatchArgumentNullable : 3 occurrences
    // PhanUndeclaredTypeProperty : 3 occurrences
    // PhanPluginMixedKeyNoKey : 2 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanUndeclaredFunction : 2 occurrences
    // PhanUndeclaredTypeReturnType : 2 occurrences
    // PhanImpossibleCondition : 1 occurrence
    // PhanParamSignatureMismatch : 1 occurrence
    // PhanPluginDuplicateExpressionAssignmentOperation : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanSuspiciousMagicConstant : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence
    // PhanUnextractableAnnotationSuffix : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/auto-conversion-settings/class-rest-settings-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/class-connections-post-field.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanUndeclaredTypeReturnType'],
        'src/class-keyring-helper.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanUndeclaredTypeReturnType'],
        'src/class-publicize-base.php' => ['PhanImpossibleCondition', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanSuspiciousMagicConstant', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction'],
        'src/class-publicize-setup.php' => ['PhanTypeMismatchArgument', 'PhanUnextractableAnnotationSuffix'],
        'src/class-publicize-ui.php' => ['PhanPluginDuplicateExpressionAssignmentOperation', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/class-publicize.php' => ['PhanParamSignatureMismatch', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMissingReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredStaticMethod'],
        'src/class-rest-controller.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod'],
        'src/social-image-generator/class-post-settings.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/social-image-generator/class-rest-settings-controller.php' => ['PhanPluginMixedKeyNoKey'],
        'src/social-image-generator/class-settings.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/social-image-generator/class-setup.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/jetpack-social-settings/test-auto-conversion.php' => ['PhanDeprecatedFunction', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/jetpack-social-settings/test-jetpack-social-settings.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/jetpack-social-settings/test-social-image-generator-settings.php' => ['PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/test-connections-post-field.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument'],
        'tests/php/test-publicize-og-optimization.php' => ['PhanDeprecatedFunction'],
        'tests/php/test-social-image-generator/test-post-settings.php' => ['PhanDeprecatedFunction'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
