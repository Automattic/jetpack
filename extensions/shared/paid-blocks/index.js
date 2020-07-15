/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import jetpackPaidBlockEdit from './paid-block-edit';

// Extend all blocks that required a paid plan.
addFilter( 'editor.BlockEdit', 'jetpack/paid-block-edit', jetpackPaidBlockEdit );
