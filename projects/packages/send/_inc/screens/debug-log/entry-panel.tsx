import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { Badge, IconButton, Spinner, Stack, Text } from '@wordpress/ui';
import { CopyValueButton } from '../../components/copy-button';
import ErrorNotice from '../../components/error-notice';
import { PanelRow, PanelRows, PanelSection } from '../../components/panel-parts';
import RouteLink from '../../components/route-link';
import { errorMessage, fetchDebugEntry } from '../../data/api';
import { fullTime, parseUtc } from '../../data/dates';
import { logEntryHref } from '../../data/log-link';
import useCloseOnEscape from '../log/use-close-on-escape';
import type { DebugArea, DebugEntry, DebugLevel } from '../../data/types';
import type { ReactNode } from 'react';
import './style.scss';

/** The panel's heading, which takes focus when an entry opens. */
export const DEBUG_PANEL_TITLE_ID = 'jetpack-send-debug-panel-title';

const LEVEL_INTENT = {
	error: 'high',
	warning: 'medium',
	info: 'informational',
	debug: 'none',
} as const;

/**
 * Translated level labels; `debug` reads as "Detail".
 *
 * @return Labels keyed by level.
 */
export const levelLabels = (): Record< DebugLevel, string > => ( {
	error: __( 'Error', 'jetpack-send-pkg' ),
	warning: __( 'Warning', 'jetpack-send-pkg' ),
	info: __( 'Info', 'jetpack-send-pkg' ),
	debug: __( 'Detail', 'jetpack-send-pkg' ),
} );

/**
 * Translated area labels.
 *
 * @return Labels keyed by area.
 */
export const areaLabels = (): Record< DebugArea, string > => ( {
	sending: __( 'Sending', 'jetpack-send-pkg' ),
	domain: __( 'Domain check', 'jetpack-send-pkg' ),
	account: __( 'Account', 'jetpack-send-pkg' ),
	settings: __( 'Settings', 'jetpack-send-pkg' ),
	cleanup: __( 'Cleanup', 'jetpack-send-pkg' ),
} );

/**
 * An entry's level as a badge, as the Log shows statuses.
 *
 * @param props       - Component props.
 * @param props.level - The level.
 * @return The badge.
 */
export const LevelBadge = ( { level }: { level: DebugLevel } ) => (
	<Badge intent={ LEVEL_INTENT[ level ] ?? 'none' }>{ levelLabels()[ level ] ?? level }</Badge>
);

type Props = {
	/** The debug entry's id. */
	id: string;
	onClose: () => void;
};

/**
 * One debug entry in the side panel, built like the Log's email panel: a bar with Close, the
 * message, its facts, then the recorded details to copy.
 *
 * @param props         - Component props.
 * @param props.id      - The entry's id.
 * @param props.onClose - Close the panel.
 * @return The panel's content.
 */
const DebugEntryPanel = ( { id, onClose }: Props ) => {
	const [ entry, setEntry ] = useState< DebugEntry | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	useEffect( () => {
		let cancelled = false;
		setEntry( null );
		setError( null );
		fetchDebugEntry( id )
			.then( result => ! cancelled && setEntry( result ) )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) );
		return () => {
			cancelled = true;
		};
	}, [ id ] );
	const loaded = entry?.id === id ? entry : null;

	// Opening moves focus to the message, once per entry, unless it's already in the panel.
	const titleRef = useRef< HTMLHeadingElement >( null );
	const closeRef = useRef< HTMLButtonElement >( null );
	const panelRef = useRef< HTMLElement >( null );
	const focusedFor = useRef< string | null >( null );
	useEffect( () => {
		if ( focusedFor.current === id || ( ! loaded && ! error ) ) {
			return;
		}
		focusedFor.current = id;
		const panel = panelRef.current;
		if ( ! panel?.contains( panel.ownerDocument.activeElement ) ) {
			( titleRef.current ?? closeRef.current )?.focus( { preventScroll: true } );
		}
	}, [ id, loaded, error ] );
	useCloseOnEscape( onClose );

	const details = useMemo(
		() => ( loaded?.context ? JSON.stringify( loaded.context, null, 2 ) : '' ),
		[ loaded ]
	);

	let content: ReactNode = (
		<Stack direction="row" align="center" justify="center" className="jetpack-send-debug__loading">
			<Spinner />
		</Stack>
	);
	if ( error ) {
		content = <ErrorNotice message={ error } />;
	} else if ( loaded ) {
		const when = parseUtc( loaded.created_at );
		const valid = ! isNaN( when.getTime() );
		content = (
			<Stack direction="column" gap="lg">
				<Text
					variant="heading-lg"
					render={ <h2 id={ DEBUG_PANEL_TITLE_ID } ref={ titleRef } tabIndex={ -1 } /> }
					className="jetpack-send-debug__title"
				>
					{ loaded.message }
				</Text>
				<PanelRows>
					<PanelRow label={ __( 'Level', 'jetpack-send-pkg' ) }>
						<LevelBadge level={ loaded.level } />
					</PanelRow>
					<PanelRow label={ __( 'Time', 'jetpack-send-pkg' ) }>
						{ valid ? <time dateTime={ when.toISOString() }>{ fullTime( when ) }</time> : null }
					</PanelRow>
					<PanelRow label={ __( 'Area', 'jetpack-send-pkg' ) }>
						{ areaLabels()[ loaded.area ] ?? loaded.area }
					</PanelRow>
					<PanelRow label={ __( 'Event', 'jetpack-send-pkg' ) }>
						<code className="jetpack-send-code">{ loaded.event }</code>
					</PanelRow>
					<PanelRow label={ __( 'Email', 'jetpack-send-pkg' ) }>
						{ loaded.log_id ? (
							<RouteLink href={ logEntryHref( loaded.log_id ) }>
								{ __( 'Open email', 'jetpack-send-pkg' ) }
							</RouteLink>
						) : null }
					</PanelRow>
					<PanelRow label={ __( 'Who', 'jetpack-send-pkg' ) }>
						{ loaded.user || __( 'Automatic', 'jetpack-send-pkg' ) }
					</PanelRow>
				</PanelRows>
				{ details && (
					<PanelSection title={ __( 'Details', 'jetpack-send-pkg' ) }>
						<Stack direction="column" gap="md" align="start">
							<pre className="jetpack-send-email__raw jetpack-send-debug__context">{ details }</pre>
							<CopyValueButton
								text={ details }
								label={ __( 'Copy details', 'jetpack-send-pkg' ) }
							/>
						</Stack>
					</PanelSection>
				) }
			</Stack>
		);
	}

	return (
		<section
			className="jetpack-send-panel"
			ref={ panelRef }
			aria-labelledby={ loaded ? DEBUG_PANEL_TITLE_ID : undefined }
			aria-label={ loaded ? undefined : __( 'Debug entry', 'jetpack-send-pkg' ) }
		>
			<Stack
				direction="row"
				align="center"
				justify="flex-end"
				gap="xs"
				className="jetpack-send-panel__header"
			>
				<IconButton
					ref={ closeRef }
					icon={ close }
					label={ __( 'Close', 'jetpack-send-pkg' ) }
					variant="minimal"
					tone="neutral"
					size="compact"
					onClick={ onClose }
				/>
			</Stack>
			<div className="jetpack-send-panel__body">{ content }</div>
		</section>
	);
};

export default DebugEntryPanel;
