# Custom Form Fields Developer Guide

This guide explains how to extend Jetpack Forms with custom field types. The extensibility system allows external developers to register new form fields that integrate seamlessly with the Jetpack Forms editor, validation system, response handling, and dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [PHP API Reference](#php-api-reference)
4. [JavaScript Block Registration](#javascript-block-registration)
5. [Frontend Interactivity](#frontend-interactivity)
6. [Dashboard Integration](#dashboard-integration)
7. [Complete Example: Color Picker Field](#complete-example-color-picker-field)
8. [Testing Your Custom Fields](#testing-your-custom-fields)

## Overview

The Jetpack Forms extensibility system provides a unified API similar to WordPress's `register_post_type()`. With a single function call, you can register:

- Block type for the editor
- Server-side validation
- Frontend field rendering with Interactivity API support
- Response value rendering (email, CSV, API, dashboard)
- Error messages
- Editor, view, and dashboard scripts
- Automatic Name/ID control in the Advanced panel
- Label support with the `jetpack/label` block

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
│  │ • Script enqueueing (editor, view, dashboard)               ││
│  │ • Automatic Name/ID control injection                       ││
│  │ • Label block parent registration (with supports.label)     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- WordPress 6.5+ (for Interactivity API support)
- Jetpack Forms plugin active
- Basic knowledge of WordPress block development

### Quick Start

1. **Create a WordPress plugin** to contain your custom field
2. **Register the field** using `register_jetpack_form_field()` on the `init` hook
3. **Create the editor block** in JavaScript using `registerBlockType()`
4. **Create the view script** for frontend interactivity (optional)
5. **Create the dashboard script** for custom value rendering (optional)

### Minimal Example

```php
add_action( 'init', function() {
    if ( ! function_exists( 'register_jetpack_form_field' ) ) {
        return;
    }

    register_jetpack_form_field( 'color', array(
        'supports' => array(
            'label' => true, // Enable jetpack/label as inner block
        ),
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
| `supports` | array | `[]` | Feature support flags (see below). |
| `render_callback` | callable | Auto-generated | Block render callback. |
| `validate_callback` | callable | `null` | Server-side validation callback. |
| `render_field` | callable | `null` | Frontend field HTML render callback. |
| `render_value` | callable | `null` | Value render callback for contexts. |
| `error_messages` | array | `[]` | Error key => message pairs for frontend validation. |
| `editor_script` | string | `''` | URL to the editor script. |
| `editor_script_deps` | array | `['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n']` | Editor script dependencies. |
| `editor_script_ver` | string | `'1.0.0'` | Editor script version. |
| `view_script` | string | `''` | URL to the frontend view script (ES module). |
| `view_script_deps` | array | `['@wordpress/interactivity', 'jp-forms-view']` | View script module dependencies. |
| `view_script_ver` | string | `'1.0.0'` | View script version. |
| `dashboard_script` | string | `''` | URL to the dashboard script. |
| `dashboard_script_deps` | array | `['wp-hooks', 'wp-element', 'jp-forms-dashboard']` | Dashboard script dependencies. |
| `dashboard_script_ver` | string | `'1.0.0'` | Dashboard script version. |

**Supports Flags:**

| Flag | Type | Description |
|------|------|-------------|
| `label` | bool | Enable `jetpack/label` as inner block. Provides pre-rendered `label_html` in render_field data. |

### Callback Signatures

#### validate_callback

Server-side validation that runs when the form is submitted.

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
    if ( $value && ! preg_match( '/^#[0-9A-Fa-f]{6}$/', $value ) ) {
        return sprintf( '%s must be a valid hex color.', $label );
    }
    return true;
}
```

#### render_field

Renders the field HTML on the frontend. When `supports.label` is enabled, you receive pre-rendered label and error HTML.

```php
/**
 * @param array $data Field data with keys:
 *   - id: Field ID
 *   - label: Field label text
 *   - value: Current/default value
 *   - required: Whether field is required
 *   - placeholder: Placeholder text
 *   - class: CSS classes
 *   - field: Contact_Form_Field instance
 *   - wrapper_attrs: Interactivity API attributes for wrapper div
 *   - label_html: Pre-rendered label HTML (when supports.label is true)
 *   - error_html: Pre-rendered error HTML for validation messages
 * @return string HTML to render.
 */
function( $data ) {
    return sprintf(
        '<div class="grunion-field-wrap" %s>
            %s
            <input type="color" id="%s" name="%s" value="%s" data-type="color" />
            %s
        </div>',
        $data['wrapper_attrs'],
        $data['label_html'],
        esc_attr( $data['id'] ),
        esc_attr( $data['id'] ),
        esc_attr( $data['value'] ?? '' ),
        $data['error_html']
    );
}
```

#### render_value

Renders the field value in different contexts (email notifications, dashboard, CSV export, API).

```php
/**
 * @param string         $context The render context: 'email', 'web', 'ajax', 'csv', 'api'.
 * @param mixed          $value   The raw field value.
 * @param Feedback_Field $field   The field instance.
 * @return mixed Rendered value.
 */
function( $context, $value, $field ) {
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

    return $value; // Raw value for csv, api, web, ajax
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

Create a JavaScript file that registers the block in the editor using `registerBlockType()`.

### Key Points

1. **Block name must match** the `block_name` in PHP (defaults to `'jetpack/field-{type}'`)
2. **Use `parent: ['jetpack/contact-form']`** to restrict the field to forms
3. **Include an `id` attribute** - the Name/ID control is automatically injected
4. **Don't auto-generate IDs** - leave `id` empty and the server will generate unique IDs based on the label

### Modern Block with Label Support

When `supports.label` is enabled, use `jetpack/label` as an inner block for the label:

```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, ColorPicker } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ALLOWED_INNER_BLOCKS = [ 'jetpack/label' ];

registerBlockType( 'jetpack/field-color', {
    apiVersion: 3,
    title: __( 'Color Picker', 'my-plugin' ),
    icon: 'color-picker',
    category: 'contact-form',
    parent: [ 'jetpack/contact-form' ],
    attributes: {
        required: {
            type: 'boolean',
            default: false,
        },
        requiredIndicator: {
            type: 'boolean',
            default: true,
        },
        defaultValue: {
            type: 'string',
            default: '',
        },
        width: {
            enum: [ 25, 33, 50, 75, 100, 'auto' ],
            default: 100,
        },
        // Optional custom ID - leave empty for auto-generation
        id: {
            type: 'string',
        },
        shareFieldAttributes: {
            type: 'boolean',
            default: true,
        },
    },
    // Provide context to jetpack/label
    providesContext: {
        'jetpack/field-required': 'required',
        'jetpack/field-share-attributes': 'shareFieldAttributes',
    },
    supports: {
        reusable: false,
        html: false,
        __experimentalExposeControlsToChildren: true,
    },

    edit: function( { attributes, setAttributes } ) {
        const { required, requiredIndicator, defaultValue, width, shareFieldAttributes } = attributes;

        const blockProps = useBlockProps( {
            className: `jetpack-field jetpack-field-color jetpack-field__width-${ width }`,
        } );

        const template = useMemo( () => [
            [ 'jetpack/label', {
                label: __( 'Favorite Color', 'my-plugin' ),
                required,
            } ],
        ], [ required ] );

        const innerBlocksProps = useInnerBlocksProps( {}, {
            allowedBlocks: ALLOWED_INNER_BLOCKS,
            template,
            templateLock: 'all',
        } );

        return (
            <>
                <InspectorControls>
                    <PanelBody title={ __( 'Field Settings', 'my-plugin' ) }>
                        <ToggleControl
                            label={ __( 'Field is required', 'my-plugin' ) }
                            checked={ required }
                            onChange={ ( value ) => setAttributes( { required: value } ) }
                        />
                        { required && (
                            <ToggleControl
                                label={ __( 'Show required text', 'my-plugin' ) }
                                checked={ requiredIndicator }
                                onChange={ ( value ) => setAttributes( { requiredIndicator: value } ) }
                            />
                        ) }
                        <ToggleControl
                            label={ __( 'Sync fields style', 'my-plugin' ) }
                            checked={ shareFieldAttributes }
                            onChange={ ( value ) => setAttributes( { shareFieldAttributes: value } ) }
                        />
                    </PanelBody>
                    <PanelBody title={ __( 'Default Value', 'my-plugin' ) } initialOpen={ false }>
                        <ColorPicker
                            color={ defaultValue }
                            onChange={ ( value ) => setAttributes( { defaultValue: value } ) }
                            enableAlpha={ false }
                        />
                    </PanelBody>
                </InspectorControls>

                <div { ...blockProps }>
                    <div { ...innerBlocksProps } />
                    { /* Your field preview UI here */ }
                </div>
            </>
        );
    },

    save: () => {
        const innerBlocksProps = useInnerBlocksProps.save();
        return <div { ...innerBlocksProps } />;
    },
} );
```

### Automatic Name/ID Control

The Name/ID control is automatically injected into the Advanced panel for all custom fields. Users can:
- Leave it empty (recommended) - a unique ID is auto-generated from the label
- Set a custom ID for specific use cases

You don't need to add any code for this - just include the `id` attribute in your block registration.

## Frontend Interactivity

For dynamic frontend behavior, create a view script that extends the `jetpack/form` Interactivity API store.

### View Script Structure

```javascript
// src/view.js
import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

// Get reference to the form's actions for validation integration
const { actions: formActions } = store( NAMESPACE );

store( NAMESPACE, {
    state: {
        // Register your validator so the form can use it
        validators: {
            color: ( value, isRequired ) => {
                if ( isRequired && ! value ) {
                    return 'is_required';
                }
                if ( value && ! /^#[0-9A-Fa-f]{6}$/i.test( value ) ) {
                    return 'invalid_color';
                }
                return 'yes';
            },
        },

        // Custom state getters for your field
        get getColorValue() {
            const context = getContext();
            return context.fieldValue || '';
        },

        get hasColorValue() {
            const context = getContext();
            return !! context.fieldValue;
        },
    },

    actions: {
        // Handle value changes - update both local state and form registry
        onColorChange( event ) {
            const context = getContext();
            const value = event.target.value;

            // Update local fieldValue for UI reactivity
            context.fieldValue = value;

            // Update form's field registry for validation
            if ( formActions.updateField ) {
                formActions.updateField( context.fieldId, value );
            }
        },

        // Handle blur to show validation errors
        onColorBlur( event ) {
            const context = getContext();
            const value = event.target.value;

            // Pass true to show field errors
            if ( formActions.updateField ) {
                formActions.updateField( context.fieldId, value, true );
            }
        },
    },
} );
```

### Webpack Configuration for View Scripts

View scripts must be built as ES modules:

```javascript
// webpack.config.js
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

// Editor script (standard)
const editorConfig = {
    ...defaultConfig,
    entry: { index: './src/index.js' },
    output: {
        ...defaultConfig.output,
        path: path.resolve( __dirname, 'build' ),
    },
};

// View script (ES module for Interactivity API)
const viewConfig = {
    mode: defaultConfig.mode,
    entry: { view: './src/view.js' },
    output: {
        path: path.resolve( __dirname, 'build' ),
        filename: '[name].js',
        module: true,
        chunkFormat: 'module',
        library: { type: 'module' },
    },
    experiments: { outputModule: true },
    externalsType: 'module',
    externals: {
        '@wordpress/interactivity': '@wordpress/interactivity',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [ '@babel/preset-env' ],
                    },
                },
            },
        ],
    },
};

module.exports = [ editorConfig, viewConfig ];
```

### Using Interactivity Directives in PHP

In your `render_field` callback, use Interactivity API directives:

```php
'render_field' => function( $data ) {
    return sprintf(
        '<div class="grunion-field-wrap" %s>
            %s
            <input
                type="color"
                id="%s"
                name="%s"
                value="%s"
                data-type="color"
                data-wp-bind--value="state.getColorValue"
                data-wp-on--input="actions.onColorChange"
                data-wp-on--change="actions.onColorBlur"
            />
            %s
        </div>',
        $data['wrapper_attrs'], // Contains interactivity context
        $data['label_html'],
        esc_attr( $data['id'] ),
        esc_attr( $data['id'] ),
        esc_attr( $data['value'] ?? '' ),
        $data['error_html']
    );
},
```

The `wrapper_attrs` includes:
- `data-wp-interactive="jetpack/form"`
- `data-wp-context` with field data (fieldId, fieldValue, fieldType, fieldIsRequired, etc.)
- `data-wp-init="callbacks.initializeField"` to register the field
- `data-wp-on--jetpack-form-reset="callbacks.initializeField"` for form reset handling

## Dashboard Integration

The Jetpack Forms dashboard uses React to display form responses. Custom fields can provide custom rendering using WordPress hooks.

### Dashboard Script

```javascript
// src/dashboard.js
( function() {
    const { addFilter } = wp.hooks;
    const { createElement: el } = wp.element;

    // Custom field value rendering
    addFilter(
        'jetpack.forms.dashboard.fieldValue',
        'my-plugin/color-field-value',
        function( element, fieldType, value ) {
            if ( fieldType !== 'color' ) {
                return element;
            }

            if ( ! value ) {
                return '-';
            }

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
    );

    // Custom field icon
    addFilter(
        'jetpack.forms.dashboard.fieldIcon',
        'my-plugin/color-field-icon',
        function( icon, fieldType ) {
            if ( fieldType !== 'color' ) {
                return icon;
            }

            return el(
                'svg',
                { viewBox: '0 0 24 24', width: 24, height: 24 },
                el( 'path', {
                    d: 'M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z',
                    fill: 'currentColor',
                } )
            );
        }
    );
} )();
```

## Complete Example: Color Picker Field

Here's the complete plugin structure for a color picker field:

### Plugin Structure

```
jetpack-forms-color-field/
├── jetpack-forms-color-field.php    # Main plugin file
├── package.json                      # Build configuration
├── webpack.config.js                 # Webpack config for both scripts
├── src/
│   ├── index.js                      # Editor block
│   ├── view.js                       # Frontend interactivity
│   └── dashboard.js                  # Dashboard integration
└── build/
    ├── index.js                      # Compiled editor
    ├── index.asset.php
    ├── view.js                       # Compiled view module
    └── view.asset.php
```

### Main Plugin File

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
        'supports' => array(
            'label' => true,
        ),

        'block_attributes' => array(
            'defaultValue' => array(
                'type'    => 'string',
                'default' => '',
            ),
        ),

        'validate_callback' => function( $value, $label, $field ) {
            if ( empty( $value ) && $field->get_attribute( 'required' ) ) {
                return sprintf( __( '%s is required.', 'my-plugin' ), $label );
            }
            if ( $value && ! preg_match( '/^#[0-9A-Fa-f]{6}$/', $value ) ) {
                return sprintf( __( '%s must be a valid hex color.', 'my-plugin' ), $label );
            }
            return true;
        },

        'render_field' => function( $data ) {
            return sprintf(
                '<div class="grunion-field-wrap" %s>
                    %s
                    <input type="color" id="%s" name="%s" value="%s" data-type="color"
                        data-wp-bind--value="state.getColorValue"
                        data-wp-on--input="actions.onColorChange"
                        data-wp-on--change="actions.onColorBlur"
                    />
                    %s
                </div>',
                $data['wrapper_attrs'],
                $data['label_html'],
                esc_attr( $data['id'] ),
                esc_attr( $data['id'] ),
                esc_attr( $data['value'] ?? '' ),
                $data['error_html']
            );
        },

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

        'error_messages' => array(
            'invalid_color' => __( 'Please enter a valid hex color (e.g., #FF0000).', 'my-plugin' ),
        ),

        'editor_script' => plugin_dir_url( __FILE__ ) . 'build/index.js',
        'view_script'   => plugin_dir_url( __FILE__ ) . 'build/view.js',
        'dashboard_script' => plugin_dir_url( __FILE__ ) . 'src/dashboard.js',
    ) );
} );
```

## Testing Your Custom Fields

### Manual Testing Checklist

1. **Block Registration**
   - [ ] Field appears in block inserter under "Contact Form" category
   - [ ] Field can only be inserted within a form block
   - [ ] Field settings panel shows expected controls
   - [ ] Name/ID control appears in Advanced panel

2. **Frontend Rendering**
   - [ ] Field renders correctly on the frontend
   - [ ] Label displays with proper styles
   - [ ] Default value is pre-filled
   - [ ] Multiple instances work independently

3. **Validation**
   - [ ] Required field shows error when empty
   - [ ] Custom validation (e.g., format) works
   - [ ] Error messages display correctly
   - [ ] Server-side validation catches invalid submissions

4. **Form Submission**
   - [ ] Field value is submitted correctly
   - [ ] Email notifications display field value
   - [ ] Dashboard response viewer shows custom rendering
   - [ ] CSV export includes field value

## Troubleshooting

### Common Issues

**Field doesn't appear in inserter:**
- Ensure `parent: ['jetpack/contact-form']` is set in JavaScript
- Check browser console for JavaScript errors
- Verify Jetpack Forms plugin is active

**Validation errors not showing:**
- Ensure `view_script` is registered
- Check that validators are registered in `state.validators`
- Verify `wrapper_attrs` is included in render output
- Check that `error_html` is included in render output

**Multiple fields share the same value:**
- Don't auto-generate IDs in the editor
- Use `context.fieldValue` (field-level) not `context.fields` (form-level)
- Delete and re-add fields after fixing ID issues

**View script not loading:**
- Check that `view_script` URL is correct
- Verify the script is built as an ES module
- Check browser console for module loading errors

### Debug Tips

```php
// Check if your field is registered
if ( jetpack_form_field_exists( 'color' ) ) {
    $config = get_jetpack_form_field( 'color' );
    error_log( print_r( $config, true ) );
}
```

```javascript
// Debug in view script
console.log( '[MyField] Context:', getContext() );

// Debug dashboard hooks
console.log( 'Registered filters:', wp.hooks.filters );
```
