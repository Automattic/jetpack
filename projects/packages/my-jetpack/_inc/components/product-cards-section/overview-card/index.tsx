import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Badge, Button, LinkButton, Skeleton, Text as UIText } from '@wordpress/ui';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import useProductsByOwnership from '../../../data/products/use-products-by-ownership';
import useConnectSite from '../../../hooks/use-connect-site';
import ActionButton from '../../action-button';
import cardStyles from '../../card/style.module.scss';
import ConnectedProductCard from '../../connected-product-card';
import { getProductCardTitleId } from '../../product-card';
import { getStatusLabel } from '../../product-card/status';
import styles from './style.module.scss';
import type { AdditionalAction } from '../../action-button/types';
import type { ComponentProps, FC, ReactNode } from 'react';

type BadgeIntent = ComponentProps< typeof Badge >[ 'intent' ];

export type OverviewCardBadge = {
	label: string;
	intent: BadgeIntent;
};

export type OverviewCardProps = {
	slug: JetpackModuleWithCard;
	admin: boolean;
	label: string;
	value?: string;
	badge?: OverviewCardBadge;
	action?: { label: string; href?: string; onClick?: () => void };
	primaryActionOverride?: Record< string, AdditionalAction >;
	isLoading?: boolean;
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
 * An Overview card: one value or status badge, and one action.
 *
 * @param {OverviewCardProps} props - Component props.
 * @return {import('react').JSX.Element} The card.
 */
const OverviewCard: FC< OverviewCardProps > = ( {
	slug,
	admin,
	label,
	value,
	badge,
	action,
	primaryActionOverride,
	isLoading = false,
	error,
} ) => {
	const { detail } = useProduct( slug );
	const statusBadge = useStatusBadge( slug );
	const { connectSite } = useConnectSite( {
		tracksInfo: {
			event: 'jetpack_myjetpack_product_card_fix_site_connection',
			properties: {},
		},
	} );
	const titleId = getProductCardTitleId( slug );
	const shownBadge = badge ?? statusBadge;

	let content: ReactNode;
	if ( isLoading ) {
		content = (
			<>
				<Skeleton className={ styles.skeleton } />
				<span className="screen-reader-text">{ __( 'Loading…', 'jetpack-my-jetpack' ) }</span>
			</>
		);
	} else if ( error ) {
		content = (
			<>
				<UIText variant="heading-lg">{ __( 'Unavailable', 'jetpack-my-jetpack' ) }</UIText>
				<UIText variant="body-sm">{ error.reason }</UIText>
			</>
		);
	} else if ( value !== undefined ) {
		content = <UIText variant="heading-xl">{ value }</UIText>;
	} else {
		content = <Badge intent={ shownBadge.intent }>{ shownBadge.label }</Badge>;
	}

	let actionContent = null;
	if ( error && ! isLoading ) {
		actionContent = (
			<Button variant="outline" size="compact" onClick={ error.onRetry }>
				{ __( 'Try again', 'jetpack-my-jetpack' ) }
			</Button>
		);
	} else if ( admin && action?.href ) {
		actionContent = (
			<LinkButton href={ action.href } variant="outline" size="compact" onClick={ action.onClick }>
				{ action.label }
			</LinkButton>
		);
	} else if ( admin && action ) {
		actionContent = (
			<Button variant="outline" size="compact" onClick={ action.onClick }>
				{ action.label }
			</Button>
		);
	} else if ( admin ) {
		actionContent = (
			<ActionButton
				slug={ slug }
				primaryActionOverride={ primaryActionOverride }
				fixSiteConnectionHandler={ connectSite }
				tracksIdentifier="product_card"
				labelSuffixId={ titleId }
			/>
		);
	}

	return (
		<ConnectedProductCard admin={ admin } slug={ slug } variant="slim" isDataLoading={ isLoading }>
			<div className={ styles.card }>
				<div className={ cardStyles.title }>
					<div className={ cardStyles.name } id={ titleId }>
						<Text variant="title-medium">{ detail?.name || slug }</Text>
					</div>
				</div>
				<UIText variant="body-sm" className={ styles.label }>
					{ label }
				</UIText>
				<div className={ styles.value } aria-busy={ isLoading }>
					{ content }
				</div>
				{ actionContent && <div className={ styles.action }>{ actionContent }</div> }
			</div>
		</ConnectedProductCard>
	);
};

export default OverviewCard;
