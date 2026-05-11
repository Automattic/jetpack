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

interface BlockMetadataLike {
	name: string;
	attributes?: Record< string, unknown >;
	[ key: string ]: unknown;
}

// Settings is intentionally loose — `@wordpress/blocks`' `BlockConfiguration`
// is generic over attributes and carries many optional fields; this thin
// shim just forwards it through to `registerBlockType`.
type BlockSettings = Record< string, unknown >;

interface ChildBlock {
	name: string;
	settings: BlockSettings;
}

type RegisterBlockArg0 = Parameters< typeof registerBlockType >[ 0 ];
type RegisterBlockArg1 = Parameters< typeof registerBlockType >[ 1 ];
type RegisterBlockResult = ReturnType< typeof registerBlockType >;

// Registers a Gutenberg block if the availability requirements are met.
export default function registerJetpackBlock(
	nameOrMetadata: string | BlockMetadataLike,
	settings: BlockSettings,
	childBlocks: ChildBlock[] = [],
	prefix: boolean = true
): RegisterBlockResult | false {
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
		( typeof nameOrMetadata === 'object' ? nameOrMetadata : prefixedName ) as RegisterBlockArg0,
		settings as RegisterBlockArg1
	);

	if ( requiredPlan ) {
		addFilter(
			'editor.BlockListBlock',
			`${ prefixedName }-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( prefixedName )
		);
	}

	childBlocks.forEach( childBlock =>
		registerBlockType(
			( jpPrefix + childBlock.name ) as RegisterBlockArg0,
			childBlock.settings as RegisterBlockArg1
		)
	);

	return result;
}

// Wrapper around registerJetpackBlock that takes a metadata object.
export function registerJetpackBlockFromMetadata(
	metadata: BlockMetadataLike,
	settings: BlockSettings,
	childBlocks?: ChildBlock[],
	prefix?: boolean
): RegisterBlockResult | false {
	const mergedSettings: BlockSettings = {
		...settings,
		icon: getBlockIconProp( metadata ),
		attributes: metadata.attributes || {},
	};

	return registerJetpackBlock( metadata, mergedSettings, childBlocks, prefix );
}
