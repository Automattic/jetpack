/**
 * External dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './style.scss';

// Injecting the `has-warning` class into the block wrapper component gives us
// the right kind of borders around the block, both visually and conceptually.
// However, it also adds styling to prevent user interaction with that block.
// We thus add a new `is-interactive` class to be able to override that behavior.
// We add the `is-premium` class to indicate that the block requires a paid plan.
export default ( name, classNames ) =>
	createHigherOrderComponent(
		BlockListBlock => props => (
			<BlockListBlock
				{ ...props }
				className={ props.name === name ? classNames : props.className }
			/>
		),
		'withCustomClassNames'
	);
