import { Container, Col } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import styles from './styles.module.scss';
import type { FC } from 'react';

const AdminSectionHeroNotices: FC = () => {
	const { hasConnectionError } = useConnectionErrorNotice();

	if ( ! hasConnectionError ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 0 }>
			<Col className={ styles[ 'connection-error-col' ] }>
				<ConnectionError trackingContext="protect" />
			</Col>
		</Container>
	);
};

export default AdminSectionHeroNotices;
