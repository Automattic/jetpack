import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { IconButton, ButtonLink } from '@wordpress/ui';
import { createEngagementTracker, selectionLength } from './engagement.ts';
import {
	CLICK_EVENT,
	DISMISS_EVENT,
	IMPRESSION_EVENT,
	difmOfferDismissProps,
	difmOfferTracksProps,
	dismissalRequest,
	recordDifmOfferEvent,
	type DifmOfferTracksProps,
} from './tracks.ts';
import type { RefObject } from 'react';

import './style.scss';

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
 * The banner copy for each experiment arm. The copy matches Calypso's `getDifmOfferCopy()`.
 *
 * @param variation - The ExPlat variation from the server.
 * @return The title and description, or null for a variation with no copy.
 */
function getCopy( variation: string ): { title: string; description: string } | null {
	switch ( variation ) {
		case 'expert_help':
			return {
				title: __( 'Expert help to get you started', 'jetpack-mu-wpcom' ),
				description: __(
					'A human builds your site based on your needs — free with Business.',
					'jetpack-mu-wpcom'
				),
			};
		case 'no_time_to_build':
			return {
				title: __( 'No time to build your site?', 'jetpack-mu-wpcom' ),
				description: __(
					'Let us take that off your plate. Ready in 4 days and free with Business.',
					'jetpack-mu-wpcom'
				),
			};
		case 'skip_the_setup':
			return {
				title: __( 'Skip the setup', 'jetpack-mu-wpcom' ),
				description: __(
					'For a limited time, our experts will bring your vision to life. Free with Business.',
					'jetpack-mu-wpcom'
				),
			};
		default:
			return null;
	}
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
	const copy = getCopy( offer.variation );
	const hasCopy = copy !== null;

	useEffect( () => {
		// A banner with no copy renders nothing, so it records no impression.
		if ( hasCopy ) {
			recordDifmOfferEvent( IMPRESSION_EVENT, tracksProps );
		}
	}, [ tracksProps, hasCopy ] );

	useEngagementTracking( ref, tracksProps );

	const handleDismiss = () => {
		recordDifmOfferEvent( DISMISS_EVENT, difmOfferDismissProps( tracksProps ) );
		onDismiss();
		// A failed write only means the offer can show again.
		apiFetch( dismissalRequest( new Date() ) ).catch( () => {} );
	};

	if ( ! copy ) {
		return null;
	}

	return (
		<div className="ai-launchpad-difm-offer" ref={ ref }>
			<div className="ai-launchpad-difm-offer__content">
				<img className="ai-launchpad-difm-offer__image" src={ offer.image_url } alt="" />
				<div className="ai-launchpad-difm-offer__body">
					<h2 className="ai-launchpad-difm-offer__title">{ copy.title }</h2>
					<p className="ai-launchpad-difm-offer__description">{ copy.description }</p>
				</div>
				<ButtonLink
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
				</ButtonLink>
			</div>
			<IconButton
				className="ai-launchpad-difm-offer__dismiss"
				variant="minimal"
				tone="neutral"
				size="small"
				icon={ closeSmall }
				label={ __( 'Dismiss', 'jetpack-mu-wpcom' ) }
				onClick={ handleDismiss }
			/>
		</div>
	);
}
