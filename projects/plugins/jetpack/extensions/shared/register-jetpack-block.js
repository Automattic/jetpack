import {
	getJetpackExtensionAvailability,
	withHasWarningIsInteractiveClassNames,
	requiresPaidPlan,
	getBlockIconProp,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { _x } from '@wordpress/i18n';

const JETPACK_PREFIX = 'jetpack/';
const LOCALIZED_BLOCK_PROPERTIES = [ 'title', 'description', 'keywords' ];
const DEFAULT_TEXTDOMAIN = 'jetpack';

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} name - The block's name. Jetpack blocks must be registered with a name prefixed
 * with `jetpack/`. This function accepts an unprefixed name too, though (it'd handle both
 * `business-hours` and `jetpack/business-hours` similarly, for instance).
 * @param {object} settings - The block's settings.
 * @param {object} childBlocks - The block's child blocks.
 * @param {boolean} prefix - Should this block be prefixed with `jetpack/`?
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock( name, settings, childBlocks = [], prefix = true ) {
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
	const result = registerBlockType( prefixedName, settings );

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

// Localize properties passed as parameter when applicable.
// Note: the documentation states that `registerBlockType` wraps localized properties in `_x`
// when it is passed the metadata object as the first param. I haven't found this to be true
// with the latest version of `@wordpress/blocks` (12.18.0) at the time of writing this.
// https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#javascript
const localizeBlockProperties = ( metadata, props ) => {
	const result = { ...props };

	for ( const prop in props ) {
		if ( LOCALIZED_BLOCK_PROPERTIES.includes( prop ) ) {
			// eslint-disable-next-line
			result[ prop ] = _x( props[ prop ], null, metadata.textdomain || DEFAULT_TEXTDOMAIN );
		}
	}

	return result;
};

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
		...metadata,
		...settings,
	};
	const processedSettings = {
		...localizeBlockProperties( metadata, mergedSettings ),
		icon: getBlockIconProp( metadata ),
	};

	const { variations } = metadata;

	if ( Array.isArray( variations ) && variations.length > 0 ) {
		processedSettings.variations = variations.map( variation => {
			return {
				...localizeBlockProperties( metadata, variation ),
				icon: getBlockIconProp( variation ),
			};
		} );
	}

	return registerJetpackBlock( metadata.name, processedSettings, childBlocks, prefix );
}
