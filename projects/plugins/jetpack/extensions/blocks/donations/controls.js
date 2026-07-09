import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	__experimentalBorderRadiusControl as BorderRadiusControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BorderBoxControl,
	Button,
	Dashicon,
	Dropdown,
	ExternalLink,
	Flex,
	FlexBlock,
	FlexItem,
	Icon,
	MenuGroup,
	MenuItem,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	ToolbarGroup,
	ToolbarItem,
	ToolbarButton,
	Tooltip,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import {
	getDefaultDonationAmountsForCurrency,
	minimumTransactionAmountForCurrency,
	SUPPORTED_CURRENCIES,
} from '../../shared/currencies';
import { store as membershipProductsStore } from '../../store/membership-products';
import { TRIGGER_ICONS } from './icons';
import { firstShownInterval } from './utils';

const SETTING_DEBOUNCE_MS = 800;

const INTERVAL_TO_ATTRIBUTE = {
	'one-time': 'oneTimeDonation',
	'1 month': 'monthlyDonation',
	'1 year': 'annualDonation',
};

const Controls = props => {
	const { attributes, setAttributes, clientId } = props;
	const { tracks } = useAnalytics();
	const debounceTimers = useRef( {} );

	const stripeConnectUrl = useSelect(
		select => select( membershipProductsStore ).getConnectUrl() || '',
		[]
	);
	const stripeConnected = ! stripeConnectUrl;

	const recordSettingChange = useCallback(
		( settingName, settingValue ) => {
			tracks.recordEvent( 'jetpack_donations_setting_changed', {
				feature: 'donations',
				surface: 'block_editor',
				setting_name: settingName,
				setting_value: settingValue,
				stripe_connected: stripeConnected,
			} );
		},
		[ tracks, stripeConnected ]
	);

	const recordSettingChangeDebounced = useCallback(
		( settingName, settingValue ) => {
			if ( debounceTimers.current[ settingName ] ) {
				clearTimeout( debounceTimers.current[ settingName ] );
			}
			debounceTimers.current[ settingName ] = setTimeout( () => {
				recordSettingChange( settingName, settingValue );
				delete debounceTimers.current[ settingName ];
			}, SETTING_DEBOUNCE_MS );
		},
		[ recordSettingChange ]
	);

	const {
		currency,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		showCustomAmount,
		contentAlignment,
		defaultInterval,
		customAmountPlaceholder,
		minimumAmount,
		maximumAmount,
		displayMode,
		triggerButtonText,
		triggerIcon,
		triggerSticky,
		blockBorder,
		blockBorderRadius,
	} = attributes;

	const stripeMin = minimumTransactionAmountForCurrency( currency );
	const computedCustomAmountPlaceholder = stripeMin * 100;
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

	const FREQUENCY_SETTING_NAME = {
		'one-time': 'show_one_time',
		'1 month': 'show_monthly',
		'1 year': 'show_yearly',
	};

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
		recordSettingChange( FREQUENCY_SETTING_NAME[ interval ], show );
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
	const DEFAULT_AMOUNT_SETTING_NAME = {
		'one-time': 'default_amount_one_time',
		'1 month': 'default_amount_monthly',
		'1 year': 'default_amount_yearly',
	};

	const onAmountChange = interval => value => {
		const parsed = value === '' ? undefined : parseInt( value, 10 );
		setDonationValue( interval, 'defaultAmountIndex', parsed );
		recordSettingChange( DEFAULT_AMOUNT_SETTING_NAME[ interval ], parsed ?? null );
	};

	const setContentAlignment = useCallback(
		value => setAttributes( { contentAlignment: value || '' } ),
		[ setAttributes ]
	);

	let maximumHelp;
	if (
		minimumAmount !== undefined &&
		maximumAmount !== undefined &&
		maximumAmount < minimumAmount
	) {
		maximumHelp = __( 'Maximum must be greater than the minimum amount.', 'jetpack' );
	} else if ( maximumAmount !== undefined && maximumAmount < stripeMin ) {
		maximumHelp = sprintf(
			/* translators: %s: minimum donation amount formatted with currency symbol */
			__( 'Maximum must be at least %s, the minimum amount Stripe can process.', 'jetpack' ),
			formatCurrency( stripeMin, currency )
		);
	}

	const changeDefaultDonationAmounts = ccy => {
		const defaultAmounts = getDefaultDonationAmountsForCurrency( ccy );

		setAttributes( {
			currency: ccy,
			oneTimeDonation: { ...oneTimeDonation, amounts: defaultAmounts },
			monthlyDonation: { ...monthlyDonation, amounts: defaultAmounts },
			annualDonation: { ...annualDonation, amounts: defaultAmounts },
			customAmountPlaceholder: undefined,
		} );
		recordSettingChange( 'currency', ccy );
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
				<PanelBody title={ __( 'Display', 'jetpack' ) }>
					<ToggleGroupControl
						label={ __( 'Display mode', 'jetpack' ) }
						value={ displayMode }
						onChange={ value => setAttributes( { displayMode: value } ) }
						isBlock
						__nextHasNoMarginBottom={ true }
					>
						<ToggleGroupControlOption value="inline" label={ __( 'In-page', 'jetpack' ) } />
						<ToggleGroupControlOption value="modal" label={ __( 'Pop-up', 'jetpack' ) } />
					</ToggleGroupControl>
					{ displayMode === 'modal' && (
						<>
							<ToggleControl
								label={ __( 'Sticky', 'jetpack' ) }
								help={ __( 'Fix the button to the bottom right corner of the page.', 'jetpack' ) }
								checked={ !! triggerSticky }
								onChange={ value => setAttributes( { triggerSticky: value } ) }
								style={ { marginTop: 16 } }
								__nextHasNoMarginBottom={ true }
							/>
							<TextControl
								label={ __( 'Button text', 'jetpack' ) }
								value={ triggerButtonText ?? '' }
								placeholder={ __( 'Donate', 'jetpack' ) }
								onChange={ value => setAttributes( { triggerButtonText: value || undefined } ) }
								__nextHasNoMarginBottom={ true }
							/>
							<ToggleControl
								label={ __( 'Show icon', 'jetpack' ) }
								checked={ triggerIcon !== 'none' }
								onChange={ value => setAttributes( { triggerIcon: value ? 'heart' : 'none' } ) }
								style={ { marginTop: 16 } }
								__nextHasNoMarginBottom={ true }
							/>
							{ triggerIcon !== 'none' && (
								<div className="jetpack-donations__icon-picker">
									{ TRIGGER_ICONS.map( ( { key, label, icon } ) => (
										<Tooltip key={ key } text={ label }>
											<Button
												className="jetpack-donations__icon-option"
												onClick={ () => setAttributes( { triggerIcon: key } ) }
												aria-label={ label }
												isPressed={ triggerIcon === key }
											>
												<Icon icon={ icon } size={ 20 } />
											</Button>
										</Tooltip>
									) ) }
								</div>
							) }
						</>
					) }
				</PanelBody>
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
						onChange={ value => {
							setAttributes( { showCustomAmount: value } );
							recordSettingChange( 'show_custom_amount', value );
						} }
						label={ __( 'Show custom amount option', 'jetpack' ) }
						__nextHasNoMarginBottom={ true }
					/>
					<h3
						className="jp-donations-defaults-heading"
						style={ {
							margin: '24px 0 8px',
							fontSize: 13,
							fontWeight: 600,
							textTransform: 'none',
						} }
					>
						{ __( 'Defaults', 'jetpack' ) }
					</h3>
					<SelectControl
						label={ __( 'Frequency', 'jetpack' ) }
						value={ effectiveDefaultInterval }
						options={ frequencyOptions }
						onChange={ value => {
							setAttributes( { defaultInterval: value } );
							recordSettingChange( 'default_frequency', value );
						} }
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
					{ showCustomAmount && (
						<Flex justify="space-between" align="center" style={ { marginBottom: 8 } }>
							<FlexItem style={ { minWidth: 80 } }>{ __( 'Custom', 'jetpack' ) }</FlexItem>
							<FlexBlock>
								<TextControl
									type="number"
									hideLabelFromVision
									label={ __( 'Suggested custom amount', 'jetpack' ) }
									value={ effectiveCustomAmountPlaceholder }
									onChange={ value => {
										const parsed =
											value === '' || value === undefined ? undefined : Number( value );
										setAttributes( { customAmountPlaceholder: parsed } );
										recordSettingChangeDebounced( 'custom_amount_placeholder', parsed ?? null );
									} }
									min={ minimumTransactionAmountForCurrency( currency ) }
									step={ 0.01 }
									__nextHasNoMarginBottom={ true }
								/>
							</FlexBlock>
						</Flex>
					) }
					<p style={ { marginTop: 24 } }>
						<ExternalLink href={ `https://wordpress.com/earn/${ getSiteFragment() }` }>
							{ __( 'View donation earnings', 'jetpack' ) }
						</ExternalLink>
					</p>
				</PanelBody>
				<PanelBody title={ __( 'Security', 'jetpack' ) } initialOpen={ false }>
					<p style={ { marginTop: 0, marginBottom: 16, fontSize: 13 } }>
						{ __(
							'Setting minimum and maximum donation amounts can help prevent fraudulent transactions.',
							'jetpack'
						) }
					</p>
					<TextControl
						type="number"
						label={ __( 'Minimum amount', 'jetpack' ) }
						value={ minimumAmount ?? '' }
						onChange={ value => {
							const parsed = value === '' ? undefined : Number( value );
							setAttributes( { minimumAmount: parsed } );
							recordSettingChangeDebounced( 'minimum_amount', parsed ?? null );
						} }
						min={ stripeMin }
						step={ 0.01 }
						__nextHasNoMarginBottom={ true }
					/>
					<TextControl
						type="number"
						label={ __( 'Maximum amount', 'jetpack' ) }
						value={ maximumAmount ?? '' }
						onChange={ value => {
							const parsed = value === '' ? undefined : Number( value );
							setAttributes( { maximumAmount: parsed } );
							recordSettingChangeDebounced( 'maximum_amount', parsed ?? null );
						} }
						min={ minimumAmount ?? stripeMin }
						step={ 0.01 }
						help={ maximumHelp }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>
			{ displayMode !== 'modal' && (
				<InspectorControls group="border">
					<ToolsPanel
						label={ __( 'Border', 'jetpack' ) }
						resetAll={ () =>
							setAttributes( { blockBorder: undefined, blockBorderRadius: undefined } )
						}
						panelId={ clientId }
					>
						<ToolsPanelItem
							label={ __( 'Border', 'jetpack' ) }
							hasValue={ () => !! blockBorder }
							onDeselect={ () => setAttributes( { blockBorder: undefined } ) }
							isShownByDefault
							panelId={ clientId }
						>
							<BorderBoxControl
								label={ __( 'Border', 'jetpack' ) }
								value={ blockBorder }
								onChange={ value => setAttributes( { blockBorder: value } ) }
								enableAlpha
								enableStyle
								__next40pxDefaultSize
							/>
						</ToolsPanelItem>
						<ToolsPanelItem
							label={ __( 'Radius', 'jetpack' ) }
							hasValue={ () => !! blockBorderRadius }
							onDeselect={ () => setAttributes( { blockBorderRadius: undefined } ) }
							isShownByDefault
							panelId={ clientId }
						>
							<BorderRadiusControl
								values={ blockBorderRadius }
								onChange={ value => setAttributes( { blockBorderRadius: value } ) }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
		</>
	);
};

export default Controls;
