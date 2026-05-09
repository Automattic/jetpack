import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { flagEmoji } from './flag-emoji';
import type { TopLocation } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	locations: TopLocation[];
	isLoading: boolean;
};

const NUMBER_FORMATTER = new Intl.NumberFormat();

/**
 * "Top locations" card. Mini-table of country flag + name and view
 * counts. Rows are not links and there is no "See all locations"
 * footer (no such route exists yet — Phase 6 may add it).
 *
 * @param props           - Component props.
 * @param props.locations - Top countries for the active range.
 * @param props.isLoading - When true, renders 5 skeleton rows so the
 *                        card height does not collapse.
 * @return The card element.
 */
export default function TopLocationsCard( { locations, isLoading }: Props ): ReactElement {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Top locations', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<table className="vp-overview__ranking-table">
					<thead>
						<tr>
							<th scope="col">{ __( 'COUNTRIES', 'jetpack-videopress-pkg' ) }</th>
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
							: locations.map( l => (
									<tr key={ l.countryCode } className="vp-overview__ranking-row">
										<td>
											<span aria-hidden="true" className="vp-overview__flag">
												{ flagEmoji( l.countryCode ) }
											</span>
											{ l.countryName }
										</td>
										<td className="vp-overview__ranking-views">
											{ NUMBER_FORMATTER.format( l.views ) }
										</td>
									</tr>
							  ) ) }
					</tbody>
				</table>
			</Card.Content>
		</Card.Root>
	);
}
