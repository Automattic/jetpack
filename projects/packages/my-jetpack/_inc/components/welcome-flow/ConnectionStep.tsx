import { Col, Button, Text, TermsOfService } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../../hooks/use-analytics';
import styles from './style.module.scss';

type ConnectionStepProps = {
	onActivateSite: ( e?: Event ) => Promise< void >;
	isActivating: boolean;
};

/**
 * Component that renders the Welcome banner on My Jetpack.
 *
 * @param {object} props - ConnectioStepProps
 * @param {Function} props.onActivateSite - Alias for handleRegisterSite
 * @param {boolean} props.isActivating - Alias for siteIsRegistering
 * @returns {object} The ConnectionStep component.
 */
const ConnectionStep = ( { onActivateSite, isActivating }: ConnectionStepProps ) => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );

	const activationButtonLabel = __( 'Activate Jetpack in one click', 'jetpack-my-jetpack' );

	const onConnectSiteClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_connect_site_click' );
		onActivateSite().then( () => {
			recordEvent( 'jetpack_myjetpack_welcome_banner_connect_site_success' );
			resetNotice();
			setNotice( {
				message: __( 'Your site has been successfully connected.', 'jetpack-my-jetpack' ),
				options: {
					id: 'site-connection-success-notice',
					level: 'success',
					actions: [],
					priority: NOTICE_PRIORITY_HIGH,
					hideCloseButton: false,
					onClose: resetNotice,
				},
			} );
		} );
	}, [ onActivateSite, recordEvent, resetNotice, setNotice ] );

	return (
		<>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-description' ] }>
				<Text variant="headline-small" mb={ 3 }>
					{ __( 'Welcome to Jetpack!', 'jetpack-my-jetpack' ) }
				</Text>
				<Text variant="body" mb={ 2 }>
					{ __(
						'Elevate your WordPress experience with Jetpack, the complete toolkit for enhancing your site’s security, speed, and reach.',
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
				<Button variant="primary" disabled={ isActivating } onClick={ onConnectSiteClick }>
					{ isActivating ? __( 'Activating…', 'jetpack-my-jetpack' ) : activationButtonLabel }
				</Button>
			</Col>
			<Col sm={ 6 } md={ 8 } lg={ 6 } className={ styles[ 'banner-image' ] }></Col>
		</>
	);
};

export default ConnectionStep;
