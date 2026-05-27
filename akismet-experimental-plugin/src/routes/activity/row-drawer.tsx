/**
 * `<RowDrawer>` — Modal that surfaces the per-row reasoning:
 *   - Subject details (label, secondary, optional WP-admin link)
 *   - Signals that fired (with weights / descriptions)
 *   - IP + visitor id
 *   - Conditional Blackbox verdict panel when `visitor_id` is set
 *
 * Closes via Modal's onRequestClose. The drawer is a controlled
 * component — `<ActivityTab>` owns the open/closed state.
 */
import { ExternalLink, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BlackboxReportPanel } from './blackbox-report-panel';
import type { ActivityRow } from './activity-types';

type Props = {
	row: ActivityRow;
	onClose: () => void;
};

/**
 * Render the row drawer for one ActivityRow.
 *
 * @param props - The component props.
 * @return The Modal subtree.
 */
export function RowDrawer( props: Props ): JSX.Element {
	const { row, onClose } = props;
	return (
		<Modal
			title={ row.subject.label }
			onRequestClose={ onClose }
			className="akismet-activity-drawer"
		>
			<section className="akismet-activity-drawer__subject">
				{ row.subject.secondary && (
					<p className="akismet-activity-drawer__secondary">{ row.subject.secondary }</p>
				) }
				{ row.subject.link && (
					<ExternalLink href={ row.subject.link }>
						{ __( 'Open in WordPress', 'akismet' ) }
					</ExternalLink>
				) }
			</section>

			<section className="akismet-activity-drawer__signals-section">
				<h4>{ __( 'Why we flagged this', 'akismet' ) }</h4>
				<ul className="akismet-activity-drawer__signals">
					{ row.signals.map( s => (
						<li key={ s.name }>
							<code className="akismet-activity-drawer__signal-name">{ s.name }</code>
							{ s.description && (
								<span className="akismet-activity-drawer__signal-desc">
									{ ' — ' }
									{ s.description }
								</span>
							) }
							<span className="akismet-activity-drawer__signal-meta">
								{ ' (' }
								{ __( 'weight:', 'akismet' ) } { s.weight }
								{ ')' }
							</span>
						</li>
					) ) }
				</ul>
			</section>

			<section className="akismet-activity-drawer__meta">
				{ row.ip && (
					<p>
						<strong>{ __( 'IP:', 'akismet' ) }</strong> <code>{ row.ip }</code>
					</p>
				) }
				{ row.visitor_id && (
					<p>
						<strong>{ __( 'Visitor:', 'akismet' ) }</strong> <code>{ row.visitor_id }</code>
					</p>
				) }
			</section>

			{ row.visitor_id && <BlackboxReportPanel visitorId={ row.visitor_id } /> }
		</Modal>
	);
}
