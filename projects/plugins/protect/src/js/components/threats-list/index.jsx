import { Container, Col, Title } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import useProtectData from '../../hooks/use-protect-data';
import EmptyList from './empty';
import FreeList from './free-list';
import ThreatsNavigation from './navigation';
import PaidList from './paid-list';
import styles from './styles.module.scss';
import useThreatsList from './use-threats-list';

const ThreatsList = () => {
	const { securityBundle } = useProtectData();
	const { hasRequiredPlan } = securityBundle;
	const { item, list, selected, setSelected } = useThreatsList();

	return (
		<Container fluid horizontalSpacing={ 0 } horizontalGap={ 5 }>
			<Col lg={ 4 }>
				<ThreatsNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				{ list?.length > 0 ? (
					<>
						<Title className={ styles[ 'list-title' ] } mb={ 3 }>
							{ selected === 'all'
								? sprintf(
										/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
										__( 'All %s threats', 'jetpack-protect' ),
										list.length
								  )
								: sprintf(
										/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
										__( '%1$s %2$s in %3$s %4$s', 'jetpack-protect' ),
										list.length,
										list.length === 1 ? 'threat' : 'threats',
										item?.name,
										item?.version
								  ) }
						</Title>
						{ hasRequiredPlan ? <PaidList list={ list } /> : <FreeList list={ list } /> }
					</>
				) : (
					<EmptyList />
				) }
			</Col>
		</Container>
	);
};

export default ThreatsList;
