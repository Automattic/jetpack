import { Modal, TabPanel } from '@wordpress/components';
import clsx from 'clsx';
import { ReactNode } from 'react';
import styles from './style.module.scss';

export type ModalTab = {
	/** Unique name identifier for the tab */
	name: string;

	/** Display title of the tab */
	title: string;

	/** Content to display when tab is active */
	content: ReactNode;

	/** Additional class name for the tab */
	className?: string;
};

export type TabbedModalProps = {
	/** Whether the modal is open */
	isOpen: boolean;

	/** Function to call when the modal is closed */
	onClose: () => void;

	/** Modal title */
	title: string;

	/** Array of tabs to display */
	tabs: ModalTab[];

	/** Optional className to add to the modal */
	className?: string;
};

/**
 * TabbedModal component provides a modal dialog with tabs
 *
 * @param {TabbedModalProps} props - The props for the TabbedModal component
 * @return {React.ReactElement|null} The TabbedModal component or null if not open
 */
export default function TabbedModal( {
	isOpen,
	onClose,
	title,
	tabs,
	className,
}: TabbedModalProps ) {
	if ( ! isOpen ) {
		return null;
	}

	// Transform tabs to the format expected by TabPanel
	const tabPanelTabs = tabs.map( tab => ( {
		name: tab.name,
		title: tab.title,
		className: `${ styles.tab } ${ tab.className || '' }`,
	} ) );

	return (
		<Modal title={ title } onRequestClose={ onClose } className={ clsx( styles.modal, className ) }>
			<div className={ styles.wrapper }>
				<TabPanel activeClass={ styles.active } tabs={ tabPanelTabs }>
					{ activeTab => {
						// Find the matching tab content
						const currentTab = tabs.find( tab => tab.name === activeTab.name );
						return <div className={ styles.tabContent }>{ currentTab?.content }</div>;
					} }
				</TabPanel>
			</div>
		</Modal>
	);
}
