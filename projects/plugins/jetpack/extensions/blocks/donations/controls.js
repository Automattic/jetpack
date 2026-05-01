import { CURRENCIES } from '@automattic/format-currency';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { AlignmentControl, BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	Dashicon,
	Dropdown,
	ExternalLink,
	MenuGroup,
	MenuItem,
	PanelBody,
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
	SUPPORTED_CURRENCIES,
} from '../../shared/currencies';

const Controls = props => {
	const { attributes, setAttributes } = props;
	const {
		currency,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
		showCustomAmount,
		contentAlignment,
	} = attributes;

	const toggleDonation = ( interval, show ) => {
		const donationAttributes = {
			'one-time': 'oneTimeDonation',
			'1 month': 'monthlyDonation',
			'1 year': 'annualDonation',
		};
		const donationAttribute = donationAttributes[ interval ];
		const donation = attributes[ donationAttribute ];

		setAttributes( {
			[ donationAttribute ]: {
				...donation,
				show,
			},
		} );
	};

	const oneTimeOn = oneTimeDonation.show !== false;
	const monthlyOn = !! monthlyDonation.show;
	const annualOn = !! annualDonation.show;
	const enabledIntervalCount = ( oneTimeOn ? 1 : 0 ) + ( monthlyOn ? 1 : 0 ) + ( annualOn ? 1 : 0 );
	const lastEnabledHelp = __( 'At least one frequency must be enabled.', 'jetpack' );

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
					<ExternalLink href={ `https://wordpress.com/earn/payments/${ getSiteFragment() }` }>
						{ __( 'View donation earnings', 'jetpack' ) }
					</ExternalLink>
				</PanelBody>
			</InspectorControls>
		</>
	);
};

export default Controls;
