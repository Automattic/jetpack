export interface UseProductCheckoutWorkflowProps {
	/** The WordPress product slug. */
	productSlug: string;
	/** The URI to redirect to after checkout. */
	redirectUrl: string;
	/** The site suffix. */
	siteSuffix?: string;
	/** The site wp-admin url. */
	adminUrl?: string;
	/** Whether or not to connect after checkout if not connected (default false - connect before). */
	connectAfterCheckout?: boolean;
	/** The function used to check whether the site already has the requested product. This will be checked after registration and the checkout page will be skipped if the promise returned resolves true. */
	siteProductAvailabilityHandler?: ( () => Promise< boolean > | boolean ) | null;
	/** The plugin slug that initiated the flow. */
	from: string;
	/** The quantity of the product to purchase. */
	quantity?: number | null;
	/** Use blog ID instead of site suffix in the checkout URL. */
	useBlogIdSuffix?: boolean;
}
