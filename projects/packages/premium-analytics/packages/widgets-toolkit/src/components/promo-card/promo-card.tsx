/**
 * External dependencies
 */
import { IconButton, Stack, Text } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import {
	Component,
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useMemo,
	type ComponentType,
	type JSX,
	type ReactNode,
} from 'react';
/**
 * Internal dependencies
 */
import { usePromoDismissal, useTrackEvent } from '../../hooks';
import styles from './promo-card.module.scss';
import { PromoCta } from './promo-cta';
import type { PromoRenderProps } from './types';
import type { Promo, PromoPlacement } from '@jetpack-premium-analytics/data';

type ResolveModule = ( id: string ) => Promise< { default: ComponentType< PromoRenderProps > } >;

export type PromoCardProps = {
	promo: Promo;
	resolveModule?: ResolveModule;
};

const viewedPlacements = new Set< PromoPlacement >();

/**
 * Forget the placements whose view was recorded this load. Test-only.
 */
export function resetPromoViewsForTesting() {
	viewedPlacements.clear();
}

const importModule: ResolveModule = id => import( /* webpackIgnore: true */ id );

class PromoErrorBoundary extends Component<
	{ fallback: ReactNode; children: ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		return this.state.hasError ? this.props.fallback : this.props.children;
	}
}

function DataOnlyContent( {
	promo,
	trackClick,
}: Pick< PromoRenderProps, 'promo' | 'trackClick' > ): JSX.Element {
	return (
		<Stack direction="column" gap="sm" align="flex-start">
			<Text variant="heading-md" render={ <h3 /> }>
				{ promo.title }
			</Text>
			<Text variant="body-md">{ promo.description }</Text>
			<PromoCta
				href={ promo.cta_url }
				label={ promo.cta_label }
				variant="primary"
				trackClick={ trackClick }
			/>
		</Stack>
	);
}

/**
 * A registered promo as a card. Without a `render_module` the card draws the payload's own copy
 * and CTA. With one, the module draws the whole content region and the card keeps only its frame.
 *
 * @param {PromoCardProps} props - The component props.
 * @return The card, or null once the promo is dismissed.
 */
export function PromoCard( { promo, resolveModule = importModule }: PromoCardProps ) {
	const { slug, placement, dismissible, render_module: renderModule } = promo;
	const { isDismissed, willBeFinal, dismiss } = usePromoDismissal( promo );
	const trackEvent = useTrackEvent();

	useEffect( () => {
		if ( isDismissed || viewedPlacements.has( placement ) ) {
			return;
		}
		viewedPlacements.add( placement );
		trackEvent( 'jetpack_premium_analytics_promo_view', { slug, placement } );
	}, [ isDismissed, placement, slug, trackEvent ] );

	const trackClick = useCallback(
		( label: string ) =>
			trackEvent( 'jetpack_premium_analytics_promo_click', { slug, placement, label } ),
		[ trackEvent, slug, placement ]
	);

	const handleDismiss = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_promo_dismiss', {
			slug,
			placement,
			dismissal: willBeFinal ? 'final' : 'snooze',
		} );
		dismiss();
	}, [ willBeFinal, trackEvent, slug, placement, dismiss ] );

	const Module = useMemo(
		() => ( renderModule ? lazy( () => resolveModule( renderModule ) ) : null ),
		[ renderModule, resolveModule ]
	);

	if ( isDismissed ) {
		return null;
	}

	const fallback = <DataOnlyContent promo={ promo } trackClick={ trackClick } />;

	return (
		<aside className={ styles.card } aria-label={ promo.title } data-testid="promo-card">
			{ dismissible && (
				<IconButton
					className={ styles.close }
					icon={ close }
					label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
					variant="minimal"
					tone="neutral"
					size="small"
					onClick={ handleDismiss }
				/>
			) }
			{ Module ? (
				<PromoErrorBoundary fallback={ fallback }>
					<Suspense fallback={ fallback }>
						<Module
							promo={ promo }
							onDismiss={ dismissible ? handleDismiss : undefined }
							trackClick={ trackClick }
						/>
					</Suspense>
				</PromoErrorBoundary>
			) : (
				fallback
			) }
		</aside>
	);
}
