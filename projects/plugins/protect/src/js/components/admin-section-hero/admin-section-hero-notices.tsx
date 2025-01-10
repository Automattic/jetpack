import { Container, Col } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import styles from './styles.module.scss';

const AdminSectionHeroNotices: React.FC = () => {
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<Container horizontalSpacing={ 0 }>
			{ hasConnectionError && (
				<Col className={ styles[ 'connection-error-col' ] }>
					<ConnectionError />
				</Col>
			) }
			<Col>
				<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
			</Col>
		</Container>
	);
};

export default AdminSectionHeroNotices;
