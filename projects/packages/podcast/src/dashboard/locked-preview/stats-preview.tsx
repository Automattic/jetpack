// Static stats-panel placeholder for the locked preview. Mirrors the modules a
// Premium user sees in the Stats panel: Downloads bar chart, Top episodes
// list, By app list. CSS-only render — no @automattic/charts dependency so
// free users don't pull the heavy stats chunk. The whole preview is
// `aria-hidden` and visually blurred, so the rows below are non-language
// skeleton placeholders rather than localized strings.

import { __ } from '@wordpress/i18n';

const DOWNLOAD_DAYS = [ 18, 32, 24, 45, 38, 52, 41, 60, 47, 55, 49, 63, 58, 70 ];
const DOWNLOAD_MAX = Math.max( ...DOWNLOAD_DAYS );

interface SampleRow {
	id: number;
	pct: number;
}

const SAMPLE_TOP_EPISODES: SampleRow[] = [
	{ id: 1, pct: 100 },
	{ id: 2, pct: 76 },
	{ id: 3, pct: 63 },
	{ id: 4, pct: 47 },
];

const SAMPLE_BY_APP: SampleRow[] = [
	{ id: 1, pct: 100 },
	{ id: 2, pct: 66 },
	{ id: 3, pct: 24 },
	{ id: 4, pct: 15 },
];

const StatsPreview = () => (
	<div className="podcast-locked-preview__stats">
		<section className="podcast-locked-preview__module podcast-locked-preview__module--chart">
			<h3>{ __( 'Downloads', 'jetpack-podcast' ) }</h3>
			<div className="podcast-locked-preview__chart">
				{ DOWNLOAD_DAYS.map( ( v, i ) => (
					<span
						key={ i }
						className="podcast-locked-preview__chart-bar"
						style={ { height: `${ ( v / DOWNLOAD_MAX ) * 100 }%` } }
					/>
				) ) }
			</div>
		</section>

		<section className="podcast-locked-preview__module">
			<h3>{ __( 'Top episodes', 'jetpack-podcast' ) }</h3>
			<ul className="podcast-locked-preview__bar-list">
				{ SAMPLE_TOP_EPISODES.map( row => (
					<li key={ row.id }>
						<span
							className="podcast-locked-preview__bar"
							style={ { width: `${ row.pct }%` } }
							aria-hidden="true"
						/>
					</li>
				) ) }
			</ul>
		</section>

		<section className="podcast-locked-preview__module">
			<h3>{ __( 'By app', 'jetpack-podcast' ) }</h3>
			<ul className="podcast-locked-preview__bar-list">
				{ SAMPLE_BY_APP.map( row => (
					<li key={ row.id }>
						<span
							className="podcast-locked-preview__bar"
							style={ { width: `${ row.pct }%` } }
							aria-hidden="true"
						/>
					</li>
				) ) }
			</ul>
		</section>
	</div>
);

export default StatsPreview;
