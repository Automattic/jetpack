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
    // PhanTypeArraySuspiciousNullable : 20+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeMismatchArgumentNullableInternal : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 10+ occurrences
    // PhanTypeMissingReturn : 10+ occurrences
    // PhanTypeArraySuspicious : 9 occurrences
    // PhanTypeMismatchArgument : 9 occurrences
    // PhanParamTooMany : 7 occurrences
    // PhanPossiblyUndeclaredVariable : 6 occurrences
    // PhanUndeclaredClassMethod : 6 occurrences
    // PhanUndeclaredFunction : 6 occurrences
    // PhanUndeclaredConstant : 5 occurrences
    // PhanCommentParamOnEmptyParamList : 3 occurrences
    // PhanPluginUseReturnValueInternalKnown : 3 occurrences
    // PhanTypeMismatchArgumentInternal : 3 occurrences
    // PhanTypeMismatchPropertyDefault : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanUndeclaredClassConstant : 3 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanRedundantCondition : 2 occurrences
    // PhanUndeclaredMethodInCallable : 2 occurrences
    // PhanUndeclaredStaticMethod : 2 occurrences
    // PhanCoalescingNeverNull : 1 occurrence
    // PhanCommentObjectInClassConstantType : 1 occurrence
    // PhanCommentParamOutOfOrder : 1 occurrence
    // PhanCommentParamWithoutRealParam : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanImpossibleTypeComparisonInGlobalScope : 1 occurrence
    // PhanPluginNeverReturnFunction : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeInvalidUnaryOperandIncOrDec : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanTypeSuspiciousStringExpression : 1 occurrence
    // PhanUndeclaredClassInCallable : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredConstantOfClass : 1 occurrence
    // PhanUndeclaredFunctionInCallable : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence
    // PhanUndeclaredTypeParameter : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'app/admin/class-admin.php' => ['PhanNoopNew'],
        'app/admin/class-config.php' => ['PhanTypeMismatchArgument'],
        'app/data-sync/Minify_Excludes_State_Entry.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/data-sync/Performance_History_Entry.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious'],
        'app/features/setup-prompt/Setup_Prompt.php' => ['PhanTypeMissingReturn'],
        'app/lib/Environment_Change_Detector.php' => ['PhanCommentParamOutOfOrder'],
        'app/lib/Status.php' => ['PhanTypeArraySuspiciousNullable', 'PhanUndeclaredMethodInCallable'],
        'app/lib/Super_Cache_Info.php' => ['PhanUndeclaredFunction'],
        'app/lib/class-cli.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanUndeclaredConstantOfClass'],
        'app/lib/class-minify.php' => ['PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredMethod'],
        'app/lib/class-viewport.php' => ['PhanTypeMismatchArgument'],
        'app/lib/critical-css/Critical_CSS_State.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspiciousNullable'],
        'app/lib/critical-css/Regenerate.php' => ['PhanParamTooMany'],
        'app/lib/critical-css/source-providers/Source_Providers.php' => ['PhanCommentParamOnEmptyParamList'],
        'app/lib/critical-css/source-providers/providers/Archive_Provider.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/lib/critical-css/source-providers/providers/Post_ID_Provider.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/lib/critical-css/source-providers/providers/Provider.php' => ['PhanTypeMismatchArgumentInternal'],
        'app/lib/critical-css/source-providers/providers/Singular_Post_Provider.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/lib/critical-css/source-providers/providers/Taxonomy_Provider.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/lib/critical-css/source-providers/providers/WP_Core_Provider.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/lib/minify/Concatenate_CSS.php' => ['PhanPluginUseReturnValueInternalKnown', 'PhanTypeMismatchArgument'],
        'app/lib/minify/Concatenate_JS.php' => ['PhanPluginUseReturnValueInternalKnown', 'PhanPossiblyUndeclaredVariable', 'PhanTypeInvalidUnaryOperandIncOrDec', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypePossiblyInvalidDimOffset'],
        'app/lib/minify/Dependency_Path_Mapping.php' => ['PhanUndeclaredConstant'],
        'app/lib/minify/functions-helpers.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchDefault', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredConstant'],
        'app/lib/minify/functions-service.php' => ['PhanImpossibleTypeComparison', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginNeverReturnFunction', 'PhanPluginUseReturnValueInternalKnown', 'PhanPossiblyUndeclaredVariable', 'PhanRedundantCondition', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentNullableInternal'],
        'app/modules/Modules_Index.php' => ['PhanCommentObjectInClassConstantType'],
        'app/modules/Modules_Setup.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMissingReturn', 'PhanUndeclaredStaticMethod'],
        'app/modules/image-guide/Image_Guide.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeMissingReturn'],
        'app/modules/image-guide/Image_Guide_Proxy.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'app/modules/image-size-analysis/Image_Size_Analysis.php' => ['PhanTypeMissingReturn'],
        'app/modules/image-size-analysis/data-sync/Image_Size_Analysis_Action_Fix.php' => ['PhanCommentParamWithoutRealParam', 'PhanPossiblyUndeclaredVariable', 'PhanRedundantCondition'],
        'app/modules/optimizations/cloud-css/Cloud_CSS_Followup.php' => ['PhanCommentParamOnEmptyParamList'],
        'app/modules/optimizations/critical-css/CSS_Proxy.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'app/modules/optimizations/image-cdn/class-image-cdn.php' => ['PhanTypeMissingReturn'],
        'app/modules/optimizations/minify/class-minify-css.php' => ['PhanTypeMissingReturn'],
        'app/modules/optimizations/minify/class-minify-js.php' => ['PhanTypeMissingReturn'],
        'app/modules/optimizations/page-cache/Page_Cache.php' => ['PhanTypeMissingReturn'],
        'app/modules/optimizations/page-cache/Page_Cache_Setup.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn'],
        'app/modules/optimizations/page-cache/data-sync/Page_Cache_Entry.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'app/modules/optimizations/page-cache/pre-wordpress/Boost_Cache.php' => ['PhanCommentParamOnEmptyParamList', 'PhanTypeMismatchReturnProbablyReal'],
        'app/modules/optimizations/page-cache/pre-wordpress/Filesystem_Utils.php' => ['PhanTypeSuspiciousStringExpression'],
        'app/modules/optimizations/page-cache/pre-wordpress/Logger.php' => ['PhanCoalescingNeverNull', 'PhanPluginDuplicateConditionalNullCoalescing'],
        'app/modules/optimizations/page-cache/pre-wordpress/Request.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchPropertyDefault'],
        'app/modules/optimizations/page-cache/pre-wordpress/storage/File_Storage.php' => ['PhanTypeMismatchArgument'],
        'app/modules/optimizations/render-blocking-js/class-render-blocking-js.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchPropertyDefault', 'PhanTypeMissingReturn'],
        'app/modules/performance-history/Performance_History.php' => ['PhanTypeMissingReturn'],
        'app/rest-api/permissions/Nonce.php' => ['PhanParamTooMany'],
        'compatibility/amp.php' => ['PhanUndeclaredClassInCallable', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'compatibility/elementor.php' => ['PhanUndeclaredClassConstant'],
        'compatibility/jetpack.php' => ['PhanUndeclaredClassMethod'],
        'compatibility/lib/class-sync-jetpack-module-status.php' => ['PhanParamTooMany', 'PhanUndeclaredClassMethod'],
        'compatibility/page-optimize.php' => ['PhanUndeclaredFunction', 'PhanUndeclaredFunctionInCallable'],
        'compatibility/score-prompt.php' => ['PhanImpossibleTypeComparisonInGlobalScope', 'PhanTypeComparisonToArray'],
        'compatibility/web-stories.php' => ['PhanUndeclaredClassConstant'],
        'compatibility/woocommerce.php' => ['PhanTypeArraySuspicious'],
        'compatibility/wp-super-cache.php' => ['PhanUndeclaredFunction'],
        'jetpack-boost.php' => ['PhanNoopNew'],
        'tests/bootstrap.php' => ['PhanRedefineFunction', 'PhanTypeMismatchReturnProbablyReal'],
        'wp-js-data-sync.php' => ['PhanParamTooMany'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
