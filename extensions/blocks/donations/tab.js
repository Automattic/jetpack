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
				<InnerBlocks
					templateLock={ false }
					template={ [
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
						[ 'core/paragraph', { content: __( 'Choose an amount', 'jetpack' ) } ],
						[ 'jetpack/donations-amounts' ],
						[
							'core/paragraph',
							{
								className: 'donations__custom-item',
								content: __( 'Or enter a custom amount', 'jetpack' ),
							},
						],
						[ 'jetpack/donations-amounts', { isCustom: true } ],
						[ 'core/paragraph', { content: '——' } ],
						[ 'core/paragraph', { content: __( 'Your contribution is appreciated.', 'jetpack' ) } ],
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
					] }
				/>
			</Context.Provider>
		</div>
	);
};

export default Tab;
