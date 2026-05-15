// Static stats-panel placeholder for the locked preview. Mirrors the modules a
// Premium user sees in the Stats panel: Downloads bar chart, Top episodes
// list, By app list. CSS-only render — no @automattic/charts dependency so
// free users don't pull the heavy stats chunk.

import { __ } from '@wordpress/i18n';

const DOWNLOAD_DAYS = [ 18, 32, 24, 45, 38, 52, 41, 60, 47, 55, 49, 63, 58, 70 ];
const DOWNLOAD_MAX = Math.max( ...DOWNLOAD_DAYS );

interface SampleRow {
	id: number;
	label: string;
	value: string;
	pct: number;
}

const SAMPLE_TOP_EPISODES: SampleRow[] = [
	{ id: 1, label: 'Episode 1 — the first conversation', value: '1,284', pct: 100 },
	{ id: 2, label: 'Episode 2 — guest interview with a friend', value: '973', pct: 76 },
	{ id: 3, label: 'Episode 3 — back-to-basics, why we started', value: '812', pct: 63 },
	{ id: 4, label: 'Episode 4 — Q&A from our listeners', value: '604', pct: 47 },
];

const SAMPLE_BY_APP: SampleRow[] = [
	{ id: 1, label: 'Apple Podcasts', value: '2,140', pct: 100 },
	{ id: 2, label: 'Spotify', value: '1,420', pct: 66 },
	{ id: 3, label: 'Pocket Casts', value: '510', pct: 24 },
	{ id: 4, label: 'Overcast', value: '320', pct: 15 },
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
						<span className="podcast-locked-preview__bar-label">{ row.label }</span>
						<span className="podcast-locked-preview__bar-value">{ row.value }</span>
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
						<span className="podcast-locked-preview__bar-label">{ row.label }</span>
						<span className="podcast-locked-preview__bar-value">{ row.value }</span>
					</li>
				) ) }
			</ul>
		</section>
	</div>
);

export default StatsPreview;
