# Jetpack Form Editor

This directory contains the custom editor implementation for the `jetpack-form` custom post type. It provides specialized behavior for editing Jetpack Forms in the WordPress block editor.

## Overview

The form editor ensures that the `jetpack/contact-form` block behaves as a container for form fields, preventing it from being selected, moved, or deleted while allowing users to work with the inner field blocks. It also provides form settings panels in the Document Settings sidebar for easy configuration.

## Files

### `form-document-settings.tsx`

**Component:** React component that renders form configuration panels in the Document Settings sidebar.

This component provides a user-friendly interface for configuring form settings when editing a `jetpack_form` post type. It displays all form configuration options that would normally appear in the block inspector, but in the Document Settings sidebar for better accessibility.

#### Features

- **Action after submit** - Configure confirmation messages or redirect URLs
- **Form notifications** - Set up email notifications and recipients
- **Integrations** - Configure third-party integrations (if enabled)
- **Webhooks** - Set up webhook endpoints (if enabled)
- **Responses storage** - Configure where and how form responses are stored

#### Implementation Details

The component:
- Only renders when editing a `jetpack_form` post type
- Locates the contact-form block in the editor
- Uses `PluginDocumentSettingPanel` to add panels to the sidebar
- Updates block attributes using `updateBlockAttributes` dispatch action
- Separates clientId lookup from attribute retrieval to prevent re-render issues

## Components

### PHP Class: `Form_Editor`

**File:** `class-form-editor.php`

The `Form_Editor` class initializes the custom editing experience for jetpack-form posts.

#### Hooks

- **`allowed_block_types_all`** - Restricts which blocks can be inserted in the jetpack-form editor
- **`block_editor_settings_all`** - Modifies block editor settings for jetpack-form posts
- **`admin_enqueue_scripts`** - Enqueues the editor JavaScript

#### Methods

##### `allowed_blocks_for_jetpack_form( $allowed_block_types, $editor_context )`

Restricts the block inserter to only show form-related blocks:
- Field blocks (name, email, textarea, checkbox, etc.)
- Supporting blocks (button, label, input, etc.)
- Multistep form blocks
- Select core blocks (paragraph, heading, image, etc.)

The `jetpack/contact-form` block itself is excluded from the inserter since it's automatically created as the root container.

##### `block_editor_settings_all( $settings, $editor_context )`

Configures block editor settings:
- Sets `canLockBlocks` to `false` to prevent manual block locking UI

##### `enqueue_admin_scripts()`

Enqueues the form editor JavaScript with dependencies:
- `wp-data` - WordPress data stores
- `wp-hooks` - WordPress filter/action hooks
- `wp-polyfill` - JavaScript polyfills

### JavaScript: Form Editor Script

**File:** `index.ts`

The JavaScript handles the client-side behavior for the form editor and registers the Form Document Settings plugin.

#### Key Functions

##### `lockFormBlock()`

Locks the root `jetpack/contact-form` block to prevent selection, movement, and removal:

1. **Finds the form block** - Locates the jetpack/contact-form block at root level
2. **Applies lock attributes** - Sets `lock.remove` and `lock.move` to true
3. **Clears selection** - Deselects the form block if currently selected
4. **Injects CSS** - Hides the form block's selection outline, toolbar, and controls

##### `enforceBlockNesting()`

Ensures blocks are only added inside the form block:

1. **Monitors root level** - Checks for blocks added outside the form
2. **Auto-moves blocks** - Moves any orphaned blocks inside the form block
3. **Maintains structure** - Keeps the form block as the sole root element

#### Subscriptions

The script uses WordPress data subscriptions to monitor editor state:

- **Main subscription** - Runs on every editor change to lock the form block and enforce nesting
- **Post type check** - Only activates when editing `jetpack_form` posts

#### Plugin Registration

The script registers the `jetpack-form-document-settings` plugin which adds form configuration panels to the Document Settings sidebar. This provides an intuitive interface for managing form settings without having to select the form block.

#### CSS Injection

The script dynamically adds CSS rules to:
- Hide the form block's selection outline
- Remove the form block's toolbar and contextual controls
- Prevent pointer events on the form wrapper
- Re-enable pointer events for inner blocks
- Hide root-level block appenders

## Build Process

The form editor JavaScript is built using webpack:

```bash
# Build once
pnpm run build:form-editor

# Watch mode
pnpm run watch
```

**Build configuration:** `tools/webpack.config.form-editor.js`

**Output:** `dist/form-editor/jetpack-forms-editor.js`

## User Experience

When editing a jetpack-form post:

1. Users see the form fields directly, without seeing the container form block
2. The form block cannot be selected, moved, or deleted
3. Only form-related blocks appear in the inserter
4. New blocks are automatically placed inside the form
5. Form settings are accessible in the Document Settings sidebar
6. The editing experience focuses on form content and configuration, not structure

## Technical Notes

- The form block is created automatically when a new jetpack-form post is created
- The lock is applied via block attributes, not WordPress template locking
- CSS is used to hide UI elements rather than removing them from the DOM
- The subscription pattern ensures the lock is maintained even after undo/redo operations
