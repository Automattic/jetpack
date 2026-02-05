# Custom Form Fields Developer Guide

This guide explains how to extend Jetpack Forms with custom field types. The extensibility system allows external developers to register new form fields that integrate seamlessly with the Jetpack Forms editor, validation system, response handling, and dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [PHP API Reference](#php-api-reference)
4. [JavaScript Block Registration](#javascript-block-registration)
5. [Dashboard Integration](#dashboard-integration)
6. [Complete Example: Color Picker Field](#complete-example-color-picker-field)
7. [Testing Your Custom Fields](#testing-your-custom-fields)

## Overview

The Jetpack Forms extensibility system provides a unified API similar to WordPress's `register_post_type()`. With a single function call, you can register:

- Block type for the editor
- Server-side validation
- Frontend field rendering
- Response value rendering (email, CSV, API, dashboard)
- Error messages
- Editor and dashboard scripts

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  register_jetpack_form_field()                   │
│                                                                  │
│  Single function call that handles:                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Block registration (register_block_type)                  ││
│  │ • Field type registration (jetpack_forms_field_types)       ││
│  │ • Validation (jetpack_forms_validate_field)                 ││
│  │ • Field rendering (jetpack_forms_render_field)              ││
│  │ • Value rendering (jetpack_forms_render_field_value)        ││
│  │ • Error messages (jetpack_forms_error_types)                ││
│  │ • Script enqueueing (editor + dashboard)                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- WordPress 6.0+
- Jetpack Forms plugin active
- Basic knowledge of WordPress block development

### Quick Start

1. **Create a WordPress plugin** to contain your custom field
2. **Register the field** using `register_jetpack_form_field()` on the `init` hook
3. **Create the editor block** in JavaScript
4. **Create the dashboard script** for custom value rendering (optional)

### Minimal Example

```php
add_action( 'init', function() {
    if ( ! function_exists( 'register_jetpack_form_field' ) ) {
        return;
    }

    register_jetpack_form_field( 'color', array(
        'validate_callback' => function( $value, $label, $field ) {
            if ( empty( $value ) && $field->get_attribute( 'required' ) ) {
                return sprintf( '%s is required.', $label );
            }
            return true;
        },
        'editor_script' => plugin_dir_url( __FILE__ ) . 'build/index.js',
    ) );
} );
```

## PHP API Reference

### register_jetpack_form_field()

The main function for registering a custom form field type.

```php
register_jetpack_form_field( string $field_type, array $args = array() );
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `$field_type` | string | Unique identifier for the field (e.g., 'color', 'rating'). |
| `$args` | array | Configuration arguments (see below). |

**Configuration Arguments:**

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `block_name` | string | `'jetpack/field-{type}'` | WordPress block name. |
| `block_attributes` | array | `[]` | Additional block attributes. |
| `render_callback` | callable | Auto-generated | Block render callback. |
| `validate_callback` | callable | `null` | Validation callback. |
| `render_field` | callable | `null` | Frontend field HTML render callback. |
| `render_value` | callable | `null` | Value render callback for contexts. |
| `error_messages` | array | `[]` | Error key => message pairs. |
| `editor_script` | string | `''` | URL to the editor script. |
| `editor_script_deps` | array | `['wp-blocks', ...]` | Editor script dependencies. |
| `editor_script_ver` | string | `'1.0.0'` | Editor script version. |
| `dashboard_script` | string | `''` | URL to the dashboard script. |
| `dashboard_script_deps` | array | `['wp-hooks', ...]` | Dashboard script dependencies. |
| `dashboard_script_ver` | string | `'1.0.0'` | Dashboard script version. |

### Callback Signatures

#### validate_callback

```php
/**
 * @param mixed              $value The submitted field value.
 * @param string             $label The field label.
 * @param Contact_Form_Field $field The field instance.
 * @return bool|string True if valid, error message string if invalid.
 */
function( $value, $label, $field ) {
    if ( empty( $value ) && $field->get_attribute( 'required' ) ) {
        return sprintf( '%s is required.', $label );
    }
    return true;
}
```

#### render_field

```php
/**
 * @param array $data Field data with keys: id, label, value, required, placeholder, class, field.
 * @return string HTML to render.
 */
function( $data ) {
    return sprintf(
        '<div class="grunion-field-wrap">
            <label for="%s">%s</label>
            <input type="color" id="%s" name="%s" value="%s" />
        </div>',
        esc_attr( $data['id'] ),
        esc_html( $data['label'] ),
        esc_attr( $data['id'] ),
        esc_attr( $data['id'] ),
        esc_attr( $data['value'] ?? '#000000' )
    );
}
```

#### render_value

```php
/**
 * @param string         $context The render context: 'email', 'web', 'ajax', 'csv', 'api'.
 * @param mixed          $value   The raw field value.
 * @param Feedback_Field $field   The field instance.
 * @return mixed Rendered value.
 */
function( $context, $value, $field ) {
    if ( $context === 'email' ) {
        return sprintf( '<span style="color: %s">%s</span>', esc_attr( $value ), esc_html( $value ) );
    }
    return $value;
}
```

### Helper Functions

```php
// Check if a field type is registered
if ( jetpack_form_field_exists( 'color' ) ) {
    // Field is registered
}

// Get field configuration
$config = get_jetpack_form_field( 'color' );
```

## JavaScript Block Registration

Even with `register_jetpack_form_field()`, you still need to create a JavaScript file that registers the block in the editor using `registerBlockType()`.

### Basic Editor Block

```javascript
( function() {
    'use strict';

    const { registerBlockType } = wp.blocks;
    const { useBlockProps, InspectorControls } = wp.blockEditor;
    const { PanelBody, ToggleControl, TextControl } = wp.components;
    const { createElement: el, Fragment } = wp.element;
    const { __ } = wp.i18n;

    // Custom icon for your field
    const fieldIcon = el(
        'svg',
        { viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' },
        el( 'path', { d: 'M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10...' } )
    );

    registerBlockType( 'jetpack/field-color', {
        apiVersion: 3,
        title: __( 'Color Picker', 'my-plugin' ),
        description: __( 'Add a color picker field to your form.', 'my-plugin' ),
        icon: fieldIcon,
        category: 'contact-form',
        parent: [ 'jetpack/contact-form' ],
        attributes: {
            label: {
                type: 'string',
                default: 'Favorite Color',
            },
            required: {
                type: 'boolean',
                default: false,
            },
            requiredText: {
                type: 'string',
                default: '(required)',
            },
            requiredIndicator: {
                type: 'boolean',
                default: true,
            },
            defaultValue: {
                type: 'string',
                default: '#000000',
            },
            width: {
                type: 'number',
                default: 100,
            },
            id: {
                type: 'string',
            },
            shareFieldAttributes: {
                type: 'boolean',
                default: true,
            },
        },
        supports: {
            reusable: false,
            html: false,
        },

        edit: function( props ) {
            const { attributes, setAttributes, clientId } = props;
            const { label, required, requiredText, requiredIndicator, defaultValue, width } = attributes;

            // Generate field ID if not set
            if ( ! attributes.id ) {
                setAttributes( { id: 'color-' + clientId.substring( 0, 8 ) } );
            }

            const blockProps = useBlockProps( {
                className: 'jetpack-field jetpack-field-color grunion-field-width-' + width,
            } );

            return el(
                Fragment,
                null,
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        { title: __( 'Field Settings', 'my-plugin' ) },
                        el( TextControl, {
                            label: __( 'Label', 'my-plugin' ),
                            value: label,
                            onChange: ( value ) => setAttributes( { label: value } ),
                        } ),
                        el( ToggleControl, {
                            label: __( 'Required', 'my-plugin' ),
                            checked: required,
                            onChange: ( value ) => setAttributes( { required: value } ),
                        } )
                    )
                ),
                el(
                    'div',
                    blockProps,
                    el(
                        'label',
                        { className: 'grunion-field-label' },
                        label,
                        required && requiredIndicator && el( 'span', { className: 'required' }, requiredText )
                    ),
                    el( 'input', {
                        type: 'color',
                        value: defaultValue,
                        onChange: ( e ) => setAttributes( { defaultValue: e.target.value } ),
                    } )
                )
            );
        },

        save: function() {
            return null; // Server-side rendered
        },
    } );
} )();
```

**Important:** The block name in JavaScript must match the `block_name` in your PHP registration (defaults to `'jetpack/field-{type}'`).

## Dashboard Integration

The Jetpack Forms dashboard uses React to display form responses. Custom fields can provide custom rendering using WordPress hooks.

### Available Hooks

#### jetpack.forms.dashboard.fieldValue

Customize how field values are displayed in the response viewer.

```javascript
wp.hooks.addFilter(
    'jetpack.forms.dashboard.fieldValue',
    'my-plugin/field-value',
    function( element, fieldType, value, field ) {
        if ( fieldType !== 'color' ) {
            return element;
        }

        if ( ! value || typeof value !== 'string' ) {
            return '-';
        }

        return wp.element.createElement(
            'span',
            { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
            wp.element.createElement( 'span', {
                style: {
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: value,
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                },
            } ),
            wp.element.createElement( 'span', {
                style: { fontFamily: 'monospace', fontSize: '13px' },
            }, value )
        );
    }
);
```

#### jetpack.forms.dashboard.fieldIcon

Provide a custom icon for your field type.

```javascript
wp.hooks.addFilter(
    'jetpack.forms.dashboard.fieldIcon',
    'my-plugin/field-icon',
    function( icon, fieldType ) {
        if ( fieldType !== 'color' ) {
            return icon;
        }

        return wp.element.createElement(
            'svg',
            { viewBox: '0 0 24 24', width: 24, height: 24 },
            wp.element.createElement( 'path', {
                d: 'M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10...',
                fill: 'currentColor',
            } )
        );
    }
);
```

## Complete Example: Color Picker Field

Here's a complete working plugin using the unified registration API.

### Plugin Structure

```
jetpack-forms-color-field/
├── jetpack-forms-color-field.php    # Main plugin file
├── src/
│   ├── index.js                     # Editor block (source)
│   └── dashboard.js                 # Dashboard integration
└── build/
    ├── index.js                     # Compiled editor block
    └── index.asset.php              # Asset dependencies
```

### Main Plugin File (PHP)

```php
<?php
/**
 * Plugin Name: Jetpack Forms Color Field
 * Description: Adds a color picker field to Jetpack Forms.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'init', function() {
    if ( ! function_exists( 'register_jetpack_form_field' ) ) {
        return;
    }

    register_jetpack_form_field( 'color', array(
        // Block attributes specific to this field type
        'block_attributes' => array(
            'label' => array(
                'type'    => 'string',
                'default' => 'Favorite Color',
            ),
            'defaultValue' => array(
                'type'    => 'string',
                'default' => '#000000',
            ),
        ),

        // Validation callback
        'validate_callback' => function( $value, $label, $field ) {
            if ( empty( $value ) && $field->get_attribute( 'required' ) ) {
                return sprintf( __( '%s is required.', 'my-plugin' ), $label );
            }

            if ( empty( $value ) ) {
                return true;
            }

            if ( ! preg_match( '/^#[0-9A-Fa-f]{6}$/', $value ) ) {
                return sprintf( __( '%s must be a valid hex color.', 'my-plugin' ), $label );
            }

            return true;
        },

        // Frontend field rendering
        'render_field' => function( $data ) {
            $id       = esc_attr( $data['id'] );
            $label    = esc_html( $data['label'] );
            $value    = esc_attr( $data['value'] ?? '#000000' );
            $required = $data['required'] ? 'required aria-required="true"' : '';

            return sprintf(
                '<div class="grunion-field-wrap">
                    <label class="grunion-field-label color" for="%s">%s</label>
                    <input type="color" id="%s" name="%s" value="%s" data-type="color" %s />
                </div>',
                $id, $label, $id, $id, $value, $required
            );
        },

        // Value rendering for different contexts
        'render_value' => function( $context, $value, $field ) {
            if ( empty( $value ) ) {
                return '';
            }

            if ( $context === 'email' ) {
                return sprintf(
                    '<span style="display:inline-block;width:16px;height:16px;background-color:%s;border:1px solid #ccc;margin-right:8px;"></span>%s',
                    esc_attr( $value ),
                    esc_html( $value )
                );
            }

            return $value;
        },

        // Custom error messages
        'error_messages' => array(
            'invalid_color' => __( 'Please enter a valid hex color.', 'my-plugin' ),
        ),

        // Scripts
        'editor_script'    => plugin_dir_url( __FILE__ ) . 'build/index.js',
        'dashboard_script' => plugin_dir_url( __FILE__ ) . 'src/dashboard.js',
    ) );
} );
```

### Dashboard Integration (JavaScript)

```javascript
// src/dashboard.js
( function() {
    'use strict';

    const { addFilter } = wp.hooks;
    const { createElement: el } = wp.element;

    function ColorSwatch( { value } ) {
        return el(
            'span',
            { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
            el( 'span', {
                style: {
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: value,
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                },
            } ),
            el( 'span', { style: { fontFamily: 'monospace' } }, value )
        );
    }

    addFilter(
        'jetpack.forms.dashboard.fieldValue',
        'my-plugin/field-value',
        function( element, fieldType, value ) {
            if ( fieldType !== 'color' ) return element;
            if ( ! value ) return '-';
            return el( ColorSwatch, { value } );
        }
    );
} )();
```

## Testing Your Custom Fields

### Manual Testing Checklist

1. **Block Registration**
   - [ ] Field appears in block inserter under "Contact Form" category
   - [ ] Field can only be inserted within a form block
   - [ ] Field settings panel shows expected controls

2. **Frontend Rendering**
   - [ ] Field renders correctly on the frontend
   - [ ] Field respects required attribute
   - [ ] Default value is pre-filled

3. **Form Submission**
   - [ ] Field value is submitted correctly
   - [ ] Server-side validation works
   - [ ] Invalid submissions show appropriate errors

4. **Response Handling**
   - [ ] Email notifications display field value correctly
   - [ ] Dashboard response viewer shows custom rendering
   - [ ] CSV export includes field value
   - [ ] API responses include field value

## Troubleshooting

### Common Issues

**Field doesn't appear in inserter:**
- Ensure `parent: ['jetpack/contact-form']` is set in your JavaScript block
- Check browser console for JavaScript errors
- Verify Jetpack Forms plugin is active

**Field value not saved on submission:**
- Ensure the input `name` attribute matches the field ID
- Check that `data-type` attribute is set on the input

**Validation not working:**
- Verify `validate_callback` returns `true` for valid, string for invalid
- Check the field type matches in your callback

**Custom rendering not showing in dashboard:**
- Verify `dashboard_script` URL is correct
- Check that the script uses the correct filter hook name
- Ensure `jp-forms-dashboard` is listed in dependencies

### Debug Tips

```php
// Check if your field is registered
if ( jetpack_form_field_exists( 'color' ) ) {
    $config = get_jetpack_form_field( 'color' );
    error_log( print_r( $config, true ) );
}
```

```javascript
// Debug dashboard hooks
console.log( 'Registered filters:', wp.hooks.filters );
```
