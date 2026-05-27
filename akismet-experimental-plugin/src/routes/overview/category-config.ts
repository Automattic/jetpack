/**
 * Single source of truth for the six categories the Overview tab renders.
 *
 * Each `<CategoryCard>` looks up its definition by id; the `fetch` field
 * tells `useCategorySummary` which adapter to dispatch to. Keep this list
 * the canonical render order — the grid maps it 1:1.
 *
 * Adding a category requires three coordinated changes:
 *   1. New entry here with a unique id + fetch dispatch.
 *   2. (If `blackbox-aggregates`) extend the PHP enum on
 *      `Akismet_Experimental_REST_API::register_routes` and the matching
 *      `BlackboxCategory` union in `src/lib/types.ts`.
 *   3. Adapter coverage in `src/lib/category-adapters.ts`.
 */
import { __ } from '@wordpress/i18n';
import type { BlackboxCategory } from '@/lib/types';

export type CategoryId = 'comments' | 'forms' | 'logins' | 'checkouts' | 'bots' | 'brute-force';

export type CategoryFetch =
	| { kind: 'akismet-stats' }
	| { kind: 'blackbox-aggregates'; category: BlackboxCategory }
	| { kind: 'woocommerce-fraud' };

export type CategoryDefinition = {
	id: CategoryId;
	label: string;
	icon: 'admin-comments' | 'feedback' | 'lock' | 'cart' | 'shield' | 'shield-alt';
	short: string;
	source: 'akismet-content' | 'blackbox' | 'woocommerce-fraud' | 'akismet-content+blackbox';
	fetch: CategoryFetch;
	requires?: 'woocommerce';
	drillDownTab: 'activity';
};

export const CATEGORIES: ReadonlyArray< CategoryDefinition > = [
	{
		id: 'comments',
		label: __( 'Comments', 'akismet' ),
		icon: 'admin-comments',
		short: __( 'Spam blocked on comment forms.', 'akismet' ),
		source: 'akismet-content',
		fetch: { kind: 'akismet-stats' },
		drillDownTab: 'activity',
	},
	{
		id: 'forms',
		label: __( 'Forms', 'akismet' ),
		icon: 'feedback',
		short: __( 'Spam blocked on contact, signup, and custom forms.', 'akismet' ),
		source: 'akismet-content+blackbox',
		fetch: { kind: 'blackbox-aggregates', category: 'forms' },
		drillDownTab: 'activity',
	},
	{
		id: 'logins',
		label: __( 'Logins', 'akismet' ),
		icon: 'lock',
		short: __( 'Credential stuffing and account-takeover attempts.', 'akismet' ),
		source: 'blackbox',
		fetch: { kind: 'blackbox-aggregates', category: 'logins' },
		drillDownTab: 'activity',
	},
	{
		id: 'checkouts',
		label: __( 'Checkouts & Fraud', 'akismet' ),
		icon: 'cart',
		short: __( 'Fraudulent orders and carding attempts on WooCommerce.', 'akismet' ),
		source: 'woocommerce-fraud',
		fetch: { kind: 'woocommerce-fraud' },
		requires: 'woocommerce',
		drillDownTab: 'activity',
	},
	{
		id: 'bots',
		label: __( 'Bots', 'akismet' ),
		icon: 'shield',
		short: __( 'Automated traffic and scraping.', 'akismet' ),
		source: 'blackbox',
		fetch: { kind: 'blackbox-aggregates', category: 'bots' },
		drillDownTab: 'activity',
	},
	{
		id: 'brute-force',
		label: __( 'Brute-force', 'akismet' ),
		icon: 'shield-alt',
		short: __( 'Password spray and rate-limit-exceeding attacks.', 'akismet' ),
		source: 'blackbox',
		fetch: { kind: 'blackbox-aggregates', category: 'brute-force' },
		drillDownTab: 'activity',
	},
];
