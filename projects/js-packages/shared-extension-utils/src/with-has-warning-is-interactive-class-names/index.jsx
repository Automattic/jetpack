/* eslint-disable react/react-in-jsx-scope */

import { createHigherOrderComponent } from '@wordpress/compose';

import './style.scss';

// Injecting the `has-warning` class into the block wrapper component gives us
// the right kind of borders around the block, both visually and conceptually.
// However, it also adds styling to prevent user interaction with that block.
// We thus add a new `is-interactive` class to be able to override that behavior.
export default name =>
	createHigherOrderComponent(
		BlockListBlock => props => (
			<BlockListBlock
				{ ...props }
				className={ props.name === name ? 'has-warning is-interactive' : props.className }
			/>
		),
		'withHasWarningIsInteractiveClassNames'
	);
