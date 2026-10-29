import { Container, Col, AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackReturnToPage from '../../hooks/use-my-jetpack-return-to-page';
import CloseLink from '../close-link';
import ConnectionScreenBody from './body';
import ConnectionScreenFooter from './footer';
import styles from './styles.module.scss';
import type { FC } from 'react';

const ConnectionScreen: FC = () => {
	// `@wordpress/route` types no route tree, so `from` needs a cast.
	const search: Record< string, unknown > = useSearch( { from: '/$' as never, strict: false } );
	// The boot router JSON-parses search values: `?skip_pricing=true` arrives as a boolean.
	const shouldSkipPricing = search.skip_pricing === true;
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
