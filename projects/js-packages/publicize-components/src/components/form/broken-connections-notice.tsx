import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { _n } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { store as socialStore } from '../../social-store';
import { getSocialScriptData } from '../../utils/script-data';
import Notice from '../notice';
import styles from './styles.module.scss';

export const BrokenConnectionsNotice: React.FC = () => {
	const { brokenConnections, reauthConnections } = useSelect( select => {
		const store = select( socialStore );
		return {
			brokenConnections: store.getBrokenConnections(),
			reauthConnections: store.getMustReauthConnections(),
		};
	}, [] );

	const { connectionsPageUrl } = usePublicizeConfig();

	const { useAdminUiV1 } = getSocialScriptData().feature_flags;

	const { openConnectionsModal } = useDispatch( socialStore );

	const fixLink = useAdminUiV1 ? (
		<Button
			variant="link"
			onClick={ openConnectionsModal }
			className={ styles[ 'broken-connection-btn' ] }
		/>
	) : (
		<ExternalLink href={ connectionsPageUrl } />
	);

	const problemConnections = [ ...brokenConnections, ...reauthConnections ];

	if ( ! problemConnections.length ) {
		return null;
	}

	return (
		problemConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ createInterpolateElement(
					_n(
						'A social connection needs attention. <fixLink>Manage connections</fixLink> to fix it.',
						'Some social connections need attention. <fixLink>Manage connections</fixLink> to fix them.',
						problemConnections.length,
						'jetpack-publicize-components'
					),
					{
						fixLink,
					}
				) }
			</Notice>
		)
	);
};
