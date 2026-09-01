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
    // PhanTypeArraySuspiciousNullable : 15+ occurrences
    // PhanTypeArraySuspicious : 8 occurrences
    // PhanTypeMismatchArgument : 6 occurrences
    // PhanUndeclaredConstant : 5 occurrences
    // PhanTypeMismatchReturnProbablyReal : 4 occurrences
    // PhanUndeclaredClassConstant : 4 occurrences
    // PhanUndeclaredFunction : 4 occurrences
    // PhanPluginUseReturnValueInternalKnown : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanCoalescingNeverNull : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMissingReturn : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'app/admin/class-config.php' => ['PhanTypeMismatchArgument'],
        'app/data-sync/class-minify-excludes-state-entry.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/data-sync/class-performance-history-entry.php' => ['PhanTypeArraySuspicious'],
        'app/lib/class-cli.php' => ['PhanTypeMismatchArgument'],
        'app/lib/critical-css/class-critical-css-state.php' => ['PhanTypeArraySuspiciousNullable'],
        'app/lib/minify/class-concatenate-css.php' => ['PhanPluginUseReturnValueInternalKnown', 'PhanTypeMismatchArgument'],
        'app/lib/minify/class-concatenate-js.php' => ['PhanPluginUseReturnValueInternalKnown', 'PhanTypeMismatchArgument'],
        'app/lib/minify/class-dependency-path-mapping.php' => ['PhanUndeclaredConstant'],
        'app/lib/minify/functions-helpers.php' => ['PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredConstant'],
        'app/modules/optimizations/page-cache/class-page-cache-setup.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn'],
        'app/modules/optimizations/page-cache/pre-wordpress/class-logger.php' => ['PhanCoalescingNeverNull'],
        'app/modules/optimizations/page-cache/pre-wordpress/class-request.php' => ['PhanTypeMismatchPropertyDefault'],
        'app/modules/optimizations/render-blocking-js/class-render-blocking-js.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchPropertyDefault'],
        'compatibility/elementor.php' => ['PhanUndeclaredClassConstant'],
        'compatibility/page-optimize.php' => ['PhanUndeclaredFunction'],
        'compatibility/web-stories.php' => ['PhanUndeclaredClassConstant'],
        'compatibility/woocommerce.php' => ['PhanTypeArraySuspicious'],
        'tests/bootstrap.php' => ['PhanRedefineFunction', 'PhanTypeMismatchReturnProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
