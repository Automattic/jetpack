import { TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../../social-store';
import { ActivityView } from './activity-view';
import { TABS } from './constants';
import styles from './styles.module.scss';

type Tab = React.ComponentProps< typeof TabPanel >[ 'tabs' ][ number ];

/**
 * Content component for the Sharing Activity screen.
 *
 * @return Sharing activity content.
 */
export function Content() {
	const initialTab = useSelect( select => {
		return select( socialStore ).getUnifiedModalData()?.initialTab ?? TABS.ALL;
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
				{ ( tab: Tab ) => <ActivityView filter={ tab.name } /> }
			</TabPanel>
		</div>
	);
}
