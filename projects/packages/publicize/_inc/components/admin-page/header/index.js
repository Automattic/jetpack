import { Col, Container, H3 } from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { store as socialStore } from '../../../social-store';
import styles from './styles.module.scss';

const Header = () => {
	const { hasConnections, isModuleEnabled } = useSelect( select => {
		const store = select( socialStore );
		return {
			hasConnections: store.getConnections().length > 0,
			isModuleEnabled: store.getSocialModuleSettings().publicize,
		};
	} );

	const { hasConnectionError } = useConnectionErrorNotice();

	const { openConnectionsModal } = useDispatch( socialStore );

	const onWritePostClick = useCallback( () => {
		window.location.href = getAdminUrl( 'post-new.php' );
	}, [] );

	return (
		<>
			<Container horizontalSpacing={ 0 }>
				{ hasConnectionError && (
					<Col className={ styles[ 'connection-error-col' ] }>
						<ConnectionError />
					</Col>
				) }
				<Col>
					<div id="jp-admin-notices" className="jetpack-social-jitm-card" />
				</Col>
			</Container>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 } className={ styles.container }>
				<Col sm={ 4 } md={ 4 } lg={ 5 }>
					<H3 mt={ 2 }>{ __( 'Write once, post everywhere', 'jetpack-publicize-pkg' ) }</H3>
					<div className={ styles.actions }>
						{ isModuleEnabled && ! hasConnections && (
							<Button onClick={ openConnectionsModal }>
								{ __( 'Connect accounts', 'jetpack-publicize-pkg' ) }
							</Button>
						) }
						<Button onClick={ onWritePostClick } variant={ hasConnections ? 'solid' : 'outline' }>
							{ __( 'Write a post', 'jetpack-publicize-pkg' ) }
						</Button>
					</div>
				</Col>
			</Container>
		</>
	);
};

export default Header;
