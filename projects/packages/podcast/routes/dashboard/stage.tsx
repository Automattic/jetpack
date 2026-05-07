import AdminPage from '@automattic/jetpack-components/admin-page';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

const TAB_VALUES = [ 'settings', 'episodes', 'distribution', 'stats' ] as const;
type TabName = ( typeof TAB_VALUES )[ number ];

const isValidTab = ( value: string | null ): value is TabName =>
	!! value && ( TAB_VALUES as readonly string[] ).includes( value );

const Stage = () => {
	const [ activeTab, setActiveTab ] = useState< TabName >( 'settings' );

	const handleTabChange = useCallback( ( value: string | null ) => {
		if ( isValidTab( value ) ) {
			setActiveTab( value );
		}
	}, [] );

	return (
		<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
			<AdminPage
				/* "Podcast" is a product name, do not translate. */
				title="Podcast"
				subTitle={ __(
					'Publish a podcast and reach your fans, anywhere they listen.',
					'jetpack-podcast'
				) }
				tabs={
					<Tabs.List>
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-podcast' ) }</Tabs.Tab>
						<Tabs.Tab value="episodes">{ __( 'Episodes', 'jetpack-podcast' ) }</Tabs.Tab>
						<Tabs.Tab value="distribution">{ __( 'Distribution', 'jetpack-podcast' ) }</Tabs.Tab>
						<Tabs.Tab value="stats">{ __( 'Stats', 'jetpack-podcast' ) }</Tabs.Tab>
					</Tabs.List>
				}
			>
				<Tabs.Panel value="settings">
					<p>{ __( 'Settings — placeholder.', 'jetpack-podcast' ) }</p>
				</Tabs.Panel>
				<Tabs.Panel value="episodes">
					<p>{ __( 'Episodes — placeholder.', 'jetpack-podcast' ) }</p>
				</Tabs.Panel>
				<Tabs.Panel value="distribution">
					<p>{ __( 'Distribution — placeholder.', 'jetpack-podcast' ) }</p>
				</Tabs.Panel>
				<Tabs.Panel value="stats">
					<p>{ __( 'Stats — placeholder.', 'jetpack-podcast' ) }</p>
				</Tabs.Panel>
			</AdminPage>
		</Tabs.Root>
	);
};

export { Stage as stage };
