import clsx from 'clsx';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import NoticeManager from '$features/notice/manager';
import Support from '$layout/settings-page/support/support';
import Tips from '$layout/settings-page/tips/tips';
import Index from '../../pages/index';
import styles from './modern-settings.module.scss';

type ModernSettingsProps = {
	hidden?: boolean;
};

/**
 * @param props        - Component props.
 * @param props.hidden - Hide while a redirect is pending, without unmounting.
 */
const ModernSettings = ( { hidden = false }: ModernSettingsProps ) => {
	const premiumFeatures = usePremiumFeatures();
	const hasPrioritySupport = premiumFeatures && premiumFeatures.includes( 'support' );

	return (
		<div className={ clsx( 'jb-modern-settings', styles.settings ) } hidden={ hidden }>
			<div className="jb-section jb-section--main">
				<Index />
			</div>

			<Tips />

			{ hasPrioritySupport && <Support /> }

			<NoticeManager />
		</div>
	);
};

export default ModernSettings;
