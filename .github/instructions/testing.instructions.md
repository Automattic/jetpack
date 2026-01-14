---
applyTo: "**/*.test.{js,jsx,ts,tsx},**/tests/**/*.{js,jsx,ts,tsx},**/test/**/*.php,**/tests/**/*.php"
---

# Testing Instructions

## JavaScript/TypeScript Tests

### Framework: Jest with Testing Library

- Use Jest as the test runner
- Use `@testing-library/react` for React components
- Use `@testing-library/react-hooks` for custom hooks
- Use `@testing-library/user-event` for user interactions

### Test Structure

```javascript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { ... };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### Best Practices

- Use `screen` queries from Testing Library (not destructuring from render)
- Prefer `getByRole` over `getByTestId` when possible
- Test user behavior, not implementation details
- Don't test internal state directly
- Mock external dependencies (API calls, etc.)
- Use `jest.fn()` for function mocks
- Clean up after each test with `afterEach` if needed

### Coverage

- Aim for high coverage of public APIs
- Focus on critical paths and edge cases
- Don't test trivial code just for coverage

## PHP Tests

### Framework: PHPUnit with WordPress Test Suite

- Use PHPUnit for unit tests
- Use WordPress test suite for integration tests
- Use Brain\Monkey for mocking WordPress functions

### Test Structure

```php
class Test_Class_Name extends WP_UnitTestCase {
    public function test_method_name() {
        // Arrange
        $expected = 'value';
        
        // Act
        $result = function_to_test();
        
        // Assert
        $this->assertEquals($expected, $result);
    }
}
```

### Best Practices

- Extend `WP_UnitTestCase` for WordPress integration tests
- Use `setUp()` and `tearDown()` for test fixtures
- Use data providers for testing multiple scenarios
- Mock external services and APIs
- Test both success and failure cases
- Test edge cases and boundary conditions
- Use descriptive test method names

### WordPress-Specific Testing

- Use factory methods for creating test data (`$this->factory->post->create()`)
- Clean up data after tests
- Test with multiple user roles/capabilities
- Test hooks (actions/filters) are called correctly
- Verify database changes with assertions

## E2E Tests (Playwright)

### Framework: Playwright with Allure

- Use Playwright for browser automation
- Use `allure-playwright` for reporting
- Tests should be independent and idempotent

### Best Practices

- Start with a clean WordPress installation
- Use page objects for reusable page interactions
- Wait for elements to be visible/ready before interacting
- Take screenshots on failures
- Test critical user journeys
- Test on multiple browsers if needed
- Keep tests fast and focused

## Running Tests

- JS tests: `pnpm test` or `jetpack test` → select JS tests
- PHP tests: `jetpack test` → select PHP unit tests
- E2E tests: Part of CI pipeline, see `.github/workflows/e2e-tests.yml`

## Mocking

- Mock external APIs and services
- Don't mock code you're testing
- Use realistic mock data
- Keep mocks simple and focused
- Document complex mocks

## Common Mistakes to Avoid

- Testing implementation details instead of behavior
- Tests that depend on other tests
- Tests that depend on execution order
- Overly complex test setup
- Not cleaning up test data
- Testing third-party code
