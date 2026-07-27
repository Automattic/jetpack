import { DonutMeter } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { formatListBullets } from '@wordpress/icons';
import { Button, Card, Icon, Stack, Text, Tooltip } from '@wordpress/ui';
import styles from './style.module.scss';
import type { ContentCoverage } from '../../data/overview-types';
import type { FC, ReactNode } from 'react';

// The unconfigured slice a ring deep-links to on the Content tab. Each value is
// read back off the URL by the Content screen (`?needs=`) and seeded as a
// DataViews filter so the user lands on exactly the rows that still need work.
export type ContentNeed = 'schema' | 'title' | 'description' | 'search';

interface Props {
	data: ContentCoverage;
	onManage: () => void;
	// Deep-link to the Content tab filtered to the rows still missing this field.
	onFilter: ( need: ContentNeed ) => void;
}

interface RingProps {
	label: string;
	// Localized action for the interactive ring: describes what filtering to the
	// unconfigured rows will show. Doubles as the ring's accessible label.
	action: string;
	segment: number;
	total: number;
	need: ContentNeed;
	onFilter: ( need: ContentNeed ) => void;
}

/**
 * One factual coverage ring: a proportion (segment of total) plus the literal
 * count beneath it. Deliberately a single neutral fill colour and never
 * adaptive — fuller is not "better", it's just how many posts have the field
 * set. The admin decides what matters.
 *
 * When some items still lack the field, the ring is an interactive control that
 * deep-links to the Content tab filtered to *those* rows — the ones there's an
 * action to take. A fully-covered ring has nothing to fix, so it stays static.
 *
 * @param props          - Component props.
 * @param props.label    - Localized label for the metric.
 * @param props.action   - Localized action/aria label for the interactive ring.
 * @param props.segment  - Number of posts with the field set.
 * @param props.total    - Total published supported content items.
 * @param props.need     - The unconfigured slice this ring filters to.
 * @param props.onFilter - Deep-link handler for the unconfigured rows.
 * @return A labelled coverage ring, interactive when work remains.
 */
const CoverageRing: FC< RingProps > = ( { label, action, segment, total, need, onFilter } ) => {
	const handleFilter = useCallback( () => onFilter( need ), [ need, onFilter ] );

	const count = sprintf(
		/* translators: %1$d: posts with the field set, %2$d: total published posts. */
		__( '%1$d / %2$d', 'jetpack-seo' ),
		segment,
		total
	);

	const inner: ReactNode = (
		<>
			{ /* Chart is decorative here: the ring's aria-label carries the action and
			     the count/label are visible text below, so the DonutMeter is left
			     unlabeled (aria-hidden) — this also removes its native SVG `<title>`
			     tooltip, which otherwise duplicated the action tooltip on hover. */ }
			<div className={ styles.donutWrap }>
				<DonutMeter totalCount={ total } segmentCount={ segment } donutWidth="56px" />
			</div>
			<Text variant="heading-md">{ count }</Text>
			<Text variant="body-sm">{ label }</Text>
		</>
	);

	// Everything set → nothing to filter to; keep it a static, non-interactive ring.
	if ( segment >= total ) {
		return (
			<Stack direction="column" align="center" gap="xs" className={ styles.ring }>
				{ inner }
			</Stack>
		);
	}

	return (
		<Tooltip.Provider delay={ 150 }>
			<Tooltip.Root>
				<Tooltip.Trigger
					className={ styles.ringTrigger }
					aria-label={ action }
					onClick={ handleFilter }
				>
					<Stack direction="column" align="center" gap="xs" className={ styles.ring }>
						{ inner }
					</Stack>
				</Tooltip.Trigger>
				<Tooltip.Popup>{ action }</Tooltip.Popup>
			</Tooltip.Root>
		</Tooltip.Provider>
	);
};

// Per-ring action copy resolved at module scope (static, one per ring) so the
// production minifier can't fold adjacent `__()` calls. See
// feedback_i18n_ternary_minifier_fold.
const schemaAction = __( 'Add schema to content', 'jetpack-seo' );
const titleAction = __( 'Set SEO titles', 'jetpack-seo' );
const descriptionAction = __( 'Add meta descriptions', 'jetpack-seo' );
const searchAction = __( 'Configure search visibility', 'jetpack-seo' );

const ContentCoverageCard: FC< Props > = ( { data, onManage, onFilter } ) => {
	const { total, with_schema, with_title, with_description, with_search_visible } = data;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>
					<span className={ styles.cardTitle }>
						{ __( 'Content SEO', 'jetpack-seo' ) }
						<span className={ styles.titleIcon }>
							<Icon icon={ formatListBullets } size={ 20 } />
						</span>
					</span>
				</Card.Title>
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
							action={ schemaAction }
							segment={ with_schema }
							total={ total }
							need="schema"
							onFilter={ onFilter }
						/>
						<CoverageRing
							label={ __( 'SEO title set', 'jetpack-seo' ) }
							action={ titleAction }
							segment={ with_title }
							total={ total }
							need="title"
							onFilter={ onFilter }
						/>
						<CoverageRing
							label={ __( 'Meta description added', 'jetpack-seo' ) }
							action={ descriptionAction }
							segment={ with_description }
							total={ total }
							need="description"
							onFilter={ onFilter }
						/>
						<CoverageRing
							label={ __( 'Visible to search engines', 'jetpack-seo' ) }
							action={ searchAction }
							segment={ with_search_visible }
							total={ total }
							need="search"
							onFilter={ onFilter }
						/>
					</div>
				) }
				<Stack direction="row" justify="flex-end" className={ styles.footer }>
					<Button variant="solid" size="compact" onClick={ onManage }>
						{ __( 'Manage content SEO', 'jetpack-seo' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default ContentCoverageCard;
