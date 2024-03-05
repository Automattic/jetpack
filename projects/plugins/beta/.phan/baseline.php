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
    // PhanUndeclaredConstant : 30+ occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanTypeMismatchReturnProbablyReal : 4 occurrences
    // PhanPossiblyUndeclaredVariable : 3 occurrences
    // PhanStaticPropIsStaticType : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanPossiblyUndeclaredGlobalVariable : 1 occurrence
    // PhanTypeInvalidExpressionArrayDestructuring : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredFunctionInCallable : 1 occurrence
    // PhanUnextractableAnnotation : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'jetpack-beta.php' => ['PhanUndeclaredFunctionInCallable'],
        'src/admin/plugin-manage.template.php' => ['PhanPossiblyUndeclaredGlobalVariable', 'PhanUndeclaredConstant'],
        'src/admin/plugin-select.template.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/admin/show-needed-updates.template.php' => ['PhanPossiblyUndeclaredVariable'],
        'src/class-admin.php' => ['PhanUndeclaredConstant'],
        'src/class-autoupdateself.php' => ['PhanStaticPropIsStaticType', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant'],
        'src/class-hooks.php' => ['PhanPossiblyNullTypeMismatchProperty', 'PhanStaticPropIsStaticType', 'PhanTypeInvalidExpressionArrayDestructuring', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredConstant', 'PhanUndeclaredMethod', 'PhanUnextractableAnnotation'],
        'src/class-plugin.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredMethod'],
        'src/class-utils.php' => ['PhanUndeclaredConstant'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
