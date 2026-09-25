import { IconTooltip } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { getProvidersWithErrors } from '../lib/critical-css-errors';
import { useRegenerateCriticalCssAction } from '../lib/stores/critical-css-state';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';
import TimeAgo from '../time-ago/time-ago';
import { useTooltipLayer } from '$features/module/surface';
import ProgressBar from '$features/ui/progress-bar/progress-bar';
import { subpageHref } from '$lib/modern/routes';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './modern-critical-css-status.module.scss';

type Props = {
	cssState: CriticalCssState;
	isGenerating: boolean;
	progress: number;
};

export default function ModernCriticalCssStatus( { cssState, isGenerating, progress }: Props ) {
	const regenerateAction = useRegenerateCriticalCssAction();
	const tooltipLayer = useTooltipLayer();
	const generating = isGenerating || cssState.status === 'pending';
	const idle = cssState.status === 'not_generated';
	const successCount = cssState.providers.filter(
		provider => provider.status === 'success'
	).length;
	const failureCount = getProvidersWithErrors( cssState ).length;

	const generate = () => {
		if ( ! idle ) {
			recordBoostEvent( 'critical_css_regenerate_clicked', {} );
		}
		regenerateAction.mutate();
	};

	return (
		<Stack direction="column" gap="md">
			<div className={ styles.well } data-testid="critical-css-meta">
				<Stack direction="column" gap="sm">
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Stack direction="row" align="center" gap="sm">
							<Text variant="heading-md">{ __( 'Critical CSS', 'jetpack-boost' ) }</Text>
							<IconTooltip
								className={ styles[ 'info-icon' ] }
								iconSize={ 20 }
								label={ __( 'What is Critical CSS?', 'jetpack-boost' ) }
								placement="bottom"
								{ ...tooltipLayer }
							>
								{ __(
									'Critical CSS is the small set of styles needed to show the top of each page. Boost loads it first so pages appear faster while the rest of the CSS loads.',
									'jetpack-boost'
								) }
							</IconTooltip>
						</Stack>
						{ ! generating && (
							<Button
								variant="minimal"
								onClick={ generate }
								disabled={ regenerateAction.isPending }
							>
								{ idle
									? _x( 'Generate', '', 'jetpack-boost' )
									: __( 'Regenerate', 'jetpack-boost' ) }
							</Button>
						) }
					</Stack>
					<Text variant="body-sm" className={ styles.description }>
						{ generating ? (
							__(
								'Generating Critical CSS. Please don’t leave this page until completed.',
								'jetpack-boost'
							)
						) : (
							<>
								{ ! idle && (
									<>
										{ sprintf(
											/* translators: %d is the number of generated CSS files. */
											_n(
												'%d file generated',
												'%d files generated',
												successCount,
												'jetpack-boost'
											),
											successCount
										) }
										{ !! cssState.updated && (
											<>
												{ ' ' }
												<TimeAgo time={ new Date( cssState.updated * 1000 ) } />
											</>
										) }
										{ '. ' }
									</>
								) }
								{ __(
									'Remember to regenerate each time you make changes that affect your HTML or CSS structure.',
									'jetpack-boost'
								) }
							</>
						) }
					</Text>
					{ generating && <ProgressBar progress={ progress } /> }
				</Stack>
			</div>
			{ ! generating && failureCount > 0 && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ createInterpolateElement(
							sprintf(
								/* translators: %d is the number of CSS files that failed to generate. */
								_n(
									'%d file could not be automatically generated. Visit <advanced>this page</advanced> for recommendations.',
									'%d files could not be automatically generated. Visit <advanced>this page</advanced> for recommendations.',
									failureCount,
									'jetpack-boost'
								),
								failureCount
							),
							{
								advanced: (
									<Notice.ActionLink
										href={ subpageHref( 'critical-css-advanced' ) }
										onClick={ () => recordBoostEvent( 'critical_css_advanced_link_clicked', {} ) }
									/>
								),
							}
						) }
					</Notice.Description>
				</Notice.Root>
			) }
		</Stack>
	);
}
