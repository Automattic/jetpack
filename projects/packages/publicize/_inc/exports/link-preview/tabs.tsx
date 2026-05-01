import { TabPanel } from '@wordpress/components';
import styles from './styles.module.scss';
import { LinkPreviewData } from './types';
import { PreviewTab, usePreviewTabs } from './use-preview-tabs';

export type LinkPreviewTabsProps = LinkPreviewData & {
	/**
	 * The initial tab to show in the link previews.
	 * If not provided, the first tab will be shown by default.
	 */
	initialTabName?: PreviewTab[ 'name' ];
};

/**
 * Shows tabbed link previews for all the supported platforms.
 *
 * @param {LinkPreviewTabsProps} props - The props for the link previews component.
 *
 * @return The link previews component
 */
export function LinkPreviewTabs( { initialTabName, ...props }: LinkPreviewTabsProps ) {
	const tabs = usePreviewTabs();

	return (
		<TabPanel
			tabs={ tabs }
			initialTabName={ initialTabName }
			className={ styles[ 'link-preview-tabs' ] }
		>
			{ ( tab: PreviewTab ) => {
				return (
					<div className={ styles[ 'link-preview-tab' ] }>
						<tab.preview { ...props } />
					</div>
				);
			} }
		</TabPanel>
	);
}
