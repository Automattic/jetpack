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
import wrapPaidBlock from './wrap-paid-block';

const availableBlockTags = {
	paid: _x( 'paid', 'Short label appearing near a block requiring a paid plan', 'jetpack' ),
	beta: __( 'beta', 'jetpack' ),
};

const betaExtensions = extensionList.beta || [];

/**
 * Checks whether the block requires a paid plan or not.
 *
 * @param {string} unavailableReason The reason why block is unavailable
 * @param {Object} details The block details
 * @returns {string|boolean} Either false if the block doesn't require a paid plan, or the actual plan name it requires.
 */
function requiresPaidPlan( unavailableReason, details ) {
	if ( unavailableReason === 'missing_plan' ) {
		return details.required_plan;
	}
	return false;
}

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} name The block's name.
 * @param {object} settings The block's settings.
 * @param {object} childBlocks The block's child blocks.
 * @returns {object|false} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock( name, settings, childBlocks = [] ) {
	const { available, details, unavailableReason } = getJetpackExtensionAvailability( name );

	const requiredPlan = requiresPaidPlan( unavailableReason, details );

	if ( ! available && ! requiredPlan ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ name } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	let blockTitle = settings.title;
	const blockTags = [];

	if ( requiredPlan ) {
		blockTags.push( availableBlockTags.plan );
	}
	if ( betaExtensions.includes( name ) ) {
		blockTags.push( availableBlockTags.beta );
	}

	if ( blockTags.length ) {
		blockTitle = `${ blockTitle } (${ blockTags.join( ', ' ) })`;
	}

	const result = registerBlockType( `jetpack/${ name }`, {
		...settings,
		title: blockTitle,
		edit: requiredPlan ? wrapPaidBlock( { requiredPlan } )( settings.edit ) : settings.edit,
		example: requiredPlan ? undefined : settings.example,
	} );

	if ( requiredPlan ) {
		addFilter(
			'editor.BlockListBlock',
			`jetpack/${ name }-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( `jetpack/${ name }` )
		);
	}

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( `jetpack/${ childBlock.name }`, childBlock.settings )
	);

	return result;
}
