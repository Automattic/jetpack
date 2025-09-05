# WordPress.com MCP Abilities Registry

The Abilities Registry provides a memory-efficient, configuration-driven architecture for creating MCP (Model Control
Protocol) abilities. This system eliminates code repetition and enables lazy loading for optimal performance.

## Architecture Overview

The architecture separates concerns into lightweight abilities and heavy executors:

- **Abilities**: Lightweight classes that handle registration and delegate execution
- **Executors**: Heavy classes containing the actual execution logic (only loaded when needed)
- **Registry**: Configuration-driven system that eliminates hardcoded ability names
- **Factory**: Creates executor instances on-demand with caching

### Memory Efficiency Benefits

- **Significant reduction** in baseline memory usage
- Executors are only loaded when abilities are executed
- Lazy loading prevents unnecessary class instantiation
- Self-identifying abilities reduce configuration overhead

## Directory Structure

```
AbilitiesRegistry/
├── README.md                    # This documentation
├── abilities-config.php         # Central configuration file
├── Registry/
│   └── AbilityRegistry.php     # Configuration loader and lookup methods
├── Traits/
│   ├── AbilityTrait.php        # Combined trait for ability delegation and self-identification
│   └── UserContextTrait.php    # Common user context functionality
├── Factories/
│   └── ExecutorFactory.php     # On-demand executor creation
├── Interfaces/
│   └── ExecutorInterface.php   # Contract for all executors
├── Abilities/
│   └── User/                   # Lightweight ability classes
│       └── UserSitesAbility.php
└── Executors/
    └── User/                   # Heavy execution logic
        └── UserSitesExecutor.php
```

## How to Create a New Ability

Follow these steps to create a new ability using the established pattern:

### Step 1: Add Configuration Entry

Edit `abilities-config.php` and add your new ability:

```php
'wpcom-mcp/my-new-ability' => array(
    'class'       => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Abilities\\Category\\MyNewAbility',
    'executor'    => 'Automattic\\WpcomMcp\\AbilitiesRegistry\\Executors\\Category\\MyNewExecutor',
    'category'    => 'category',        // e.g., 'user', 'content', 'site'
    'type'        => 'tool',           // 'tool', 'resource', or 'prompt'
    'servers'     => array( 'default' ), // Which servers should include this ability
    'description' => 'Brief description of what this ability does',
),
```

### Step 2: Create the Ability Class

Create your lightweight ability class in `Abilities/Category/MyNewAbility.php`:

Check the Abilities API documentation for details on configuration
options: https://github.com/WordPress/abilities-api/tree/trunk/docs

```php
<?php

namespace Automattic\WpcomMcp\AbilitiesRegistry\Abilities\Category;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\AbilityInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\AbilityTrait;

/**
 * My New Ability Class
 *
 * Detailed description of what this ability does
 */
class MyNewAbility implements AbilityInterface {
    use AbilityTrait;

    /**
     * Constructor - registers the ability.
     */
    public function __construct() {
        wp_register_ability(
            $this->get_ability_name(),
            $this->get_config()
        );
    }

    /**
     * Get the ability configuration array.
     *
     * @return array The ability configuration.
     */
    public function get_config(): array {
        return array(
            'label'               => 'My New Ability',
            'description'         => 'Detailed description of what this ability does',
            'input_schema'        => $this->get_input_schema(),
            'output_schema'       => $this->get_output_schema(),
            'execute_callback'    => array( $this, 'execute' ),
            'permission_callback' => array( $this, 'check_permission' ),
        );
    }

    /**
     * Get the input schema for the ability.
     *
     * @return array The input schema.
     */
    private function get_input_schema(): array {
        return array(
            'type'       => 'object',
            'properties' => array(
                'param1' => array(
                    'type'        => 'string',
                    'description' => 'Description of parameter',
                ),
                'param2' => array(
                    'type'        => 'integer',
                    'description' => 'Another parameter description',
                    'minimum'     => 1,
                    'default'     => 10,
                ),
            ),
            'required' => array( 'param1' ),
        );
    }

    /**
     * Get the output schema for the ability.
     *
     * @return array The output schema.
     */
    private function get_output_schema(): array {
        return array(
            'type'       => 'object',
            'properties' => array(
                'success' => array( 'type' => 'boolean' ),
                'data'    => array(
                    'type'       => 'object',
                    'properties' => array(
                        // Define your output structure here
                    ),
                ),
            ),
        );
    }
}
```

### Step 3: Create the Executor Class

Create your heavy executor class in `Executors/Category/MyNewExecutor.php`:

```php
<?php

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\Category;

use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use WP_Error;

class MyNewExecutor implements ExecutorInterface {

    public function execute( array $input = array() ): WP_Error|array {
        // Validate input parameters
        $validation_result = $this->validate_input( $input );
        if ( is_wp_error( $validation_result ) ) {
            return $validation_result;
        }

        // Your heavy execution logic goes here
        // This is where you put all the complex business logic
        
        try {
            // Example: Process the input and return results
            $results = $this->process_request( $input );
            
            return array(
                'success' => true,
                'data'    => $results,
            );
        } catch ( Exception $e ) {
            return new WP_Error(
                'execution_failed',
                'Failed to execute ability: ' . $e->getMessage()
            );
        }
    }

    public function check_permission( array $input = array() ): bool {
        // Implement your permission checks here
        // Return true if user has permission, false otherwise
        
        // Example permission checks:
        if ( ! is_user_logged_in() ) {
            return false;
        }
        
        // Add more specific permission logic as needed
        return true;
    }

    private function validate_input( array $input ): bool|WP_Error {
        // Validate required parameters
        if ( empty( $input['param1'] ) ) {
            return new WP_Error(
                'missing_parameter',
                'Parameter param1 is required'
            );
        }

        // Add more validation as needed
        return true;
    }

    private function process_request( array $input ): array {
        // Your main business logic implementation
        // This method contains the heavy lifting
        
        return array(
            // Your processed results
        );
    }
}
```

### Step 4: Test Your Ability

The ability will be automatically loaded and registered when the MCP adapter initializes. No additional registration
code is needed.

## Configuration Reference

### Ability Types

- **tool**: Interactive abilities that can be called by AI assistants
- **resource**: Static data resources that can be referenced
- **prompt**: Template prompts for AI interactions

### MCP Servers

- **default**: The amin wordpress.com MCP server
- **site-level**: Single-site MCP server for individual sites

## Key Features

### AbilityTrait

The `AbilityTrait` provides significant benefits for ability creation:

**Simplified Code**:

- No need to manually implement `execute()` and `check_permission()` methods
- Consistent behavior across all abilities

**Enhanced Error Messages**:

- Descriptive error messages instead of generic ones
- Structured error data with status codes and ability context
- Automatic error logging for debugging

**Example of the difference**:

```php
// Before (30+ lines of repetitive code)
public function execute( array $input = array() ): WP_Error|array {
    $executor = ExecutorFactory::instance()->create_executor( $this->get_ability_name() );
    
    if ( ! $executor ) {
        return new WP_Error( 'executor_not_found', 'Executor not available', array( 'status' => 500 ) );
    }

    return $executor->execute( $input );
}

// After (0 lines - handled by trait)
use AbilityTrait; // That's it!
```

## Best Practices

### Memory Efficiency

- Keep ability classes lightweight (registration only)
- Put all heavy logic in executor classes
- Use lazy loading - executors are only created when needed
- Cache executor instances in the factory
- **Always use `AbilityTrait`** to eliminate code duplication

### Error Handling

- Always return `WP_Error` objects for failures
- The trait provides enhanced error messages automatically
- Validate input parameters thoroughly in executors
- Handle exceptions gracefully

### Security

- Implement proper permission checks in executors
- Validate and sanitize all input data
- Use WordPress security functions (`esc_*`, `sanitize_*`)
- Follow WordPress security best practices

### Code Organization

- Group related abilities in the same category folder
- Use descriptive class and method names
- Add comprehensive documentation comments
- Follow WordPress coding standards

## Example: UserSitesAbility

The `UserSitesAbility` serves as a reference implementation:

- **Ability**: `Abilities/User/UserSitesAbility.php` (221 lines)
- **Executor**: `Executors/User/UserSitesExecutor.php` (400+ lines)
- **Configuration**: Entry in `abilities-config.php`

This demonstrates the separation of concerns where the lightweight ability handles registration while the heavy executor
contains all the complex site management logic.

## Adding to Different Servers

To make your ability available on different servers, update the `servers` array in the configuration:

```php
'servers' => array( 'default', 'site-level' ), // Available on both servers
```

The ability will automatically appear in the appropriate server's tool list without any additional code changes.

## Automated tests

The Abilities Registry system includes comprehensive automated tests to ensure reliability and proper functionality
across different scenarios. The test suite covers configuration validation, server registration, and ability integration
testing.

### Core Test Files

The following test files automatically validate the system's core functionality:

- **`bin/tests/isolated/suites/wpcom-mcp/AbilitiesConfigTest.php`** - Validates the abilities configuration file
  structure and ensures all referenced classes exist. Tests include:
    - Configuration file existence and readability
    - Proper configuration structure validation
    - Ability configuration structure verification
    - Ability and executor class existence checks
    - Executor requirements validation by type
    - Ability naming convention compliance

- **`bin/tests/isolated/suites/wpcom-mcp/DefaultServerRegistrationTest.php`** - Tests the default WordPress.com MCP
  server registration process, ensuring abilities are correctly loaded and available. Tests include:
    - Default MCP server registration validation
    - MCP endpoint initialization testing
    - Tools list endpoint verification
    - Resources list endpoint validation
    - Prompts list endpoint testing

- **`bin/tests/isolated/suites/wpcom-mcp/SiteLevelServerRegistrationTest.php`** - Validates site-level server
  registration, confirming that abilities are properly configured for individual site MCP servers. Tests include:
    - Site-level MCP server registration
    - MCP endpoint initialization for site-level servers
    - Tools, resources, and prompts list endpoints for site-level servers

### Integration Testing

Additional integration tests are required for each ability to ensure they perform correctly with different input
parameters and edge cases:

- **`bin/tests/isolated/suites/wpcom-mcp/UserSitesAbilityIntegrationTest.php`** - Comprehensive integration testing for
  the UserSitesAbility, covering various input scenarios, permission checks, and error handling. Tests include:
    - Basic MCP tools/call request with default parameters
    - Response structure validation
    - Content type and format verification

### Additional Test Files

- **`bin/tests/isolated/suites/wpcom-mcp/AbilitiesApiCompatibilityTest.php`** - Ensures compatibility with the WordPress
  Abilities API
- **`bin/tests/isolated/suites/wpcom-mcp/ServerRegistrationTest.php`** - General server registration testing
- **`bin/tests/isolated/suites/wpcom-mcp/WpcomMcpTestCase.php`** - Base test case class providing common testing
  utilities

### Test Coverage Requirements

Each ability should include integration tests that verify:

- **Input Validation**: Tests with valid, invalid, and edge case parameters
- **Permission Checks**: Verification of proper access control under different user contexts
- **Error Handling**: Validation of appropriate error responses for various failure scenarios
- **Output Schema**: Confirmation that responses match the defined output schema
- **Performance**: Basic performance validation to ensure abilities execute within acceptable time limits

### Running Tests

Execute the test suite using the standard WordPress testing framework:

```bash
cd bin/tests/isolated/

# Run all wpcom-mcp tests
phpunit --testsuite="wpcom-mcp"

# Run specific test file
phpunit --testsuite="wpcom-mcp" --filter UserSitesAbilityIntegrationTest
```

The automated tests ensure the Abilities Registry maintains its memory efficiency, configuration-driven architecture,
and reliable execution across all supported MCP servers.
