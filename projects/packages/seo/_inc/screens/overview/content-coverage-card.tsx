import { DonutMeter } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { formatListBullets } from '@wordpress/icons';
import { Button, Card, Stack, Text, Tooltip } from '@wordpress/ui';
import CardHeaderIcon from './card-header-icon';
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
	// unconfigured rows will show, and seeds the ring's accessible name.
	action: string;
	segment: number;
	total: number;
	need: ContentNeed;
	onFilter: ( need: ContentNeed ) => void;
}

/**
 * One factual coverage ring: a proportion (segment of total) plus the literal
 * count and a centered percentage. Uses the DonutMeter's default Jetpack-brand
 * green — a deliberate brand choice, not a health grade, and never adaptive (a
 * fuller ring never turns yellow/red); more posts with the field set just means
 * a fuller ring. The admin decides what matters.
 *
 * When some items still lack the field, the ring is an interactive control that
 * deep-links to the Content tab filtered to *those* rows — the ones there's an
 * action to take. A fully-covered ring has nothing to fix, so it stays static.
 *
 * @param props          - Component props.
 * @param props.label    - Localized label for the metric.
 * @param props.action   - Localized action; also seeds the ring's accessible name.
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

	// Round to whole percent, but never show a misleading "100%" while the ring is
	// still incomplete (e.g. 199/200 → 99%). A fully-covered ring reads exactly 100%.
	const rounded = segment >= total ? 100 : Math.min( 99, Math.round( ( segment / total ) * 100 ) );
	const percent = sprintf(
		/* translators: %d: percentage of posts with the field set. */
		__( '%d%%', 'jetpack-seo' ),
		rounded
	);

	const inner: ReactNode = (
		<>
			{ /* Chart is decorative: the interactive ring's aria-label carries the action
			     and count, and the count/label are visible text below, so the DonutMeter
			     and the centered percentage are aria-hidden — this also removes the
			     DonutMeter's native SVG `<title>` tooltip, which duplicated the tooltip. */ }
			<div className={ styles.donutWrap }>
				<DonutMeter
					totalCount={ total }
					segmentCount={ segment }
					donutWidth="112px"
					thickness="4"
				/>
				<span className={ styles.pct } aria-hidden="true">
					<Text variant="heading-lg" className={ styles.pctValue }>
						{ percent }
					</Text>
				</span>
			</div>
			<Text variant="heading-lg">{ count }</Text>
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

	// The button's aria-label overrides its contents for the accessible name, so
	// fold the count in — otherwise a screen reader hears the action but loses the
	// coverage value the sighted user sees.
	const accessibleName = sprintf(
		/* translators: %1$s: the action (e.g. "Set SEO titles"); %2$d: posts with the field set; %3$d: total posts. */
		__( '%1$s. %2$d of %3$d.', 'jetpack-seo' ),
		action,
		segment,
		total
	);

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				className={ styles.ringTrigger }
				aria-label={ accessibleName }
				onClick={ handleFilter }
			>
				<Stack direction="column" align="center" gap="xs" className={ styles.ring }>
					{ inner }
				</Stack>
			</Tooltip.Trigger>
			<Tooltip.Popup>{ action }</Tooltip.Popup>
		</Tooltip.Root>
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
			{ /* The rings count every public, REST-enabled post type — not just posts and
			     pages — so the scope is worth stating; "Content SEO" alone doesn't say it. */ }
			<CardHeaderIcon
				icon={ formatListBullets }
				title={ __( 'Content SEO', 'jetpack-seo' ) }
				subtitle={ __( 'Posts, pages, and more', 'jetpack-seo' ) }
			/>
			<Card.Content>
				{ total === 0 ? (
					<Text variant="body-md" render={ <p /> }>
						{ __( 'No published content yet.', 'jetpack-seo' ) }
					</Text>
				) : (
					// One shared Tooltip.Provider for all rings so hovering between
					// adjacent rings re-opens instantly instead of re-waiting the delay.
					<Tooltip.Provider delay={ 150 }>
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
					</Tooltip.Provider>
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
