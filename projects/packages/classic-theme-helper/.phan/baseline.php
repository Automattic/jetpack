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
    // PhanTypeMismatchArgumentInternal : 10+ occurrences
    // PhanUndeclaredClassMethod : 10+ occurrences
    // PhanTypePossiblyInvalidDimOffset : 8 occurrences
    // PhanTypeSuspiciousNonTraversableForeach : 6 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 5 occurrences
    // PhanUndeclaredClassReference : 4 occurrences
    // PhanTypeInvalidDimOffset : 2 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '_inc/lib/tonesque.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-featured-content.php' => ['PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanTypePossiblyInvalidDimOffset'],
        'src/class-social-links.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'src/content-options/featured-images-fallback.php' => ['PhanTypePossiblyInvalidDimOffset'],
        'src/custom-content-types.php' => ['PhanUndeclaredClassMethod'],
        'src/custom-post-types/class-jetpack-portfolio.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanUndeclaredClassMethod'],
        'src/custom-post-types/class-jetpack-testimonial.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/custom-post-types/class-nova-restaurant.php' => ['PhanTypeSuspiciousNonTraversableForeach'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
