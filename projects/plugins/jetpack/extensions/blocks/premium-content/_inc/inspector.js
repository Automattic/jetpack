/**
 * WordPress dependencies
 */
import {
	Button,
	PanelBody,
	PanelRow,
	SelectControl,
	TextControl,
	ExternalLink,
	Placeholder,
	Spinner,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CURRENCY_OPTIONS } from '../../../shared/currencies';

const API_STATE_NOT_REQUESTING = 0;
const API_STATE_REQUESTING = 1;

/**
 * @typedef {object} PlanAttributes
 * @property { string } newPlanCurrency
 * @property { string } newPlanName
 * @property { number } newPlanPrice
 * @property { string } newPlanInterval
 * @typedef {object} Currency
 * @property { string } label
 * @property { string } symbol
 * @typedef {object} Props
 * @property { PlanAttributes } attributes
 * @property { (attributes: object<PlanAttributes>) => void } setAttributes
 * @property { string } className
 * @property { (attributes: PlanAttributes, onComplete:(isSuccesful: boolean)=>void) => void } savePlan
 * @property { Currency[] } currencies
 * @property { string } siteSlug
 * @param { Props } props
 * @returns {object} Toolbar settings for our block.
 */
export default function Inspector( props ) {
	const [ apiState, setApiState ] = useState( API_STATE_NOT_REQUESTING );
	const { attributes, setAttributes, className, savePlan, siteSlug } = props;

	return (
		<InspectorControls>
			{ siteSlug && (
				<ExternalLink
					href={ `https://wordpress.com/earn/payments/${ siteSlug }` }
					className={ 'wp-block-premium-content-container---link-to-earn' }
				>
					{ __( 'Manage your subscriptions.', 'jetpack' ) }
				</ExternalLink>
			) }
			<PanelBody
				title={ __( 'Add a new subscription', 'jetpack' ) }
				initialOpen={ true }
				className={ `${ className }---settings-add_plan` }
			>
				{ apiState === API_STATE_REQUESTING && (
					<Placeholder
						icon="lock"
						label={ __( 'Premium Content', 'jetpack' ) }
						instructions={ __( 'Saving plan…', 'jetpack' ) }
					>
						<Spinner />
					</Placeholder>
				) }
				{ apiState === API_STATE_NOT_REQUESTING && (
					<div>
						<PanelRow className="plan-name">
							<TextControl
								id="new-plan-name"
								label={ __( 'Name', 'jetpack' ) }
								value={ attributes.newPlanName }
								onChange={ set => setAttributes( { newPlanName: set } ) }
							/>
						</PanelRow>
						<PanelRow className="plan-price">
							<SelectControl
								label={ __( 'Currency', 'jetpack' ) }
								onChange={ set => setAttributes( { newPlanCurrency: set } ) }
								value={ attributes.newPlanCurrency }
								options={ CURRENCY_OPTIONS }
							></SelectControl>
							<TextControl
								label={ __( 'Price', 'jetpack' ) }
								value={ attributes.newPlanPrice }
								onChange={ set => setAttributes( { newPlanPrice: parseFloat( set ) } ) }
								type="number"
							></TextControl>
						</PanelRow>
						<PanelRow className="plan-interval">
							<SelectControl
								label={ __( 'Interval', 'jetpack' ) }
								onChange={ set => setAttributes( { newPlanInterval: set } ) }
								value={ attributes.newPlanInterval }
								options={ [
									{ label: __( 'Month', 'jetpack' ), value: '1 month' },
									{ label: __( 'Year', 'jetpack' ), value: '1 year' },
								] }
							></SelectControl>
						</PanelRow>
						<PanelRow>
							<Button
								// @ts-ignore isSecondary is missing from the type definition
								isSecondary={ true }
								isLarge={ true }
								onClick={
									/**
									 * @param { import('react').MouseEvent<HTMLElement> } e
									 */
									e => {
										e.preventDefault();
										setApiState( API_STATE_REQUESTING );
										savePlan( props.attributes, success => {
											setApiState( API_STATE_NOT_REQUESTING );
											if ( success ) {
												setAttributes( { newPlanPrice: 5 } );
												setAttributes( { newPlanName: '' } );
											}
										} );
									}
								}
							>
								{ __( 'Add subscription', 'jetpack' ) }
							</Button>
						</PanelRow>
					</div>
				) }
			</PanelBody>
		</InspectorControls>
	);
}
