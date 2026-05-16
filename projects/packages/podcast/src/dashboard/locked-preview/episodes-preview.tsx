// Static episode-list placeholder for the locked preview. Mirrors the columns
// the live DataViews-backed Episodes table renders (thumb / title / duration /
// plays / date / status) so the blurred shape reads as "this is what the
// dashboard looks like" without revealing any real data.

import { __ } from '@wordpress/i18n';

interface SampleEpisode {
	id: number;
	title: string;
	duration: string;
	plays: string;
	date: string;
	status: string;
}

const SAMPLE_EPISODES: SampleEpisode[] = [
	{
		id: 1,
		title: 'Episode 1 — the first conversation',
		duration: '42:18',
		plays: '1,284',
		date: 'May 1, 2026',
		status: 'Published',
	},
	{
		id: 2,
		title: 'Episode 2 — guest interview with a friend',
		duration: '38:02',
		plays: '973',
		date: 'May 8, 2026',
		status: 'Published',
	},
	{
		id: 3,
		title: 'Episode 3 — back-to-basics, why we started',
		duration: '51:47',
		plays: '812',
		date: 'May 15, 2026',
		status: 'Published',
	},
	{
		id: 4,
		title: 'Episode 4 — Q&A from our listeners',
		duration: '29:33',
		plays: '604',
		date: 'May 22, 2026',
		status: 'Published',
	},
	{
		id: 5,
		title: 'Episode 5 — short bonus thoughts',
		duration: '14:20',
		plays: '450',
		date: 'May 28, 2026',
		status: 'Scheduled',
	},
];

const EpisodesPreview = () => (
	<table className="podcast-locked-preview__episodes">
		<thead>
			<tr>
				<th scope="col" className="podcast-locked-preview__col-media">
					{ '' }
				</th>
				<th scope="col">{ __( 'Title', 'jetpack-podcast' ) }</th>
				<th scope="col">{ __( 'Duration', 'jetpack-podcast' ) }</th>
				<th scope="col">{ __( 'Plays', 'jetpack-podcast' ) }</th>
				<th scope="col">{ __( 'Date', 'jetpack-podcast' ) }</th>
				<th scope="col">{ __( 'Status', 'jetpack-podcast' ) }</th>
			</tr>
		</thead>
		<tbody>
			{ SAMPLE_EPISODES.map( ep => (
				<tr key={ ep.id }>
					<td className="podcast-locked-preview__col-media">
						<span className="podcast-locked-preview__thumb" />
					</td>
					<td>{ ep.title }</td>
					<td>{ ep.duration }</td>
					<td>{ ep.plays }</td>
					<td>{ ep.date }</td>
					<td>{ ep.status }</td>
				</tr>
			) ) }
		</tbody>
	</table>
);

export default EpisodesPreview;
