import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton, LinkButton } from '@wordpress/ui';
import { createEngagementTracker, selectionLength } from './engagement.ts';
import {
	CLICK_EVENT,
	DISMISS_EVENT,
	IMPRESSION_EVENT,
	difmOfferTracksProps,
	recordDifmOfferEvent,
	type DifmOfferTracksProps,
} from './tracks.ts';
import type { RefObject } from 'react';

import './style.scss';

// Shared with the Calypso banners, so one dismissal hides the offer on every surface and site.
const DISMISSED_PREFERENCE = 'hosting-dashboard-difm-offer-dismissed';

/** The offer the server returns in `difm_offer` when the banner may show. */
export interface DifmOffer {
	variation: string;
	image_url: string;
	// The Calypso site overview, which opens the offer modal from a query parameter.
	cta_url: string;
}

interface Props {
	offer: DifmOffer;
	// Called after a dismissal is recorded. The parent unmounts the banner.
	onDismiss: () => void;
}

/**
 * The selected text of each range, clipped to the part inside the element. A selection that
 * starts or ends outside the element counts only its part inside it.
 *
 * @param selection - The document selection.
 * @param element   - The banner element.
 * @return The selected text inside the element, one entry per range.
 */
function selectedTextsInside( selection: Selection, element: HTMLElement ): string[] {
	const elementRange = document.createRange();
	elementRange.selectNodeContents( element );

	const texts: string[] = [];
	for ( let index = 0; index < selection.rangeCount; index++ ) {
		const range = selection.getRangeAt( index );
		if ( range.collapsed || ! range.intersectsNode( element ) ) {
			continue;
		}

		const insideRange = range.cloneRange();
		if ( insideRange.compareBoundaryPoints( Range.START_TO_START, elementRange ) < 0 ) {
			insideRange.setStart( elementRange.startContainer, elementRange.startOffset );
		}
		if ( insideRange.compareBoundaryPoints( Range.END_TO_END, elementRange ) > 0 ) {
			insideRange.setEnd( elementRange.endContainer, elementRange.endOffset );
		}
		texts.push( insideRange.toString() );
	}

	return texts;
}

/**
 * Records one hover and one text-select event per mount of the banner.
 *
 * @param ref   - The banner's root element.
 * @param props - The banner's base Tracks props.
 */
function useEngagementTracking(
	ref: RefObject< HTMLElement | null >,
	props: DifmOfferTracksProps
): void {
	useEffect( () => {
		const element = ref.current;
		if ( ! element ) {
			return;
		}

		const tracker = createEngagementTracker( {
			record: ( eventName, extra ) => recordDifmOfferEvent( eventName, { ...props, ...extra } ),
			measureSelection: () => {
				const selection = document.getSelection();
				return selection ? selectionLength( selectedTextsInside( selection, element ) ) : 0;
			},
		} );

		element.addEventListener( 'pointerenter', tracker.pointerEnter );
		element.addEventListener( 'pointerleave', tracker.pointerLeave );
		document.addEventListener( 'selectionchange', tracker.selectionChange );

		return () => {
			element.removeEventListener( 'pointerenter', tracker.pointerEnter );
			element.removeEventListener( 'pointerleave', tracker.pointerLeave );
			document.removeEventListener( 'selectionchange', tracker.selectionChange );
			tracker.dispose();
		};
	}, [ ref, props ] );
}

/**
 * The free DIFM offer banner under the task list. The server decides eligibility and the
 * experiment assignment, so this only renders the offer it is given.
 *
 * @param props           - Component props.
 * @param props.offer     - The offer from the server.
 * @param props.onDismiss - Called after the dismissal is recorded.
 * @return The banner element.
 */
export function DifmOfferBanner( { offer, onDismiss }: Props ) {
	const ref = useRef< HTMLDivElement >( null );
	// The variation is fixed for a page load, so the props, and the effects keyed on them, stay put.
	const tracksProps = useMemo( () => difmOfferTracksProps( offer.variation ), [ offer.variation ] );

	useEffect( () => {
		recordDifmOfferEvent( IMPRESSION_EVENT, tracksProps );
	}, [ tracksProps ] );

	useEngagementTracking( ref, tracksProps );

	const handleDismiss = () => {
		recordDifmOfferEvent( DISMISS_EVENT, tracksProps );
		onDismiss();
		// `global` keeps WordPress.com's wp-admin request bridge from scoping this user
		// endpoint to the site. A failed write only means the offer can show again.
		const request = {
			path: '/wpcom/v2/me/preferences',
			method: 'POST',
			global: true,
			data: { calypso_preferences: { [ DISMISSED_PREFERENCE ]: new Date().toISOString() } },
		};
		apiFetch( request ).catch( () => {} );
	};

	return (
		<div className="ai-launchpad-difm-offer" ref={ ref }>
			<img className="ai-launchpad-difm-offer__image" src={ offer.image_url } alt="" />
			<div className="ai-launchpad-difm-offer__body">
				<h2 className="ai-launchpad-difm-offer__title">
					{ __( 'No time to build your site?', 'jetpack-mu-wpcom' ) }
				</h2>
				<p className="ai-launchpad-difm-offer__description">
					{ __(
						'Let us take that off your plate. Ready in 4 days and free with Business.',
						'jetpack-mu-wpcom'
					) }
				</p>
				<LinkButton
					className="ai-launchpad-difm-offer__cta"
					variant="outline"
					tone="neutral"
					size="compact"
					href={ offer.cta_url }
					// The link unloads the page. The beacon sends the click with a keepalive fetch, so it
					// survives the unload: clicks over modal opens is the drop-off measure for this CTA.
					onClick={ () =>
						recordDifmOfferEvent( CLICK_EVENT, { ...tracksProps, use_beacon: true } )
					}
				>
					{ __( 'See the offer', 'jetpack-mu-wpcom' ) }
				</LinkButton>
			</div>
			<IconButton
				className="ai-launchpad-difm-offer__dismiss"
				variant="minimal"
				tone="neutral"
				size="small"
				icon={ close }
				label={ __( 'Dismiss', 'jetpack-mu-wpcom' ) }
				onClick={ handleDismiss }
			/>
		</div>
	);
}
