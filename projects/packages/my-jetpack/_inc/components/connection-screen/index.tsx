import { Container, Col, AdminPage } from '@automattic/jetpack-components';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import { useSearchParams } from 'react-router-dom';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackReturnToPage from '../../hooks/use-my-jetpack-return-to-page';
import CloseLink from '../close-link';
import ConnectionScreenBody from './body';
import ConnectionScreenFooter from './footer';
import styles from './styles.module.scss';
import type { FC } from 'react';

const ConnectionScreen: FC = () => {
	const [ searchParams ] = useSearchParams();
	const shouldSkipPricing = searchParams.get( 'skip_pricing' ) === 'true';
	const returnToPage = useMyJetpackReturnToPage();
	const { apiRoot, apiNonce, registrationNonce } = useMyJetpackConnection();
	return (
		<AdminPage
			showHeader={ false }
			showBackground={ false }
			useInternalLinks={ shouldUseInternalLinks() }
		>
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
						skipPricingPage={ shouldSkipPricing }
						footer={ <ConnectionScreenFooter /> }
					/>
				</Col>
			</Container>
		</AdminPage>
	);
};

export default ConnectionScreen;
