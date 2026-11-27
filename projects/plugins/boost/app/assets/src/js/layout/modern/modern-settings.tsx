import { Popover, SlotFillProvider } from '@wordpress/components';
import clsx from 'clsx';
import NoticeManager from '$features/notice/manager';
import Settings from '../../pages/settings/settings';
import styles from './modern-settings.module.scss';

type ModernSettingsProps = {
	hidden?: boolean;
	active?: boolean;
};

/**
 * @param props        - Component props.
 * @param props.hidden - Hide while a redirect is pending, without unmounting.
 * @param props.active - Whether the root dashboard route is active.
 */
const ModernSettings = ( { hidden = false, active = true }: ModernSettingsProps ) => {
	// Popovers portal into this slot, outside the cards that clip them.
	return (
		<SlotFillProvider>
			<div className={ clsx( 'jb-modern-settings', styles.settings ) } hidden={ hidden }>
				<Settings active={ active && ! hidden } />

				<NoticeManager />
			</div>
			<div className="jb-modern-settings-popovers">
				<Popover.Slot />
			</div>
		</SlotFillProvider>
	);
};

export default ModernSettings;
