import { Popover, SlotFillProvider } from '@wordpress/components';
import clsx from 'clsx';
import NoticeManager from '$features/notice/manager';
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
	// Popovers portal into this slot, outside the cards that clip them.
	return (
		<SlotFillProvider>
			<div className={ clsx( 'jb-modern-settings', styles.settings ) } hidden={ hidden }>
				<Settings />

				<NoticeManager />
			</div>
			<div className="jb-modern-settings-popovers">
				<Popover.Slot />
			</div>
		</SlotFillProvider>
	);
};

export default ModernSettings;
