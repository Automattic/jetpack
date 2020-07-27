/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import {
	ExternalLink,
	TextControl,
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SUPPORTED_CURRENCIES, minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Controls = props => {
	const { attributes, setAttributes, products, siteSlug } = props;
	const { currency, amounts, monthlyPlanId, annuallyPlanId, showCustomAmount } = attributes;
	const [ editedAmounts, setEditedAmounts ] = useState( amounts );

	const minAmount = minimumTransactionAmountForCurrency( currency );

	const setAmount = ( amount, tier ) => {
		let isValidAmount = true;
		if ( ! amount ) {
			isValidAmount = false;
		}
		amount = parseFloat( amount );
		if ( amount < minAmount ) {
			isValidAmount = false;
		}
		const newAmounts = [ ...amounts ];
		newAmounts[ tier ] = amount;
		setEditedAmounts( newAmounts );
		if ( isValidAmount ) {
			setAttributes( { amounts: newAmounts } );
		}
	};

	// Updates the inputs handling the amount when the amounts attribute changes.
	useEffect( () => {
		setEditedAmounts( amounts );
	}, [ amounts ] );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings', 'jetpack' ) }>
				<SelectControl
					label={ __( 'Currency', 'jetpack' ) }
					value={ currency }
					options={ Object.keys( SUPPORTED_CURRENCIES ).map( ccy => ( {
						label: ccy,
						value: ccy,
					} ) ) }
					onChange={ ccy => setAttributes( { currency: ccy } ) }
				/>
				<div className="donations__controls-amounts">
					{ editedAmounts.map( ( amount, index ) => (
						<TextControl
							type="number"
							min={ minAmount }
							step="1"
							value={ amount }
							label={ sprintf(
								// translators: %d: Tier level e.g: "1", "2", "3"
								__( 'Tier %d', 'jetpack' ),
								index + 1
							) }
							onChange={ value => setAmount( value, index ) }
						/>
					) ) }
				</div>
				<ToggleControl
					checked={ !! monthlyPlanId }
					onChange={ value =>
						setAttributes( { monthlyPlanId: value ? products[ '1 month' ] : null } )
					}
					label={ __( 'Show monthly donations', 'jetpack' ) }
				/>
				<ToggleControl
					checked={ !! annuallyPlanId }
					onChange={ value =>
						setAttributes( { annuallyPlanId: value ? products[ '1 year' ] : null } )
					}
					label={ __( 'Show annual donations', 'jetpack' ) }
				/>
				<ToggleControl
					checked={ showCustomAmount }
					onChange={ value => setAttributes( { showCustomAmount: value } ) }
					label={ __( 'Show custom amount option', 'jetpack' ) }
				/>
				<ExternalLink href={ `https://wordpress.com/earn/payments/${ siteSlug }` }>
					{ __( 'View donation earnings', 'jetpack' ) }
				</ExternalLink>
			</PanelBody>
		</InspectorControls>
	);
};

export default Controls;
