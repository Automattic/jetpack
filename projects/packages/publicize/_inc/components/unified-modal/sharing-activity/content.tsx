import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ShareList } from '../../share-status/share-list';
import styles from '../../share-status/styles.module.scss';

type Tab = {
	name: string;
	title: string;
};

/**
 * Content component for the Sharing Activity screen.
 *
 * @return Sharing activity content.
 */
export function Content() {
	const tabs: Tab[] = [
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
	];

	return (
		<div className={ styles[ 'tab-panel-wrapper' ] }>
			<TabPanel tabs={ tabs }>
				{ ( tab: Tab ) => {
					// For now, just show the existing share list under the "Shared" tab
					// Other tabs will be implemented later
					if ( tab.name === 'shared' ) {
						return <ShareList />;
					}
					return (
						<div style={ { padding: '20px', textAlign: 'center' } }>
							{ __( 'Coming soon', 'jetpack-publicize-pkg' ) }
						</div>
					);
				} }
			</TabPanel>
		</div>
	);
}
