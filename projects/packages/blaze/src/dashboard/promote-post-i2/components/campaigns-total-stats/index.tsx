import { formatNumberCompact } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import { Skeleton } from '@wordpress/ui';
import './style.scss';

type Props = {
	totalImpressions?: number;
	totalClicks?: number;
	isLoading?: boolean;
	outerContainerClass?: string;
};

/**
 * The Performance card: total ad views and clicks across campaigns.
 *
 * @param props                     - Props.
 * @param props.totalImpressions    - Total ad views.
 * @param props.totalClicks         - Total clicks.
 * @param props.isLoading           - Whether the totals are still loading.
 * @param props.outerContainerClass - Class for the wrapper.
 * @return The card.
 */
export default function CampaignsTotalStats( {
	totalImpressions,
	totalClicks,
	isLoading = false,
	outerContainerClass,
}: Props ) {
	const placeholder = <Skeleton className="campaigns-total-stats__placeholder" />;

	return (
		<div className={ outerContainerClass }>
			<div className="campaigns-total-stats__container">
				<div className="campaigns-total-stats__header">
					<div className="campaigns-total-stats__title">
						{ __( 'Performance', 'jetpack-blaze' ) }
					</div>
				</div>
				<div className="campaigns-total-stats__items">
					<div className="campaigns-total-stats__item">
						<div className="campaigns-total-stats__label">
							{ __( 'Total ad views', 'jetpack-blaze' ) }
						</div>
						<div className="campaigns-total-stats__result">
							{ isLoading
								? placeholder
								: formatNumberCompact( totalImpressions || 0, {
										numberFormatOptions: { maximumFractionDigits: 3 },
									} ) }
						</div>
					</div>
					<div className="campaigns-total-stats__item">
						<div className="campaigns-total-stats__label">
							{ __( 'Total clicks', 'jetpack-blaze' ) }
						</div>
						<div className="campaigns-total-stats__result">
							{ isLoading
								? placeholder
								: formatNumberCompact( totalClicks || 0, {
										numberFormatOptions: { maximumFractionDigits: 1 },
									} ) }
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
