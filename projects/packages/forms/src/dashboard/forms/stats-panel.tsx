/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Page from '../components/page/index.tsx';

type StatsPoint = {
	date: string;
	count: number;
	pretty?: string;
};

type FormStatsPanelProps = {
	formTitle?: string;
	stats: {
		responses_count: number;
		activity: StatsPoint[];
	} | null;
	isLoading: boolean;
};

/**
 * Sidebar panel showing placeholder stats for a form.
 *
 * @param {FormStatsPanelProps} props - Component props.
 * @return {JSX.Element} Sidebar surface.
 */
export default function FormStatsPanel( { formTitle, stats, isLoading }: FormStatsPanelProps ) {
	const totalResponses = stats?.responses_count ?? 0;
	const activity = stats?.activity ?? [];

	return (
		<Page
			className="jp-forms-form-stats"
			title={ formTitle || __( 'Form stats', 'jetpack-forms' ) }
			subTitle={ __( 'Track recent activity for this reusable form.', 'jetpack-forms' ) }
			hasPadding={ true }
			hasBorder={ false }
			showSidebarToggle={ false }
		>
			{ isLoading ? (
				<div className="jp-forms-form-stats__loading">
					<Spinner />
				</div>
			) : (
				<>
					<div className="jp-forms-form-stats__summary">
						<p className="jp-forms-form-stats__summary-label">
							{ __( 'Total responses', 'jetpack-forms' ) }
						</p>
						<p className="jp-forms-form-stats__summary-value">{ totalResponses }</p>
					</div>
					<div className="jp-forms-form-stats__activity">
						<p className="jp-forms-form-stats__activity-heading">
							{ __( 'Past week', 'jetpack-forms' ) }
						</p>
						<ul>
							{ activity.map( point => {
								const formatted = point.pretty
									? point.pretty
									: dateI18n(
											/* translators: Date in the form stats sidebar (e.g. Jan 4). */
											__( 'M j', 'jetpack-forms' ),
											point.date
									  );
								return (
									<li key={ point.date }>
										<span>{ formatted }</span>
										<span>{ point.count }</span>
									</li>
								);
							} ) }
							{ ! activity.length && (
								<li className="jp-forms-form-stats__activity-empty">
									{ __( 'No activity yet.', 'jetpack-forms' ) }
								</li>
							) }
						</ul>
					</div>
				</>
			) }
		</Page>
	);
}
