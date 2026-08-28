/**
 * Payments settings panel — PROTOTYPE.
 *
 * In production this content lives in the integrations sidebar next to
 * Salesforce and Google Sheets, and its first job is a "Connect Stripe" CTA
 * pointing at the `connect_url` from `GET /wpcom/v2/memberships/status`. The
 * prototype skips connection entirely — there is nothing to connect to — and
 * goes straight to the amount settings, which are the part worth showing.
 */

import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const CURRENCIES = [
	{ label: 'USD ($)', value: 'USD' },
	{ label: 'EUR (€)', value: 'EUR' },
	{ label: 'GBP (£)', value: 'GBP' },
	{ label: 'CAD (C$)', value: 'CAD' },
	{ label: 'AUD (A$)', value: 'AUD' },
];

const DEFAULTS = {
	enabled: false,
	currency: 'USD',
	amountMode: 'fixed',
	amount: 25,
	amountField: '',
};

const PaymentsSettings = ( { attributes, setAttributes } ) => {
	const payments = { ...DEFAULTS, ...( attributes.payments || {} ) };

	const update = changes => setAttributes( { payments: { ...payments, ...changes } } );

	// The design makes these mutually exclusive: a payment needs a durable
	// response to attach money to, and `saveResponses: false` parks responses
	// in a temporary status.
	const responsesDisabled = attributes.saveResponses === false;

	return (
		<PanelBody
			title={ __( 'Payments (prototype)', 'jetpack-forms' ) }
			className="jetpack-contact-form__panel"
			initialOpen={ false }
		>
			{ responsesDisabled && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Payments need responses to be saved. Turn on response storage to collect payment.',
						'jetpack-forms'
					) }
				</Notice>
			) }

			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Collect payment on submit', 'jetpack-forms' ) }
				help={ __(
					'Demo only — a simulated checkout opens after the form is submitted. No card is charged.',
					'jetpack-forms'
				) }
				checked={ !! payments.enabled && ! responsesDisabled }
				disabled={ responsesDisabled }
				onChange={ enabled => update( { enabled } ) }
			/>

			{ payments.enabled && ! responsesDisabled && (
				<>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Currency', 'jetpack-forms' ) }
						value={ payments.currency }
						options={ CURRENCIES }
						onChange={ currency => update( { currency } ) }
					/>

					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Amount', 'jetpack-forms' ) }
						value={ payments.amountMode }
						options={ [
							{ label: __( 'Fixed amount', 'jetpack-forms' ), value: 'fixed' },
							{
								label: __( 'Chosen by the person filling the form', 'jetpack-forms' ),
								value: 'buyer',
							},
						] }
						help={ __(
							'Amounts computed from answers (quantity × price, priced options) are a later phase.',
							'jetpack-forms'
						) }
						onChange={ amountMode => update( { amountMode } ) }
					/>

					{ 'fixed' === payments.amountMode ? (
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							type="number"
							min="1"
							step="0.5"
							label={ __( 'Price', 'jetpack-forms' ) }
							value={ payments.amount }
							onChange={ amount => update( { amount: parseFloat( amount ) || 0 } ) }
						/>
					) : (
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Field holding the amount', 'jetpack-forms' ) }
							value={ payments.amountField }
							placeholder={ __( 'e.g. Amount', 'jetpack-forms' ) }
							help={ __(
								'Label of the field to read the amount from. Leave empty to use the first numeric answer.',
								'jetpack-forms'
							) }
							onChange={ amountField => update( { amountField } ) }
						/>
					) }
				</>
			) }
		</PanelBody>
	);
};

export default PaymentsSettings;
