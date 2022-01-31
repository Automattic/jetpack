/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import extensionList from '../index.json';
import getJetpackExtensionAvailability from './get-jetpack-extension-availability';
import withHasWarningIsInteractiveClassNames from './with-has-warning-is-interactive-class-names';

const availableBlockTags = {
	paid: _x( 'paid', 'Short label appearing near a block requiring a paid plan', 'jetpack' ),
	beta: __( 'beta', 'jetpack' ),
};

const betaExtensions = extensionList.beta || [];

/**
 * Checks whether the block requires a paid plan or not.
 *
 * @param {string} unavailableReason - The reason why block is unavailable
 * @param {object} details - The block details
 * @returns {string|boolean} Either false if the block doesn't require a paid plan, or the actual plan name it requires.
 */
export function requiresPaidPlan( unavailableReason, details ) {
	if ( unavailableReason === 'missing_plan' ) {
		return details.required_plan;
	}
	return false;
}

/**
 * Builds an array of tags associated with this block, such as ["paid", "beta"].
 *
 * @param {string} name - The block's name.
 * @returns {Array} Array of tags associated with this block
 */
function buildBlockTags( name ) {
	const blockTags = [];

	if ( betaExtensions.includes( name ) ) {
		blockTags.push( availableBlockTags.beta );
	}

	return blockTags;
}

/**
 * Takes a block title string and optionally appends comma separated block tags in parentheses.
 *
 * @param {string} blockTitle - The block's title
 * @param {Array} blockTags - The tags you want appended in parentheses (tags, show, here)
 * @returns {string} Block title
 */
function buildBlockTitle( blockTitle, blockTags = [] ) {
	if ( ! blockTags.length ) {
		return blockTitle;
	}
	return `${ blockTitle } (${ blockTags.join( ', ' ) })`;
}

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} name - The block's name.
 * @param {object} settings - The block's settings.
 * @param {object} childBlocks - The block's child blocks.
 * @param {boolean} prefix - Should this block be prefixed with `jetpack/`?
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock( name, settings, childBlocks = [], prefix = true ) {
	const { available, details, unavailableReason } = getJetpackExtensionAvailability( name );

	const requiredPlan = requiresPaidPlan( unavailableReason, details );
	const jpPrefix = prefix ? 'jetpack/' : '';

	if ( ! available && ! requiredPlan ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ name } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	const result = registerBlockType( jpPrefix + name, {
		...settings,
		title: buildBlockTitle( settings.title, buildBlockTags( name, requiredPlan ) ),
	} );

	if ( requiredPlan ) {
		addFilter(
			'editor.BlockListBlock',
			`${ jpPrefix + name }-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( jpPrefix + name )
		);
	}

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( jpPrefix + childBlock.name, childBlock.settings )
	);

	return result;
}
