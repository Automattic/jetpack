import { Col, Button, Text, TermsOfService } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useConnectSite from '../../hooks/use-connect-site';
import styles from './style.module.scss';
import { WelcomeFlowExperiment } from '.';
import type { Dispatch, SetStateAction } from 'react';

type ConnectionStepProps = {
	onUpdateWelcomeFlowExperiment?: Dispatch< SetStateAction< WelcomeFlowExperiment > >;
	isActivating: boolean;
};

const ConnectionStep = ( { isActivating }: ConnectionStepProps ) => {
	const activationButtonLabel = __( 'Activate Jetpack in one click', 'jetpack-my-jetpack' );

	const { connectSite: onConnectSiteClick } = useConnectSite( {
		tracksInfo: {
			event: 'jetpack_myjetpack_welcome_banner_connect_site',
			properties: {},
		},
	} );

	return (
		<>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-description' ] }>
				<Text variant="headline-small" mb={ 3 }>
					{ __( 'Welcome to Jetpack!', 'jetpack-my-jetpack' ) }
				</Text>
				<Text variant="body" mb={ 2 }>
					{ __(
						'Unlock the power of your WordPress site with Jetpack, the complete toolkit for enhancing your site’s security, speed, and growth.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<Text variant="body" mb={ 2 }>
					{ __(
						'Jetpack works behind the scenes to keep your site safe, make it lightning-fast, and to help you get more traffic.',
						'jetpack-my-jetpack'
					) }
				</Text>
				<TermsOfService agreeButtonLabel={ activationButtonLabel } mb={ 4 } />
				<Button
					variant="primary"
					disabled={ isActivating }
					isLoading={ isActivating }
					onClick={ onConnectSiteClick }
				>
					{ isActivating ? __( 'Activating…', 'jetpack-my-jetpack' ) : activationButtonLabel }
				</Button>
			</Col>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-image' ] }></Col>
		</>
	);
};

export default ConnectionStep;
