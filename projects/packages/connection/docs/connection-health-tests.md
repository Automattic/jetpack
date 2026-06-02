# Connection Health Tests

The connection health testing framework provides a set of diagnostic tests for verifying that a site's Jetpack connection is working correctly. These tests are surfaced in the WordPress **Site Health** screen and can also be run via **WP-CLI**.

## Architecture

The framework is composed of three classes:

### `Connection_Health_Test_Base`

The base framework class. It provides:

- **Test registration** via `add_test()` with support for `direct` and `async` types.
- **Test execution** via `run_test()` (single) and `run_tests()` (all).
- **Result helpers** — static methods for building consistent result arrays: `passing_test()`, `failing_test()`, `skipped_test()`, `informational_test()`, and `connection_failing_test()`.
- **Output methods** — `output_results_for_cli()`, `output_results_for_core_async_site_health()`, and `output_fails_as_wp_error()`.
- **Helper methods** for common checks: `helper_is_connected()`, `helper_get_blog_token()`, `helper_retrieve_connection_owner()`, `helper_get_support_url()`, etc.
- **Encryption** — `encrypt_string_for_wpcom()` for sending diagnostic data securely.

### `Connection_Health_Tests`

Extends `Connection_Health_Test_Base` with all the connection-specific tests. Its constructor:

1. Auto-discovers all `test__*` methods and registers them as `direct` tests.
2. Fires the `jetpack_connection_tests_loaded` action, passing itself as the argument. This is the extension point for plugins.
3. Optionally includes `last__wpcom_self_test` when the `jetpack_debugger_run_self_test` filter returns `true`.

**Built-in tests:**

| Test | What it checks |
|------|---------------|
| `test__blog_token_if_exists` | Blog token is present |
| `test__check_if_connected` | Site is connected to WordPress.com |
| `test__master_user_exists_on_site` | Connection owner exists locally |
| `test__master_user_can_manage_options` | Connection owner is an administrator |
| `test__outbound_http` | Outbound HTTP requests work |
| `test__outbound_https` | Outbound HTTPS requests work |
| `test__identity_crisis` | No URL mismatch with WordPress.com |
| `test__connection_token_health` | Connection tokens are valid |
| `test__wpcom_connection_test` | WordPress.com can reach the site |
| `test__server_port_value` | Server port is standard |
| `test__xml_parser_available` | PHP XML extension is available |

### `Site_Health`

Integrates the health tests into WordPress Site Health. It:

- Registers each `direct` test as a Site Health direct test (runs on page load).
- Registers an async test suite entry (`jetpack-connection-health`) with a corresponding AJAX handler.
- Defers to the legacy Jetpack debugger when an old Jetpack version is active (detected via `has_filter( 'site_status_tests', 'jetpack_debugger_site_status_tests' )`).

## When tests run

- **Site Health page** (`/wp-admin/site-health.php`): Direct tests run synchronously on page load. The async test suite runs via an AJAX request after the page loads.
- **WP-CLI**: Tests can be run programmatically via `$tests = new Connection_Health_Tests(); $tests->output_results_for_cli();`.
- **REST API / other consumers**: Instantiate `Connection_Health_Tests` and call `run_test()`, `pass()`, or `output_fails_as_wp_error()` as needed.

## Extending with plugin-specific tests

Plugins can add their own tests by hooking into the `jetpack_connection_tests_loaded` action. The Jetpack plugin does this to add a sync health test.

### Step 1: Create a test class

Create a class that extends `Connection_Health_Test_Base`. Define test methods with the `test__` prefix and use the result helpers to return consistent results.

```php
use Automattic\Jetpack\Connection\Connection_Health_Test_Base;

class My_Plugin_Cxn_Tests extends Connection_Health_Test_Base {

    /**
     * Register this class's tests on a target test suite.
     *
     * @param Connection_Health_Test_Base $target The test suite to register on.
     */
    public function register_tests_on( $target ) {
        $methods = get_class_methods( static::class );
        foreach ( $methods as $method ) {
            if ( ! str_contains( $method, 'test__' ) ) {
                continue;
            }
            $target->add_test( array( $this, $method ), $method, 'direct' );
        }
    }

    /**
     * Example: check that sync is healthy.
     */
    protected function test__my_feature_health() {
        $name = 'test__my_feature_health';

        if ( ! $this->helper_is_connected() ) {
            return self::skipped_test(
                array(
                    'name'              => $name,
                    'short_description' => 'Not connected.',
                )
            );
        }

        if ( my_feature_is_healthy() ) {
            return self::passing_test( array( 'name' => $name ) );
        }

        return self::failing_test(
            array(
                'name'              => $name,
                'short_description' => 'My feature is not healthy.',
                'severity'          => 'recommended',
            )
        );
    }
}
```

### Step 2: Register via the action hook

Hook into `jetpack_connection_tests_loaded` to register your tests on the connection test suite instance.

```php
add_action(
    'jetpack_connection_tests_loaded',
    function ( $connection_tests ) {
        $my_tests = new My_Plugin_Cxn_Tests();
        $my_tests->register_tests_on( $connection_tests );
    }
);
```

Your tests will now appear in Site Health alongside the built-in connection tests.

### Real-world example: Jetpack plugin

The Jetpack plugin registers its sync health test using this exact pattern in `_inc/lib/debugger.php`:

```php
add_action(
    'jetpack_connection_tests_loaded',
    function ( $connection_tests ) {
        $jetpack_tests = new Jetpack_Cxn_Tests();
        $jetpack_tests->register_tests_on( $connection_tests );
    }
);
```

It also customizes the support URL for beta versions:

```php
add_filter(
    'jetpack_connection_support_url',
    function ( $url ) {
        if ( Jetpack::is_development_version() ) {
            return Redirect::get_url( 'jetpack-contact-support-beta-group' );
        }
        return $url;
    }
);
```

## Available filters

| Filter | Description | Default |
|--------|-------------|---------|
| `jetpack_connection_tests_loaded` | Action. Fires after built-in tests are registered. Receives the `Connection_Health_Tests` instance. | — |
| `jetpack_debugger_run_self_test` | Whether to include the WP.com self-test. | `false` |
| `jetpack_connection_support_url` | Support URL shown in failing test results. | Jetpack support contact page |
| `jetpack_connection_reconnect_url` | Reconnect URL shown in connection failure results. | Empty string by default; the Jetpack plugin provides the reconnect URL when available. |
| `jetpack_connection_site_health_badge_label` | Badge label shown in Site Health. | `'Jetpack'` |

## Test result format

All test methods must return an array. Use the static helpers to ensure a consistent structure:

```php
// Passing
return self::passing_test( array( 'name' => 'test__my_test' ) );

// Failing
return self::failing_test( array(
    'name'              => 'test__my_test',
    'short_description' => 'Something is wrong.',
    'severity'          => 'critical', // or 'recommended'
    'action'            => 'https://example.com/fix',
    'action_label'      => 'Fix it',
) );

// Skipped (precondition not met)
return self::skipped_test( array(
    'name'              => 'test__my_test',
    'short_description' => 'Not applicable.',
) );

// Connection-specific failure (includes reconnect action)
return self::connection_failing_test(
    'test__my_test',
    'Token is invalid.',
    'Try reconnecting Jetpack.'
);
```

## Unit tests

The framework and individual tests are covered by PHPUnit tests in `tests/php/`:

- **`Connection_Health_Test_Base_Test.php`** — Tests the base framework: test registration, execution, result helpers, output methods, encryption, filters, and the subclass extension pattern.
- **`Connection_Health_Tests_Test.php`** — Tests individual health test methods: verifies skipped/pass/fail paths for each built-in test using partial mocks for helper methods.
- **`Site_Health_Test.php`** — Tests Site Health integration: registration, legacy Jetpack detection, direct test callback invocation, and AJAX action registration.

Run the tests from the package directory:

```bash
cd projects/packages/connection
composer phpunit
```

To run a specific test file:

```bash
composer phpunit -- --filter Connection_Health_Tests_Test
```
