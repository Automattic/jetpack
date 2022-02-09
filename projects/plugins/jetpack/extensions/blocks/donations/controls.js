/**
 * External dependencies
 */
import { CURRENCIES } from '@automattic/format-currency';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';

/**
 * WordPress dependencies
 */
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
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { DOWN } from '@wordpress/keycodes';

/**
 * External dependencies
 */
import getSiteFragment from '../../shared/get-site-fragment';

/**
 * Internal dependencies
 */
import { ANNUAL_DONATION, MONTHLY_DONATION } from './common/constants';
import { CURRENCIES } from '@automattic/format-currency';
import { SUPPORTED_CURRENCIES } from '../../shared/currencies';

const Controls = props => {
	const { attributes, setAttributes, onChangeTab } = props;
	const { showCustomAmount, currency } = attributes;

	const toggleDonation = ( donationType, show ) => {
		setAttributes( { [ donationType ]: show } );
		onChangeTab( donationType, show );
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
						checked={ attributes[ MONTHLY_DONATION ] }
						onChange={ value => toggleDonation( MONTHLY_DONATION, value ) }
						label={ __( 'Show monthly donations', 'jetpack' ) }
					/>
					<ToggleControl
						checked={ attributes[ ANNUAL_DONATION ] }
						onChange={ value => toggleDonation( ANNUAL_DONATION, value ) }
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
