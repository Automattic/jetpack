/* global document */
import './settings-tooltip-globals';
import '@wordpress/theme/design-tokens.css';
// Boost enqueues this alongside its own stylesheet; the popover's frame and arrow come from it.
import '@wordpress/components/build-style/style.css';
import '@automattic/jetpack-base-styles/root-variables';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { createRoot } from 'react-dom/client';
import ModernSettings from '$layout/modern/modern-settings';
import { NoticeProvider } from '$features/notice/context';
import '$css/admin-style.scss';

const Modern = () => (
	<div className="jetpack-boost-page">
		<ModernSettings />
	</div>
);

createRoot( document.getElementById( 'root' ) ).render(
	<DataSyncProvider>
		<NoticeProvider>
			<Modern />
		</NoticeProvider>
	</DataSyncProvider>
);
