import { createBlock } from '@wordpress/blocks';
import { __, _x } from '@wordpress/i18n';
import icon from './_inc/icon';
import { blockContainsPremiumBlock, blockHasParentPremiumBlock } from './_inc/premium';
import { transformToCoreGroup } from './_inc/transform-to-core-group';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import save from './save';

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

export const name = 'premium-content/container';
export const settings = {
	title: __( 'Premium Content', 'jetpack' ),
	description: __( 'Restrict access to your content for paying subscribers.', 'jetpack' ),
	icon,
	category: 'grow',
	keywords: [
		_x( 'buy', 'block search term', 'jetpack' ),
		_x( 'credit card', 'block search term', 'jetpack' ),
		_x( 'debit card', 'block search term', 'jetpack' ),
		_x( 'earn', 'block search term', 'jetpack' ),
		_x( 'exclusive', 'block search term', 'jetpack' ),
		_x( 'gated', 'block search term', 'jetpack' ),
		'gofundme',
		_x( 'memberships', 'block search term', 'jetpack' ),
		_x( 'money', 'block search term', 'jetpack' ),
		_x( 'newsletter', 'block search term', 'jetpack' ),
		_x( 'paid', 'block search term', 'jetpack' ),
		'patreon',
		_x( 'pay', 'block search term', 'jetpack' ),
		_x( 'payments', 'block search term', 'jetpack' ),
		_x( 'paywall', 'block search term', 'jetpack' ),
		_x( 'purchase', 'block search term', 'jetpack' ),
		_x( 'recurring', 'block search term', 'jetpack' ),
		_x( 'repeat', 'block search term', 'jetpack' ),
		_x( 'signin', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
		_x( 'support', 'block search term', 'jetpack' ),
		_x( 'sponsor', 'block search term', 'jetpack' ),
		'square',
		'toast',
		'venmo',
		'stripe',
		'substack',
	],
	attributes: {
		newPlanName: {
			type: 'string',
			default: __( 'Monthly Subscription', 'jetpack' ),
		},
		newPlanCurrency: {
			type: 'string',
			default: 'USD',
		},
		newPlanPrice: {
			type: 'number',
			default: 5,
		},
		newPlanInterval: {
			type: 'string',
			default: '1 month',
		},
		selectedPlanId: {
			type: 'number',
			default: 0,
		},
		isPreview: {
			type: 'boolean',
			default: false,
		},
		isPremiumContentChild: {
			type: 'bool',
			default: true,
		},
	},
	edit,
	save,
	providesContext: {
		'premium-content/planId': 'selectedPlanId',
		'premium-content/isPreview': 'isPreview',
		isPremiumContentChild: 'isPremiumContentChild',
	},
	supports: {
		html: false,
	},
	example: {
		attributes: {
			isPreview: true,
		},
	},
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
	deprecated: [ deprecatedV1 ],
};
