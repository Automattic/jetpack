var React = require( 'react' ),
	Tabs = require( 'components/tabs' ),
	Card = require( 'components/card' );

var Navigation = React.createClass( {
	render: function () {
		return (
			<div className='dops-navigation'>
				<Tabs>
					<Tabs.Panel title="At a Glance">
						<Card className='dops-security-panel'>Hello At a Glance</Card>
					</Tabs.Panel>
					<Tabs.Panel title="Security">
						<Card className='dops-security-panel'>Hello Security Panel</Card>
					</Tabs.Panel>
					<Tabs.Panel title="Traffic">
						<Card className='dops-security-panel'>Hello Traffic Panel</Card>
					</Tabs.Panel>
					<Tabs.Panel title="Other">
						<Card className='dops-security-panel'>Hello Other Panel</Card>
					</Tabs.Panel>
				</Tabs>
			</div>
		)
	}
} );

module.exports = Navigation;
