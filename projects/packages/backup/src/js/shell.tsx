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
			title={ 'VaultPress Backup' /* "VaultPress Backup" is a product name, do not translate. */ }
			subTitle={ __(
				'Save changes and restore quickly with one-click recovery.',
				'jetpack-backup-pkg'
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
