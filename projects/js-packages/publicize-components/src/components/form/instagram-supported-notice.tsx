import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useDismissNotice from '../../hooks/use-dismiss-notice';
import Notice from '../notice';

export const InstagramSupportedNotice: React.FC = () => {
	const { dismissNotice, NOTICES } = useDismissNotice();
	const { connectionsAdminUrl } = usePublicizeConfig();
	const onDismissInstagramNotice = useCallback( () => {
		dismissNotice( NOTICES.instagram );
	}, [ dismissNotice, NOTICES ] );

	return (
		<Notice
			onDismiss={ onDismissInstagramNotice }
			type={ 'highlight' }
			actions={ [
				<Button
					key="connect"
					href={ connectionsAdminUrl }
					target="_blank"
					rel="noreferrer noopener"
					variant="primary"
				>
					{ __( 'Connect now', 'jetpack' ) }
				</Button>,
				<Button
					key="learn-more"
					href={ getRedirectUrl( 'jetpack-social-connecting-to-social-networks' ) }
					target="_blank"
					rel="noreferrer noopener"
				>
					{ __( 'Learn more', 'jetpack' ) }
				</Button>,
			] }
		>
			{ __( 'You can now share directly to your Instagram account!', 'jetpack' ) }
		</Notice>
	);
};
