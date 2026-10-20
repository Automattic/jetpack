import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Badge, Button, Icon, Link, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import useProductsByOwnership from '../../../data/products/use-products-by-ownership';
import useAnalytics from '../../../hooks/use-analytics';
import { getProductCardTitleId } from '../../product-card';
import { getStatusLabel } from '../../product-card/status';
import styles from './style.module.scss';
import type { ComponentProps, FC, ReactNode } from 'react';

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

export type OverviewItemBadge = {
	label: string;
	intent: BadgeIntent;
};

export type OverviewItemLink = {
	label: string;
	href: string;
	onClick?: () => void;
};

export type OverviewItemProps = {
	slug: JetpackModuleWithCard;
	admin: boolean;
	label: string;
	value?: string;
	valueTone?: 'good' | 'warning' | 'bad';
	badge?: OverviewItemBadge;
	action?: OverviewItemLink;
	upgrade?: OverviewItemLink;
	isLoading?: boolean;
	loadingLabel?: string;
	error?: { reason: string; onRetry: () => void };
};

const STATUS_INTENTS: Partial< Record< ProductStatus, BadgeIntent > > = {
	[ PRODUCT_STATUSES.ACTIVE ]: 'stable',
	[ PRODUCT_STATUSES.CAN_UPGRADE ]: 'stable',
	[ PRODUCT_STATUSES.EXPIRED ]: 'high',
	[ PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR ]: 'high',
	[ PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING ]: 'medium',
	[ PRODUCT_STATUSES.EXPIRING_SOON ]: 'medium',
	[ PRODUCT_STATUSES.SITE_CONNECTION_ERROR ]: 'medium',
	[ PRODUCT_STATUSES.USER_CONNECTION_ERROR ]: 'medium',
	[ PRODUCT_STATUSES.ABSENT_WITH_PLAN ]: 'medium',
};

/**
 * The product's own status as a badge, for an item that has no value to show.
 *
 * @param {JetpackModuleWithCard} slug - The product slug.
 * @return {OverviewItemBadge} The badge.
 */
const useStatusBadge = ( slug: JetpackModuleWithCard ): OverviewItemBadge => {
	const { detail } = useProduct( slug );
	const {
		data: { ownedProducts },
	} = useProductsByOwnership();
	const status = detail?.status;

	return {
		label: getStatusLabel( status, !! ownedProducts?.includes( slug ), false ),
		intent: STATUS_INTENTS[ status ] ?? 'none',
	};
};

/**
 * Record the product card's load event once the product's data has loaded,
 * so the My Jetpack dashboard stays comparable.
 *
 * @param {JetpackModuleWithCard} slug      - The product slug.
 * @param {boolean}               isLoading - Whether the product's data is still loading.
 */
export const useOverviewLoadEvent = ( slug: JetpackModuleWithCard, isLoading: boolean ) => {
	const { detail } = useProduct( slug );
	const status = detail?.status;
	const { recordEvent } = useAnalytics();
	const hasRecordedLoad = useRef( false );

	useEffect( () => {
		if ( isLoading || ! status || hasRecordedLoad.current ) {
			return;
		}
		hasRecordedLoad.current = true;
		recordEvent( 'jetpack_myjetpack_product_card_load', { product: slug, status } );
	}, [ isLoading, status, slug, recordEvent ] );
};

/**
 * An Overview item: one value or status badge, and one link.
 *
 * @param {OverviewItemProps} props - Component props.
 * @return {import('react').JSX.Element} The item.
 */
const OverviewItem: FC< OverviewItemProps > = ( {
	slug,
	admin,
	label,
	value,
	valueTone,
	badge,
	action,
	upgrade,
	isLoading = false,
	loadingLabel,
	error,
} ) => {
	const statusBadge = useStatusBadge( slug );
	useOverviewLoadEvent( slug, isLoading );

	let content: ReactNode;
	if ( isLoading ) {
		content = (
			<Badge intent="none">{ loadingLabel ?? __( 'Loading…', 'jetpack-my-jetpack' ) }</Badge>
		);
	} else if ( error ) {
		content = <Badge intent="high">{ error.reason }</Badge>;
	} else if ( value !== undefined ) {
		content = (
			<span className={ styles.metric }>
				<Text variant="heading-2xl">{ value }</Text>
				{ valueTone && (
					<span className={ clsx( styles.dot, styles[ `is-${ valueTone }` ] ) } aria-hidden />
				) }
			</span>
		);
	} else {
		const shownBadge = badge ?? statusBadge;
		content = <Badge intent={ shownBadge.intent }>{ shownBadge.label }</Badge>;
	}

	const links: ReactNode[] = [];
	if ( error && ! isLoading ) {
		links.push(
			<Link key="retry" render={ <Button variant="unstyled" onClick={ error.onRetry } /> }>
				{ __( 'Try again', 'jetpack-my-jetpack' ) }
			</Link>
		);
	} else if ( admin ) {
		if ( action ) {
			links.push(
				<Link key="action" href={ action.href } onClick={ action.onClick }>
					{ action.label }
				</Link>
			);
		}
		if ( upgrade ) {
			links.push(
				<Link key="upgrade" href={ upgrade.href } onClick={ upgrade.onClick }>
					<Icon icon={ lock } size={ 16 } />
					{ upgrade.label }
				</Link>
			);
		}
	}

	return (
		<div className={ styles.item }>
			<Text variant="body-md" id={ getProductCardTitleId( slug ) }>
				{ label }
			</Text>
			<div className={ styles.value } aria-busy={ isLoading }>
				{ content }
			</div>
			{ links.length > 0 && <div className={ styles.links }>{ links }</div> }
		</div>
	);
};

export default OverviewItem;
