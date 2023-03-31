/**
 * External dependencies
 */
import {
	Button,
	ProductPrice,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useState } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';

/**
 * Product Detail component.
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @returns {object}                ConnectedPricingTable react component.
 */
const ConnectedPricingTable = ( { onScanAdd } ) => {
	const { handleRegisterSite, registrationError } = useConnection( {
		skipUserConnection: true,
	} );

	const { refreshPlan, refreshStatus } = useDispatch( STORE_ID );

	const [ getProtectFreeButtonIsLoading, setGetProtectFreeButtonIsLoading ] = useState( false );
	const [ getScanButtonIsLoading, setGetScanButtonIsLoading ] = useState( false );

	// Access paid protect product data
	const { jetpackScan } = useProtectData();
	const { refreshWaf } = useWafData();
	const { pricingForUi } = jetpackScan;
	const { introductoryOffer, currencyCode: currency = 'USD' } = pricingForUi;

	// Compute the price per month.
	const price = pricingForUi.cost ? Math.ceil( ( pricingForUi.cost / 12 ) * 100 ) / 100 : null;
	const offPrice = introductoryOffer?.costPerInterval
		? Math.ceil( ( introductoryOffer.costPerInterval / 12 ) * 100 ) / 100
		: null;

	// Track free and paid click events
	const { recordEvent, recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_pricing_table_get_scan_link_click', () => {
		setGetScanButtonIsLoading( true );
		onScanAdd();
	} );

	const getProtectFree = useCallback( () => {
		recordEvent( 'jetpack_protect_connected_product_activated' );
		setGetProtectFreeButtonIsLoading( true );
		handleRegisterSite()
			.then( () => setGetProtectFreeButtonIsLoading( false ) )
			.then( () => {
				refreshPlan();
				refreshWaf();
				refreshStatus( true );
			} );
	}, [ handleRegisterSite, recordEvent, refreshWaf, refreshPlan, refreshStatus ] );

	const args = {
		title: __( 'Stay one step ahead of threats', 'jetpack-protect' ),
		items: [
			{
				name: __( 'Scan for threats and vulnerabilities', 'jetpack-protect' ),
			},
			{
				name: __( 'Daily automated scans', 'jetpack-protect' ),
			},
			{
				name: __( 'Web Application Firewall', 'jetpack-protect' ),
			},
			{
				name: __( 'Brute force protection', 'jetpack-protect' ),
			},
			{
				name: __( 'Access to scan on Cloud', 'jetpack-protect' ),
			},
			{
				name: __( 'One-click auto fixes', 'jetpack-protect' ),
			},
			{
				name: __( 'Notifications', 'jetpack-protect' ),
			},
			{
				name: __( 'Severity labels', 'jetpack-protect' ),
			},
		],
	};

	return (
		<>
			<PricingTable { ...args }>
				<PricingTableColumn primary>
					<PricingTableHeader>
						<ProductPrice
							price={ price }
							offPrice={ offPrice }
							leyend={ __( '/month, billed yearly', 'jetpack-protect' ) }
							currency={ currency }
							hideDiscountLabel={ false }
						/>
						<Button
							fullWidth
							onClick={ getScan }
							isLoading={ getScanButtonIsLoading }
							disabled={ getProtectFreeButtonIsLoading || getScanButtonIsLoading }
						>
							{ __( 'Get Jetpack Protect', 'jetpack-protect' ) }
						</Button>
					</PricingTableHeader>
					<PricingTableItem
						isIncluded={ true }
						label={ <strong>{ __( 'Line by line malware scanning', 'jetpack-protect' ) }</strong> }
					/>
					<PricingTableItem
						isIncluded={ true }
						label={ <strong>{ __( 'Plus on-demand manual scans', 'jetpack-protect' ) }</strong> }
					/>
					<PricingTableItem
						isIncluded={ true }
						label={
							<strong>{ __( 'Automatic protection and rule updates', 'jetpack-protect' ) }</strong>
						}
					/>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
				</PricingTableColumn>
				<PricingTableColumn>
					<PricingTableHeader>
						<ProductPrice
							price={ 0 }
							leyend={ __( 'Free forever', 'jetpack-protect' ) }
							currency={ currency }
							hidePriceFraction
						/>
						<Button
							fullWidth
							variant="secondary"
							onClick={ getProtectFree }
							isLoading={ getProtectFreeButtonIsLoading }
							disabled={ getProtectFreeButtonIsLoading || getScanButtonIsLoading }
							error={
								registrationError
									? __( 'An error occurred. Please try again.', 'jetpack-protect' )
									: null
							}
						>
							{ __( 'Start for free', 'jetpack-protect' ) }
						</Button>
					</PricingTableHeader>
					<PricingTableItem
						isIncluded={ true }
						label={ __( 'Check items against database', 'jetpack-protect' ) }
					/>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem
						isIncluded={ true }
						label={ __( 'Manual rules only', 'jetpack-protect' ) }
					/>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ false } />
					<PricingTableItem isIncluded={ false } />
					<PricingTableItem isIncluded={ false } />
					<PricingTableItem isIncluded={ false } />
				</PricingTableColumn>
			</PricingTable>
		</>
	);
};

export default ConnectedPricingTable;
