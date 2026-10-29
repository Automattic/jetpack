import { __ } from '@wordpress/i18n';
import { check, close } from '@wordpress/icons';
import { Badge, IconButton, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';
import { isOfflineFeatures } from '../../../data/utils/offline-features';
import { getBandStyle } from './band-palette';
import { FeatureBand } from './feature-band';
import { FeatureDelivery } from './feature-delivery';
import { FeatureHighlights } from './feature-highlights';
import { FeatureIcon } from './feature-icon';
import { FeatureInstallNotice } from './feature-install-notice';
import { FeatureLinks } from './feature-links';
import { FeatureModalActions } from './feature-modal-actions';
import { FeaturePaid } from './feature-paid';
import { useFeatureStates } from './feature-state';
import { FeaturesTrackingProvider } from './features-tracking-context';
import { getFeatureStatusLabel, getFeatureUnavailableReason } from './module-availability';
import styles from './styles.module.scss';
import { readFeaturesParams } from './use-feature-filter';
import { useMainFeatures } from './use-main-features';
import type { KeyboardEvent } from 'react';

let inInspector = false;

/**
 * Show feature details in the wp-build inspector instead of a modal; called by the dashboard stage.
 */
export function showFeatureDetailsInInspector() {
	inInspector = true;
}

/**
 * Whether feature details belong to the inspector rather than the modal.
 *
 * @return True under the dashboard stage.
 */
export function areFeatureDetailsInInspector() {
	return inInspector;
}

type FeatureInspectorProps = {
	slug: string;
	searchParams: URLSearchParams;
	onClose: () => void;
};

/**
 * A feature's details in the wp-build inspector, reporting clicks against the grid beside it.
 *
 * @param {FeatureInspectorProps} props              - The component props.
 * @param {string}                props.slug         - The open feature's slug.
 * @param {URLSearchParams}       props.searchParams - The Features tab's query.
 * @param {Function}              props.onClose      - Closes the inspector.
 * @return The rendered component.
 */
export function FeatureInspector( { slug, searchParams, onClose }: FeatureInspectorProps ) {
	const { filter, search, view } = readFeaturesParams( searchParams );
	const details = <FeatureDetails slug={ slug } onClose={ onClose } />;

	if ( isOfflineFeatures() ) {
		return details;
	}

	return (
		<FeaturesTrackingProvider filter={ filter } search={ search } view={ view }>
			{ details }
		</FeaturesTrackingProvider>
	);
}

/**
 * A feature's details, built from the same parts as the modal.
 *
 * @param {object}   props         - The component props.
 * @param {string}   props.slug    - The open feature's slug.
 * @param {Function} props.onClose - Closes the inspector.
 * @return The rendered component.
 */
function FeatureDetails( { slug, onClose }: Omit< FeatureInspectorProps, 'searchParams' > ) {
	const mainFeatures = useMainFeatures();
	const { states } = useFeatureStates( mainFeatures );
	const state = states.find( item => item.feature.slug === slug );
	// The modal never opened for a slug the site lacks; an empty seed is not yet a list to check.
	const isUnknown =
		! state && ( mainFeatures.features.length > 0 || ! mainFeatures.isPlaceholderData );

	useEffect( () => {
		if ( isUnknown ) {
			onClose();
		}
	}, [ isUnknown, onClose ] );

	// Like the modal: focus moves in on open, and back to whatever opened it on close.
	const rootRef = useRef< HTMLDivElement >( null );
	const headingRef = useRef< HTMLSpanElement >( null );
	const openerRef = useRef< HTMLElement | null >( null );
	const isShown = Boolean( state );

	useEffect( () => {
		if ( ! isShown ) {
			return;
		}
		const active = rootRef.current?.ownerDocument.activeElement;
		if ( active instanceof HTMLElement && ! rootRef.current?.contains( active ) ) {
			openerRef.current = active;
		}
		headingRef.current?.focus();
	}, [ slug, isShown ] );

	useEffect(
		() => () => {
			if ( openerRef.current?.isConnected ) {
				openerRef.current.focus();
			}
		},
		[]
	);

	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if (
				event.key === 'Escape' &&
				! event.defaultPrevented &&
				! ( event.target as Element ).closest( '[role="menu"], [role="listbox"], [role="dialog"]' )
			) {
				onClose();
			}
		},
		[ onClose ]
	);

	if ( ! state ) {
		return null;
	}

	const { feature, product } = state;
	const unavailable = getFeatureUnavailableReason( state );
	const statusLabel = getFeatureStatusLabel( state );
	const freeHighlights = feature.free_highlights ?? [];

	return (
		// The handler only listens for Escape bubbling up from the controls inside.
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div ref={ rootRef } onKeyDown={ onKeyDown }>
			<div
				className={ clsx( styles[ 'modal-band' ], styles[ 'inspector-band' ] ) }
				style={ getBandStyle( feature.slug ) }
			>
				<IconButton
					className={ styles[ 'modal-band__close' ] }
					icon={ close }
					label={ __( 'Close', 'jetpack-my-jetpack' ) }
					variant="minimal"
					tone="neutral"
					size="compact"
					onClick={ onClose }
				/>
				<div className={ styles[ 'modal-band__art' ] }>
					<FeatureBand key={ feature.slug } feature={ feature } />
				</div>
			</div>

			<Stack direction="column" gap="lg" className={ styles[ 'inspector-body' ] }>
				<Stack direction="row" align="center" gap="sm">
					<span className={ styles[ 'modal-icon' ] } aria-hidden="true">
						<FeatureIcon feature={ feature } />
					</span>
					<Stack direction="column" gap="xs" className={ styles[ 'modal-heading' ] }>
						<Text ref={ headingRef } variant="heading-md" render={ <h2 tabIndex={ -1 } /> }>
							{ feature.name }
						</Text>
						{ statusLabel ? (
							<Badge intent={ ! unavailable && state.status === 'active' ? 'stable' : 'draft' }>
								{ statusLabel }
							</Badge>
						) : null }
					</Stack>
				</Stack>

				<Stack direction="row" align="center" gap="sm" data-feature-actions>
					<FeatureModalActions state={ state } />
				</Stack>

				<FeatureDelivery state={ state } />
				<FeatureInstallNotice state={ state } errorsOnly />

				<Text>{ feature.long_description || product?.longDescription || feature.description }</Text>

				{ freeHighlights.length > 0 && (
					<section className={ styles[ 'detail-section' ] }>
						<Text variant="heading-sm" render={ <h3 /> }>
							{ __( 'Free', 'jetpack-my-jetpack' ) }
						</Text>
						<FeatureHighlights items={ freeHighlights } icon={ check } />
					</section>
				) }

				<FeaturePaid state={ state } />
				<FeatureLinks feature={ feature } />
			</Stack>
		</div>
	);
}
