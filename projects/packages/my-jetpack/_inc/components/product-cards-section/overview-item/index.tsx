import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Badge, Button, Icon, Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useProductsByOwnership from '../../../data/products/use-products-by-ownership';
import { getStatusLabel, getStatusTone } from '../../product-card/status';
import styles from './style.module.scss';
import useOverviewLoadEvent from './use-overview-load-event';
import type { StatusTone } from '../../product-card/status';
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

const TONE_INTENTS: Record< StatusTone, BadgeIntent > = {
	active: 'stable',
	warning: 'medium',
	error: 'high',
	inactive: 'none',
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
	const isOwned = !! ownedProducts?.includes( slug );
	// As on the Protect card, threats found don't make Protect "need attention".
	const suppressNeedsAttention = slug === PRODUCT_SLUGS.PROTECT;

	return {
		label: getStatusLabel( status, isOwned, suppressNeedsAttention ),
		intent: TONE_INTENTS[ getStatusTone( status, isOwned, suppressNeedsAttention ) ],
	};
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

	const productLinks: ReactNode[] = [];
	if ( admin && action ) {
		productLinks.push(
			<Link key="action" href={ action.href } onClick={ action.onClick }>
				{ action.label }
			</Link>
		);
	}
	if ( admin && upgrade ) {
		productLinks.push(
			<Link key="upgrade" href={ upgrade.href } onClick={ upgrade.onClick }>
				<Icon icon={ lock } size={ 16 } />
				{ upgrade.label }
			</Link>
		);
	}

	let content: ReactNode;
	let links = productLinks;
	if ( isLoading ) {
		content = (
			<Badge intent="none">{ loadingLabel ?? __( 'Loading…', 'jetpack-my-jetpack' ) }</Badge>
		);
	} else if ( error ) {
		content = <Badge intent="high">{ error.reason }</Badge>;
		links = [
			<Link key="retry" render={ <Button variant="unstyled" onClick={ error.onRetry } /> }>
				{ __( 'Try again', 'jetpack-my-jetpack' ) }
			</Link>,
		];
	} else if ( value !== undefined ) {
		content = (
			<Stack direction="row" align="center" gap="md">
				<Text variant="heading-2xl">{ value }</Text>
				{ valueTone && (
					<span className={ clsx( styles.dot, styles[ `is-${ valueTone }` ] ) } aria-hidden />
				) }
			</Stack>
		);
	} else {
		const shownBadge = badge ?? statusBadge;
		content = <Badge intent={ shownBadge.intent }>{ shownBadge.label }</Badge>;
	}

	return (
		<Stack direction="column" gap="sm" className={ styles.item }>
			<Text variant="body-md">{ label }</Text>
			<div className={ styles.value } aria-busy={ isLoading }>
				{ content }
			</div>
			{ links.length > 0 && (
				<Stack direction="row" align="center" gap="sm" wrap="wrap" className={ styles.links }>
					{ links }
				</Stack>
			) }
		</Stack>
	);
};

export default OverviewItem;
