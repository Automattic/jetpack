import { Container, Col, AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackReturnToPage from '../../hooks/use-my-jetpack-return-to-page';
import CloseLink from '../close-link';
import ConnectionScreenBody from './body';
import ConnectionScreenFooter from './footer';
import styles from './styles.module.scss';

const ConnectionScreen: React.FC = () => {
	const returnToPage = useMyJetpackReturnToPage();
	const { apiRoot, apiNonce, registrationNonce } = useMyJetpackConnection();

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 8 } horizontalGap={ 0 }>
				<Col className={ styles[ 'relative-col' ] }>
					<CloseLink
						className={ styles[ 'close-link' ] }
						accessibleName={ __( 'Go back to previous screen', 'jetpack-my-jetpack' ) }
					/>
				</Col>
				<Col>
					<ConnectionScreenBody
						from="my-jetpack"
						redirectUri={ returnToPage }
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						registrationNonce={ registrationNonce }
						footer={ <ConnectionScreenFooter /> }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
};

export default ConnectionScreen;
