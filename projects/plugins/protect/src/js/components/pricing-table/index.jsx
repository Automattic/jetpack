import {
	Button,
	ProductPrice,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useState } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useNotices from '../../hooks/use-notices';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';

/**
 * Product Detail component.
 *
 * @return {object}                ConnectedPricingTable react component.
 */
const ConnectedPricingTable = () => {
	const { showErrorNotice } = useNotices();
	const { recordEvent } = useAnalyticsTracks();
	const { upgradePlan, isLoading: isPlanLoading } = usePlan();
	const { handleRegisterSite, registrationError } = useConnection( {
		from: 'protect',
		skipUserConnection: true,
		redirectUri: 'admin.php?page=jetpack-protect',
	} );

	// Track whether the connection process has started outside of the connection/checkout flows.
	// This flag is used to show the related actions as "busy" all the way until the post-connection/checkout redirect is complete.
	const [ hasConnectionStarted, setHasConnectionStarted ] = useState( false );
	const [ hasCheckoutStarted, setHasCheckoutStarted ] = useState( false );

	// Access paid protect product data
	const { jetpackScan } = useProtectData();
	const { pricingForUi } = jetpackScan;
	const { introductoryOffer, currencyCode: currency = 'USD' } = pricingForUi;

	// Compute the price per month.
	const price = pricingForUi.cost ? Math.ceil( ( pricingForUi.cost / 12 ) * 100 ) / 100 : null;
	const offPrice = introductoryOffer?.costPerInterval
		? Math.ceil( ( introductoryOffer.costPerInterval / 12 ) * 100 ) / 100
		: null;

	const getScan = useCallback( () => {
		setHasCheckoutStarted( true );
		recordEvent( 'jetpack_protect_pricing_table_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	const getProtectFree = useCallback( async () => {
		setHasConnectionStarted( true );
		recordEvent( 'jetpack_protect_connected_product_activated' );
		try {
			await handleRegisterSite();
		} catch {
			showErrorNotice( __( 'Could not connect site.', 'jetpack-protect' ) );
			setHasConnectionStarted( false );
		}
	}, [ handleRegisterSite, recordEvent, showErrorNotice ] );

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
				name: __( 'Account protection', 'jetpack-protect' ),
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
							isLoading={ hasCheckoutStarted }
							disabled={ isPlanLoading || hasCheckoutStarted }
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
							isLoading={ hasConnectionStarted }
							disabled={ isPlanLoading || hasConnectionStarted }
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
