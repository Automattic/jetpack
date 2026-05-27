/**
 * `<CategoryCard>` — one card per category in the Overview grid.
 *
 * Three states (the IA-load-bearing element of this plan):
 *   - active        — real numbers + sparkline + drill-down link
 *   - preview       — same as active, plus a "preview data" pill so
 *                     reviewers don't conflate mocks with real data
 *   - not-active-here — empty state explaining the missing prerequisite
 *                     (e.g., Checkouts requires WooCommerce)
 *
 * Markup is a plain div tree (not `@wordpress/components` Card) so we
 * own the visual hierarchy and can match modern WP.com / Calypso card
 * conventions: 1px hairline border, 28px icon tile, tabular-nums on
 * every count. Styles live in src/styles/overview.scss.
 */
import { Spinner } from '@wordpress/components';
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

	const Icon = (
		<span className="akismet-category-card__icon" aria-hidden="true">
			<span className={ `dashicons dashicons-${ def.icon }` } />
		</span>
	);

	if ( isLoading || ! data ) {
		return (
			<article className="akismet-category-card akismet-category-card--loading">
				<Spinner />
			</article>
		);
	}

	if ( data.not_active_here ) {
		return (
			<article className="akismet-category-card akismet-category-card--inactive">
				<header className="akismet-category-card__header">
					{ Icon }
					<h3 className="akismet-category-card__title">{ def.label }</h3>
				</header>
				<p className="akismet-category-card__short">{ def.short }</p>
				<p className="akismet-category-card__empty">
					<span className="dashicons dashicons-warning" aria-hidden="true" />
					{ sprintf(
						/* translators: %s: integration prerequisite, e.g. "WooCommerce". */
						__( 'Not active here. Requires %s.', 'akismet' ),
						def.requires === 'woocommerce' ? 'WooCommerce' : def.requires ?? ''
					) }
				</p>
			</article>
		);
	}

	return (
		<article className="akismet-category-card">
			<header className="akismet-category-card__header">
				{ Icon }
				<h3 className="akismet-category-card__title">{ def.label }</h3>
				{ data.preview && (
					<span
						className="akismet-category-card__badge"
						title={ __(
							'Mocked data — the upstream signal source is not wired up on this site yet.',
							'akismet'
						) }
					>
						{ __( 'Preview', 'akismet' ) }
					</span>
				) }
			</header>

			<p className="akismet-category-card__short">{ def.short }</p>

			<p className="akismet-category-card__primary">
				<span className="akismet-category-card__primary-value">
					{ formatNumber( data.blocked ) }
				</span>
				<span className="akismet-category-card__primary-label">{ __( 'Blocked', 'akismet' ) }</span>
			</p>

			{ ( data.challenged > 0 || data.passed > 0 ) && (
				<dl className="akismet-category-card__secondary">
					{ data.challenged > 0 && (
						<div className="akismet-category-card__secondary-item">
							<dt>{ __( 'Challenged', 'akismet' ) }</dt>
							<dd>{ formatNumber( data.challenged ) }</dd>
						</div>
					) }
					{ data.passed > 0 && (
						<div className="akismet-category-card__secondary-item">
							<dt>{ __( 'Passed', 'akismet' ) }</dt>
							<dd>{ formatNumber( data.passed ) }</dd>
						</div>
					) }
				</dl>
			) }

			<CategorySparkline series={ data.series } label={ def.label } />

			<div className="akismet-category-card__footer">
				<button
					type="button"
					className="akismet-category-card__drill"
					onClick={ () => onDrillDown( id ) }
				>
					{ __( 'See activity', 'akismet' ) }
					<span aria-hidden="true">→</span>
				</button>
			</div>
		</article>
	);
}
