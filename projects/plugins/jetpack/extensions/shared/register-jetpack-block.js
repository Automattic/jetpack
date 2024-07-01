import {
	getJetpackExtensionAvailability,
	withHasWarningIsInteractiveClassNames,
	requiresPaidPlan,
	getBlockIconProp,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

const JETPACK_PREFIX = 'jetpack/';

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

	const requiredPlan = requiresPaidPlan( unavailableReason, details );
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
	const result = registerBlockType(
		typeof nameOrMetadata === 'object' ? nameOrMetadata : prefixedName,
		settings
	);

	if ( requiredPlan ) {
		addFilter(
			'editor.BlockListBlock',
			`${ prefixedName }-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( prefixedName )
		);
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
 * @param {object }metadata - Metadata of the block (content of block.json)
 * @param {object} settings - See registerJetpackBlock.
 * @param {object} childBlocks - See registerJetpackBlock.
 * @param {boolean} prefix - See registerJetpackBlock.
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export function registerJetpackBlockFromMetadata( metadata, settings, childBlocks, prefix ) {
	const mergedSettings = {
		...settings,
		icon: getBlockIconProp( metadata ),
		attributes: metadata.attributes || {},
	};

	return registerJetpackBlock( metadata, mergedSettings, childBlocks, prefix );
}
