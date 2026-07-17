import { getRedirectUrl } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useConnectionMediaValidation } from '../../../hooks/use-connection-media-validation';
import { NO_MEDIA_ERROR, getErrorLabel } from '../../../hooks/use-media-restrictions/constants';
import { Connection } from '../../../social-store/types';
import { InstagramNoMediaNotice } from '../../form/instagram-no-media-notice';
import { useServiceLabel } from '../../services/use-service-label';

type PerConnectionNoticeProps = {
	connection: Connection;
};

/**
 * Displays media validation notice for a single connection in per-network mode.
 *
 * @param {PerConnectionNoticeProps} props - The component props.
 * @return - Notice component or null.
 */
export function PerConnectionNotice( { connection }: PerConnectionNoticeProps ) {
	const { error, isConvertible } = useConnectionMediaValidation( connection );
	const getServiceLabel = useServiceLabel();

	if ( ! error || isConvertible ) {
		return null;
	}

	if ( error === NO_MEDIA_ERROR ) {
		return <InstagramNoMediaNotice />;
	}

	const serviceLabel = getServiceLabel( connection.service_name );

	return (
		<Notice status="warning" isDismissible={ false }>
			<p>
				{ sprintf(
					/* translators: %s is the name of the social media platform (e.g., Facebook, Instagram). */
					__( 'The selected media cannot be shared to %s.', 'jetpack-publicize-pkg' ),
					serviceLabel
				) }
			</p>
			<ul>
				<li>
					<i>{ getErrorLabel( error ) }</i>
				</li>
			</ul>
			<Link openInNewTab href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }>
				{ __( 'Troubleshooting tips', 'jetpack-publicize-pkg' ) }
			</Link>
		</Notice>
	);
}
