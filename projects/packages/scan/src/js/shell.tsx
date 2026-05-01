import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Outlet } from 'react-router';
import Gates from './gates';
import { HeaderActionsProvider, useHeaderActions } from './header-actions-context';
import MockBanner from './mock-banner';
import type { FC } from 'react';

const ShellChrome: FC = () => {
	const headerActions = useHeaderActions();

	return (
		<AdminPage
			showFooter
			title={ 'Scan' /* "Scan" is a product name, do not translate. */ }
			subTitle={ __(
				'Find and fix vulnerabilities and suspicious files on your site.',
				'jetpack-scan-page'
			) }
			actions={ headerActions }
		>
			<MockBanner />
			<Gates>
				<Outlet />
			</Gates>
		</AdminPage>
	);
};

const Shell: FC = () => (
	<HeaderActionsProvider>
		<ShellChrome />
	</HeaderActionsProvider>
);

export default Shell;
