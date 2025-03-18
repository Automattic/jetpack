import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { getSocialAdminPageUrl } from '../../utils';
import Notice from '../notice';
import styles from './styles.module.scss';

export const UnsupportedConnectionsNotice: React.FC = () => {
	const unsupportedServices = useSelect( select => {
		return select( socialStore ).getServicesBy( 'status', 'unsupported' );
	}, [] );

	if ( ! unsupportedServices.length ) {
		return null;
	}

	return (
		<Notice type="error">
			{ _x(
				'Following platforms are not supported anymore:',
				'Followed by a list of social media platforms that are no longer supported by Publicize.',
				'jetpack-publicize-components'
			) }
			<ul className={ styles[ 'unsupported-connections-list' ] }>
				{ unsupportedServices.map( service => (
					<li key={ service.id }>{ service.label }</li>
				) ) }
			</ul>
			<ExternalLink href={ getSocialAdminPageUrl() }>
				{ __( 'Learn more', 'jetpack-publicize-components' ) }
			</ExternalLink>
		</Notice>
	);
};
