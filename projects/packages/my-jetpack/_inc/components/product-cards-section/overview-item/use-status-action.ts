import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import useConnectSite from '../../../hooks/use-connect-site';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import { overviewFrom } from '../../../utils/connect-url';
import useProductStatusAction from '../../action-button/use-product-status-action';
import useOverviewStatus from './use-overview-status';
import type { OverviewItemLink } from '.';

/**
 * The product card's action for the product's status, with the item's own label for adding or activating it.
 *
 * @param {JetpackModuleWithCard} slug          - The product slug.
 * @param {string}                label         - The label for activating the product.
 * @param {string | null}         [absentLabel] - The label for adding it while its plugin is missing, or null for the card's own.
 * @param {string}                [name]        - The product name for the connect link, if not the product's own.
 * @return {{action: OverviewItemLink | undefined, forcedOffReason: string | null}} The link, and why the host keeps the product off.
 */
const useStatusAction = (
	slug: JetpackModuleWithCard,
	label: string,
	absentLabel: string | null = label,
	name?: string
) => {
	const { detail, refetch } = useProduct( slug );
	const { isRegistered } = useMyJetpackConnection();
	const connectFrom = overviewFrom( slug );
	const { connectSite } = useConnectSite( {
		tracksInfo: {
			event: 'jetpack_myjetpack_product_card_fix_site_connection',
			properties: { from: connectFrom },
		},
		from: connectFrom,
	} );
	const primaryActionOverride = useMemo(
		() => ( {
			...( absentLabel ? { [ PRODUCT_STATUSES.ABSENT ]: { label: absentLabel } } : {} ),
			[ PRODUCT_STATUSES.INACTIVE ]: { label },
		} ),
		[ label, absentLabel ]
	);
	const { action, isBusy, forcedOffReason } = useProductStatusAction( slug, {
		primaryActionOverride,
		fixSiteConnectionHandler: connectSite,
		tracksIdentifier: 'product_card',
		from: connectFrom,
		showStateWithoutAccount: true,
	} );

	// Matches the product card, which refetches its product once the site is registered.
	const status = useOverviewStatus( slug );
	useEffect( () => {
		if ( isRegistered ) {
			refetch();
		}
	}, [ isRegistered, status, refetch ] );

	const { label: actionLabel, href, onClick, disabled } = action;
	const isConnectionError =
		status === PRODUCT_STATUSES.SITE_CONNECTION_ERROR ||
		status === PRODUCT_STATUSES.USER_CONNECTION_ERROR;
	const link: OverviewItemLink | undefined =
		disabled || ! actionLabel
			? undefined
			: {
					label: actionLabel,
					href,
					onClick: onClick && ( () => onClick( undefined ) ),
					disabled: isBusy,
					// "Connect" alone is ambiguous when several sections offer it.
					ariaLabel: isConnectionError
						? sprintf(
								/* translators: %s is a product name, such as Stats. */
								__( 'Connect %s', 'jetpack-my-jetpack' ),
								name ?? detail?.name
							)
						: undefined,
				};

	return { action: link, forcedOffReason };
};

export default useStatusAction;
