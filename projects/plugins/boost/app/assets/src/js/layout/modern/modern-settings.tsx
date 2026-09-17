import { Popover, SlotFillProvider } from '@wordpress/components';
import clsx from 'clsx';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import NoticeManager from '$features/notice/manager';
import Support from '$layout/settings-page/support/support';
import Tips from '$layout/settings-page/tips/tips';
import Settings from '../../pages/settings/settings';
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

	// Popovers portal into this slot, outside the cards that clip them.
	return (
		<SlotFillProvider>
			<div className={ clsx( 'jb-modern-settings', styles.settings ) } hidden={ hidden }>
				<Settings />

				<Tips />

				{ hasPrioritySupport && <Support /> }

				<NoticeManager />
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
};

export default ModernSettings;
