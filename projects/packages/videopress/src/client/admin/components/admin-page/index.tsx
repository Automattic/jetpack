import {
	Text,
	AdminPage,
	AdminSectionHero,
	AdminSection,
	Container,
	Button,
	Col,
} from '@automattic/jetpack-components';
import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import useVideos from '../../hooks/use-videos';
import Logo from '../logo';
import { LocalLibrary, VideoPressLibrary } from './libraries';
import { ConnectionStore } from './types';

const Admin = () => {
	const connectionStatus = useSelect(
		select => ( select( CONNECTION_STORE_ID ) as ConnectionStore ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	const { items: videos } = useVideos();
	const localVideos = [];

	return (
		<AdminPage
			moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			header={ <Logo /> }
		>
			{ showConnectionCard ? (
				<AdminSectionHero>
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				</AdminSectionHero>
			) : (
				<>
					<AdminSectionHero>
						<Container horizontalSpacing={ 6 } horizontalGap={ 3 }>
							<Col sm={ 4 } md={ 4 } lg={ 8 }>
								<Text variant="headline-small" mb={ 3 }>
									{ __( 'High quality, ad-free video', 'jetpack-videopress-pkg' ) }
								</Text>
								<Button>{ __( 'Add new video', 'jetpack-videopress-pkg' ) }</Button>
							</Col>
						</Container>
					</AdminSectionHero>
					<AdminSection>
						<Container horizontalSpacing={ 6 } horizontalGap={ 10 }>
							<Col sm={ 4 } md={ 6 } lg={ 12 }>
								<VideoPressLibrary videos={ videos } />
							</Col>
							<Col sm={ 4 } md={ 6 } lg={ 12 }>
								<LocalLibrary videos={ localVideos } />
							</Col>
						</Container>
					</AdminSection>
				</>
			) }
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackVideoPressInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			title={ __( 'High quality, ad-free video.', 'jetpack-videopress-pkg' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-videopress"
			redirectUri="admin.php?page=jetpack-videopress"
		>
			<h3>{ __( 'Connection screen title', 'jetpack-videopress-pkg' ) }</h3>
			<ul>
				<li>{ __( 'Amazing feature 1', 'jetpack-videopress-pkg' ) }</li>
				<li>{ __( 'Amazing feature 2', 'jetpack-videopress-pkg' ) }</li>
				<li>{ __( 'Amazing feature 3', 'jetpack-videopress-pkg' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
