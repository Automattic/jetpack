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
    // PhanPluginMixedKeyNoKey : 50+ occurrences
    // PhanUndeclaredStaticMethod : 15+ occurrences
    // PhanTypeMismatchArgument : 6 occurrences
    // PhanUndeclaredClassMethod : 6 occurrences
    // PhanTypeMismatchArgumentNullable : 5 occurrences
    // PhanTypeVoidArgument : 5 occurrences
    // PhanTypeVoidAssignment : 5 occurrences
    // PhanUndeclaredConstant : 5 occurrences
    // PhanTypeArraySuspiciousNullable : 3 occurrences
    // PhanContextNotObject : 1 occurrence
    // PhanDeprecatedFunction : 1 occurrence
    // PhanDeprecatedProperty : 1 occurrence
    // PhanPluginUseReturnValueInternalKnown : 1 occurrence
    // PhanTypeObjectUnsetDeclaredProperty : 1 occurrence
    // PhanUndeclaredClassConstant : 1 occurrence
    // PhanUndeclaredClassStaticProperty : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'custom-colors/class-palette.php' => ['PhanTypeArraySuspiciousNullable'],
        'custom-colors/colors.php' => ['PhanTypeMismatchArgumentNullable'],
        'custom-colors/core-bg-admin-notice.php' => ['PhanContextNotObject'],
        'endpoints/class-marketplace-webhook-response.php' => ['PhanPluginMixedKeyNoKey'],
        'feature-plugins/autosave-revision.php' => ['PhanTypeMismatchArgumentNullable'],
        'feature-plugins/coblocks-mods.php' => ['PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod'],
        'feature-plugins/managed-plugins.php' => ['PhanUndeclaredClassMethod'],
        'feature-plugins/sensei-pro-mods.php' => ['PhanUndeclaredClassMethod'],
        'footer-credit/theme-optimizations.php' => ['PhanUndeclaredConstant', 'PhanUndeclaredStaticMethod'],
        'functions.php' => ['PhanUndeclaredClassStaticProperty'],
        'imports/playground/class-sql-importer.php' => ['PhanUndeclaredConstant'],
        'safeguard/utils.php' => ['PhanTypeMismatchArgument'],
        'tests/ActivityPubTest.php' => ['PhanUndeclaredClassMethod'],
        'tests/AnyoneCanRegisterNoticeTest.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument', 'PhanTypeVoidAssignment'],
        'tests/FrontendNoticesTest.php' => ['PhanUndeclaredStaticMethod'],
        'tests/PlanNoticesTest.php' => ['PhanDeprecatedProperty', 'PhanPluginUseReturnValueInternalKnown', 'PhanUndeclaredStaticMethod'],
        'tests/WpcomFeaturesTest.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredStaticMethod'],
        'tests/feature-manager/FeatureHookTest.php' => ['PhanUndeclaredStaticMethod'],
        'tests/imports/SQLGeneratorTest.php' => ['PhanTypeObjectUnsetDeclaredProperty'],
        'widgets/class-widget-top-clicks.php' => ['PhanDeprecatedFunction'],
        'wpcom-features/class-wpcom-features.php' => ['PhanPluginMixedKeyNoKey'],
        'wpcom-features/functions-wpcom-features.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
