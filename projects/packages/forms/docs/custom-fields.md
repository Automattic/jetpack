# Custom Form Fields Developer Guide

This guide provides templates for creating custom Jetpack Forms fields. Use this as a reference to create new field types.

---

## LLM Prompt Template

Use this prompt to have an AI assistant create a complete custom field. Copy, customize the bracketed sections, and paste to your AI assistant.

````markdown
Create a custom Jetpack Forms field plugin with the following specifications:

## Field Details
- **Field type identifier**: [e.g., "rating", "signature", "date-range", "file-upload"]
- **Display name**: [e.g., "Star Rating", "Signature Pad", "Date Range Picker"]
- **Default label**: [e.g., "Rate your experience", "Sign here", "Select date range"]
- **Description**: [Describe what the field does and how users interact with it]

## Field Behavior
- **Value format**: [What data format is stored/submitted? e.g., "number 1-5", "base64 image", "ISO date string", "JSON object {start, end}"]
- **Required validation**: [How should empty/missing values be handled?]
- **Custom validation rules**: [e.g., "must be between 1 and 5", "signature must have at least 10 points", "end date must be after start date"]

## Editor Experience
- **Preview**: [How should the field appear in the block editor? Interactive or static preview?]
- **Settings panel options**: [What settings should appear in the sidebar? e.g., "min/max values", "allowed file types", "date format"]
- **Default values**: [Should users be able to set a default value? How?]

## Frontend Experience
- **Interaction model**: [How do users interact? Click, drag, type, select, etc.]
- **Accessibility requirements**: [Keyboard navigation, screen reader support, ARIA labels]
- **Mobile considerations**: [Touch interactions, responsive layout]

## Output Rendering
- **Email display**: [How should the value appear in notification emails?]
- **Dashboard display**: [How should it render in the form responses dashboard?]
- **CSV export**: [What format for CSV export?]

## Technical Requirements
Follow these Jetpack Forms conventions:

1. **Use WordPress Interactivity API** for all frontend JavaScript reactivity
   - Import from `@wordpress/interactivity`: `store`, `getContext`
   - Use `data-wp-*` attributes for bindings
   - Store field state in the form's shared context

2. **Use WordPress core components** in the editor where possible
   - `@wordpress/components`: TextControl, RangeControl, ToggleControl, ColorPicker, etc.
   - `@wordpress/block-editor`: useBlockProps, InspectorControls, etc.

3. **File structure** (all files required):
   ```
   jetpack-forms-{type}-field/
   ├── jetpack-forms-{type}-field.php   # Registration + render_field + validate
   ├── package.json                      # Build dependencies
   ├── webpack.config.js                 # Webpack config (use provided template)
   └── src/
       ├── index.js          # Block registration + editor UI
       ├── editor.scss       # Editor-only styles
       ├── view.js           # Interactivity API store extensions
       ├── view.scss         # Frontend styles
       └── dashboard.js      # Dashboard column rendering (optional)
   ```

4. **PHP registration** must include:
   - `'plugin_file' => __FILE__` for auto asset resolution
   - `'supports' => array('label' => true)` for label block support
   - `validate_callback` for server-side validation
   - `render_field` returning HTML with `$data['wrapper_attrs']`, `$data['label_html']`, `$data['error_html']`
   - `render_value` for email/CSV/dashboard output
   - `error_messages` array for frontend validation keys

5. **Hidden input pattern**: Always include a hidden input with:
   - `id` and `name` from `$data['id']`
   - `data-type="{field_type}"` for validation routing
   - `data-wp-bind--value` for Interactivity API binding

6. **Validation flow**:
   - Frontend: Register validator in `view.js` via `state.validators.{type}`
   - Return error key string (maps to `error_messages`) or `'yes'` for valid
   - Backend: `validate_callback` returns `true` or error message string

## Edge Cases to Handle
- [ ] Empty/null values (both required and optional fields)
- [ ] Invalid data format submitted (malicious or corrupted input)
- [ ] Very long values (truncation, max length)
- [ ] Special characters and XSS prevention (proper escaping)
- [ ] Form submission without JavaScript (graceful degradation)
- [ ] Multiple instances of this field in one form (unique IDs)
- [ ] Field inside repeater/nested form structures (if applicable)

## Reference
Read the full API documentation and templates in this file, and reference these working examples:
- NPS field (0-10 scale selector): `tools/docker/wordpress/wp-content/plugins/jetpack-forms-nps-field/`
- Color field (color picker): `tools/docker/wordpress/wp-content/plugins/jetpack-forms-color-field/`

Generate all files with complete, production-ready code. Use the templates from the documentation as the starting point.
````

### Example Prompts

**Star Rating Field:**
> Create a custom Jetpack Forms field: A 5-star rating field where users click stars to rate. Store as integer 1-5. Show filled/empty stars in editor preview. In emails, show "★★★☆☆ (3/5)". Allow configuring max stars (3-10) in settings panel.

**Signature Field:**
> Create a custom Jetpack Forms field: A signature pad where users draw their signature with mouse/touch. Store as base64 PNG. Show canvas in editor with placeholder text. Validate that signature has content (not empty canvas). In emails, show inline image. Clear button to reset.

**Date Range Picker:**
> Create a custom Jetpack Forms field: Two date inputs for start/end date. Store as JSON {start: "YYYY-MM-DD", end: "YYYY-MM-DD"}. Validate end >= start. Settings for min/max allowed dates. In emails, show "Jan 1, 2025 - Jan 15, 2025" formatted.

---

## Quick Start Template

Use these templates to create a new field. Replace `{FIELD_TYPE}` with your field name (e.g., `rating`, `signature`).

### File Structure

```
jetpack-forms-{FIELD_TYPE}-field/
├── jetpack-forms-{FIELD_TYPE}-field.php   # Main plugin file
├── package.json                            # Build configuration
├── webpack.config.js                       # Webpack config
└── src/
    ├── index.js                            # Editor block
    ├── editor.scss                         # Editor styles
    ├── view.js                             # Frontend interactivity
    ├── view.scss                           # Frontend styles
    └── dashboard.js                        # Dashboard integration
```

---

## File Templates

### 1. Main Plugin File (`jetpack-forms-{FIELD_TYPE}-field.php`)

```php
<?php
/**
 * Plugin Name: Jetpack Forms {FIELD_TITLE} Field
 * Description: Adds a {FIELD_TITLE} field to Jetpack Forms.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'init', function() {
    if ( ! function_exists( 'register_jetpack_form_field' ) ) {
        return;
    }

    register_jetpack_form_field( '{FIELD_TYPE}', array(
        // Pass plugin file - assets are auto-resolved from conventional paths.
        'plugin_file' => __FILE__,

        // Enable label support (provides label_html, error_html, wrapper_attrs in render_field).
        'supports' => array(
            'label' => true,
        ),

        // Field-specific block attributes (in addition to standard: required, width, id, etc.).
        'block_attributes' => array(
            // Add custom attributes here, e.g.:
            // 'minValue' => array( 'type' => 'number', 'default' => 1 ),
            // 'maxValue' => array( 'type' => 'number', 'default' => 5 ),
        ),

        // Server-side validation.
        'validate_callback' => function( $value, $label, $field ) {
            // Required check.
            if ( $field->get_attribute( 'required' ) && ( $value === '' || $value === null ) ) {
                return sprintf( __( '%s is required.', 'jetpack-forms-{FIELD_TYPE}-field' ), $label );
            }

            // Add field-specific validation here.
            // Return error message string if invalid, true if valid.

            return true;
        },

        // Frontend HTML rendering.
        'render_field' => function( $data ) {
            $id       = esc_attr( $data['id'] );
            $value    = esc_attr( $data['value'] ?? '' );
            $required = $data['required'] ? 'required aria-required="true"' : '';

            return sprintf(
                '<div class="grunion-field-wrap grunion-field-{FIELD_TYPE}-wrap" %s>
                    %s
                    <div class="{FIELD_TYPE}-field">
                        <!-- Your field HTML here -->
                        <input type="hidden" id="%s" name="%s" value="%s" data-type="{FIELD_TYPE}" %s />
                    </div>
                    %s
                </div>',
                $data['wrapper_attrs'],  // Required: Interactivity API attributes
                $data['label_html'],     // Required: Pre-rendered label
                $id,
                $id,
                $value,
                $required,
                $data['error_html']      // Required: Validation error container
            );
        },

        // Value rendering for emails, CSV, dashboard, etc.
        'render_value' => function( $context, $value, $field ) {
            if ( $value === '' || $value === null ) {
                return '';
            }

            // $context is: 'email', 'web', 'ajax', 'csv', 'api'
            switch ( $context ) {
                case 'email':
                    // Rich HTML for emails.
                    return esc_html( $value );
                default:
                    // Plain value for other contexts.
                    return $value;
            }
        },

        // Frontend validation error messages (keys used in view.js validator).
        'error_messages' => array(
            '{FIELD_TYPE}_is_required' => __( 'Please select a value.', 'jetpack-forms-{FIELD_TYPE}-field' ),
            '{FIELD_TYPE}_invalid'     => __( 'Please enter a valid value.', 'jetpack-forms-{FIELD_TYPE}-field' ),
        ),

        // Assets are auto-resolved from plugin_file when files exist at conventional paths.
        // To disable an asset, set it to false. To override, set the full URL.
    ) );
} );
```

---

### 2. Editor Block (`src/index.js`)

```javascript
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, useInnerBlocksProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';

const ALLOWED_INNER_BLOCKS = [ 'jetpack/label' ];

// Field icon SVG.
const FieldIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
);

registerBlockType( 'jetpack/field-{FIELD_TYPE}', {
    apiVersion: 3,
    title: __( '{FIELD_TITLE}', 'jetpack-forms-{FIELD_TYPE}-field' ),
    icon: FieldIcon,
    category: 'contact-form',
    parent: [ 'jetpack/contact-form' ],

    attributes: {
        // Standard attributes (always include these).
        required: { type: 'boolean', default: false },
        requiredIndicator: { type: 'boolean', default: true },
        width: { enum: [ 25, 33, 50, 75, 100, 'auto' ], default: 100 },
        id: { type: 'string' },
        shareFieldAttributes: { type: 'boolean', default: true },

        // Field-specific attributes.
        // defaultValue: { type: 'string', default: '' },
    },

    // Context for jetpack/label inner block.
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
        const { required, requiredIndicator, width, shareFieldAttributes } = attributes;

        const blockProps = useBlockProps( {
            className: `jetpack-field jetpack-field-{FIELD_TYPE} jetpack-field__width-${ width }`,
        } );

        // Template for the label inner block.
        const template = useMemo( () => [
            [ 'jetpack/label', {
                label: __( '{DEFAULT_LABEL}', 'jetpack-forms-{FIELD_TYPE}-field' ),
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
                    <PanelBody title={ __( 'Field Settings', 'jetpack-forms-{FIELD_TYPE}-field' ) }>
                        <ToggleControl
                            label={ __( 'Field is required', 'jetpack-forms-{FIELD_TYPE}-field' ) }
                            checked={ required }
                            onChange={ ( value ) => setAttributes( { required: value } ) }
                        />
                        { required && (
                            <ToggleControl
                                label={ __( 'Show required text', 'jetpack-forms-{FIELD_TYPE}-field' ) }
                                checked={ requiredIndicator }
                                onChange={ ( value ) => setAttributes( { requiredIndicator: value } ) }
                            />
                        ) }
                        <ToggleControl
                            label={ __( 'Sync fields style', 'jetpack-forms-{FIELD_TYPE}-field' ) }
                            checked={ shareFieldAttributes }
                            onChange={ ( value ) => setAttributes( { shareFieldAttributes: value } ) }
                        />
                    </PanelBody>
                    {/* Add field-specific settings panels here */}
                </InspectorControls>

                <div { ...blockProps }>
                    <div { ...innerBlocksProps } />
                    <div className="{FIELD_TYPE}-field">
                        {/* Your field preview UI here */}
                    </div>
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

---

### 3. Editor Styles (`src/editor.scss`)

```scss
.jetpack-field-{FIELD_TYPE} {
    .{FIELD_TYPE}-field {
        margin-top: 8px;
        // Add your editor styles here.
    }
}
```

---

### 4. Frontend Interactivity (`src/view.js`)

```javascript
import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

// Extend the form store with field-specific functionality.
store( NAMESPACE, {
    state: {
        // Register validator for this field type.
        validators: {
            {FIELD_TYPE}: ( value, isRequired ) => {
                if ( isRequired && ( value === '' || value === null || value === undefined ) ) {
                    return '{FIELD_TYPE}_is_required';
                }
                // Add field-specific validation.
                return 'yes';
            },
        },
    },

    actions: {
        // Handle field value changes.
        on{FIELD_TYPE_PASCAL}Change( event ) {
            const context = getContext();
            const value = event.target.value;

            // Update context for UI reactivity.
            context.fieldValue = value;

            // Find and update the hidden input.
            const wrapper = event.target.closest( '.grunion-field-{FIELD_TYPE}-wrap' );
            if ( wrapper ) {
                const hiddenInput = wrapper.querySelector( 'input[type="hidden"]' );
                if ( hiddenInput ) {
                    hiddenInput.value = value;
                    hiddenInput.dispatchEvent( new Event( 'change', { bubbles: true } ) );
                }
            }
        },
    },
} );
```

---

### 5. Frontend Styles (`src/view.scss`)

```scss
.grunion-field-{FIELD_TYPE}-wrap {
    .{FIELD_TYPE}-field {
        margin-top: 8px;
        // Add your frontend styles here.
    }
}
```

---

### 6. Dashboard Integration (`src/dashboard.js`)

```javascript
( function() {
    const { addFilter } = wp.hooks;
    const { createElement: el } = wp.element;

    // Custom value rendering in the dashboard.
    addFilter(
        'jetpack.forms.dashboard.fieldValue',
        'jetpack-forms-{FIELD_TYPE}-field/field-value',
        function( element, fieldType, value ) {
            if ( fieldType !== '{FIELD_TYPE}' ) {
                return element;
            }

            if ( value === '' || value === null || value === undefined ) {
                return '-';
            }

            // Return custom rendering.
            return el( 'span', {}, value );
        }
    );

    // Custom field icon.
    addFilter(
        'jetpack.forms.dashboard.fieldIcon',
        'jetpack-forms-{FIELD_TYPE}-field/field-icon',
        function( icon, fieldType ) {
            if ( fieldType !== '{FIELD_TYPE}' ) {
                return icon;
            }

            return el( 'svg', { viewBox: '0 0 24 24', width: 24, height: 24 },
                el( 'path', { d: 'M12 2L2 7l10 5 10-5-10-5z', fill: 'currentColor' } )
            );
        }
    );
} )();
```

---

### 7. Webpack Configuration (`webpack.config.js`)

```javascript
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const path = require( 'path' );

// Remove CleanWebpackPlugin to avoid conflicts.
const defaultPlugins = ( defaultConfig.plugins || [] ).filter(
    plugin => plugin.constructor.name !== 'CleanWebpackPlugin'
);

// Editor config: builds index.js and SCSS files.
const editorConfig = {
    ...defaultConfig,
    entry: {
        index: './src/index.js',
        'editor-style': './src/editor.scss',
        'view-style': './src/view.scss',
    },
    output: {
        ...defaultConfig.output,
        path: path.resolve( __dirname, 'build' ),
        clean: false,
    },
    plugins: defaultPlugins,
};

// View config: ES module for Interactivity API.
const viewConfig = {
    mode: defaultConfig.mode,
    devtool: defaultConfig.devtool,
    entry: { view: './src/view.js' },
    output: {
        path: path.resolve( __dirname, 'build' ),
        filename: '[name].js',
        module: true,
        chunkFormat: 'module',
        library: { type: 'module' },
        clean: false,
    },
    experiments: { outputModule: true },
    externalsType: 'module',
    externals: { '@wordpress/interactivity': '@wordpress/interactivity' },
    resolve: { extensions: [ '.js' ] },
    module: {
        rules: [ {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: { presets: [ '@babel/preset-env' ] },
            },
        } ],
    },
    plugins: [
        new DependencyExtractionWebpackPlugin( { outputFormat: 'php' } ),
    ],
};

module.exports = [ editorConfig, viewConfig ];
```

---

### 8. Package Configuration (`package.json`)

```json
{
    "name": "jetpack-forms-{FIELD_TYPE}-field",
    "version": "1.0.0",
    "description": "Adds a {FIELD_TITLE} field to Jetpack Forms",
    "scripts": {
        "build": "webpack --mode=production",
        "start": "webpack --mode=development --watch"
    },
    "devDependencies": {
        "@babel/core": "^7.24.0",
        "@babel/preset-env": "^7.24.0",
        "@wordpress/dependency-extraction-webpack-plugin": "^5.0.0",
        "@wordpress/scripts": "^28.0.0",
        "babel-loader": "^9.1.3",
        "webpack": "^5.90.0",
        "webpack-cli": "^5.1.4"
    }
}
```

---

## API Reference

### register_jetpack_form_field()

```php
register_jetpack_form_field( string $field_type, array $args );
```

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `$field_type` | string | Yes | Unique identifier (e.g., `'rating'`, `'signature'`). |
| `$args` | array | Yes | Configuration (see below). |

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `plugin_file` | string | `''` | **Recommended.** Path to plugin's main file (`__FILE__`). Auto-resolves all assets. |
| `supports` | array | `[]` | Feature flags. Set `'label' => true` to enable label support. |
| `block_attributes` | array | `[]` | Custom block attributes. |
| `validate_callback` | callable | `null` | Server-side validation. Return `true` or error string. |
| `render_field` | callable | `null` | Frontend HTML. Receives `$data` array. |
| `render_value` | callable | `null` | Value display for email/CSV/dashboard. |
| `error_messages` | array | `[]` | Error key => message pairs. |

#### Asset Options (auto-resolved when `plugin_file` is set)

When `plugin_file` is provided, assets are auto-resolved from conventional paths if the files exist:

| Asset | Conventional Path | Override Option |
|-------|------------------|-----------------|
| Editor script | `build/index.js` | `editor_script` |
| Editor style | `build/editor-style.css` | `editor_style` |
| View script | `build/view.js` | `view_script` |
| View style | `build/view-style.css` | `view_style` |
| Dashboard script | `src/dashboard.js` | `dashboard_script` |

Dependencies and version are loaded from `build/index.asset.php` (generated by `@wordpress/scripts`).

**To disable an asset:** Set it to `false` (e.g., `'dashboard_script' => false`).

**To override an asset:** Set the full URL (e.g., `'editor_script' => plugin_dir_url( __FILE__ ) . 'custom/path.js'`).

<details>
<summary>Manual asset configuration (if not using plugin_file)</summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `editor_script` | string | `''` | Editor JS URL. |
| `editor_script_deps` | array | `[...]` | Editor JS dependencies. |
| `editor_script_ver` | string | `'1.0.0'` | Editor JS version. |
| `editor_style` | string | `''` | Editor CSS URL. |
| `editor_style_deps` | array | `[]` | Editor CSS dependencies. |
| `editor_style_ver` | string | `'1.0.0'` | Editor CSS version. |
| `view_script` | string | `''` | Frontend JS URL (ES module). |
| `view_script_deps` | array | `[...]` | Frontend JS dependencies. |
| `view_script_ver` | string | `'1.0.0'` | Frontend JS version. |
| `view_style` | string | `''` | Frontend CSS URL. |
| `view_style_deps` | array | `[]` | Frontend CSS dependencies. |
| `view_style_ver` | string | `'1.0.0'` | Frontend CSS version. |
| `dashboard_script` | string | `''` | Dashboard JS URL. |
| `dashboard_script_deps` | array | `[...]` | Dashboard JS dependencies. |
| `dashboard_script_ver` | string | `'1.0.0'` | Dashboard JS version. |
| `dashboard_style` | string | `''` | Dashboard CSS URL. |
| `dashboard_style_deps` | array | `[]` | Dashboard CSS dependencies. |
| `dashboard_style_ver` | string | `'1.0.0'` | Dashboard CSS version. |

</details>

#### render_field Data Array

| Key | Type | Description |
|-----|------|-------------|
| `id` | string | Field ID (use for `id` and `name` attributes). |
| `label` | string | Label text. |
| `value` | string | Current/default value. |
| `required` | bool | Whether field is required. |
| `class` | string | CSS classes. |
| `wrapper_attrs` | string | **Required.** Interactivity API attributes for wrapper div. |
| `label_html` | string | **Required.** Pre-rendered label (when `supports.label` is true). |
| `error_html` | string | **Required.** Pre-rendered error container. |
| `field` | object | Field instance (access with `$data['field']->get_attribute('x')`). |

---

## Checklist for New Fields

- [ ] Create plugin directory with all files from templates above
- [ ] Replace all `{FIELD_TYPE}` placeholders with your field type (lowercase, e.g., `rating`)
- [ ] Replace all `{FIELD_TITLE}` placeholders with display name (e.g., `Star Rating`)
- [ ] Replace all `{FIELD_TYPE_PASCAL}` placeholders with PascalCase (e.g., `Rating`)
- [ ] Replace all `{DEFAULT_LABEL}` placeholders with default label text
- [ ] Add field-specific attributes to `block_attributes` in PHP and `attributes` in JS
- [ ] Implement `validate_callback` with field-specific validation
- [ ] Implement `render_field` with field HTML (include `wrapper_attrs`, `label_html`, `error_html`)
- [ ] Implement `render_value` for email/CSV display
- [ ] Add error messages to `error_messages` array
- [ ] Implement editor preview UI in `src/index.js`
- [ ] Implement frontend interactivity in `src/view.js`
- [ ] Style editor in `src/editor.scss`
- [ ] Style frontend in `src/view.scss`
- [ ] Implement dashboard rendering in `src/dashboard.js`
- [ ] Run `npm install && npm run build`
- [ ] Test: field appears in editor, saves correctly, validates, displays in dashboard

---

## Examples

See working examples in the monorepo:
- `tools/docker/wordpress/wp-content/plugins/jetpack-forms-nps-field/` - NPS (0-10 scale) field
- `tools/docker/wordpress/wp-content/plugins/jetpack-forms-color-field/` - Color picker field
