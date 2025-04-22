import {
	Container,
	Col,
	H3,
	Button,
	SocialIcon,
	getUserLocale,
} from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, postList } from '@wordpress/icons';
import { store as socialStore } from '../../../social-store';
import { getSocialScriptData } from '../../../utils';
import StatCards from './stat-cards';
import styles from './styles.module.scss';

const Header = () => {
	const {
		hasConnections,
		isModuleEnabled,
		totalSharesCount,
		sharedPostsCount,
		isShareLimitEnabled,
	} = useSelect( select => {
		const store = select( socialStore );
		return {
			hasConnections: store.getConnections().length > 0,
			isModuleEnabled: store.getSocialModuleSettings().publicize,
			totalSharesCount: store.getTotalSharesCount(),
			sharedPostsCount: store.getSharedPostsCount(),
			isShareLimitEnabled: store.isShareLimitEnabled(),
		};
	} );

	const { urls, feature_flags } = getSocialScriptData();

	const useAdminUiV1 = feature_flags.useAdminUiV1;

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
					<H3 mt={ 2 }>{ __( 'Write once, post everywhere', 'jetpack-publicize-components' ) }</H3>
					<div className={ styles.actions }>
						{ isModuleEnabled && ! hasConnections && (
							<>
								{ useAdminUiV1 ? (
									<Button onClick={ openConnectionsModal }>
										{ __( 'Connect accounts', 'jetpack-publicize-components' ) }
									</Button>
								) : (
									<Button href={ urls.connectionsManagementPage } isExternalLink={ true }>
										{ __( 'Connect accounts', 'jetpack-publicize-components' ) }
									</Button>
								) }
							</>
						) }
						<Button
							href={ getAdminUrl( 'post-new.php' ) }
							variant={ hasConnections ? 'primary' : 'secondary' }
						>
							{ __( 'Write a post', 'jetpack-publicize-components' ) }
						</Button>
					</div>
				</Col>
				{ isShareLimitEnabled ? (
					<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } }>
						<StatCards
							stats={ [
								{
									icon: <SocialIcon />,
									label: __( 'Total shares past 30 days', 'jetpack-publicize-components' ),
									value: formatter.format( totalSharesCount ),
								},
								{
									icon: <Icon icon={ postList } />,
									label: __( 'Posted this month', 'jetpack-publicize-components' ),
									value: formatter.format( sharedPostsCount ),
								},
							] }
						/>
					</Col>
				) : null }
			</Container>
		</>
	);
};

export default Header;
