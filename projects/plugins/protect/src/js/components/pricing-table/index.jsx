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
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useConnectSiteMutation from '../../data/use-connection-mutation';
import useProductDataQuery from '../../data/use-product-data-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';

/**
 * Product Detail component.
 *
 * @return {object}                ConnectedPricingTable react component.
 */
const ConnectedPricingTable = () => {
	const navigate = useNavigate();
	const { recordEvent } = useAnalyticsTracks();
	const connectSiteMutation = useConnectSiteMutation();
	const { upgradePlan, isLoading: isPlanLoading } = usePlan();
	const { registrationError } = useConnection( {
		skipUserConnection: true,
	} );

	// Access paid protect product data
	const { data: jetpackScan } = useProductDataQuery();
	const { pricingForUi } = jetpackScan;
	const { introductoryOffer, currencyCode: currency = 'USD' } = pricingForUi;

	// Compute the price per month.
	const price = pricingForUi.cost ? Math.ceil( ( pricingForUi.cost / 12 ) * 100 ) / 100 : null;
	const offPrice = introductoryOffer?.costPerInterval
		? Math.ceil( ( introductoryOffer.costPerInterval / 12 ) * 100 ) / 100
		: null;

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_pricing_table_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	const getProtectFree = useCallback( async () => {
		recordEvent( 'jetpack_protect_connected_product_activated' );
		await connectSiteMutation.mutateAsync();
		navigate( '/scan' );
	}, [ connectSiteMutation, recordEvent, navigate ] );

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
							isLoading={ isPlanLoading }
							disabled={ isPlanLoading || connectSiteMutation.isPending }
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
							isLoading={ connectSiteMutation.isPending }
							disabled={ connectSiteMutation.isPending || isPlanLoading }
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
