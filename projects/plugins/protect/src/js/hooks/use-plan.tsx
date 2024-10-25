import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { createContext, useContext, useState, useCallback } from 'react';
import API from '../api';
import { JETPACK_SCAN_SLUG } from '../constants';
import usePlanQuery from '../data/use-has-plan-query';

type CheckoutContextType = {
	hasCheckoutStarted: boolean;
	setHasCheckoutStarted: ( hasCheckoutStarted: boolean ) => void;
};

const CheckoutContext = createContext< CheckoutContextType >( {
	hasCheckoutStarted: false,
	setHasCheckoutStarted: () => {},
} );

export const CheckoutProvider = ( { children } ) => {
	const [ hasCheckoutStarted, setHasCheckoutStarted ] = useState( false );

	return (
		<CheckoutContext.Provider
			value={ {
				hasCheckoutStarted,
				setHasCheckoutStarted,
			} }
		>
			{ children }
		</CheckoutContext.Provider>
	);
};

export const useCheckoutContext = () => useContext( CheckoutContext );

/**
 * Plan hook.
 *
 * Provides data and functions related to the site's current plan.
 *
 * @param {object} props             - Hook props.
 * @param {string} props.redirectUrl - Post-checkout redirect URL.
 *
 * @return {object} Hook data
 */
export default function usePlan( { redirectUrl }: { redirectUrl?: string } = {} ) {
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { data: hasPlan, isLoading: isPlanLoading } = usePlanQuery();
	const { hasCheckoutStarted, setHasCheckoutStarted } = useCheckoutContext();

	const { run: checkout } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: redirectUrl || adminUrl,
		siteProductAvailabilityHandler: API.checkPlan,
		useBlogIdSuffix: true,
		connectAfterCheckout: false,
		from: () => 'protect',
	} ) as unknown as {
		run: ( event?: Event, redirect?: string ) => void;
		isRegistered: boolean;
		hasCheckoutStarted: boolean;
	};

	const upgradePlan = useCallback( () => {
		setHasCheckoutStarted( true );
		checkout();
	}, [ checkout, setHasCheckoutStarted ] );

	return {
		hasPlan,
		upgradePlan,
		isLoading: isPlanLoading || hasCheckoutStarted,
	};
}
