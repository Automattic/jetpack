import { Col, Container } from '@automattic/jetpack-components';
import { useQuery } from '@tanstack/react-query';
import { __, sprintf } from '@wordpress/i18n';
import { siteScanCountsQuery } from '../../data/query-options';
import type { FC } from 'react';

/**
 * Phase 0 overview placeholder. Renders a "Hello Scan" panel with the
 * threat counts pulled from `siteScanCountsQuery` so we can verify the
 * data layer is wired end-to-end. Phase 1+ replaces this with the real
 * tabbed Active / History DataViews port.
 *
 * @return The Phase 0 overview screen.
 */
const OverviewScreen: FC = () => {
	const { data: counts, isLoading } = useQuery( siteScanCountsQuery() );

	return (
		<Container horizontalSpacing={ 5 } horizontalGap={ 3 }>
			<Col>
				<h2>{ __( 'Scan overview', 'jetpack-scan-page' ) }</h2>
				<p>
					{ __(
						'This is the Phase 0 scaffold for the Scan overview page. Phase 1+ replaces this placeholder with the tabbed Active / History DataViews port from the WordPress.com Dashboard.',
						'jetpack-scan-page'
					) }
				</p>
				{ isLoading && <p>{ __( 'Loading…', 'jetpack-scan-page' ) }</p> }
				{ ! isLoading && counts && (
					<ul>
						<li>
							{ sprintf(
								/* translators: %d is the number of currently-detected active threats. */
								__( 'Active threats: %d', 'jetpack-scan-page' ),
								counts.current
							) }
						</li>
						<li>
							{ sprintf(
								/* translators: %d is the number of fixed threats over time. */
								__( 'Fixed threats: %d', 'jetpack-scan-page' ),
								counts.fixed
							) }
						</li>
						<li>
							{ sprintf(
								/* translators: %d is the number of ignored threats. */
								__( 'Ignored threats: %d', 'jetpack-scan-page' ),
								counts.ignored
							) }
						</li>
					</ul>
				) }
			</Col>
		</Container>
	);
};

export default OverviewScreen;
