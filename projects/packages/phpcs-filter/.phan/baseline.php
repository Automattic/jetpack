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
    // PhanUndeclaredFunction : 10+ occurrences
    // PhanPossiblyUndeclaredVariable : 3 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanRedefinedUsedTrait : 2 occurrences
    // PhanTypeMismatchReturnNullable : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanUndeclaredTypeParameter : 2 occurrences
    // PhanPluginLoopVariableReuse : 1 occurrence
    // PhanTypeArraySuspiciousNullable : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/PhpcsFilter.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeParameter'],
        'tests/fixtures/perdir-custom/control/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir-custom/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir-custom/test/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/control/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/exclude-3/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/exclude-4/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/exclude-pattern/excluded1.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/exclude-pattern/excluded2.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/exclude-pattern/excludedfile.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/excludedfile.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/file.php' => ['PhanUndeclaredFunction'],
        'tests/fixtures/perdir/severity-to-0/file.php' => ['PhanUndeclaredFunction'],
        'tests/php/PhpcsFilterTest.php' => ['PhanPluginLoopVariableReuse', 'PhanPossiblyUndeclaredVariable', 'PhanRedefinedUsedTrait'],
        'tests/php/StdinBootstrapTest.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedefinedUsedTrait', 'PhanTypeArraySuspiciousNullable', 'PhanUndeclaredClassMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
