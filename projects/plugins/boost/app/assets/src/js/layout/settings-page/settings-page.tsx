import SpeedScore from '$features/speed-score/speed-score';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import Support from './support/support';
import Tips from './tips/tips';
import clsx from 'clsx';
import styles from './settings-page.module.scss';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import CriticalCssProvider from '$features/critical-css/critical-css-context/critical-css-context-provider';
import NoticeManager from '$features/notice/manager';
import { NoticeProvider } from '$features/notice/context';

type SettingsPageProps = {
	children: React.ReactNode;
};

const SettingsPage = ( { children }: SettingsPageProps ) => {
	const premiumFeatures = usePremiumFeatures();
	const hasPrioritySupport = premiumFeatures && premiumFeatures.includes( 'support' );

	return (
		<NoticeProvider>
			<CriticalCssProvider>
				<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
					<Header />

					<div className="jb-section jb-section--alt jb-section--scores">
						<SpeedScore />
					</div>

					{ children && (
						<div className={ clsx( 'jb-section jb-section--main', styles.section ) }>
							{ children }
						</div>
					) }

					<Tips />

					{ hasPrioritySupport && <Support /> }

					<Footer />
					<NoticeManager />
				</div>
			</CriticalCssProvider>
		</NoticeProvider>
	);
};

export default SettingsPage;
