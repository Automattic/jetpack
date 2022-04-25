/**
 * External dependencies
 */
import React from 'react';
import { Container, Col } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import VulnerabilitiesNavigation from './navigation';
import List from './list';
import useVulsList from './use-vuls-list';

const VulnerabilitiesList = () => {
	const { selected, setSelected } = useVulsList();

	return (
		<Container fluid>
			<Col lg={ 4 }>
				<VulnerabilitiesNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				<List selected={ selected } />
			</Col>
		</Container>
	);
};

export default VulnerabilitiesList;
