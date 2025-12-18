# Phone Field View Testing

This directory contains tests for the phone field view.js module, which implements the WordPress Interactivity API for phone number input with country selection.

## Testing Strategy

The phone field view.js module uses WordPress Interactivity API to manage:
- Phone number validation using libphonenumber-js
- Country selection combobox with search functionality
- Keyboard navigation
- Dynamic form state management

## Test Structure

### What's Tested

**Phone Validation (`validators.phone`)**
- Required/optional field validation
- International phone number validation with country selector
- Regex fallback validation for simple phone formats
- Phone numbers starting with + or 00 prefixes
- Invalid character detection

**User Interactions**
- Phone input handling (with/without country selector)
- Country selection and switching
- Combobox keyboard navigation (Arrow keys, Enter, Escape)
- Document click handling (outside/inside click detection)

**Component Lifecycle**
- Element registration callbacks
- Phone field initialization (immediate and delayed)
- Delayed initialization when internal refs aren't ready
- Reset functionality
- Focus handling

**Search & Filtering**
- Country filtering logic based on name, code, or prefix

### Testing Limitations

Due to the module's internal state management (private variables like `asYouTypes`, `phoneInputRefs`, etc.), some integration tests are limited. The tests focus on:

1. **Public API testing**: Testing the store configuration and action behaviors
2. **Logic verification**: Testing the core algorithms independently
3. **Error boundary testing**: Ensuring graceful failure when internal state isn't properly initialized

### Mocking Strategy

- **WordPress Interactivity API**: Fully mocked to capture store configuration
- **libphonenumber-js**: Mocked to control validation results
- **DOM elements**: Created using jsdom for realistic HTML structure
- **Country data**: Mocked with sample countries for testing

## Running Tests

```bash
cd projects/packages/forms
pnpm test -- tests/js/modules/field-phone/view.test.js
```

## Test Coverage

The test suite covers:
- ✅ Phone number validation logic (27 tests total)
- ✅ Basic input handling
- ✅ Country selection and updates
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ DOM element registration callbacks
- ✅ Component initialization (immediate and delayed scenarios)
- ✅ Delayed initialization fallback mechanism
- ✅ Reset and focus behaviors
- ✅ Search filtering logic
- ✅ Document click handling (inside/outside detection)

This provides comprehensive coverage of the view.js functionality while working within the constraints of the WordPress Interactivity API architecture.