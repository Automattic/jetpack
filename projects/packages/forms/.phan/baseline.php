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
    // PhanTypeMismatchArgument : 50+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 7 occurrences
    // PhanDeprecatedFunction : 3 occurrences
    // PhanTypeConversionFromArray : 2 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanDeprecatedClass : 1 occurrence
    // PhanPluginMixedKeyNoKey : 1 occurrence
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/contact-form/class-contact-form-field.php' => ['PhanPossiblyNullTypeMismatchProperty', 'PhanTypeConversionFromArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form-plugin.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form-shortcode.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/service/class-google-drive.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'tests/php/contact-form/Contact_Form_Plugin_Test.php' => ['PhanPluginMixedKeyNoKey'],
        'tests/php/dashboard/Dashboard_View_Switch_Test.php' => ['PhanDeprecatedClass', 'PhanDeprecatedFunction'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
