import SpeedScore from '$features/speed-score/speed-score';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import Support from './support/support';
import Tips from './tips/tips';
import classNames from 'classnames';
import styles from './settings-page.module.scss';
import { usePremiumFeatures } from '../../pages/index/lib/hooks';

type SettingsPageProps = {
	children: React.ReactNode;
};

const SettingsPage = ( { children }: SettingsPageProps ) => {
	const premiumFeatures = usePremiumFeatures();
	const hasPrioritySupport = premiumFeatures?.includes( 'support' );

	return (
		<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
			<Header />

			<div className="jb-section jb-section--alt jb-section--scores">
				<SpeedScore />
			</div>

			{ children && (
				<div className={ classNames( 'jb-section jb-section--main', styles.section ) }>
					{ children }
				</div>
			) }

			<Tips />

			{ hasPrioritySupport && <Support /> }

			<Footer />
		</div>
	);
};

export default SettingsPage;
