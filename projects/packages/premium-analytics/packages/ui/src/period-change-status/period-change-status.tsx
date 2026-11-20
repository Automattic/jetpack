/**
 * External dependencies
 */
import { type PeriodChange } from '@jetpack-premium-analytics/data';
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatDateRangeNatural } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';

export type PeriodChangeStatusProps = {
	/** The period change to announce; each new id is read out. */
	periodChange?: PeriodChange;
};

/**
 * A live region announcing a period a widget set, for readers who cannot
 * see the trigger draw attention to itself. Mount it where it outlives the
 * navigation: a region announces only changes made after it exists.
 */
export function PeriodChangeStatus( { periodChange }: PeriodChangeStatusProps ) {
	return (
		<VisuallyHidden render={ <div /> } role="status">
			{ /* Keyed so a repeat of the same sentence is a new node, which a live region reads. */ }
			{ periodChange && (
				<span key={ periodChange.id }>
					{ sprintf(
						/* translators: %s: the period a widget set, e.g. "July 2026" */
						__( 'Date range updated to %s.', 'jetpack-premium-analytics-pkg' ),
						formatDateRangeNatural( periodChange.range )
					) }
				</span>
			) }
		</VisuallyHidden>
	);
}
