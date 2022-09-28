import { Container, Col, Title } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import EmptyList from './empty';
import List from './list';
import VulnerabilitiesNavigation from './navigation';
import useVulsList from './use-vuls-list';

const VulnerabilitiesList = () => {
	const { item, list, selected, setSelected } = useVulsList();

	return (
		<Container fluid horizontalSpacing={ 0 } horizontalGap={ 5 }>
			<Col lg={ 4 }>
				<VulnerabilitiesNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				{ list?.length > 0 ? (
					<>
						<Title mb={ 3 }>
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
					</>
				) : (
					<EmptyList />
				) }
			</Col>
		</Container>
	);
};

export default VulnerabilitiesList;
