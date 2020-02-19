# Jetpack Local Testing Suite

A package adding a framework and tests for a Jetpack-enabled site to be integrated with Core's Site Info, WP CLI, and the Jetpack.com Debugging tools.

The Jetpack Debugger is a framework and collection of tests to provide the same results in a variety of debug locations:
- Core's Site Health and Debug Data sections.
- WP CLI via the `wp jetpack status` that is part of the Jetpack plugin.
- Jetpack.com's debugger used by Jetpack staff.

### Usage

- The tests within the system can be called by
`(new Tests)->list_tests();`
- The results, unformatted, can be called by `(new Tests)->raw_results();`
- To only return the failures, `(new Tests)->list_fails;`
- To return failures in WP_Error format, `(new Tests)->output_fails_as_wp_error`;

The functions are set to run the tests if they have not yet been run so the package
does not need to be "primed".

#### Adding Tests

To add a test to the package, add it to the `class-tests.php` file. Methods within
that class that begin with `test__` will be automatically included. See below for example.

To add a test via a plugin as a package consumer, you can do so via the `jetpack_connection_tests_loaded` filter.

For example:

```$php
add_action( 'jetpack_connection_tests_loaded', 'example_function', 10, 2);

function example_function( $tests ) {
    $callable = 'example_test'; // Required. Needs to be a valid callable.
    $name     = 'Test Name'; // Required. The default tests use __FUNCTION__. Needs to be unique.
    $type     = 'direct'; // Optional. Core Site Health check type. direct to run during the load of Core's Site Health, async for an async test.
    $groups   = 'default'; // Optional. Testing group. Currently unused.
    $tests->add_test( $callable, $name, $type, $groups );
}

function example_test( $tests ) {
    $name = 'Test Name'; // Test name to be passed back with the result.
    // The test need to return on a passing or a failing state. Optionally, it can return a skipped status.

    // Example test that passes if on https, fails if not. It will skip if fired via WP CLI.
    if ( defined( 'WP_CLI' ) && WP_CLI ) {
        $message = "Skipped since not applicable in CLI." // Optional. Reason for skipping.
        return $tests::skipped_test( $name, $message );
    } else if ( is_ssl() ) {
        // Returns a passed result.
        return $tests::passed_test( $name );
    } else {
        $message = "Your site is not secure for your visitors!";
        $resolution = "Contact your hosting provider for information on how to enable HTTPS on your site.";
        $action = false; // Optional URL to direct site owners to in order to resolve failure.
        $severity = 'critical'; // Optional. "critical" or "recommended" for failure stats.
        return $tests::failing_test( $name, $message, $resolution, $action, $severity )
    }
}
```
