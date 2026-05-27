/**
 * `<WooCommercePanel>` — the wedge-market demo of the WordPress-trust-layer
 * pivot. Renders only when WooCommerce is detected; the strategy says
 * checkout fraud is the product-meaningful demo because it's measurable
 * in dollars.
 *
 * Three metric cards (orders flagged / blocked checkouts / chargebacks
 * averted) plus a top-signals collapsible. Methodology link points to
 * the (future) blackboxdocs page so the chargeback estimate is honest.
 */
import { Card, CardBody, CardHeader, ExternalLink, Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
import { useWooCommerceFraudSummary } from '@/hooks/use-woocommerce-fraud-summary';
import type { StatsInterval } from '@/lib/types';

type Props = { interval: StatsInterval };

/**
 * Format an integer with the locale's thousands separator.
 *
 * @param value - Number to format.
 * @return Formatted string.
 */
function formatNumber( value: number ): string {
	return new Intl.NumberFormat().format( value );
}

/**
 * Format a number as USD (no fractional cents — we round to dollars).
 *
 * @param value - Number of dollars.
 * @return Currency string.
 */
function formatUsd( value: number ): string {
	return new Intl.NumberFormat( undefined, {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	} ).format( value );
}

/**
 * Render the WooCommerce store-protection panel.
 *
 * @param props - The component props.
 * @return The rendered panel, or null when WC is absent.
 */
export function WooCommercePanel( props: Props ): JSX.Element | null {
	const { interval } = props;
	const wcActive = isWooCommerceActive();
	const { data, isLoading } = useWooCommerceFraudSummary( interval );

	if ( ! wcActive ) {
		return null;
	}

	if ( isLoading || ! data ) {
		return <Spinner />;
	}

	return (
		<section className="akismet-woocommerce-panel" aria-labelledby="akismet-wc-heading">
			<header className="akismet-woocommerce-panel__header">
				<h2 id="akismet-wc-heading">{ __( 'WooCommerce store protection', 'akismet' ) }</h2>
				{ data.preview && (
					<span className="akismet-woocommerce-panel__badge">
						{ __( 'preview data', 'akismet' ) }
					</span>
				) }
			</header>
			<p className="akismet-woocommerce-panel__lede">
				{ __( 'Fraud and abuse caught on your store before the order completes.', 'akismet' ) }
			</p>
			<div className="akismet-woocommerce-panel__metrics">
				<Card>
					<CardHeader>{ __( 'Orders flagged', 'akismet' ) }</CardHeader>
					<CardBody>{ formatNumber( data.orders_flagged ) }</CardBody>
				</Card>
				<Card>
					<CardHeader>{ __( 'Blocked checkouts', 'akismet' ) }</CardHeader>
					<CardBody>{ formatNumber( data.blocked_checkouts ) }</CardBody>
				</Card>
				<Card>
					<CardHeader>{ __( 'Chargebacks averted (est.)', 'akismet' ) }</CardHeader>
					<CardBody>
						{ formatUsd( data.estimated_chargebacks_averted_usd ) }
						<p className="akismet-woocommerce-panel__methodology">
							<ExternalLink href="https://blackboxdocs.wordpress.com/methodology-chargebacks-averted">
								{ __( 'How is this estimated?', 'akismet' ) }
							</ExternalLink>
						</p>
					</CardBody>
				</Card>
			</div>
			<details className="akismet-woocommerce-panel__signals">
				<summary>{ __( 'Top fraud signals', 'akismet' ) }</summary>
				<ul>
					{ data.top_signals.map( s => (
						<li key={ s.name }>
							<code>{ s.name }</code>
							<span>
								{ sprintf(
									/* translators: %s: count. */
									__( '%s hits', 'akismet' ),
									formatNumber( s.count )
								) }
							</span>
						</li>
					) ) }
				</ul>
			</details>
			<p className="akismet-woocommerce-panel__deep-link">
				<ExternalLink href="/wp-admin/admin.php?page=wc-admin&path=%2Fanalytics%2Forders">
					{ __( 'See full order analytics in WooCommerce →', 'akismet' ) }
				</ExternalLink>
			</p>
		</section>
	);
}
