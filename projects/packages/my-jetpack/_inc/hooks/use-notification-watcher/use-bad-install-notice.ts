import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import type { NoticeHookType } from './types';
import type { NoticeOptions } from '../../context/notices/types';

const useBadInstallNotice: NoticeHookType = ( redBubbleAlerts, isLoading ) => {
	const { setNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	useEffect( () => {
		const badInstallAlerts = isLoading
			? []
			: ( Object.keys( redBubbleAlerts ).filter( key =>
					key.endsWith( '-bad-installation' )
			  ) as Array< `${ string }-bad-installation` > );

		if ( badInstallAlerts.length === 0 ) {
			return;
		}

		const alert = redBubbleAlerts[ badInstallAlerts[ 0 ] ];
		const { plugin } = alert.data;
		const devEnvUrl =
			'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md';

		const errorMessage = sprintf(
			// translators: %s is the name of the plugin that has a bad installation.
			__(
				'Your installation of %1$s is incomplete. If you installed %1$s from GitHub, please refer to the developer documentation to set up your development environment.',
				'jetpack-my-jetpack'
			),
			plugin
		);

		const onCtaClick = () => {
			window.open( devEnvUrl );
			recordEvent( 'jetpack_my_jetpack_bad_installation_notice_cta_click', {
				plugin,
			} );
		};

		const noticeOptions: NoticeOptions = {
			id: 'bad-installation-notice',
			level: 'error',
			actions: [
				{
					label: __( 'See documentation', 'jetpack-my-jetpack' ),
					onClick: onCtaClick,
					noDefaultClasses: true,
				},
			],
			priority: NOTICE_PRIORITY_MEDIUM,
		};

		if ( ! isLoading ) {
			setNotice( {
				message: errorMessage,
				options: noticeOptions,
			} );
		}
	}, [ redBubbleAlerts, setNotice, recordEvent, isLoading ] );
};

export default useBadInstallNotice;
