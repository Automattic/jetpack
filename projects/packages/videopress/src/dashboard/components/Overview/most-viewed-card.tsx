import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import { Card, Stack } from '@wordpress/ui';
import type { TopVideo } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	videos: TopVideo[];
	isLoading: boolean;
};

const NUMBER_FORMATTER = new Intl.NumberFormat();

/**
 * "Most viewed" card. Renders a mini table whose rows link to the
 * Phase 4 details screen at `/video/$id`. The footer "See all videos"
 * link routes back to the Library tab.
 *
 * @param props           - Component props.
 * @param props.videos    - Top videos for the active range.
 * @param props.isLoading - When true, renders 5 skeleton rows so the
 *                        card height does not collapse.
 * @return The card element.
 */
export default function MostViewedCard( { videos, isLoading }: Props ): ReactElement {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Most viewed', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<table className="vp-overview__ranking-table">
					<thead>
						<tr>
							<th scope="col">{ __( 'TITLE', 'jetpack-videopress-pkg' ) }</th>
							<th scope="col" className="vp-overview__ranking-views">
								{ __( 'VIEWS', 'jetpack-videopress-pkg' ) }
							</th>
						</tr>
					</thead>
					<tbody>
						{ isLoading
							? Array.from( { length: 5 } ).map( ( _, i ) => (
									<tr
										key={ `skeleton-${ i }` }
										className="vp-overview__ranking-row vp-overview__ranking-row--skeleton"
									>
										<td>
											<span className="vp-overview__skeleton-block" />
										</td>
										<td className="vp-overview__ranking-views">
											<span className="vp-overview__skeleton-block vp-overview__skeleton-block--narrow" />
										</td>
									</tr>
							  ) )
							: videos.map( v => (
									<tr key={ v.id } className="vp-overview__ranking-row">
										<td>
											<Link to={ `/video/${ v.id }` }>{ v.title }</Link>
										</td>
										<td className="vp-overview__ranking-views">
											{ NUMBER_FORMATTER.format( v.views ) }
										</td>
									</tr>
							  ) ) }
					</tbody>
				</table>
				<Stack direction="row" justify="center" className="vp-overview__ranking-footer">
					<Link to="/library">{ __( 'See all videos', 'jetpack-videopress-pkg' ) }</Link>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
