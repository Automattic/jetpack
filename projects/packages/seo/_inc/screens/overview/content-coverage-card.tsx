import { DonutMeter } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
import type { ContentCoverage } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: ContentCoverage;
	onManage: () => void;
}

interface RingProps {
	label: string;
	segment: number;
	total: number;
}

/**
 * One factual coverage ring: a proportion (segment of total) plus the literal
 * count beneath it. Deliberately a single neutral fill colour and never
 * adaptive — fuller is not "better", it's just how many posts have the field
 * set. The admin decides what matters.
 *
 * @param props         - Component props.
 * @param props.label   - Localized label for the metric.
 * @param props.segment - Number of posts with the field set.
 * @param props.total   - Total published posts/pages.
 * @return A labelled coverage ring.
 */
const CoverageRing: FC< RingProps > = ( { label, segment, total } ) => (
	<div className="jetpack-seo-overview__coverage-ring">
		<DonutMeter
			totalCount={ total }
			segmentCount={ segment }
			donutWidth="56px"
			title={ label }
			description={ sprintf(
				/* translators: %1$d: posts with the field set, %2$d: total published posts. */
				__( '%1$d of %2$d', 'jetpack-seo' ),
				segment,
				total
			) }
		/>
		<div className="jetpack-seo-overview__coverage-count">
			{ sprintf(
				/* translators: %1$d: posts with the field set, %2$d: total published posts. */
				__( '%1$d / %2$d', 'jetpack-seo' ),
				segment,
				total
			) }
		</div>
		<div className="jetpack-seo-overview__coverage-label">{ label }</div>
	</div>
);

const ContentCoverageCard: FC< Props > = ( { data, onManage } ) => {
	const { total, with_schema, with_title, with_description, with_search_visible } = data;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Content SEO', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ total === 0 ? (
					<p>{ __( 'No published posts or pages yet.', 'jetpack-seo' ) }</p>
				) : (
					<div className="jetpack-seo-overview__coverage-rings">
						<CoverageRing
							label={ __( 'Schema applied', 'jetpack-seo' ) }
							segment={ with_schema }
							total={ total }
						/>
						<CoverageRing
							label={ __( 'SEO title set', 'jetpack-seo' ) }
							segment={ with_title }
							total={ total }
						/>
						<CoverageRing
							label={ __( 'Meta description added', 'jetpack-seo' ) }
							segment={ with_description }
							total={ total }
						/>
						<CoverageRing
							label={ __( 'Visible to search engines', 'jetpack-seo' ) }
							segment={ with_search_visible }
							total={ total }
						/>
					</div>
				) }
				<div className="jetpack-seo-overview__card-footer">
					<Button variant="outline" tone="neutral" onClick={ onManage }>
						{ __( 'Manage content', 'jetpack-seo' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

export default ContentCoverageCard;
