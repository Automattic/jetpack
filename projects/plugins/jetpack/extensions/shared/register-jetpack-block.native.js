import {
	getJetpackExtensionAvailability,
	getBlockIconProp,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import extensionList from '../index.json';

const JETPACK_PREFIX = 'jetpack/';

const betaExtensions = extensionList.beta || [];

function requiresPlan( unavailableReason, details ) {
	if ( unavailableReason === 'missing_plan' ) {
		return details.required_plan;
	}
	return false;
}

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} nameOrMetadata - The block's name or metadata object. Jetpack blocks must be
 * registered with a name prefixed with `jetpack/`. This function accepts an unprefixed name too,
 * though (it'd handle both `business-hours` and `jetpack/business-hours` similarly, for instance).
 * @param {object} settings - The block's settings.
 * @param {object} childBlocks - The block's child blocks.
 * @param {boolean} prefix - Should this block be prefixed with `jetpack/`?
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock(
	nameOrMetadata,
	settings,
	childBlocks = [],
	prefix = true
) {
	const name = typeof nameOrMetadata === 'string' ? nameOrMetadata : nameOrMetadata.name;
	const isNamePrefixed = name.startsWith( JETPACK_PREFIX );
	const rawName = isNamePrefixed ? name.slice( JETPACK_PREFIX.length ) : name;

	const { available, details, unavailableReason } = getJetpackExtensionAvailability( rawName );

	const requiredPlan = requiresPlan( unavailableReason, details );
	const jpPrefix = prefix || isNamePrefixed ? JETPACK_PREFIX : '';

	if ( ! available && ! requiredPlan ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ rawName } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	const prefixedName = jpPrefix + rawName;
	const result = registerBlockType( nameOrMetadata === 'object' ? nameOrMetadata : prefixedName, {
		...settings,
		title: betaExtensions.includes( prefixedName ) ? `${ settings.title } (beta)` : settings.title,
		edit: settings.edit,
		example: requiredPlan ? undefined : settings.example,
	} );

	if ( 'production' !== process.env.NODE_ENV ) {
		// eslint-disable-next-line no-console
		console.log( `Block ${ prefixedName } registered.` );
	}

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( jpPrefix + childBlock.name, childBlock.settings )
	);

	return result;
}

/**
 * Wrapper around registerJetpackBlock to register a block by specifying its metadata.
 *
 * @param {object} metadata - Metadata of the block (content of block.json)
 * @param {object} settings - See registerJetpackBlock.
 * @param {object} childBlocks - See registerJetpackBlock.
 * @param {boolean} prefix - See registerJetpackBlock.
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export function registerJetpackBlockFromMetadata( metadata, settings, childBlocks, prefix ) {
	const mergedSettings = {
		...settings,
		icon: getBlockIconProp( metadata ),
		title: metadata.title,
		attributes: metadata.attributes || {},
	};
	const { variations } = metadata;

	if ( Array.isArray( variations ) && variations.length > 0 ) {
		mergedSettings.variations = variations.map( variation => {
			return {
				...variation,
				icon: getBlockIconProp( variation ),
			};
		} );
	}

	return registerJetpackBlock( metadata, mergedSettings, childBlocks, prefix );
}
