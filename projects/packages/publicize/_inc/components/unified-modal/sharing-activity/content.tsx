import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../../social-store';
import { SHARING_ACTIVITY_TABS as TABS } from '../../../utils';
import { ActivityView } from './activity-view';
import styles from './styles.module.scss';
import type { SharingActivityFilter } from './types';

type Tab = React.ComponentProps< typeof TabPanel >[ 'tabs' ][ number ];

/**
 * Content component for the Sharing Activity screen.
 *
 * @return Sharing activity content.
 */
export function Content() {
	const initialTab = useSelect( select => {
		return select( socialStore ).getUnifiedModalData()?.sharingActivity?.initialTab ?? TABS.ALL;
	}, [] );

	const tabs: Tab[] = useMemo(
		() => [
			{
				name: TABS.ALL,
				title: __( 'All shares', 'jetpack-publicize-pkg' ),
			},
			{
				name: TABS.SHARED,
				title: __( 'Shared', 'jetpack-publicize-pkg' ),
			},
			{
				name: TABS.SCHEDULED,
				title: __( 'Scheduled', 'jetpack-publicize-pkg' ),
			},
		],
		[]
	);

	return (
		<div className={ styles[ 'tab-panel-wrapper' ] }>
			<TabPanel tabs={ tabs } initialTabName={ initialTab }>
				{ tab => <ActivityView filter={ tab.name as SharingActivityFilter } /> }
			</TabPanel>
		</div>
	);
}
