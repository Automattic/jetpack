import type { ReactElement, ReactNode } from 'react';

export type Props = {
	// The Title
	title?: string;
	// The Connect Button label
	buttonLabel?: string;
	// API root
	apiRoot: string;
	// API nonce
	apiNonce: string;
	// Registration nonce
	registrationNonce: string;
	// Where the connection request is coming from
	from?: string;
	// The redirect admin URI
	redirectUri: string;
	// Whether to initiate the connection process automatically upon rendering the component
	autoTrigger?: boolean;
	// Additional page elements to show before the call to action
	children?: ReactNode;
	// The Pricing Card Title
	pricingTitle: string;
	// The Pricing Card Icon
	pricingIcon?: string | ReactElement;
	// Price before discount
	priceBefore: number;
	// Price after discount
	priceAfter: number;
	// The Currency code, eg 'USD'
	pricingCurrencyCode?: string;
	// The WordPress.com product slug. If specified, the connection/authorization flow will go
	// through the Checkout page for this product.
	wpcomProductSlug?: string;
	// A callback that will be used to check whether the site already has the wpcomProductSlug.
	// This will be checked after registration and the checkout will be skipped if it returns true.
	siteProductAvailabilityHandler?: ( () => Promise< boolean > | boolean ) | null;
	// The logo to display at the top of the component
	logo?: ReactNode;
	// Whether to apply RNA styles
	rna?: boolean;
};
