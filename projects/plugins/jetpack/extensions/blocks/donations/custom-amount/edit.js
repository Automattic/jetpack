/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DonationsContext from '../common/context';

const Edit = () => {
	const { showCustomAmount, currency } = useContext( DonationsContext );

	return (
		showCustomAmount && (
			<InnerBlocks
				templateLock={ 'all' }
				template={ [
					[
						'core/paragraph',
						{
							content: __( 'Or enter a custom amount', 'jetpack' ),
						},
					],
					[
						'core/group',
						{
							layout: {
								type: 'flex',
								allowOrientation: false,
							},
						},
						[
							[
								'jetpack/donations-amount',
								{
									label: __( 'Custom amount', 'jetpack' ),
									baseAmountMultiplier: 100,
									currency,
									className: 'donations__custom-amount',
									disabled: true,
								},
							],
						],
					],
				] }
				__experimentalCaptureToolbars={ true }
				templateInsertUpdatesSelection={ false }
			/>
		)
	);
};

export default Edit;
