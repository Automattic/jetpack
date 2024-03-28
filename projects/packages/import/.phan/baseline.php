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
    // PhanUndeclaredTypeReturnType : 35+ occurrences
    // PhanTypeArraySuspicious : 25+ occurrences
    // PhanTypeMismatchArgument : 25+ occurrences
    // PhanUndeclaredTypeParameter : 20+ occurrences
    // PhanParamSignatureMismatch : 15+ occurrences
    // PhanTypeMismatchReturn : 10+ occurrences
    // PhanUndeclaredClassMethod : 10+ occurrences
    // PhanPluginMixedKeyNoKey : 4 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 3 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredProperty : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanRedundantArrayValuesCall : 1 occurrence
    // PhanTraitParentReference : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/endpoints/class-attachment.php' => ['PhanParamSignatureMismatch', 'PhanPluginMixedKeyNoKey', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-category.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-comment.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-custom-css.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-end.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-global-style.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-menu-item.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-menu.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-page.php' => ['PhanTypeArraySuspicious', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-post.php' => ['PhanAccessMethodInternal', 'PhanImpossibleTypeComparison', 'PhanParamSignatureMismatch', 'PhanRedundantArrayValuesCall', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-start.php' => ['PhanParamSignatureMismatch', 'PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-tag.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-template.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/trait-import-id.php' => ['PhanParamSignatureMismatch', 'PhanTraitParentReference', 'PhanTypeArraySuspicious', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/trait-import.php' => ['PhanPluginMixedKeyNoKey', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod', 'PhanUndeclaredProperty', 'PhanUndeclaredTypeParameter'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
