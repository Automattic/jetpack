/**
 * `<CategoryCard>` — one card per category in the Overview grid.
 *
 * Three states (the IA-load-bearing element of this plan):
 *   - active        — real numbers + sparkline + drill-down link
 *   - preview       — same as active, plus a "preview data" badge so
 *                     reviewers don't conflate mocks with real data
 *   - not-active-here — empty state explaining the missing prerequisite
 *                     (e.g., Checkouts requires WooCommerce)
 */
import { Button, Card, CardBody, CardHeader, Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCategorySummary } from '@/hooks/use-category-summary';
import { CATEGORIES, type CategoryId } from '@/routes/overview/category-config';
import { CategorySparkline } from '@/routes/overview/category-sparkline';
import type { StatsInterval } from '@/lib/types';

type Props = {
	id: CategoryId;
	interval: StatsInterval;
	onDrillDown: ( id: CategoryId ) => void;
};

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
 * Render one category card.
 *
 * @param props - The component props.
 * @return The rendered card.
 */
export function CategoryCard( props: Props ): JSX.Element {
	const { id, interval, onDrillDown } = props;
	const def = CATEGORIES.find( c => c.id === id );
	if ( ! def ) {
		throw new Error( `Unknown category: ${ id }` );
	}
	const { data, isLoading } = useCategorySummary( id, interval );

	if ( isLoading || ! data ) {
		return (
			<Card className="akismet-category-card">
				<CardHeader>{ def.label }</CardHeader>
				<CardBody>
					<Spinner />
				</CardBody>
			</Card>
		);
	}

	if ( data.not_active_here ) {
		return (
			<Card className="akismet-category-card akismet-category-card--inactive">
				<CardHeader>{ def.label }</CardHeader>
				<CardBody>
					<p className="akismet-category-card__short">{ def.short }</p>
					<p className="akismet-category-card__empty">
						{ sprintf(
							/* translators: %s: integration prerequisite, e.g. "WooCommerce". */
							__( 'Not active here. Requires %s.', 'akismet' ),
							def.requires === 'woocommerce' ? 'WooCommerce' : def.requires ?? ''
						) }
					</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className="akismet-category-card">
			<CardHeader>
				<span className="akismet-category-card__title">{ def.label }</span>
				{ data.preview && (
					<span
						className="akismet-category-card__badge"
						title={ __(
							'Mocked data — the upstream signal source is not wired up on this site yet.',
							'akismet'
						) }
					>
						{ __( 'preview data', 'akismet' ) }
					</span>
				) }
			</CardHeader>
			<CardBody>
				<p className="akismet-category-card__short">{ def.short }</p>
				<dl className="akismet-category-card__stats">
					<div>
						<dt>{ __( 'Blocked', 'akismet' ) }</dt>
						<dd>{ formatNumber( data.blocked ) }</dd>
					</div>
					{ data.challenged > 0 && (
						<div>
							<dt>{ __( 'Challenged', 'akismet' ) }</dt>
							<dd>{ formatNumber( data.challenged ) }</dd>
						</div>
					) }
					{ data.passed > 0 && (
						<div>
							<dt>{ __( 'Passed challenge', 'akismet' ) }</dt>
							<dd>{ formatNumber( data.passed ) }</dd>
						</div>
					) }
				</dl>
				<CategorySparkline series={ data.series } label={ def.label } />
				<Button variant="tertiary" onClick={ () => onDrillDown( id ) } __next40pxDefaultSize>
					{ __( 'See activity →', 'akismet' ) }
				</Button>
			</CardBody>
		</Card>
	);
}
