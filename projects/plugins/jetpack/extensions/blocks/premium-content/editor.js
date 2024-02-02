import { createBlock } from '@wordpress/blocks';
import { registerPlugin } from '@wordpress/plugins';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import { blockContainsPremiumBlock, blockHasParentPremiumBlock } from './_inc/premium';
import RemoveBlockKeepContent from './_inc/remove-block-keep-content';
import { transformToCoreGroup } from './_inc/transform-to-core-group';
import metadata from './block.json';
import { name as buttonsBlockName, settings as buttonsBlockSettings } from './buttons/.';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import {
	name as loggedOutViewBlockName,
	settings as loggedOutViewBlockSettings,
} from './logged-out-view/.';
import {
	name as loginButtonBlockName,
	settings as loginButtonBlockSettings,
} from './login-button/.';
import save from './save';
import {
	name as subscriberViewBlockName,
	settings as subscriberViewBlockSettings,
} from './subscriber-view/.';

/**
 * A list of blocks that should be disallowed to be transformed to Premium content block since they are mostly markup blocks.
 */
const disallowFromTransformations = [
	'core/nextpage',
	'core/spacer',
	'core/separator',
	'core/more',
	'core/loginout',
	'core/post-navigation-link',
];

/**
 * Check if the given blocks are transformable to premium-content block
 *
 * This is because transforming blocks that are already premium content blocks, or have one as a descendant or ancestor
 * doesn't make sense and is likely to lead to confusion.
 *
 * We also filter the blocks that don't bring any value in transforming them to Premium Content block.
 *
 * @param {Array} blocks - The blocks that could be transformed
 * @returns {boolean} Whether the blocks should be allowed to be transformed to a premium content block
 */
const blocksCanBeTransformed = blocks => {
	// Avoid transforming any premium-content block.
	if ( blocks.some( blockContainsPremiumBlock ) ) {
		return false;
	}

	// Avoid transforming if any parent is a premium-content block. Blocks share same parents since they
	// are siblings, so checking the first one is enough.
	if ( blockHasParentPremiumBlock( blocks[ 0 ] ) ) {
		return false;
	}

	// Check if the blocks selected are all in the disallowFromTransformations.
	// If  they are, they don't have any value in allowing them to be transformed to Premium Content.
	const isInDisallowList = blocks.every( block =>
		disallowFromTransformations.includes( block.name )
	);

	return ! isInDisallowList;
};

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save,
		transforms: {
			from: [
				{
					type: 'block',
					isMultiBlock: true,
					blocks: [ '*' ],
					isMatch: ( fromAttributes, fromBlocks ) => {
						if ( fromAttributes.some( attributes => attributes.isPremiumContentChild ) ) {
							return false;
						}
						// The fromBlocks parameter doesn't exist in Gutenberg < 11.1.0, so if it isn't passed, allow the
						// match, fallback code in the convert method will handle it.
						return fromBlocks === undefined || blocksCanBeTransformed( fromBlocks );
					},
					__experimentalConvert( blocks ) {
						// This is checked here as well as in isMatch because the isMatch function isn't fully compatible
						// with gutenberg < 11.1.0
						if ( ! blocksCanBeTransformed( blocks ) ) {
							return;
						}

						// Clone the Blocks
						// Failing to create new block references causes the original blocks
						// to be replaced in the switchToBlockType call thereby meaning they
						// are removed both from their original location and within the
						// new premium content block.
						const innerBlocksSubscribe = blocks.map( block => {
							return createBlock( block.name, block.attributes, block.innerBlocks );
						} );

						return createBlock( 'premium-content/container', {}, [
							createBlock( 'premium-content/subscriber-view', {}, innerBlocksSubscribe ),
							createBlock( 'premium-content/logged-out-view' ),
						] );
					},
				},
			],
			to: [
				{
					type: 'block',
					blocks: [ 'core/group' ],
					transform: ( attributes, innerBlocks ) => {
						return transformToCoreGroup( innerBlocks );
					},
				},
			],
		},
		deprecated: [ deprecatedV2, deprecatedV1 ],
	},
	[
		{ name: loggedOutViewBlockName, settings: loggedOutViewBlockSettings },
		{ name: subscriberViewBlockName, settings: subscriberViewBlockSettings },
		{ name: buttonsBlockName, settings: buttonsBlockSettings },
		{ name: loginButtonBlockName, settings: loginButtonBlockSettings },
	],
	false
);

registerPlugin( 'block-settings-remove-block-keep-content', {
	render: RemoveBlockKeepContent,
} );
