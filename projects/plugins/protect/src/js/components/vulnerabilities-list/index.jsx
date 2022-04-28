/**
 * External dependencies
 */
import React from 'react';
import { Container, Col, Title } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VulnerabilitiesNavigation from './navigation';
import List from './list';
import useVulsList from './use-vuls-list';

const VulnerabilitiesList = () => {
	const { item, list, selected, setSelected } = useVulsList();

	return (
		<Container fluid>
			<Col lg={ 4 }>
				<VulnerabilitiesNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				<Title>
					{ selected === 'all'
						? sprintf(
								/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
								__( 'All %s vulnerabilities', 'jetpack-protect' ),
								list.length
						  )
						: sprintf(
								/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
								__( '%1$s vulnerabilities in your %2$s %3$s', 'jetpack-protect' ),
								list.length,
								item?.name,
								item?.version
						  ) }
				</Title>
				<List list={ list } />
			</Col>
		</Container>
	);
};

export default VulnerabilitiesList;
