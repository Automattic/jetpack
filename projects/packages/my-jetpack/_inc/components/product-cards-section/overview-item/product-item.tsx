import { __, sprintf } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import useOverviewLoadEvent from './use-overview-load-event';
import useStatusAction from './use-status-action';
import OverviewItem, { isHealthyStatus } from '.';
import type { OverviewItemLink, OverviewItemProps } from '.';
import type { FC } from 'react';

type ProductOverviewItemProps = {
	slug: JetpackModuleWithCard;
	admin: boolean;
	actionLabel: string;
	upgradeLabel?: string;
	// The rest lets a product show what its card shows.
	label?: string;
	value?: string;
	statusLabel?: string;
	isLoading?: boolean;
	loadTracks?: Record< Lowercase< string >, unknown >;
	action?: OverviewItemLink | null;
	error?: OverviewItemProps[ 'error' ];
};

/**
 * An Overview item for a product: its value or status, its main link, and an upgrade link on a free plan.
 *
 * @param {ProductOverviewItemProps} props - Component props.
 * @return {import('react').JSX.Element} The item.
 */
const ProductOverviewItem: FC< ProductOverviewItemProps > = ( {
	slug,
	admin,
	actionLabel,
	upgradeLabel = __( 'Upgrade', 'jetpack-my-jetpack' ),
	label,
	value,
	statusLabel,
	isLoading: isValueLoading = false,
	loadTracks,
	action: actionOverride,
	error,
} ) => {
	const { detail, isLoading: isProductLoading } = useProduct( slug );
	const { name = '', status, manageUrl, purchaseUrl } = detail || {};
	const isLoading = isProductLoading || isValueLoading;
	const { recordEvent } = useAnalytics();
	const { action: statusAction, forcedOffReason } = useStatusAction(
		slug,
		/* translators: %s is a product name, such as Social. */
		sprintf( __( 'Activate %s', 'jetpack-my-jetpack' ), name ),
		null
	);
	useOverviewLoadEvent( slug, isLoading, loadTracks );

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
		if ( status === PRODUCT_STATUSES.CAN_UPGRADE ) {
			upgrade = {
				label: upgradeLabel,
				href: purchaseUrl || `#/add-${ slug }`,
				onClick: () => recordEvent( 'jetpack_myjetpack_product_card_add_click', { product: slug } ),
			};
		}
	}
	if ( actionOverride !== undefined ) {
		action = actionOverride ?? undefined;
	}

	return (
		<OverviewItem
			slug={ slug }
			admin={ admin }
			label={ label ?? name }
			value={ value }
			action={ action }
			upgrade={ upgrade }
			isLoading={ isLoading }
			forcedOffReason={ forcedOffReason }
			statusLabel={ statusLabel }
			error={ error }
		/>
	);
};

export default ProductOverviewItem;
