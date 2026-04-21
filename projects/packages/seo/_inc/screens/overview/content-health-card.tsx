import { PieChart, type DataPointPercentage } from '@automattic/charts';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Badge, Card, Link, Stack, Text } from '@wordpress/ui';
import { useNavigate } from 'react-router';
import { JetpackSeoRoutes } from '../../constants';
import CardSkeleton from './card-skeleton';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC, MouseEvent } from 'react';

interface Props {
	data?: OverviewResponse[ 'content_seo' ];
}

type StatusKey = 'good' | 'fair' | 'poor';

// WPDS decorative-icon tokens — match the Severity dot palette and the
// Notice decorative-icon rail so the row bullets line up with other
// status indicators on the screen.
const COLOR_GOOD = 'var(--wpds-color-fg-content-success-weak, #007f30)';
const COLOR_FAIR = 'var(--wpds-color-fg-content-warning-weak, #926300)';
const COLOR_POOR = 'var(--wpds-color-fg-content-error-weak, #cc1818)';

// Chart segments paint colour via the SVG `fill` attribute, which does
// not resolve `var(--…)` expressions the way CSS properties do. Pass the
// concrete fallback hex values of the same WPDS tokens used above so the
// donut segments match the row bullets.
const CHART_COLOR: Record< StatusKey, string > = {
	good: '#007f30',
	fair: '#926300',
	poor: '#cc1818',
};

interface Bucket {
	id: StatusKey;
	label: string;
	count: number;
	color: string;
}

const ContentHealthCard: FC< Props > = ( { data } ) => {
	const navigate = useNavigate();

	if ( ! data ) {
		return <CardSkeleton title={ __( 'Content SEO health', 'jetpack-seo' ) } />;
	}

	const total = data.total_published;
	const empty = total === 0;
	const good = data.by_status.good;
	const fair = data.by_status.fair;
	const poor = data.by_status.poor;
	const goodPct = total === 0 ? 0 : Math.round( ( good / total ) * 100 );

	// Labels and order mirror the Content page STATUS_OPTIONS filter so the
	// bucket names on the Overview read identically to the ones the user
	// lands on after clicking View.
	const buckets: Bucket[] = [
		{ id: 'good', label: __( 'Good', 'jetpack-seo' ), count: good, color: COLOR_GOOD },
		{ id: 'fair', label: __( 'Fair', 'jetpack-seo' ), count: fair, color: COLOR_FAIR },
		{ id: 'poor', label: __( 'Poor', 'jetpack-seo' ), count: poor, color: COLOR_POOR },
	];

	const chartData: DataPointPercentage[] = buckets.map( bucket => ( {
		label: bucket.label,
		value: bucket.count,
		color: CHART_COLOR[ bucket.id ],
	} ) );

	const heroValue = empty ? '—' : `${ goodPct }%`;

	let summary: string;
	if ( empty ) {
		summary = __( 'Publish a post to start tracking SEO health.', 'jetpack-seo' );
	} else if ( good === total ) {
		summary = __( 'Every published post has a good SEO score.', 'jetpack-seo' );
	} else {
		summary = sprintf(
			/* translators: %d: total audited posts */
			_n(
				'of %d published post has a good SEO score.',
				'of %d published posts have a good SEO score.',
				data.total_published,
				'jetpack-seo'
			),
			data.total_published
		);
	}

	const goToStatus = ( status: StatusKey ) => ( event: MouseEvent< HTMLAnchorElement > ) => {
		event.preventDefault();
		navigate( `${ JetpackSeoRoutes.Content }?status=${ status }` );
	};

	return (
		<Card.Root>
			<Card.Content>
				{ /*
				 * Native block flow here (rather than Stack) so the floated
				 * chart can sit in the top-right corner and the title,
				 * summary, and bucket list wrap around it — falling back
				 * to below the chart once the vertical space is consumed.
				 */ }
				{ ! empty && (
					<div
						style={ {
							float: 'right',
							marginInlineStart: 'var(--wpds-dimension-gap-lg, 16px)',
						} }
						aria-hidden="true"
					>
						<PieChart
							data={ chartData }
							width={ 120 }
							height={ 120 }
							thickness={ 0.35 }
							showLegend={ false }
							showLabels={ false }
							gapScale={ 0.02 }
							cornerScale={ 0.03 }
						/>
					</div>
				) }
				<Text
					variant="heading-sm"
					style={ {
						display: 'block',
						marginBlockEnd: 'var(--wpds-dimension-gap-lg, 16px)',
						color: 'var(--wpds-color-fg-content-neutral-weak, #6d6d6d)',
					} }
				>
					{ __( 'Content SEO health', 'jetpack-seo' ) }
				</Text>
				<Text
					variant="heading-xl"
					style={ {
						display: 'block',
						marginBlockEnd: 'var(--wpds-dimension-gap-xs, 4px)',
					} }
				>
					{ heroValue }
				</Text>
				<Text
					variant="body-sm"
					style={ {
						display: 'block',
						marginBlockEnd: 'var(--wpds-dimension-gap-2xl, 32px)',
					} }
				>
					{ summary }
				</Text>
				<Stack direction="column" gap="sm">
					{ buckets.map( bucket => (
						<Stack
							key={ bucket.id }
							direction="row"
							gap="sm"
							align="center"
							justify="space-between"
						>
							<Stack direction="row" gap="sm" align="center">
								<span
									aria-hidden="true"
									style={ {
										display: 'inline-block',
										width: 10,
										height: 10,
										borderRadius: '50%',
										background: bucket.color,
										flex: '0 0 auto',
									} }
								/>
								<Text variant="body-md">{ bucket.label }</Text>
								<Badge intent="none">{ String( bucket.count ) }</Badge>
							</Stack>
							<Link
								href={ `${ JetpackSeoRoutes.Content }?status=${ bucket.id }` }
								onClick={ goToStatus( bucket.id ) }
							>
								{ __( 'View', 'jetpack-seo' ) }
							</Link>
						</Stack>
					) ) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default ContentHealthCard;
