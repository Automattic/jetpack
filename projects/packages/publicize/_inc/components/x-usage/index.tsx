import { PanelRow, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils';
import { FREE_PLAN_LIMIT, PAID_PLAN_LIMIT, WARNING_THRESHOLD } from './constants';
import styles from './styles.module.scss';
import { getCurrentPeriod, getResetDate } from './utils';
import { XUsageContent } from './x-usage-content';

/**
 * Panel showing X usage limits in the sidebar.
 * Only renders when the user has at least one X connection.
 *
 * @return The rendered X usage UI
 */
export function XUsage() {
	const hasXConnection = useSelect(
		select => select( socialStore ).getConnectionsByService( 'x' ).length > 0,
		[]
	);

	const isPaid = hasSocialPaidFeatures();
	const period = isPaid ? getCurrentPeriod() : 'free';

	const { usageItem, isFetching } = useSelect(
		select => ( {
			usageItem: select( socialStore ).getXUsageFor( period ),
			isFetching: select( socialStore ).isFetchingXUsage(),
		} ),
		[ period ]
	);

	if ( ! hasXConnection ) {
		return null;
	}

	if ( isFetching ) {
		return (
			<PanelRow className={ styles[ 'x-usage-panel' ] }>
				<Spinner />
			</PanelRow>
		);
	}

	const limit = isPaid ? PAID_PLAN_LIMIT : FREE_PLAN_LIMIT;
	const used = usageItem?.total ?? 0;
	const isAtLimit = used >= limit;
	const isNearLimit = used >= limit * WARNING_THRESHOLD;

	return (
		<PanelRow className={ styles[ 'x-usage-panel' ] }>
			<XUsageContent
				used={ used }
				limit={ limit }
				isAtLimit={ isAtLimit }
				isNearLimit={ isNearLimit }
				isPaid={ isPaid }
				resetDate={ isPaid ? getResetDate() : undefined }
			/>
		</PanelRow>
	);
}
