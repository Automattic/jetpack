import { Col, Container, LoadingPlaceholder } from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { isMockMode } from './data/mock';
import useConnection from './hooks/use-connection';
import type { FC, ReactNode } from 'react';

/**
 * Gate screen — wraps the overview and only renders `children` when the
 * site is fully connected. Plan-gating (Scan plan presence) lives in
 * later phases; for now an unconnected site sees a loading placeholder
 * while the Jetpack connection state hydrates, then falls through to
 * the overview if connected.
 *
 * @param root0          - Component props.
 * @param root0.children - The wrapped overview tree.
 * @return The gate or its children.
 */
const Gates: FC< { children: ReactNode } > = ( { children } ) => {
	const connectionStatus = useConnection();
	const { hasConnectionError } = useConnectionErrorNotice();

	// `?jps-mock=1` short-circuits every gate so the overview renders
	// immediately, even on sites without a Jetpack connection or a Scan
	// plan. Useful for local design iteration on JT/Docker.
	if ( isMockMode() ) {
		return <>{ children }</>;
	}

	const connectionLoaded = Object.keys( connectionStatus ).length > 0;

	const connectionBanner = hasConnectionError ? (
		<Col className="jetpack-connection-verified-error">
			<ConnectionError />
		</Col>
	) : null;

	if ( ! connectionLoaded ) {
		return (
			<Container horizontalSpacing={ 5 } fluid>
				<Col>
					<LoadingPlaceholder width="100%" height={ 500 } />
				</Col>
			</Container>
		);
	}

	return (
		<>
			{ connectionBanner }
			{ children }
		</>
	);
};

export default Gates;
