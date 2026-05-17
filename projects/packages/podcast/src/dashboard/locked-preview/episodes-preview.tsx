// Static episode-list placeholder for the locked preview. Mirrors the columns
// the live DataViews-backed Episodes table renders (thumb / title / duration /
// plays / date / status) so the blurred shape reads as "this is what the
// dashboard looks like" without revealing any real data. The whole preview is
// `aria-hidden` and visually blurred, so sample rows render as non-language
// skeleton cells rather than localized strings.

import { __ } from '@wordpress/i18n';

const SAMPLE_ROW_IDS = [ 1, 2, 3, 4, 5 ];

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
			{ SAMPLE_ROW_IDS.map( id => (
				<tr key={ id }>
					<td className="podcast-locked-preview__col-media">
						<span className="podcast-locked-preview__thumb" />
					</td>
					<td>
						<span className="podcast-locked-preview__cell-skeleton podcast-locked-preview__cell-skeleton--wide" />
					</td>
					<td>
						<span className="podcast-locked-preview__cell-skeleton" />
					</td>
					<td>
						<span className="podcast-locked-preview__cell-skeleton" />
					</td>
					<td>
						<span className="podcast-locked-preview__cell-skeleton" />
					</td>
					<td>
						<span className="podcast-locked-preview__cell-skeleton" />
					</td>
				</tr>
			) ) }
		</tbody>
	</table>
);

export default EpisodesPreview;
