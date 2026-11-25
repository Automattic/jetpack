/**
 * External dependencies
 */
import { Card, IconButton, Stack, Text } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useCallback, useEffect, useId, useRef } from 'react';
/**
 * Internal dependencies
 */
import { usePromoDismissal, useTrackEvent } from '../../hooks';
import { PromoCta } from './promo-cta';
import type { Promo, PromoPlacement } from '@jetpack-premium-analytics/data';

export type PromoCardProps = {
	promo: Promo;
};

const viewedPlacements = new Set< PromoPlacement >();

/**
 * Forget the placements whose view was recorded this load. Test-only.
 */
export function resetPromoViewsForTesting() {
	viewedPlacements.clear();
}

/**
 * A promo as a card, drawing the payload's own copy and CTA.
 *
 * @param {PromoCardProps} props - The component props.
 * @return The card, or null once the promo is dismissed.
 */
export function PromoCard( { promo }: PromoCardProps ) {
	const { slug, placement, dismissible } = promo;
	const { isDismissed, willBeFinal, dismiss } = usePromoDismissal( promo );
	const trackEvent = useTrackEvent();

	const cardRef = useRef< HTMLDivElement >( null );
	const titleId = useId();

	// On its first intersection, not on mount: the Settings card is the last thing on the page, so a
	// view recorded on load would report an impression that nobody had.
	useEffect( () => {
		const card = cardRef.current;

		if ( isDismissed || ! card || viewedPlacements.has( placement ) ) {
			return;
		}

		const observer = new IntersectionObserver( entries => {
			if ( ! entries.some( entry => entry.isIntersecting ) ) {
				return;
			}

			observer.disconnect();

			if ( ! viewedPlacements.has( placement ) ) {
				viewedPlacements.add( placement );
				trackEvent( 'jetpack_premium_analytics_promo_view', { slug, placement } );
			}
		} );

		observer.observe( card );

		return () => observer.disconnect();
	}, [ isDismissed, placement, slug, trackEvent ] );

	const trackClick = useCallback(
		() => trackEvent( 'jetpack_premium_analytics_promo_click', { slug, placement, label: 'cta' } ),
		[ trackEvent, slug, placement ]
	);

	const handleDismiss = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_promo_dismiss', {
			slug,
			placement,
			dismissal: willBeFinal ? 'final' : 'snooze',
		} );

		// The close control is inside the card, so unmounting drops focus to `<body>` and the next Tab
		// starts again at the top of the page. The surrounding region catches it instead.
		const region = cardRef.current?.parentElement;

		if ( region ) {
			region.tabIndex = -1;
			region.focus();
			region.addEventListener( 'blur', () => region.removeAttribute( 'tabindex' ), {
				once: true,
			} );
		}

		dismiss();
	}, [ willBeFinal, trackEvent, slug, placement, dismiss ] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<Card.Root
			ref={ cardRef }
			role="complementary"
			aria-labelledby={ titleId }
			data-testid="promo-card"
		>
			{ /* Keep this the card's first child: Card.Root gives a later one different padding. */ }
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title id={ titleId } render={ <h3 /> }>
						{ promo.title }
					</Card.Title>
					{ dismissible && (
						<IconButton
							icon={ close }
							label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
							variant="minimal"
							tone="neutral"
							size="small"
							onClick={ handleDismiss }
						/>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="sm" align="flex-start">
					<Text variant="body-md">{ promo.description }</Text>
					<PromoCta
						href={ promo.cta_url }
						label={ promo.cta_label }
						variant="primary"
						trackClick={ trackClick }
					/>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
