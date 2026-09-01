/**
 * External dependencies
 */
import { Text } from '@jetpack-premium-analytics/externals';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useId, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-chart-section.module.scss';
import { ReportPageSection } from './report-page-layout';
import type { ReactNode } from 'react';

export interface ReportChartSectionProps {
	/** Section heading. Omit for a chart the report title already names. */
	title?: string;
	/** Header-right controls, rendered beside the heading. */
	controls?: ReactNode;
	/** Footer label while the chart is showing (defaults to "Hide chart"). */
	hideLabel?: string;
	/** Footer label while the chart is hidden (defaults to "Show chart"). */
	showLabel?: string;
	/** The chart. */
	children: ReactNode;
}

/**
 * A report chart in its own card, with a footer control that collapses it.
 *
 * @param {ReportChartSectionProps} props - The component props.
 * @return The chart section.
 */
export function ReportChartSection( {
	title,
	controls,
	hideLabel = __( 'Hide chart', 'jetpack-premium-analytics-pkg' ),
	showLabel = __( 'Show chart', 'jetpack-premium-analytics-pkg' ),
	children,
}: ReportChartSectionProps ) {
	const [ isHidden, setIsHidden ] = useState( false );
	const chartId = useId();

	return (
		<ReportPageSection className={ styles.root }>
			{ ( title || controls ) && (
				<div className={ styles.header }>
					{ title ? (
						<Text variant="heading-md" render={ <h3 /> }>
							{ title }
						</Text>
					) : null }
					{ controls ? <div className={ styles.controls }>{ controls }</div> : null }
				</div>
			) }
			<div id={ chartId } hidden={ isHidden }>
				{ ! isHidden && children }
			</div>
			<div className={ styles.footer }>
				<Button
					variant="tertiary"
					size="compact"
					aria-expanded={ ! isHidden }
					aria-controls={ chartId }
					onClick={ () => setIsHidden( current => ! current ) }
				>
					{ isHidden ? showLabel : hideLabel }
				</Button>
			</div>
		</ReportPageSection>
	);
}
