import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useEffect } from 'react';
import MutedText from '../../components/muted-text';
import { useTrackEvent } from '../../data/use-track-event';
import type { RenderModalProps } from '@wordpress/dataviews';

const codeBlockStyle = {
	backgroundColor: 'var(--wpds-color-bg-surface-neutral-weak, #f6f7f7)',
	border: '1px solid var(--wpds-color-stroke-surface-neutral, #e0e0e0)',
	borderRadius: 4,
	fontFamily: 'Menlo, Consolas, monaco, "Courier New", Courier, monospace',
	fontSize: 12,
	margin: 0,
	overflowX: 'auto' as const,
	padding: 12,
	whiteSpace: 'pre' as const,
};

/**
 * Read-only view-details modal — wired into `ThreatsDataViews`' "View
 * details" row action via the `RenderViewModal` prop. Mirrors the spirit
 * of Calypso's `view-details-modal.tsx` (Phase 4): full title + severity
 * + signature + description + filename / file-context / database-row
 * payload, without the action buttons. Drilling in is always available
 * regardless of the threat's status.
 *
 * @param props       - DataViews-supplied modal props.
 * @param props.items - Selected threats. Single-threat row action, so always `[ threat ]`.
 * @return The modal body element.
 */
export function ViewDetailsModal( { items }: RenderModalProps< Threat > ): JSX.Element {
	const threat = items[ 0 ];
	const trackEvent = useTrackEvent();

	useEffect( () => {
		trackEvent( 'jetpack_scan_view_details_modal_open' );
	}, [ trackEvent ] );

	let fixDescription: string;
	if ( ! threat.fixable ) {
		fixDescription = __(
			'Jetpack Scan cannot automatically fix this threat. Update WordPress, the affected theme or plugin, or remove the offending code manually.',
			'jetpack-scan-page'
		);
	} else if ( threat.fixable.fixer === 'delete' ) {
		fixDescription = __(
			'Jetpack Scan will delete the affected file or directory. The site’s look-and-feel or features may be affected — verify your most recent backup before proceeding.',
			'jetpack-scan-page'
		);
	} else {
		fixDescription = __(
			'Jetpack Scan will replace the affected file with a clean version. The site’s look-and-feel or features may be affected — verify your most recent backup before proceeding.',
			'jetpack-scan-page'
		);
	}

	const fileContext =
		threat.context &&
		Object.entries( threat.context )
			.filter( ( [ key ] ) => key !== 'marks' )
			.map( ( [ line, code ] ) => `${ line }: ${ String( code ) }` )
			.join( '\n' );

	return (
		<Stack gap="lg" direction="column">
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text
						style={ { fontWeight: 'var(--wpds-typography-font-weight-medium, 499)', fontSize: 16 } }
					>
						{ threat.title }
					</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.signature && (
					<MutedText style={ { fontFamily: 'monospace', fontSize: 12 } }>
						{ threat.signature }
					</MutedText>
				) }
			</Stack>

			{ threat.description && <Text>{ threat.description }</Text> }

			{ threat.firstDetected && (
				<Stack gap="xs" direction="column">
					<MutedText>{ __( 'First detected', 'jetpack-scan-page' ) }</MutedText>
					<Text>{ dateI18n( 'F j, Y', threat.firstDetected, false ) }</Text>
				</Stack>
			) }

			{ threat.fixedOn && (
				<Stack gap="xs" direction="column">
					<MutedText>{ __( 'Fixed on', 'jetpack-scan-page' ) }</MutedText>
					<Text>{ dateI18n( 'F j, Y', threat.fixedOn, false ) }</Text>
				</Stack>
			) }

			{ threat.extension && (
				<Stack gap="xs" direction="column">
					<MutedText>
						{ threat.extension.type === 'themes'
							? __( 'Theme', 'jetpack-scan-page' )
							: __( 'Plugin', 'jetpack-scan-page' ) }
					</MutedText>
					<Text>
						{ threat.extension.name } { threat.extension.version }
						{ threat.fixedIn && ` → ${ threat.fixedIn }` }
					</Text>
				</Stack>
			) }

			{ threat.filename && (
				<Stack gap="xs" direction="column">
					<MutedText>{ __( 'File', 'jetpack-scan-page' ) }</MutedText>
					<pre style={ codeBlockStyle }>{ threat.filename }</pre>
				</Stack>
			) }

			{ fileContext && (
				<Stack gap="xs" direction="column">
					<MutedText>{ __( 'Context', 'jetpack-scan-page' ) }</MutedText>
					<pre style={ codeBlockStyle }>{ fileContext }</pre>
				</Stack>
			) }

			<Stack gap="xs" direction="column">
				<MutedText>
					{ threat.status === 'fixed'
						? __( 'How was it fixed?', 'jetpack-scan-page' )
						: __( 'How will it be fixed?', 'jetpack-scan-page' ) }
				</MutedText>
				<Text>{ fixDescription }</Text>
			</Stack>
		</Stack>
	);
}

export default ViewDetailsModal;
