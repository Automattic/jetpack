import { AdminPage, Col, Container } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import LoadingBlock from '../loading-block';
import { replaceLocation } from './replace-location';
import type { FC, ReactNode } from 'react';

// Pricing routes named for something other than the product a host is asked about.
const ROUTE_PRODUCTS: Record< string, string > = { akismet: 'anti-spam', scan: 'protect' };

type GateProps = { children: ReactNode };

// Holds a pricing route until its product's purchase data has loaded, then leaves for the host's plans or shows it.
const HostPurchaseHold: FC< GateProps & { slug: string } > = ( { slug, children } ) => {
	const { data, isLoading, isError, failureCount } = useAllProducts();
	const hostPurchaseUrl = data[ slug ]?.hostPurchaseUrl;
	// `isLoading` lasts through the retries; one failed attempt is enough to stop waiting.
	const isHolding = isLoading && ! isError && ! failureCount;

	useEffect( () => {
		if ( hostPurchaseUrl ) {
			// A replace, so Back from the host's plans does not land on this route and leave again.
			replaceLocation( hostPurchaseUrl );
		}
	}, [ hostPurchaseUrl ] );

	if ( ! hostPurchaseUrl && ! isHolding ) {
		return <>{ children }</>;
	}

	return (
		<AdminPage showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col>
					<div aria-busy="true">
						<LoadingBlock width="100%" height="75px" spaceBelow />
						<LoadingBlock width="100%" height="250px" />
					</div>
				</Col>
			</Container>
		</AdminPage>
	);
};

// Sends a product's `/add-*` pricing route to the host's own plans when the host sells the product.
const HostPurchaseGate: FC< GateProps > = ( { children } ) => {
	const { pathname } = useLocation();
	const route = pathname.match( /^\/add-([^/]+)/ )?.[ 1 ] ?? '';
	const slug = ROUTE_PRODUCTS[ route ] ?? route;
	// Page state, not a query: where no host can sell, the route shows at once and nothing is fetched for it.
	const { items } = getMyJetpackWindowInitialState( 'products' );

	return items?.[ slug ]?.host_may_sell ? (
		<HostPurchaseHold slug={ slug }>{ children }</HostPurchaseHold>
	) : (
		<>{ children }</>
	);
};

export default HostPurchaseGate;
