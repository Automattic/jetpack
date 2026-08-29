import {
	computePrimaryRange,
	getComparisonRangeFromPreset,
	PRESET_ALL_TIME,
	type ComparisonPresetId,
	type DateRange,
	type IntervalType,
	type PrimaryPresetId,
	type YearSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import { getSettings, setSettings } from '@wordpress/date';
import { useCallback, useRef, useState } from 'react';
import { DateFiltersPanel } from '../../date-filters-panel';
import { DateIntervalDropdown } from '../../date-interval-dropdown';
import {
	getStoryIntervalOptions,
	resolveStoryInterval,
} from '../../date-interval-dropdown/stories/story-interval-options';
import { DateYearFilter } from '../../date-year-filter';
import { getSectionSubtitle } from '../get-section-subtitle';
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
					'Header for an analytics surface. A **title** names the section and a ' +
					'**subtitle** describes the active date configuration, on a row of its ' +
					'own so its length never costs the controls width.\n\n' +
					'The controls are a slot: the consumer passes them as `children`, keeps ' +
					'the date state, and derives the subtitle from the *applied* range, so ' +
					'the header stays purely presentational.',
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
 * The applied date configuration the subtitle describes.
 */
type AppliedDateState = {
	range: PanelDateRange;
	comparisonPresetId?: ComparisonPresetId;
	comparisonRange?: DateRange;
	presetId?: PrimaryPresetId;
	interval?: IntervalType;
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
 * Whether the primary picker is holding an un-applied edit.
 *
 * One predicate for two rules, the way `useReportDateFilters` has it: it gates
 * Apply, and it decides whether a comparison change commits on its own.
 */
function hasPrimaryDraft( staged: PrimaryFilterState, committed: PrimaryFilterState ): boolean {
	return (
		staged.range.from !== committed.range.from ||
		staged.range.to !== committed.range.to ||
		staged.presetId !== committed.presetId
	);
}

/**
 * Derived on every commit rather than stored, because `buildRangePatch`
 * re-derives the comparison whenever the primary range moves.
 */
function comparisonRangeFor( range: PanelDateRange, presetId: ComparisonPresetId | undefined ) {
	return presetId ? getComparisonRangeFromPreset( range, presetId ) : undefined;
}

/**
 * Rolling date controls for the slot, wired like the dashboard: staged primary
 * edits committed on Apply. A trimmed copy of the DateFiltersPanel story
 * harness.
 */
function RollingDateControls( {
	onAppliedChange,
}: {
	onAppliedChange: ( applied: AppliedDateState ) => void;
} ) {
	const initial = buildInitialPrimaryState();

	const [ committed, setCommitted ] = useState( initial );
	const [ staged, setStaged ] = useState( initial );
	const stagedRef = useRef( staged );
	stagedRef.current = staged;

	const [ comparisonPresetId, setComparisonPresetId ] = useState< ComparisonPresetId | undefined >(
		undefined
	);

	const [ pickedInterval, setPickedInterval ] = useState< IntervalType | undefined >( undefined );

	/**
	 * What the interval resolves to under a given preset, so a pick the next
	 * range no longer allows coerces on Apply rather than being carried.
	 */
	const intervalFor = useCallback(
		( presetId: PrimaryPresetId ) =>
			resolveStoryInterval( pickedInterval, getStoryIntervalOptions( presetId ) ),
		[ pickedInterval ]
	);

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
		onAppliedChange( {
			range: stagedRef.current.range,
			presetId: stagedRef.current.presetId,
			comparisonPresetId,
			comparisonRange: comparisonRangeFor( stagedRef.current.range, comparisonPresetId ),
			interval: intervalFor( stagedRef.current.presetId ),
		} );
	}, [ onAppliedChange, comparisonPresetId, intervalFor ] );

	const handleCancel = useCallback( () => {
		stagedRef.current = committed;
		setStaged( committed );
	}, [ committed ] );

	/*
	 * Mirrors `useReportDateFilters`: a comparison change commits on its own and
	 * moves the subtitle right away, unless a primary edit is staged — then it
	 * rides along and both land on Apply.
	 */
	const handleComparisonChange = useCallback(
		( _range: PanelDateRange | undefined, nextPresetId?: ComparisonPresetId ) => {
			setComparisonPresetId( nextPresetId );

			if ( ! hasPrimaryDraft( stagedRef.current, committed ) ) {
				onAppliedChange( {
					range: committed.range,
					presetId: committed.presetId,
					comparisonPresetId: nextPresetId,
					comparisonRange: comparisonRangeFor( committed.range, nextPresetId ),
					interval: intervalFor( committed.presetId ),
				} );
			}
		},
		[ onAppliedChange, committed, intervalFor ]
	);

	// Applies on click unless a primary edit is staged, in which case it lands
	// with it — the same rule a comparison change follows.
	const handleIntervalChange = useCallback(
		( nextInterval: IntervalType ) => {
			setPickedInterval( nextInterval );

			if ( ! hasPrimaryDraft( stagedRef.current, committed ) ) {
				onAppliedChange( {
					range: committed.range,
					presetId: committed.presetId,
					comparisonPresetId,
					comparisonRange: comparisonRangeFor( committed.range, comparisonPresetId ),
					interval: nextInterval,
				} );
			}
		},
		[ onAppliedChange, committed, comparisonPresetId ]
	);

	const canApply = hasPrimaryDraft( staged, committed );
	const intervalOptions = getStoryIntervalOptions( committed.presetId );

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
			onIntervalChange={ handleIntervalChange }
			onApply={ handleApply }
			onCancel={ handleCancel }
			canApply={ canApply }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

/**
 * The year surface's own seed: all time, bucketed by the coarsest-but-one
 * interval its span allows.
 */
function buildInitialYearState(): AppliedDateState {
	const range = computePrimaryRange( PRESET_ALL_TIME, STORYBOOK_TIMEZONE );

	return {
		range: { from: range?.from, to: range?.to },
		presetId: PRESET_ALL_TIME,
		interval: getStoryIntervalOptions( PRESET_ALL_TIME )[ 0 ],
	};
}

/**
 * Year-surface controls for the slot: all time plus calendar years and the
 * interval control, but no comparison, as the Insights instance specifies.
 */
function YearDateControls( {
	containerElement,
	onSelectionChange,
}: {
	containerElement: HTMLElement | null;
	onSelectionChange: ( selection: AppliedDateState ) => void;
} ) {
	const [ selection, setSelection ] = useState< AppliedDateState >( buildInitialYearState );
	const [ pickedInterval, setPickedInterval ] = useState< IntervalType | undefined >( undefined );

	const intervalOptions = getStoryIntervalOptions( selection.presetId );

	return (
		<Stack direction="row" align="center" gap="sm">
			<DateYearFilter
				value={ selection.presetId }
				onSelect={ ( range, nextPresetId: YearSurfacePresetId ) => {
					// A calendar year allows finer buckets than all time, so the
					// selection is re-resolved rather than carried.
					const next: AppliedDateState = {
						range,
						presetId: nextPresetId,
						interval: resolveStoryInterval(
							pickedInterval,
							getStoryIntervalOptions( nextPresetId )
						),
					};

					setSelection( next );
					onSelectionChange( next );
				} }
				timeZone={ STORYBOOK_TIMEZONE }
				containerElement={ containerElement }
			/>

			<DateIntervalDropdown
				options={ intervalOptions }
				value={ resolveStoryInterval( pickedInterval, intervalOptions ) }
				onChange={ nextInterval => {
					setPickedInterval( nextInterval );
					onSelectionChange( { ...selection, interval: nextInterval } );
				} }
			/>
		</Stack>
	);
}

type SectionHeaderStoryProps = {
	title: string;
	subtitle?: string;
	condenseOnScroll?: boolean;
};

function RollingSectionHeaderStory( { title, condenseOnScroll }: SectionHeaderStoryProps ) {
	const [ applied, setApplied ] = useState< AppliedDateState >( () => {
		const initial = buildInitialPrimaryState();

		return {
			range: initial.range,
			presetId: initial.presetId,
			interval: getStoryIntervalOptions( initial.presetId )[ 0 ],
		};
	} );

	return (
		<SectionHeader
			title={ title }
			subtitle={ getSectionSubtitle( applied ) }
			condenseOnScroll={ condenseOnScroll }
		>
			<RollingDateControls onAppliedChange={ setApplied } />
		</SectionHeader>
	);
}

function YearSectionHeaderStory( { title }: SectionHeaderStoryProps ) {
	const [ container, setContainer ] = useState< HTMLDivElement | null >( null );
	const [ applied, setApplied ] = useState< AppliedDateState >( buildInitialYearState );

	return (
		<div ref={ setContainer }>
			<SectionHeader title={ title } subtitle={ getSectionSubtitle( applied ) }>
				<YearDateControls containerElement={ container } onSelectionChange={ setApplied } />
			</SectionHeader>
		</div>
	);
}

/**
 * The **Traffic-like** instance: rolling presets, custom range, chart interval,
 * and comparison in the slot.
 *
 * The subtitle derives from the *applied* configuration, so it holds still
 * while a range edit is staged and only moves on Apply. Picking a comparison or
 * an interval moves it right away, matching how those commit on their own.
 *
 * The interval control is a glyph, so the subtitle is the only place its choice
 * is readable, and where the coercion shows: switching to a preset that
 * disallows the active bucket falls back to the finest one it allows.
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
 * control* but does carry the interval one. Its ranges are the longest the
 * dashboard offers, so its subtitle carries no length — the years are already
 * in the range itself — and names only the bucket.
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
 * header clears the strip above it and pins, the subtitle fades and gives its
 * row back over the next 40px. Nothing condenses while the header is still on
 * its way up, and the effect reverses as you scroll back up. Browsers without
 * scroll-driven animations, surfaces that publish no pin marker, and readers
 * who asked for reduced motion all keep the subtitle in place.
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
		subtitle: 'Last 30 days',
	},
	render: ( { title, subtitle } ) => <SectionHeader title={ title } subtitle={ subtitle } />,
};
