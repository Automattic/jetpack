/**
 * Lightweight `registerJetpackBlock` for this package.
 *
 * Bridges Jetpack's extension-availability gate (via `Jetpack_Gutenberg`) to
 * `registerBlockType`. Strips child-block / prefix branches that the full
 * shared helper carries — this block has none of those. Paid-plan gating is
 * kept: an insufficient plan reports `missing_plan`, in which case the block
 * still registers so the shared paid-block layer can show its upgrade banner.
 *
 * @todo Replace with `@automattic/jetpack-shared-extension-utils` export when one lands.
 */

import {
	getJetpackExtensionAvailability,
	getBlockIconProp,
	requiresPaidPlan,
	withHasWarningIsInteractiveClassNames,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

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
	const { available, details, unavailableReason } = getJetpackExtensionAvailability( rawName );

	const requiredPlan = requiresPaidPlan( unavailableReason, details );

	// Bail only when the block is genuinely unavailable. When it's merely gated
	// behind a paid plan, register it anyway so the paid-block layer can surface
	// the upgrade banner.
	if ( ! available && ! requiredPlan ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ rawName } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	const result = registerBlockType(
		metadata as RegisterBlockArg0,
		{
			...settings,
			icon: getBlockIconProp( metadata ),
			attributes: metadata.attributes || {},
		} as RegisterBlockArg1
	);

	if ( requiredPlan ) {
		addFilter(
			'editor.BlockListBlock',
			`${ metadata.name }-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( metadata.name )
		);
	}

	return result;
}
