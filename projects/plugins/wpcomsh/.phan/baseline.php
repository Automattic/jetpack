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
    // PhanPluginMixedKeyNoKey : 25+ occurrences
    // PhanUndeclaredFunction : 20+ occurrences
    // PhanUndeclaredClassMethod : 15+ occurrences
    // PhanUndeclaredStaticMethod : 15+ occurrences
    // PhanUndeclaredFunctionInCallable : 10+ occurrences
    // PhanTypeVoidAssignment : 8 occurrences
    // PhanUndeclaredClassProperty : 7 occurrences
    // PhanRedundantCondition : 6 occurrences
    // PhanTypeMismatchArgument : 6 occurrences
    // PhanTypeMismatchArgumentNullable : 5 occurrences
    // PhanUndeclaredConstant : 5 occurrences
    // PhanTypeSuspiciousEcho : 4 occurrences
    // PhanUndeclaredClassInCallable : 4 occurrences
    // PhanUndeclaredTypeParameter : 4 occurrences
    // PhanImpossibleCondition : 3 occurrences
    // PhanTypeArraySuspiciousNullable : 3 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanTypeVoidArgument : 2 occurrences
    // PhanUndeclaredClassInstanceof : 2 occurrences
    // PhanUndeclaredClassReference : 2 occurrences
    // PhanUndeclaredVariable : 2 occurrences
    // PhanContextNotObject : 1 occurrence
    // PhanDeprecatedProperty : 1 occurrence
    // PhanNoopNewNoSideEffects : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanPluginUseReturnValueInternalKnown : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeObjectUnsetDeclaredProperty : 1 occurrence
    // PhanUndeclaredClassConstant : 1 occurrence
    // PhanUndeclaredClassStaticProperty : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'block-theme-footer-credits/class-wpcom-block-theme-footer-credits.php' => ['PhanUndeclaredFunction'],
        'class-jetpack-plugin-compatibility.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference'],
        'class-wpcomsh-cli-commands.php' => ['PhanTypeVoidAssignment', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunctionInCallable'],
        'custom-colors/class-palette.php' => ['PhanTypeArraySuspiciousNullable'],
        'custom-colors/colors-api.php' => ['PhanNoopNewNoSideEffects'],
        'custom-colors/colors.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredVariable'],
        'custom-colors/core-bg-admin-notice.php' => ['PhanContextNotObject', 'PhanUndeclaredClassMethod'],
        'endpoints/class-marketplace-webhook-response.php' => ['PhanPluginMixedKeyNoKey'],
        'endpoints/rest-api-export.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'feature-plugins/autosave-revision.php' => ['PhanPluginRedundantAssignment', 'PhanTypeMismatchArgumentNullable'],
        'feature-plugins/coblocks-mods.php' => ['PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod'],
        'feature-plugins/gutenberg-mods.php' => ['PhanUndeclaredFunctionInCallable'],
        'feature-plugins/managed-plugins.php' => ['PhanRedundantCondition', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunctionInCallable'],
        'feature-plugins/sensei-pro-mods.php' => ['PhanUndeclaredClassMethod'],
        'footer-credit/theme-optimizations.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction'],
        'frontend-notices/gifting-banner/gifting-banner.php' => ['PhanUndeclaredFunction'],
        'functions.php' => ['PhanImpossibleCondition', 'PhanUndeclaredClassStaticProperty'],
        'i18n.php' => ['PhanUndeclaredFunction'],
        'imports/playground/class-sql-importer.php' => ['PhanUndeclaredConstant'],
        'logo-tool/logo-tool.php' => ['PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredFunction'],
        'notices/plan-notices.php' => ['PhanImpossibleCondition'],
        'plugin-hotfixes.php' => ['PhanUndeclaredFunctionInCallable'],
        'private-site/access-denied-coming-soon-template.php' => ['PhanTypeSuspiciousEcho'],
        'private-site/access-denied-preview-login-template.php' => ['PhanTypeSuspiciousEcho'],
        'private-site/access-denied-private-site-template.php' => ['PhanTypeSuspiciousEcho'],
        'safeguard/utils.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument'],
        'support-session.php' => ['PhanNoopNew'],
        'tests/feature-manager/test-feature-hooks.php' => ['PhanUndeclaredStaticMethod'],
        'tests/imports/test-sql-generator.php' => ['PhanTypeObjectUnsetDeclaredProperty'],
        'tests/test-anyone-can-register-notice.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument', 'PhanTypeVoidAssignment'],
        'tests/test-blog-token-resilience.php' => ['PhanUndeclaredStaticMethod'],
        'tests/test-frontend-notices.php' => ['PhanUndeclaredStaticMethod'],
        'tests/test-plan-notices.php' => ['PhanDeprecatedProperty', 'PhanPluginUseReturnValueInternalKnown', 'PhanTypeVoidAssignment', 'PhanUndeclaredStaticMethod'],
        'tests/test-wpcom-features.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredStaticMethod'],
        'widgets/class-jetpack-posts-i-like-widget.php' => ['PhanRedundantCondition'],
        'widgets/class-pd-top-rated.php' => ['PhanRedundantCondition'],
        'widgets/class-widget-top-clicks.php' => ['PhanUndeclaredFunction'],
        'wpcom-features/class-wpcom-features.php' => ['PhanPluginMixedKeyNoKey'],
        'wpcom-features/functions-wpcom-features.php' => ['PhanImpossibleCondition', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassInstanceof', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredFunction', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeParameter'],
        'wpcomsh.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunctionInCallable'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
