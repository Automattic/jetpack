import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import type { RenderModalProps } from './types';

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

const labelStyle = {
	color: 'var(--wpds-color-fg-content-neutral-weak, #50575e)',
};

/**
 * Read-only view-details modal — wired into `ThreatsDataViews`' "View
 * details" row action via the `RenderViewModal` prop. DataViews wraps
 * this content in its own `Modal` (with the "Threat details" header and
 * `large` size set by `ThreatsDataViews`); this component renders only
 * the body. Mirrors the upstream `packages/scan` view-details modal so
 * the two surfaces stay visually equivalent: severity badge + title,
 * signature, description, first-detected, fixed-on (only when the
 * threat's `status` is `'fixed'`), affected extension, filename, and
 * (when present) the diff payload. No mutations, no Tracks event — the
 * modal opens silently from the row action.
 *
 * @param props       - DataViews-supplied modal props.
 * @param props.items - Selected threats. Single-threat row action, so always `[ threat ]`.
 * @return The modal body element.
 */
export function ViewDetailsModal( { items }: RenderModalProps< Threat > ): JSX.Element {
	const threat = items[ 0 ];

	return (
		<Stack gap="lg" direction="column">
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text weight={ 500 } size="large">
						{ threat.title }
					</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.signature && (
					<Text variant="muted" style={ { fontFamily: 'monospace', fontSize: 12 } }>
						{ threat.signature }
					</Text>
				) }
			</Stack>

			{ threat.description && <Text>{ threat.description }</Text> }

			{ threat.firstDetected && (
				<Stack gap="xs" direction="column">
					<Text variant="muted" style={ labelStyle }>
						{ __( 'First detected', 'jetpack-protect' ) }
					</Text>
					<Text>{ dateI18n( 'F j, Y', threat.firstDetected, false ) }</Text>
				</Stack>
			) }

			{ threat.status === 'fixed' && threat.fixedOn && (
				<Stack gap="xs" direction="column">
					<Text variant="muted" style={ labelStyle }>
						{ __( 'Fixed on', 'jetpack-protect' ) }
					</Text>
					<Text>{ dateI18n( 'F j, Y', threat.fixedOn, false ) }</Text>
				</Stack>
			) }

			{ threat.extension && (
				<Stack gap="xs" direction="column">
					<Text variant="muted" style={ labelStyle }>
						{ threat.extension.type === 'themes'
							? __( 'Theme', 'jetpack-protect' )
							: __( 'Plugin', 'jetpack-protect' ) }
					</Text>
					<Text>
						{ threat.extension.name } { threat.extension.version }
						{ threat.fixedIn && ` → ${ threat.fixedIn }` }
					</Text>
				</Stack>
			) }

			{ threat.filename && (
				<Stack gap="xs" direction="column">
					<Text variant="muted" style={ labelStyle }>
						{ __( 'File', 'jetpack-protect' ) }
					</Text>
					<pre style={ codeBlockStyle }>{ threat.filename }</pre>
				</Stack>
			) }

			{ threat.diff && (
				<Stack gap="xs" direction="column">
					<Text variant="muted" style={ labelStyle }>
						{ __( 'Diff', 'jetpack-protect' ) }
					</Text>
					<pre style={ codeBlockStyle }>{ threat.diff }</pre>
				</Stack>
			) }
		</Stack>
	);
}

export default ViewDetailsModal;
