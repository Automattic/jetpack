import { __ } from '@wordpress/i18n';
import { Skeleton, VisuallyHidden } from '@wordpress/ui';

const WIDTHS = [ '62%', '48%', '70%', '55%', '40%' ];

/**
 * Placeholder rows shaped like the History list, shown while Scan history loads.
 *
 * @param props            - Component props.
 * @param props.rows       - How many rows to show.
 * @param props.showFilter - Whether to show the Fixed and Ignored tabs' placeholder.
 * @return The placeholder.
 */
export default function HistorySkeleton( {
	rows = WIDTHS.length,
	showFilter = true,
}: {
	rows?: number;
	showFilter?: boolean;
} ) {
	return (
		<div className="jp-protect-history-skeleton" aria-busy="true">
			<VisuallyHidden>{ __( 'Loading scan history…', 'jetpack-protect-pkg' ) }</VisuallyHidden>
			{ showFilter && (
				<div className="jp-protect-history-skeleton__filter" aria-hidden="true">
					<Skeleton className="jp-protect-history-skeleton__tab" />
					<Skeleton className="jp-protect-history-skeleton__tab" />
				</div>
			) }
			{ Array.from( { length: rows }, ( _, index ) => WIDTHS[ index % WIDTHS.length ] ).map(
				( width, index ) => (
					<div key={ index } className="jp-protect-history-skeleton__row" aria-hidden="true">
						<Skeleton className="jp-protect-history-skeleton__badge" />
						<Skeleton className="jp-protect-history-skeleton__icon" />
						<div className="jp-protect-history-skeleton__label">
							<Skeleton
								className="jp-protect-history-skeleton__text"
								style={ { inlineSize: width } }
							/>
							<Skeleton className="jp-protect-history-skeleton__subtext" />
						</div>
						<Skeleton className="jp-protect-history-skeleton__date" />
					</div>
				)
			) }
		</div>
	);
}
