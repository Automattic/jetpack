/**
 * Lightweight `registerJetpackBlock` for this package.
 *
 * Bridges Jetpack's extension-availability gate (via `Jetpack_Gutenberg`) to
 * `registerBlockType`. Strips paid-plan / child-block / prefix branches that
 * the full shared helper carries — this block has none of those.
 *
 * @todo Replace with `@automattic/jetpack-shared-extension-utils` export when one lands.
 */

import {
	getJetpackExtensionAvailability,
	getBlockIconProp,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';

interface BlockMetadataLike {
	name: string;
	attributes?: Record< string, unknown >;
	[ key: string ]: unknown;
}

type BlockSettings = Record< string, unknown >;
type RegisterBlockArg0 = Parameters< typeof registerBlockType >[ 0 ];
type RegisterBlockArg1 = Parameters< typeof registerBlockType >[ 1 ];
type RegisterBlockResult = ReturnType< typeof registerBlockType >;

export function registerJetpackBlockFromMetadata(
	metadata: BlockMetadataLike,
	settings: BlockSettings
): RegisterBlockResult | false {
	const rawName = metadata.name.replace( /^jetpack\//, '' );
	const { available, unavailableReason } = getJetpackExtensionAvailability( rawName );

	if ( ! available ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ rawName } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	return registerBlockType(
		metadata as RegisterBlockArg0,
		{
			...settings,
			icon: getBlockIconProp( metadata ),
			attributes: metadata.attributes || {},
		} as RegisterBlockArg1
	);
}
