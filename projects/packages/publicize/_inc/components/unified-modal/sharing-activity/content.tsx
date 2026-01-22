import { TabPanel } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ActivityView } from './activity-view';
import styles from './styles.module.scss';

type Tab = React.ComponentProps< typeof TabPanel >[ 'tabs' ][ number ];

/**
 * Content component for the Sharing Activity screen.
 *
 * @return Sharing activity content.
 */
export function Content() {
	const tabs: Tab[] = useMemo(
		() => [
			{
				name: 'all',
				title: __( 'All shares', 'jetpack-publicize-pkg' ),
			},
			{
				name: 'shared',
				title: __( 'Shared', 'jetpack-publicize-pkg' ),
			},
			{
				name: 'scheduled',
				title: __( 'Scheduled', 'jetpack-publicize-pkg' ),
			},
		],
		[]
	);

	return (
		<div className={ styles[ 'tab-panel-wrapper' ] }>
			<TabPanel tabs={ tabs } initialTabName="all">
				{ ( tab: Tab ) => <ActivityView filter={ tab.name } /> }
			</TabPanel>
		</div>
	);
}
