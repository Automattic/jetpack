/* global document, window */
import './settings-tooltip-globals';
import '@wordpress/theme/design-tokens.css';
// Boost enqueues this alongside its own stylesheet; the popover's frame and arrow come from it.
import '@wordpress/components/build-style/style.css';
import '@automattic/jetpack-base-styles/root-variables';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { createRoot } from 'react-dom/client';
import ModernSettings from '$layout/modern/modern-settings';
import { NoticeProvider } from '$features/notice/context';
import criticalCss from '$features/critical-css/critical-css-module/critical-css-module.module.scss';
import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
import '$css/admin-style.scss';

const CriticalCssCopy = () => (
	<div className={ criticalCss[ 'tooltip-wrapper' ] }>
		<p>
			<b>You should regenerate your Critical CSS</b> whenever you make changes to the HTML or CSS
			structure of your site.
		</p>
		<PremiumTooltip />
	</div>
);

const Modern = () => (
	<div className="jetpack-boost-page">
		<ModernSettings />
	</div>
);

const Legacy = () => (
	<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
		<div className="jb-section jb-section--main">
			<div className="jb-container--narrow">
				<CriticalCssCopy />
			</div>
		</div>
	</div>
);

const Fixture = new URLSearchParams( window.location.search ).has( 'legacy' ) ? Legacy : Modern;

createRoot( document.getElementById( 'root' ) ).render(
	<DataSyncProvider>
		<NoticeProvider>
			<Fixture />
		</NoticeProvider>
	</DataSyncProvider>
);
