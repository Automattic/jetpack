import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { AlignmentControl, BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	Dashicon,
	Dropdown,
	ExternalLink,
	Flex,
	FlexBlock,
	FlexItem,
	MenuGroup,
	MenuItem,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarGroup,
	ToolbarItem,
	ToolbarButton,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import {
	getDefaultDonationAmountsForCurrency,
	minimumTransactionAmountForCurrency,
	SUPPORTED_CURRENCIES,
} from '../../shared/currencies';
import { firstShownInterval } from './utils';

const INTERVAL_TO_ATTRIBUTE = {
	'one-time': 'oneTimeDonation',
	'1 month': 'monthlyDonation',
	'1 year': 'annualDonation',
};

const Controls = props => {
	const { attributes, setAttributes } = props;
	const {
		currency,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		showCustomAmount,
		contentAlignment,
		defaultInterval,
		customAmountPlaceholder,
	} = attributes;

	const computedCustomAmountPlaceholder = minimumTransactionAmountForCurrency( currency ) * 100;
	const effectiveCustomAmountPlaceholder =
		customAmountPlaceholder ?? computedCustomAmountPlaceholder;

	const oneTimeOn = oneTimeDonation.show !== false;
	const monthlyOn = !! monthlyDonation.show;
	const annualOn = !! annualDonation.show;
	const enabledIntervalCount = ( oneTimeOn ? 1 : 0 ) + ( monthlyOn ? 1 : 0 ) + ( annualOn ? 1 : 0 );
	const lastEnabledHelp = __( 'At least one frequency must be enabled.', 'jetpack' );

	const fallbackInterval = firstShownInterval( oneTimeOn, monthlyOn, annualOn ) ?? 'one-time';
	const isDefaultIntervalShown =
		( defaultInterval === 'one-time' && oneTimeOn ) ||
		( defaultInterval === '1 month' && monthlyOn ) ||
		( defaultInterval === '1 year' && annualOn );
	const effectiveDefaultInterval = isDefaultIntervalShown ? defaultInterval : fallbackInterval;

	const toggleDonation = ( interval, show ) => {
		const donationAttribute = INTERVAL_TO_ATTRIBUTE[ interval ];
		const donation = attributes[ donationAttribute ];
		const updates = {
			[ donationAttribute ]: { ...donation, show },
		};

		// If we're hiding the frequency that's currently the effective default, shift the
		// default to the next still-shown interval so the form never points at a hidden one.
		if ( ! show && effectiveDefaultInterval === interval ) {
			const stillShown = {
				oneTime: interval === 'one-time' ? false : oneTimeOn,
				monthly: interval === '1 month' ? false : monthlyOn,
				annual: interval === '1 year' ? false : annualOn,
			};
			const nextDefault = firstShownInterval(
				stillShown.oneTime,
				stillShown.monthly,
				stillShown.annual
			);
			if ( nextDefault ) {
				updates.defaultInterval = nextDefault;
			}
		}

		setAttributes( updates );
	};

	const setDonationValue = ( interval, key, value ) => {
		const donationAttribute = INTERVAL_TO_ATTRIBUTE[ interval ];
		setAttributes( {
			[ donationAttribute ]: { ...attributes[ donationAttribute ], [ key ]: value },
		} );
	};

	const intervalLabels = {
		'one-time': __( 'One-Time', 'jetpack' ),
		'1 month': __( 'Monthly', 'jetpack' ),
		'1 year': __( 'Yearly', 'jetpack' ),
	};
	const frequencyOptions = [
		...( oneTimeOn ? [ { value: 'one-time', label: intervalLabels[ 'one-time' ] } ] : [] ),
		...( monthlyOn ? [ { value: '1 month', label: intervalLabels[ '1 month' ] } ] : [] ),
		...( annualOn ? [ { value: '1 year', label: intervalLabels[ '1 year' ] } ] : [] ),
	];
	const buildAmountOptions = amounts => [
		{ value: '', label: __( 'None', 'jetpack' ) },
		...( amounts || [] ).map( ( amount, idx ) => ( {
			value: String( idx ),
			label: formatCurrency( amount, currency ),
		} ) ),
	];
	const amountValue = donation =>
		donation.defaultAmountIndex !== undefined ? String( donation.defaultAmountIndex ) : '';
	const onAmountChange = interval => value =>
		setDonationValue(
			interval,
			'defaultAmountIndex',
			value === '' ? undefined : parseInt( value, 10 )
		);

	const setContentAlignment = useCallback(
		value => setAttributes( { contentAlignment: value || '' } ),
		[ setAttributes ]
	);

	const changeDefaultDonationAmounts = ccy => {
		const defaultAmounts = getDefaultDonationAmountsForCurrency( ccy );

		setAttributes( {
			currency: ccy,
			oneTimeDonation: { ...oneTimeDonation, amounts: defaultAmounts },
			monthlyDonation: { ...monthlyDonation, amounts: defaultAmounts },
			annualDonation: { ...annualDonation, amounts: defaultAmounts },
			customAmountPlaceholder: undefined,
		} );
	};

	return (
		<>
			<BlockControls>
				<AlignmentControl value={ contentAlignment } onChange={ setContentAlignment } />
				<ToolbarGroup>
					<ToolbarItem>
						{ () => (
							<Dropdown
								contentClassName="jetpack-donations__currency-popover"
								renderToggle={ ( { onToggle, isOpen } ) => {
									const openOnArrowDown = event => {
										if ( ! isOpen && event.keyCode === DOWN ) {
											event.preventDefault();
											event.stopPropagation();
											onToggle();
										}
									};

									return (
										<ToolbarButton
											className="jetpack-donations__currency-toggle"
											icon={
												<>
													{ currency + ' - ' + CURRENCIES[ currency ].symbol }
													<Dashicon icon="arrow-down" />
												</>
											}
											label={ __( 'Change currency', 'jetpack' ) }
											onClick={ onToggle }
											onKeyDown={ openOnArrowDown }
										/>
									);
								} }
								renderContent={ ( { onClose } ) => (
									<MenuGroup>
										{ Object.keys( SUPPORTED_CURRENCIES ).map( ccy => (
											<MenuItem
												isSelected={ ccy === currency }
												icon={ ccy === currency ? 'yes' : '' }
												onClick={ () => {
													changeDefaultDonationAmounts( ccy );
													onClose();
												} }
												key={ `jetpack-donations-currency-${ ccy }` }
											>
												{ ccy + ' - ' + CURRENCIES[ ccy ].symbol }
											</MenuItem>
										) ) }
									</MenuGroup>
								) }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						checked={ oneTimeOn }
						onChange={ value => toggleDonation( 'one-time', value ) }
						disabled={ oneTimeOn && enabledIntervalCount === 1 }
						help={ oneTimeOn && enabledIntervalCount === 1 ? lastEnabledHelp : undefined }
						label={ __( 'Show one-time donations', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
					/>
					<ToggleControl
						checked={ monthlyOn }
						onChange={ value => toggleDonation( '1 month', value ) }
						disabled={ monthlyOn && enabledIntervalCount === 1 }
						help={ monthlyOn && enabledIntervalCount === 1 ? lastEnabledHelp : undefined }
						label={ __( 'Show monthly donations', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
					/>
					<ToggleControl
						checked={ annualOn }
						onChange={ value => toggleDonation( '1 year', value ) }
						disabled={ annualOn && enabledIntervalCount === 1 }
						help={ annualOn && enabledIntervalCount === 1 ? lastEnabledHelp : undefined }
						label={ __( 'Show annual donations', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
					/>
					<ToggleControl
						checked={ showCustomAmount }
						onChange={ value => setAttributes( { showCustomAmount: value } ) }
						label={ __( 'Show custom amount option', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
					/>
					{ showCustomAmount && (
						<TextControl
							type="number"
							label={ __( 'Suggested custom amount', 'jetpack' ) }
							help={ __(
								'Shown as the placeholder when donors enter a custom amount.',
								'jetpack'
							) }
							value={ effectiveCustomAmountPlaceholder }
							onChange={ value =>
								setAttributes( {
									customAmountPlaceholder:
										value === '' || value === undefined ? undefined : Number( value ),
								} )
							}
							min={ minimumTransactionAmountForCurrency( currency ) }
							step={ 0.01 }
							__nextHasNoMarginBottom={ true }
						/>
					) }
					<h3
						className="jp-donations-defaults-heading"
						style={ { margin: '24px 0 8px', fontSize: 13, fontWeight: 600 } }
					>
						{ __( 'Defaults', 'jetpack' ) }
					</h3>
					<SelectControl
						label={ __( 'Frequency', 'jetpack' ) }
						value={ effectiveDefaultInterval }
						options={ frequencyOptions }
						onChange={ value => setAttributes( { defaultInterval: value } ) }
						__nextHasNoMarginBottom={ true }
					/>
					<h4
						className="jp-donations-defaults-subheading"
						style={ {
							margin: '16px 0 8px',
							fontSize: 11,
							fontWeight: 500,
							textTransform: 'uppercase',
						} }
					>
						{ __( 'Amounts', 'jetpack' ) }
					</h4>
					{ oneTimeOn && (
						<Flex justify="space-between" align="center" style={ { marginBottom: 8 } }>
							<FlexItem style={ { minWidth: 80 } }>{ __( 'One-Time', 'jetpack' ) }</FlexItem>
							<FlexBlock>
								<SelectControl
									hideLabelFromVision
									label={ __( 'Default amount for One-Time', 'jetpack' ) }
									value={ amountValue( oneTimeDonation ) }
									options={ buildAmountOptions( oneTimeDonation.amounts ) }
									onChange={ onAmountChange( 'one-time' ) }
									__nextHasNoMarginBottom={ true }
								/>
							</FlexBlock>
						</Flex>
					) }
					{ monthlyOn && (
						<Flex justify="space-between" align="center" style={ { marginBottom: 8 } }>
							<FlexItem style={ { minWidth: 80 } }>{ __( 'Monthly', 'jetpack' ) }</FlexItem>
							<FlexBlock>
								<SelectControl
									hideLabelFromVision
									label={ __( 'Default amount for Monthly', 'jetpack' ) }
									value={ amountValue( monthlyDonation ) }
									options={ buildAmountOptions( monthlyDonation.amounts ) }
									onChange={ onAmountChange( '1 month' ) }
									__nextHasNoMarginBottom={ true }
								/>
							</FlexBlock>
						</Flex>
					) }
					{ annualOn && (
						<Flex justify="space-between" align="center" style={ { marginBottom: 8 } }>
							<FlexItem style={ { minWidth: 80 } }>{ __( 'Annual', 'jetpack' ) }</FlexItem>
							<FlexBlock>
								<SelectControl
									hideLabelFromVision
									label={ __( 'Default amount for Annual', 'jetpack' ) }
									value={ amountValue( annualDonation ) }
									options={ buildAmountOptions( annualDonation.amounts ) }
									onChange={ onAmountChange( '1 year' ) }
									__nextHasNoMarginBottom={ true }
								/>
							</FlexBlock>
						</Flex>
					) }
					<p style={ { marginTop: 24 } }>
						<ExternalLink href={ `https://wordpress.com/earn/payments/${ getSiteFragment() }` }>
							{ __( 'View donation earnings', 'jetpack' ) }
						</ExternalLink>
					</p>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default Controls;
