/**
 * Local copy of the registerJetpackBlock helper used by the Jetpack plugin.
 *
 * Mirrors the copy paypal-payments keeps for the same reason: the package
 * builds independently of `projects/plugins/jetpack/extensions/shared`.
 *
 * @todo Move this to `@automattic/jetpack-shared-extension-utils` so all packages can drop their copies.
 *
 * @see https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/jetpack/extensions/shared/register-jetpack-block.js
 */

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
 * @param {string}  nameOrMetadata - Block's name or metadata object. Jetpack blocks must be
 *                                 registered with a `jetpack/`-prefixed name. Both `podcast-episode`
 *                                 and `jetpack/podcast-episode` are accepted.
 * @param {object}  settings       - The block's settings.
 * @param {object}  childBlocks    - The block's child blocks.
 * @param {boolean} prefix         - Should this block be prefixed with `jetpack/`?
 * @return {object|boolean} `false` if the block is unavailable, otherwise `registerBlockType`'s return value.
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
		// eslint-disable-next-line no-undef -- webpack sets process.env.NODE_ENV
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

	childBlocks.forEach( childBlock =>
		registerBlockType( jpPrefix + childBlock.name, childBlock.settings )
	);

	return result;
}

/**
 * Wrapper around registerJetpackBlock that takes a metadata object.
 *
 * @param {object } metadata    - block.json metadata.
 * @param {object}  settings    - See registerJetpackBlock.
 * @param {object}  childBlocks - See registerJetpackBlock.
 * @param {boolean} prefix      - See registerJetpackBlock.
 * @return {object|boolean} See registerJetpackBlock.
 */
export function registerJetpackBlockFromMetadata( metadata, settings, childBlocks, prefix ) {
	const mergedSettings = {
		...settings,
		icon: getBlockIconProp( metadata ),
		attributes: metadata.attributes || {},
	};

	return registerJetpackBlock( metadata, mergedSettings, childBlocks, prefix );
}
