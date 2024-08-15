import {
	Container,
	Col,
	H3,
	Button,
	SocialIcon,
	getUserLocale,
} from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import {
	store as socialStore,
	getSocialScriptData,
} from '@automattic/jetpack-publicize-components';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, postList } from '@wordpress/icons';
import StatCards from '../stat-cards';
import styles from './styles.module.scss';

const Header = () => {
	const { hasConnections, isModuleEnabled, postsCount, totalShareCount } = useSelect( select => {
		const store = select( socialStore );
		return {
			hasConnections: store.getConnections().length > 0,
			isModuleEnabled: store.isModuleEnabled(),
			postsCount: store.getSharedPostsCount(),
			totalShareCount: store.getTotalSharesCount(),
		};
	} );

	const {
		feature_flags: { useAdminUiV1 },
		urls,
	} = getSocialScriptData();

	const { hasConnectionError } = useConnectionErrorNotice();

	const formatter = Intl.NumberFormat( getUserLocale(), {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	const { openConnectionsModal } = useDispatch( socialStore );

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
					<H3 mt={ 2 }>{ __( 'Write once, post everywhere', 'jetpack-social' ) }</H3>
					<div className={ styles.actions }>
						{ isModuleEnabled && ! hasConnections && (
							<>
								{ useAdminUiV1 ? (
									<Button onClick={ openConnectionsModal }>
										{ __( 'Connect accounts', 'jetpack-social' ) }
									</Button>
								) : (
									<Button href={ urls.connectionsManagementPage } isExternalLink={ true }>
										{ __( 'Connect accounts', 'jetpack-social' ) }
									</Button>
								) }
							</>
						) }
						<Button
							href={ getAdminUrl( 'post-new.php' ) }
							variant={ hasConnections ? 'primary' : 'secondary' }
						>
							{ __( 'Write a post', 'jetpack-social' ) }
						</Button>
					</div>
				</Col>
				<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } }>
					<StatCards
						stats={ [
							{
								icon: <SocialIcon />,
								label: __( 'Total shares past 30 days', 'jetpack-social' ),
								loading: null === totalShareCount,
								value: formatter.format( totalShareCount ),
							},
							{
								icon: <Icon icon={ postList } />,
								label: __( 'Posted this month', 'jetpack-social' ),
								loading: null === postsCount,
								value: formatter.format( postsCount ),
							},
						] }
					/>
				</Col>
			</Container>
		</>
	);
};

export default Header;
