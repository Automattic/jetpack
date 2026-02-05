/**
 * Shared components for Jetpack Forms field extensibility.
 *
 * This module exports the reusable components that custom field implementations can use
 * to maintain consistent styling and behavior with built-in Jetpack Forms fields.
 */

// Core field components
export { default as JetpackField } from '../blocks/shared/components/jetpack-field.js';
export { default as JetpackFieldControls } from '../blocks/shared/components/jetpack-field-controls.js';
export { default as JetpackFieldWidth } from '../blocks/shared/components/jetpack-field-width.js';
export { default as JetpackFieldId } from '../blocks/shared/components/jetpack-field-id-control.js';
export { default as ToolbarRequiredGroup } from '../blocks/shared/components/toolbar-required-group.js';

// Default settings for field blocks
export { default as defaultSettings } from '../blocks/shared/settings/index.js';

// Hooks for field behavior
export { default as useFormWrapper } from '../blocks/shared/hooks/use-form-wrapper.js';
export { default as useFieldSelected } from '../blocks/shared/hooks/use-field-selected.js';
export { default as useJetpackFieldStyles } from '../blocks/shared/hooks/use-jetpack-field-styles.js';
export { default as useFormStyle } from '../blocks/shared/hooks/use-form-style.js';
export { default as useSyncRequiredIndicator } from '../blocks/shared/hooks/use-sync-required-indicator.js';
export { default as useParentFormClientId } from '../blocks/shared/hooks/use-parent-form-client-id.js';

// Utility functions
export { generateUniqueFormFieldId } from '../blocks/shared/util/generate-unique-id.js';
export { FORM_BLOCK_NAME, ALLOWED_INNER_BLOCKS } from '../blocks/shared/util/constants.js';
