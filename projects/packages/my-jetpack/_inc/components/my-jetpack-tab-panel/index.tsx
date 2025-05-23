import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HelpTab } from './help-tab';
import { OverviewTab } from './overview-tab';
import { ProductsTab } from './products-tab';
import styles from './styles.module.scss';

const tabComponentMap = {
	overview: OverviewTab,
	products: ProductsTab,
	help: HelpTab,
};

/**
 * My Jetpack Tab panel component.
 *
 * @return The rendered component.
 */
export function MyJetpackTabPanel() {
	const params = useParams();
	const navigate = useNavigate();

	const onTabSelect = useCallback(
		( tabName: string ) => {
			if ( tabName !== params.tab ) {
				navigate( `/${ tabName }` );
			}
		},
		[ navigate, params.tab ]
	);

	const tabRenderer = useCallback( ( tab: { name: string; title: string } ) => {
		const TabComponent = tabComponentMap[ tab.name ];

		if ( ! TabComponent ) {
			return null;
		}
		return <TabComponent />;
	}, [] );

	return (
		<TabPanel
			className={ styles[ 'tab-panel' ] }
			initialTabName={ params.tab || 'overview' }
			onSelect={ onTabSelect }
			children={ tabRenderer }
			tabs={ [
				{
					name: 'overview',
					title: __( 'Overview', 'jetpack-my-jetpack' ),
				},
				{
					name: 'products',
					title: __( 'Products', 'jetpack-my-jetpack' ),
				},
				{
					name: 'help',
					title: __( 'Help', 'jetpack-my-jetpack' ),
				},
			] }
		/>
	);
}
