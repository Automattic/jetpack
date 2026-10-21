import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Badge, Button, Icon, Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useProductsByOwnership from '../../../data/products/use-products-by-ownership';
import { getStatusLabel, getStatusTone } from '../../product-card/status';
import styles from './style.module.scss';
import type { StatusTone } from '../../product-card/status';
import type { ComponentProps, FC, ReactNode } from 'react';

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

export type OverviewItemBadge = {
	label: string;
	intent: BadgeIntent;
};

export type OverviewItemLink = {
	label: string;
	href?: string;
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
	forcedOffReason?: string | null;
};

const TONE_INTENTS: Record< StatusTone, BadgeIntent > = {
	active: 'stable',
	warning: 'medium',
	error: 'high',
	inactive: 'none',
};

/**
 * Whether the product is working, so its item needs no status badge beside its value.
 *
 * @param {JetpackModuleWithCard} slug   - The product slug.
 * @param {string | undefined}    status - The product status, undefined while it loads.
 * @return {boolean} Whether the product is working.
 */
export const isHealthyStatus = ( slug: JetpackModuleWithCard, status?: string ): boolean => {
	switch ( status ) {
		case undefined:
		case PRODUCT_STATUSES.ACTIVE:
		case PRODUCT_STATUSES.CAN_UPGRADE:
			return true;
		// Protect reports found threats as "needs attention", but its value already shows them.
		case PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING:
		case PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR:
			return slug === PRODUCT_SLUGS.PROTECT;
		default:
			return false;
	}
};

/**
 * The product's own status as a badge, and whether the product is working.
 *
 * @param {JetpackModuleWithCard} slug - The product slug.
 * @return {{badge: OverviewItemBadge, isHealthy: boolean}} The badge and whether the product is working.
 */
const useStatusBadge = ( slug: JetpackModuleWithCard ) => {
	const { detail } = useProduct( slug );
	const {
		data: { ownedProducts },
	} = useProductsByOwnership();
	const status = detail?.status;
	const isOwned = !! ownedProducts?.includes( slug );

	return {
		badge: {
			label: getStatusLabel( status, isOwned, false ),
			intent: TONE_INTENTS[ getStatusTone( status, isOwned, false ) ],
		},
		isHealthy: isHealthyStatus( slug, status ),
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
	forcedOffReason,
} ) => {
	const { badge: ownStatusBadge, isHealthy } = useStatusBadge( slug );
	const statusBadge: OverviewItemBadge = forcedOffReason
		? { label: forcedOffReason, intent: 'medium' }
		: ownStatusBadge;
	const showsStatus = ! isHealthy || !! forcedOffReason;

	const productLinks: ReactNode[] = [];
	if ( admin && action && ! forcedOffReason ) {
		productLinks.push(
			<Link
				key="action"
				{ ...( action.href
					? { href: action.href, onClick: action.onClick }
					: { render: <Button variant="unstyled" onClick={ action.onClick } /> } ) }
			>
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
				{ showsStatus && <Badge intent={ statusBadge.intent }>{ statusBadge.label }</Badge> }
			</Stack>
		);
	} else {
		const shownBadge = showsStatus ? statusBadge : ( badge ?? statusBadge );
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
