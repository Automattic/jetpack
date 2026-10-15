import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Badge, Button, Icon, Link, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import useProductsByOwnership from '../../../data/products/use-products-by-ownership';
import ConnectedProductCard from '../../connected-product-card';
import { getProductCardTitleId } from '../../product-card';
import { getStatusLabel } from '../../product-card/status';
import styles from './style.module.scss';
import type { ComponentProps, FC, ReactNode } from 'react';

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

export type OverviewCardBadge = {
	label: string;
	intent: BadgeIntent;
};

export type OverviewCardLink = {
	label: string;
	href: string;
	onClick?: () => void;
};

export type OverviewCardProps = {
	slug: JetpackModuleWithCard;
	admin: boolean;
	label: string;
	value?: string;
	valueTone?: 'good' | 'warning' | 'bad';
	badge?: OverviewCardBadge;
	action?: OverviewCardLink;
	upgrade?: OverviewCardLink;
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
 * The product's own status as a badge, for a card that has no value to show.
 *
 * @param {JetpackModuleWithCard} slug - The product slug.
 * @return {OverviewCardBadge} The badge.
 */
const useStatusBadge = ( slug: JetpackModuleWithCard ): OverviewCardBadge => {
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
 * An Overview card: one value or status badge, and one link.
 *
 * @param {OverviewCardProps} props - Component props.
 * @return {import('react').JSX.Element} The card.
 */
const OverviewCard: FC< OverviewCardProps > = ( {
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
		<ConnectedProductCard admin={ admin } slug={ slug } variant="slim" isDataLoading={ isLoading }>
			<div className={ styles.card }>
				<Text variant="body-md" id={ getProductCardTitleId( slug ) }>
					{ label }
				</Text>
				<div className={ styles.value } aria-busy={ isLoading }>
					{ content }
				</div>
				{ links.length > 0 && <div className={ styles.links }>{ links }</div> }
			</div>
		</ConnectedProductCard>
	);
};

export default OverviewCard;
