/**
 * External dependencies
 */
import { Icon, Popover, Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, info } from '@wordpress/icons';
import clsx from 'clsx';
import { useId, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-chart-section.module.scss';
import { ReportPageSection } from './report-page-layout';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

interface ReportChartHelpProps {
	/** The section heading the tip belongs to, used to name the trigger. */
	title: string;
	children: ReactNode;
}

/**
 * The "what am I looking at" tip beside a chart heading.
 *
 * @param {ReportChartHelpProps} props - The component props.
 * @return The info tip.
 */
function ReportChartHelp( { title, children }: ReportChartHelpProps ) {
	/* translators: %s is the name of the chart the tip explains. */
	const label = sprintf( __( 'About %s', 'jetpack-premium-analytics-pkg' ), title );

	return (
		<Popover.Root>
			<Popover.Trigger
				openOnHover
				delay={ 200 }
				closeDelay={ 200 }
				aria-label={ label }
				className={ styles.help }
			>
				<Icon icon={ info } size={ 20 } />
			</Popover.Trigger>
			<Popover.Popup className={ styles.helpPopup }>
				<Popover.Arrow />
				<VisuallyHidden render={ <Popover.Title /> }>{ label }</VisuallyHidden>
				<Popover.Description>{ children }</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
}

export interface ReportChartSectionProps {
	/** Section heading. Omit for a chart the report title already names. */
	title?: string;
	/** Icon shown before the heading, from `@wordpress/icons`. */
	icon?: ReactElement< ComponentProps< 'svg' > >;
	/** Explanatory copy behind an info tip beside the heading. Needs a `title`. */
	help?: ReactNode;
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
 * A report chart in its own card, with a control below it that collapses the card.
 *
 * A collapsed chart stays mounted; the stylesheet is what takes it out of the
 * tab order.
 *
 * @param {ReportChartSectionProps} props - The component props.
 * @return The chart section.
 */
export function ReportChartSection( {
	title,
	icon,
	help,
	controls,
	hideLabel = __( 'Hide chart', 'jetpack-premium-analytics-pkg' ),
	showLabel = __( 'Show chart', 'jetpack-premium-analytics-pkg' ),
	children,
}: ReportChartSectionProps ) {
	const [ isHidden, setIsHidden ] = useState( false );
	const chartId = useId();

	return (
		<div className={ styles.root }>
			<div
				id={ chartId }
				className={ clsx( styles.chart, isHidden && styles.isHidden ) }
				aria-hidden={ isHidden || undefined }
			>
				<div className={ styles.pane }>
					<ReportPageSection className={ styles.card }>
						{ ( title || controls ) && (
							<div className={ styles.header }>
								<div className={ styles.identity }>
									{ icon ? <Icon icon={ icon } size={ 24 } /> : null }
									{ title ? (
										<Text variant="heading-md" render={ <h3 /> }>
											{ title }
										</Text>
									) : null }
									{ title && help ? (
										<ReportChartHelp title={ title }>{ help }</ReportChartHelp>
									) : null }
								</div>
								{ controls ? <div className={ styles.controls }>{ controls }</div> : null }
							</div>
						) }
						{ children }
					</ReportPageSection>
				</div>
			</div>
			<div className={ styles.footer }>
				<Button
					variant="tertiary"
					size="small"
					icon={ isHidden ? chevronDown : chevronUp }
					aria-expanded={ ! isHidden }
					aria-controls={ chartId }
					onClick={ () => setIsHidden( current => ! current ) }
				>
					{ isHidden ? showLabel : hideLabel }
				</Button>
			</div>
		</div>
	);
}
