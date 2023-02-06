import { CURRENCIES } from '@automattic/format-currency';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	Dashicon,
	Dropdown,
	ExternalLink,
	MenuGroup,
	MenuItem,
	PanelBody,
	ToggleControl,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import { SUPPORTED_CURRENCIES } from '../../shared/currencies';

const Controls = props => {
	const { attributes, setAttributes } = props;
	const { currency, monthlyDonation, annualDonation, showCustomAmount } = attributes;

	const toggleDonation = ( interval, show ) => {
		const donationAttributes = {
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

	return (
		<>
			<BlockControls>
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
										<Button
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
												onClick={ () => {
													setAttributes( { currency: ccy } );
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
						checked={ monthlyDonation.show }
						onChange={ value => toggleDonation( '1 month', value ) }
						label={ __( 'Show monthly donations', 'jetpack' ) }
					/>
					<ToggleControl
						checked={ annualDonation.show }
						onChange={ value => toggleDonation( '1 year', value ) }
						label={ __( 'Show annual donations', 'jetpack' ) }
					/>
					<ToggleControl
						checked={ showCustomAmount }
						onChange={ value => setAttributes( { showCustomAmount: value } ) }
						label={ __( 'Show custom amount option', 'jetpack' ) }
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
