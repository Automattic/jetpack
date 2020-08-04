/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Context from './context';

// Default template for inner blocks.
// Some items stay in sync across all tabs, where others have different values on each tab.
// @see https://github.com/Automattic/jetpack/pull/16593#issuecomment-668060633
const TEMPLATE = [
	// ↓ Heading (not synced).
	[
		'core/heading',
		{
			className: 'donations__one-time-item',
			content: __( 'Make a one-time donation', 'jetpack' ),
			level: 4,
		},
	],
	[
		'core/heading',
		{
			className: 'donations__monthly-item',
			content: __( 'Make a monthly donation', 'jetpack' ),
			level: 4,
		},
	],
	[
		'core/heading',
		{
			className: 'donations__annual-item',
			content: __( 'Make a yearly donation', 'jetpack' ),
			level: 4,
		},
	],

	// ↓ Choose amount label (synced).
	[ 'core/paragraph', { content: __( 'Choose an amount', 'jetpack' ) } ],

	// ↓ Buttons for choosing a prefixed amount (not synced).
	[ 'jetpack/donations-amounts', { className: 'donations__one-time-item', interval: 'one-time' } ],
	[ 'jetpack/donations-amounts', { className: 'donations__monthly-item', interval: '1 month' } ],
	[ 'jetpack/donations-amounts', { className: 'donations__annual-item', interval: '1 year' } ],

	// ↓ Custom amount label (synced).
	[
		'core/paragraph',
		{ className: 'donations__custom-item', content: __( 'Or enter a custom amount', 'jetpack' ) },
	],

	// ↓ Input for entering a custom amount (synced).
	[ 'jetpack/donations-amounts', { className: 'donations__custom-item' } ],

	// ↓ Separator (synced).
	[ 'core/paragraph', { content: '——' } ],

	// ↓ Extra text (not synced).
	[
		'core/paragraph',
		{
			className: 'donations__one-time-item',
			content: __( 'Your contribution is appreciated.', 'jetpack' ),
		},
	],
	[
		'core/paragraph',
		{
			className: 'donations__monthly-item',
			content: __( 'Your contribution is appreciated.', 'jetpack' ),
		},
	],
	[
		'core/paragraph',
		{
			className: 'donations__annual-item',
			content: __( 'Your contribution is appreciated.', 'jetpack' ),
		},
	],

	// ↓ Donate buttons (not synced).
	[
		'jetpack/button',
		{
			className: 'donations__one-time-item',
			element: 'a',
			saveInPostContent: true,
			text: __( 'Donate', 'jetpack' ),
			uniqueId: 'donations-button-one-time',
		},
	],
	[
		'jetpack/button',
		{
			className: 'donations__monthly-item',
			element: 'a',
			saveInPostContent: true,
			text: __( 'Donate monthly', 'jetpack' ),
			uniqueId: 'donations-button-monthly',
		},
	],
	[
		'jetpack/button',
		{
			className: 'donations__annual-item',
			element: 'a',
			saveInPostContent: true,
			text: __( 'Donate yearly', 'jetpack' ),
			uniqueId: 'donations-button-annual',
		},
	],
];

const Tab = props => {
	const { activeTab, attributes, clientId } = props;
	const { currency, oneTimePlanId, showCustomAmount } = attributes;

	const { selectBlock } = useDispatch( 'core/block-editor' );

	// Keeps the parent block selected when the block is first inserted (otherwise inner blocks will be selected).
	useEffect( () => {
		// Since there is no setting for disabling the one-time option, we can assume that the block has been just
		// inserted if the attribute `oneTimePlanId` is not set.
		if ( oneTimePlanId ) {
			return;
		}
		selectBlock( clientId );
	}, [ clientId, oneTimePlanId, selectBlock ] );

	return (
		<div
			className={ classnames( 'donations__tab', {
				'is-one-time': activeTab === 'one-time',
				'is-monthly': activeTab === '1 month',
				'is-annual': activeTab === '1 year',
				'show-custom': showCustomAmount,
			} ) }
		>
			<Context.Provider value={ { currency, showCustomAmount } }>
				<InnerBlocks templateLock={ false } template={ TEMPLATE } />
			</Context.Provider>
		</div>
	);
};

export default Tab;
