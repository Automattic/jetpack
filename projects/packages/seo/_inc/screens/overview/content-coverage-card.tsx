import { DonutMeter } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import styles from './style.module.scss';
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
 * @param props.total   - Total published supported content items.
 * @return A labelled coverage ring.
 */
const CoverageRing: FC< RingProps > = ( { label, segment, total } ) => (
	<Stack direction="column" align="center" gap="xs" className={ styles.ring }>
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
		<Text variant="heading-md">
			{ sprintf(
				/* translators: %1$d: posts with the field set, %2$d: total published posts. */
				__( '%1$d / %2$d', 'jetpack-seo' ),
				segment,
				total
			) }
		</Text>
		<Text variant="body-sm">{ label }</Text>
	</Stack>
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
					<Text variant="body-md" render={ <p /> }>
						{ __( 'No published posts or pages yet.', 'jetpack-seo' ) }
					</Text>
				) : (
					<div className={ styles.rings }>
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
				<Stack direction="row" justify="flex-end" className={ styles.footer }>
					<Button variant="outline" tone="neutral" onClick={ onManage }>
						{ __( 'Manage content', 'jetpack-seo' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default ContentCoverageCard;
