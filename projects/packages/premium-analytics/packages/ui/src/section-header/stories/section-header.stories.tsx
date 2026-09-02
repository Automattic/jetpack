import {
	computePrimaryRange,
	PRESET_ALL_TIME,
	type ComparisonPresetId,
	type IntervalType,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Icon, Skeleton, Stack } from '@jetpack-premium-analytics/externals';
import { getSettings, setSettings } from '@wordpress/date';
import { post } from '@wordpress/icons';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { DateFiltersPanel } from '../../date-filters-panel';
import { DateIntervalDropdown } from '../../date-interval-dropdown';
import {
	getStoryIntervalOptions,
	resolveStoryInterval,
} from '../../date-interval-dropdown/stories/story-interval-options';
import { DateYearFilter } from '../../date-year-filter';
import { SectionHeader } from '../section-header';
import type { DateRange as PanelDateRange } from '../../date-filters-panel/date-filters-panel';
import type { Meta, StoryObj } from '@storybook/react';

const STORYBOOK_TIMEZONE = 'America/New_York';

const meta: Meta< typeof SectionHeader > = {
	title: 'Packages/Premium Analytics/UI/SectionHeader',
	component: SectionHeader,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Header for an analytics surface: a **title** names the section, and the ' +
					'date controls sit beside it on the same row.\n\n' +
					'The controls are a slot: the consumer passes them as `children` and keeps ' +
					'the date state, so the header stays purely presentational.',
			},
		},
	},
	argTypes: {
		children: { control: false },
	},
	beforeEach: () => {
		const settings = getSettings();
		setSettings( {
			...settings,
			timezone: { ...settings.timezone, string: STORYBOOK_TIMEZONE },
		} );

		return () => setSettings( settings );
	},
};
export default meta;

type Story = StoryObj< typeof SectionHeader >;

type PrimaryFilterState = {
	range: PanelDateRange;
	presetId: PrimaryPresetId;
};

/**
 * Committed/staged seed mirroring the dashboard default: Last 30 days.
 */
function buildInitialPrimaryState(): PrimaryFilterState {
	const range = computePrimaryRange( 'last-30-days', STORYBOOK_TIMEZONE );

	return {
		presetId: 'last-30-days',
		range: { from: range?.from, to: range?.to },
	};
}

/**
 * Whether the primary picker is holding an un-applied edit, which gates Apply.
 */
function hasPrimaryDraft( staged: PrimaryFilterState, committed: PrimaryFilterState ): boolean {
	return (
		staged.range.from !== committed.range.from ||
		staged.range.to !== committed.range.to ||
		staged.presetId !== committed.presetId
	);
}

/**
 * Rolling date controls for the slot, wired like the dashboard: staged primary
 * edits committed on Apply, while a comparison or interval pick commits on its
 * own. A trimmed copy of the DateFiltersPanel story harness.
 */
function RollingDateControls() {
	const initial = buildInitialPrimaryState();

	const [ committed, setCommitted ] = useState( initial );
	const [ staged, setStaged ] = useState( initial );
	const stagedRef = useRef( staged );
	stagedRef.current = staged;

	const [ comparisonPresetId, setComparisonPresetId ] = useState< ComparisonPresetId | undefined >(
		undefined
	);

	const [ pickedInterval, setPickedInterval ] = useState< IntervalType | undefined >( undefined );

	const handleChange = useCallback(
		( nextRange?: PanelDateRange, nextPresetId?: PrimaryPresetId ) => {
			const next: PrimaryFilterState = {
				range: nextRange ?? stagedRef.current.range,
				presetId: nextPresetId ?? stagedRef.current.presetId,
			};

			stagedRef.current = next;
			setStaged( next );
		},
		[]
	);

	const handleApply = useCallback( () => {
		setCommitted( stagedRef.current );
	}, [] );

	const handleCancel = useCallback( () => {
		stagedRef.current = committed;
		setStaged( committed );
	}, [ committed ] );

	const handleComparisonChange = useCallback(
		( _range: PanelDateRange | undefined, nextPresetId?: ComparisonPresetId ) => {
			setComparisonPresetId( nextPresetId );
		},
		[]
	);

	// A pick the committed range no longer allows coerces to the finest bucket
	// it does, the way the report params have it.
	const intervalOptions = getStoryIntervalOptions( staged.presetId );

	return (
		<DateFiltersPanel
			presetId={ staged.presetId }
			range={ staged.range }
			appliedPresetId={ committed.presetId }
			appliedRange={ committed.range }
			comparisonPresetId={ comparisonPresetId }
			withIntervalControl
			interval={ resolveStoryInterval( pickedInterval, intervalOptions ) }
			intervalOptions={ intervalOptions }
			onChange={ handleChange }
			onComparisonChange={ handleComparisonChange }
			onIntervalChange={ setPickedInterval }
			onApply={ handleApply }
			onCancel={ handleCancel }
			canApply={ hasPrimaryDraft( staged, committed ) }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

/**
 * Year-surface controls for the slot: all time plus calendar years and the
 * interval control, but no comparison, as the Insights instance specifies.
 */
function YearDateControls( { containerElement }: { containerElement: HTMLElement | null } ) {
	const [ presetId, setPresetId ] = useState< YearSurfacePresetId >( PRESET_ALL_TIME );
	const [ pickedInterval, setPickedInterval ] = useState< IntervalType | undefined >( undefined );

	// A calendar year allows finer buckets than all time, so the interval is
	// re-resolved against the selection rather than carried.
	const intervalOptions = getStoryIntervalOptions( presetId );

	return (
		<Stack direction="row" align="center" gap="sm">
			<DateYearFilter
				value={ presetId }
				onSelect={ ( _range, nextPresetId ) => setPresetId( nextPresetId ) }
				timeZone={ STORYBOOK_TIMEZONE }
				containerElement={ containerElement }
			/>

			<DateIntervalDropdown
				options={ intervalOptions }
				value={ resolveStoryInterval( pickedInterval, intervalOptions ) }
				onChange={ setPickedInterval }
			/>
		</Stack>
	);
}

type SectionHeaderStoryProps = {
	title: ReactNode;
	condenseOnScroll?: boolean;
};

function RollingSectionHeaderStory( { title, condenseOnScroll }: SectionHeaderStoryProps ) {
	return (
		<SectionHeader title={ title } condenseOnScroll={ condenseOnScroll }>
			<RollingDateControls />
		</SectionHeader>
	);
}

function YearSectionHeaderStory( { title }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title }>
				<YearDateControls containerElement={ container } />
			</SectionHeader>
		</div>
	);
}

/**
 * The **Traffic-like** instance: rolling presets, custom range, chart interval,
 * and comparison in the slot.
 *
 * Range edits are staged and land on Apply; a comparison or interval pick
 * commits on its own, the way `useReportDateFilters` has it. Switching to a
 * preset that disallows the active bucket falls back to the finest one it
 * allows.
 */
export const Default: Story = {
	args: {
		title: 'Site traffic',
	},
	render: ( { title } ) => <RollingSectionHeaderStory title={ title } />,
};

/**
 * A title long enough to overflow its track: it truncates with an ellipsis
 * instead of wrapping or compressing the date controls, which keep their
 * natural width for as long as the title stays above its floor.
 */
export const LongTitle: Story = {
	args: {
		title: 'Traffic for every site, network, and channel this account has ever measured',
	},
	render: ( { title } ) => <RollingSectionHeaderStory title={ title } />,
};

/**
 * The **Insights-like** instance: the year surface (all time plus calendar
 * years) and the chart interval in the slot.
 *
 * Per the design's instances table, this surface carries *no comparison
 * control* but does carry the interval one.
 */
export const YearSurface: Story = {
	args: {
		title: 'Insights',
	},
	render: ( { title } ) => <YearSectionHeaderStory title={ title } />,
};

/**
 * The same header in a box too narrow for two halves: the title and the
 * controls stack, and the controls read from the start edge.
 *
 * The switch follows this wrapper's width, not the viewport's, so the story
 * shows it at any window size.
 */
export const Stacked: Story = {
	args: {
		title: 'Site traffic',
	},
	render: ( { title } ) => (
		<div style={ { inlineSize: 520 } }>
			<RollingSectionHeaderStory title={ title } />
		</div>
	),
};

/*
 * Story-only stand-in for what a surface provides around a pinned header: a
 * strip to scroll past and the pin marker publishing the view timeline. The
 * dashboard does this in `routes/dashboard/stage.module.scss`.
 */
const PIN_TIMELINE = '--section-header-pin';
const PIN_MARKER_STYLE = {
	position: 'absolute',
	insetBlockStart: 0,
	inlineSize: 1,
	blockSize: 40,
	visibility: 'hidden',
	pointerEvents: 'none',
	viewTimelineName: PIN_TIMELINE,
	viewTimelineAxis: 'block',
} as const;

/**
 * `condenseOnScroll` on a pinned header: scroll the box below, and once the
 * header clears the strip above it and pins, the title drops a type-scale step
 * over the next 40px. Nothing condenses while the header is still on its way
 * up, and the effect reverses as you scroll back up. Browsers without
 * scroll-driven animations, surfaces that publish no pin marker, and readers
 * who asked for reduced motion all keep the resting title.
 */
export const CondensingOnScroll: Story = {
	args: {
		title: 'Site traffic',
	},
	render: ( { title } ) => (
		<div style={ { blockSize: 320, overflowY: 'auto' } }>
			<div style={ { blockSize: 48 } }>Something to scroll past, as the section tabs are.</div>
			<div style={ { position: 'relative', timelineScope: PIN_TIMELINE } }>
				<div style={ PIN_MARKER_STYLE } aria-hidden="true" />
				<div
					style={ {
						position: 'sticky',
						insetBlockStart: 0,
						background: 'var(--wpds-color-background-surface-neutral-strong)',
					} }
				>
					<RollingSectionHeaderStory title={ title } condenseOnScroll />
				</div>
				<div style={ { blockSize: 900 } } />
			</div>
		</div>
	),
};

/**
 * The left half on its own: nothing in the controls slot.
 */
export const WithoutControls: Story = {
	args: {
		title: 'Site traffic',
	},
	render: ( { title } ) => <SectionHeader title={ title } />,
};

/**
 * The **detail-page** instance: a resource names the page, so the title is its
 * `h1`, its mark (here the type icon, a thumbnail when the post has one) sits
 * before it, and a subtitle states what the widgets below report on.
 *
 * The visual slot owns its box, so a consumer passes only the image or the
 * glyph. It is decorative by contract — the title already names the resource.
 */
export const WithVisualAndSubtitle: Story = {
	args: {
		title: 'Ten things I learned building a headless storefront',
	},
	render: ( { title } ) => (
		<SectionHeader
			headingLevel={ 1 }
			title={ title }
			visual={ <Icon icon={ post } size={ 28 } /> }
			subTitle="Post published on Feb 3, 2025. Performance from Feb 3, 2025 to Sep 2, 2026"
		>
			<RollingDateControls />
		</SectionHeader>
	),
};

/**
 * The same header before the resource resolves: the title and subtitle slots
 * hold skeletons, so the page does not read as blank while the grid draws.
 */
export const LoadingResource: Story = {
	render: () => (
		<SectionHeader
			headingLevel={ 1 }
			busy
			title={ <Skeleton style={ { display: 'block', blockSize: 38, inlineSize: 320 } } /> }
			visual={ <Icon icon={ post } size={ 28 } /> }
			subTitle={ <Skeleton style={ { display: 'block', blockSize: 18, inlineSize: 260 } } /> }
		>
			<RollingDateControls />
		</SectionHeader>
	),
};
