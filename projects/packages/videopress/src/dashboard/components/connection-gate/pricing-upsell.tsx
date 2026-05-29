import AdminPage from '@automattic/jetpack-components/admin-page';
import Button from '@automattic/jetpack-components/button';
import PricingTable, {
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '@automattic/jetpack-components/pricing-table';
import ProductPrice from '@automattic/jetpack-components/product-price';
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
import { VIDEOPRESS_ADMIN_PAGE } from '../../utils/constants';
import './style.scss';

/**
 * Pre-connection upsell shown when the site isn't registered yet. A port of the
 * legacy dashboard's pricing table (`PricingSection`): the paid column drives
 * `useProductCheckoutWorkflow` (Get VideoPress), the free column registers the
 * site and connects the user via `useConnection` (Start for free). Reads the
 * product/price payload from `JPVIDEOPRESS_INITIAL_STATE.pricing`, which the
 * server only populates for disconnected sites.
 *
 * Returns null when the pricing payload is absent (e.g. the WPCOM price request
 * failed); the gate renders the plain connect screen in that case.
 *
 * @return The pricing table element, or null when pricing data is unavailable.
 */
export default function PricingUpsell() {
	const state =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' ? JPVIDEOPRESS_INITIAL_STATE : undefined;
	const pricing = state?.pricing;
	const siteSuffix = state?.jetpackStatus?.calypsoSlug ?? '';
	const redirectUrl = VIDEOPRESS_ADMIN_PAGE;

	// These hooks must run unconditionally (Rules of Hooks) and therefore precede
	// the `! pricing` guard below, which the gate already makes unreachable in
	// practice — so the assignments are never actually wasted.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const [ isConnecting, setIsConnecting ] = useState( false );

	const { handleRegisterSite, userIsConnecting } = useConnection( {
		from: 'jetpack-videopress',
		redirectUri: redirectUrl,
	} );

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: pricing?.yearly?.slug ?? '',
		redirectUrl,
		siteSuffix,
		useBlogIdSuffix: true,
		from: 'jetpack-videopress',
	} );

	if ( ! pricing ) {
		return null;
	}

	const { title, features, yearly } = pricing;
	const pricingItems = features.map( feature => ( { name: feature } ) );

	return (
		<AdminPage
			title={ 'VideoPress' /* product name; not translated */ }
			subTitle={ __( 'Professional quality, ad-free video hosting.', 'jetpack-videopress-pkg' ) }
		>
			<div className="vp-connection-gate__upsell">
				<PricingTable title={ title } items={ pricingItems }>
					<PricingTableColumn primary>
						<PricingTableHeader>
							<ProductPrice
								offPrice={ yearly.discount ? yearly.salePriceByMonth : undefined }
								price={ yearly.priceByMonth }
								promoLabel={
									yearly.discount
										? sprintf(
												/* translators: %1$s: the discount amount */
												__( '%1$s%% off', 'jetpack-videopress-pkg' ),
												String( yearly.discount )
										  )
										: undefined
								}
								legend={ __( '/month, billed yearly', 'jetpack-videopress-pkg' ) }
								currency={ yearly.currency }
							/>
							<Button
								onClick={ () => run() }
								isLoading={ hasCheckoutStarted }
								fullWidth
								disabled={ isConnecting || hasCheckoutStarted || userIsConnecting }
							>
								{ __( 'Get VideoPress', 'jetpack-videopress-pkg' ) }
							</Button>
						</PricingTableHeader>
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded />
					</PricingTableColumn>
					<PricingTableColumn>
						<PricingTableHeader>
							<ProductPrice price={ 0 } legend="" currency={ yearly.currency } hidePriceFraction />
							<Button
								fullWidth
								variant="secondary"
								onClick={ () => {
									setIsConnecting( true );
									handleRegisterSite();
								} }
								isLoading={ userIsConnecting || isConnecting }
								disabled={ userIsConnecting || isConnecting || hasCheckoutStarted }
							>
								{ __( 'Start for free', 'jetpack-videopress-pkg' ) }
							</Button>
						</PricingTableHeader>
						<PricingTableItem
							isIncluded={ false }
							label={ <strong>{ __( 'Upload one video', 'jetpack-videopress-pkg' ) }</strong> }
						/>
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded={ false } />
						<PricingTableItem isIncluded={ false } />
					</PricingTableColumn>
				</PricingTable>
			</div>
		</AdminPage>
	);
}
