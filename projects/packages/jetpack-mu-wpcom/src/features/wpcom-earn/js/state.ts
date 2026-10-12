export interface InitialState {
	/** The site's domain, which Calypso and the WordPress.com APIs address it by. */
	domain: string;
	/** The site's WordPress.com blog ID. */
	blogId: number;
	siteUrl: string;
	/** Atomic sites reach WordPress.com through the page's proxy; Simple sites reach it directly. */
	isAtomic: boolean;
	/** Whether the site's plan includes each feature the page branches on. */
	features: {
		wordads: boolean;
		simplePayments: boolean;
		donations: boolean;
		premiumContent: boolean;
		recurringPayments: boolean;
	};
	/** Whether the site is running WordAds, not just eligible for it. */
	wordadsEnabled: boolean;
}

declare global {
	interface Window {
		wpcomEarnInitialState?: InitialState;
	}
}

/**
 * Read the state PHP printed onto the page.
 *
 * @return The initial state, or one that offers nothing if the global is absent.
 */
export function getInitialState(): InitialState {
	return (
		window.wpcomEarnInitialState ?? {
			domain: window.location.hostname,
			blogId: 0,
			siteUrl: window.location.origin,
			isAtomic: false,
			features: {
				wordads: false,
				simplePayments: false,
				donations: false,
				premiumContent: false,
				recurringPayments: false,
			},
			wordadsEnabled: false,
		}
	);
}
