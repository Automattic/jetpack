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
    // PhanUndeclaredConstant : 7 occurrences
    // PhanUndeclaredClassMethod : 4 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanUndeclaredTypeParameter : 2 occurrences
    // PhanCompatibleAttributeGroupOnSameLine : 1 occurrence
    // PhanParamSignatureMismatch : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-automatic-install-skin.php' => ['PhanCompatibleAttributeGroupOnSameLine', 'PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeParameter'],
        'src/class-plugins-installer.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
