var React = require( 'react' ),
	Tabs = require( 'components/tabs' ),
	Card = require( 'components/card' );

import {Page as AtAGlance} from 'at-a-glance';
import {Page as Engagement} from 'engagement';
import {Page as Security} from 'security';
import {Page as GeneralSettings} from 'general-settings';

const Navigation = React.createClass( {
	render: function() {
		return (
			<div className='dops-navigation'>
				<Tabs>
					<Tabs.Panel title="At a Glance">
						<AtAGlance></AtAGlance>
					</Tabs.Panel>
					<Tabs.Panel title="Engagement">
						<Engagement></Engagement>
					</Tabs.Panel>
					<Tabs.Panel title="Security">
						<Security></Security>
					</Tabs.Panel>
					<Tabs.Panel title="Site Health">
						<Card className='dops-security-panel'>Site Health</Card>
					</Tabs.Panel>
					<Tabs.Panel title="More">
						<Card className='dops-security-panel'>More...</Card>
					</Tabs.Panel>
					<Tabs.Panel title="General Settings">
						<GeneralSettings></GeneralSettings>
					</Tabs.Panel>
				</Tabs>
			</div>
		)
	}
} );

module.exports = Navigation;
