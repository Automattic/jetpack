import { Container, Col, AdminPage } from '@automattic/jetpack-components';
import { CONNECTION_FROM, isStandardEntryPoint } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackReturnToPage from '../../hooks/use-my-jetpack-return-to-page';
import { useRouteSearch } from '../../router-bridge';
import CloseLink from '../close-link';
import ConnectionScreenBody from './body';
import ConnectionScreenFooter from './footer';
import styles from './styles.module.scss';
import type { FC } from 'react';

const ConnectionScreen: FC = () => {
	const search = useRouteSearch();
	// The router hands back an unquoted `true` as a boolean and a quoted one as a string.
	const shouldSkipPricing = String( search.skip_pricing ) === 'true';
	// Forward the name of the link that opened this screen, so the connection is counted by it.
	const from =
		typeof search.from === 'string' && isStandardEntryPoint( search.from )
			? search.from
			: CONNECTION_FROM.myJetpackConnectionScreen;
	const returnToPage = useMyJetpackReturnToPage();
	const { apiRoot, apiNonce, registrationNonce } = useMyJetpackConnection();
	return (
		<AdminPage className="jp-my-jetpack-connection" showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 8 } horizontalGap={ 0 }>
				<Col className={ styles[ 'relative-col' ] }>
					<CloseLink
						className={ styles[ 'close-link' ] }
						accessibleName={ __( 'Go back to previous screen', 'jetpack-my-jetpack' ) }
					/>
				</Col>
				<Col>
					<ConnectionScreenBody
						from={ from }
						redirectUri={ returnToPage }
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						registrationNonce={ registrationNonce }
						skipPricingPage={ shouldSkipPricing }
						footer={ <ConnectionScreenFooter /> }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
};

export default ConnectionScreen;
