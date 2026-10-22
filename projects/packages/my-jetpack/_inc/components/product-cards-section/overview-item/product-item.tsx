import { __, sprintf } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import useOverviewLoadEvent from './use-overview-load-event';
import useStatusAction from './use-status-action';
import OverviewItem, { isHealthyStatus } from '.';
import type { OverviewItemLink } from '.';
import type { FC } from 'react';

type ProductOverviewItemProps = {
	slug: JetpackModuleWithCard;
	admin: boolean;
	actionLabel: string;
	upgradeLabel?: string;
};

/**
 * An Overview item for a product with no number to show: its status, its main link, and an upgrade link on a free plan.
 *
 * @param {ProductOverviewItemProps} props - Component props.
 * @return {import('react').JSX.Element} The item.
 */
const ProductOverviewItem: FC< ProductOverviewItemProps > = ( {
	slug,
	admin,
	actionLabel,
	upgradeLabel,
} ) => {
	const { detail, isLoading } = useProduct( slug );
	const { name = '', status, manageUrl } = detail || {};
	const { recordEvent } = useAnalytics();
	const { action: statusAction, forcedOffReason } = useStatusAction(
		slug,
		/* translators: %s is a product name, such as Social. */
		sprintf( __( 'Activate %s', 'jetpack-my-jetpack' ), name )
	);
	useOverviewLoadEvent( slug, isLoading );

	let action: OverviewItemLink | undefined = statusAction;
	let upgrade: OverviewItemLink | undefined;
	if ( isHealthyStatus( slug, status ) ) {
		action = manageUrl
			? {
					label: actionLabel,
					href: manageUrl,
					onClick: () =>
						recordEvent( 'jetpack_myjetpack_product_card_manage_click', { product: slug } ),
				}
			: undefined;
		if ( upgradeLabel && status === PRODUCT_STATUSES.CAN_UPGRADE ) {
			upgrade = {
				label: upgradeLabel,
				href: `#/add-${ slug }`,
				onClick: () => recordEvent( 'jetpack_myjetpack_product_card_add_click', { product: slug } ),
			};
		}
	}

	return (
		<OverviewItem
			slug={ slug }
			admin={ admin }
			label={ name }
			action={ action }
			upgrade={ upgrade }
			isLoading={ isLoading }
			forcedOffReason={ forcedOffReason }
		/>
	);
};

export default ProductOverviewItem;
