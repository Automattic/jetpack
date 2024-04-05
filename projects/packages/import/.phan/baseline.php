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
    // PhanPluginMixedKeyNoKey : 4 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 3 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredProperty : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanRedundantArrayValuesCall : 1 occurrence
    // PhanTraitParentReference : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence
    // PhanUndeclaredMethod : 1 occurrence
    // PhanUndeclaredTypeReturnType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/endpoints/class-attachment.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturn', 'PhanUndeclaredTypeReturnType'],
        'src/endpoints/class-category.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/endpoints/class-end.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturnProbablyReal'],
        'src/endpoints/class-global-style.php' => ['PhanTypeMismatchReturn'],
        'src/endpoints/class-menu.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/endpoints/class-post.php' => ['PhanAccessMethodInternal', 'PhanImpossibleTypeComparison', 'PhanRedundantArrayValuesCall', 'PhanUndeclaredClassMethod'],
        'src/endpoints/class-start.php' => ['PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturnProbablyReal'],
        'src/endpoints/class-tag.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/endpoints/trait-import-id.php' => ['PhanTraitParentReference'],
        'src/endpoints/trait-import.php' => ['PhanPluginMixedKeyNoKey', 'PhanUndeclaredMethod', 'PhanUndeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
