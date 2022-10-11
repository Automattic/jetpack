import { Container, Col, Title } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import EmptyList from './empty';
import List from './list';
import ThreatsNavigation from './navigation';
import useThreatsList from './use-threats-list';

const ThreatsList = () => {
	const { item, list, selected, setSelected } = useThreatsList();

	const getTitle = useCallback( () => {
		switch ( selected ) {
			case 'all':
				return sprintf(
					/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
					__( 'All %s threats', 'jetpack-protect' ),
					list.length
				);
			case 'files':
				return sprintf(
					/* translators: placeholder is the amount of file threats found on the site. */
					__( '%s file threats', 'jetpack-protect' ),
					list.length
				);
			case 'database':
				return sprintf(
					/* translators: placeholder is the amount of database threats found on the site. */
					__( '%s database threats', 'jetpack-protect' ),
					list.length
				);
			default:
				return sprintf(
					/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
					__( '%1$s threats in your %2$s %3$s', 'jetpack-protect' ),
					list.length,
					item?.name,
					item?.version
				);
		}
	}, [ selected, list, item ] );

	return (
		<Container fluid horizontalSpacing={ 0 } horizontalGap={ 5 }>
			<Col lg={ 4 }>
				<ThreatsNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				{ list?.length > 0 ? (
					<>
						<Title mb={ 3 }>{ getTitle() }</Title>
						<List list={ list } />
					</>
				) : (
					<EmptyList />
				) }
			</Col>
		</Container>
	);
};

export default ThreatsList;
