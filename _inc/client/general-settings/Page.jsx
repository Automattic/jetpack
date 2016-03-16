import React from 'react';
import Card from 'components/card';

export const Page = ( props ) =>
	<div>
		<Card>
			<h2>Jetpack Add-ons</h2>
			<p>
				Manage your Jetpack account and premium add-ons.
			</p>
		</Card>
		<Card>
			<h2>Jetpack Connection Settings</h2>
			<p>
				Manage your connected user accounts or disconnect.
			</p>
		</Card>
		<Card>
			<h2>Miscellaneous Settings</h2>
			<p>
				Manage Snow and other fun things for your site.
			</p>
		</Card>
		<Card>
			<h2>Summary Report Settings</h2>
			<p>
				Manage how Jetpack informs you about your site.
			</p>
		</Card>
		<Card>
			<h2>Import Jetpack Feature Configuration</h2>
			<p>
				Import your Jetpack setup from another intsallation.
			</p>
		</Card>
		<Card>
			<h2>Widget Settings</h2>
			<p>
				Configure your WordPress admin dashboard widget.
			</p>
		</Card>
	</div>
