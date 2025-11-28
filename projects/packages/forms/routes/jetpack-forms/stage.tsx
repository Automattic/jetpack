/**
 * External dependencies
 */
import { Button, Card, CardBody, CardHeader } from '@wordpress/components';
import * as React from 'react';

const LEGACY_DASHBOARD_URL = 'admin.php?page=jetpack-forms-admin';

export const stage = (): React.ReactElement => (
	<div className="jp-forms-test-route">
		<Card>
			<CardHeader>
				<strong>Jetpack Forms test page</strong>
			</CardHeader>
			<CardBody>
				<p>This is a test page for the Jetpack Forms package with wp-build.</p>
				<Button variant="primary" href={ LEGACY_DASHBOARD_URL }>
					Go to the current dashboard
				</Button>
			</CardBody>
		</Card>
	</div>
);
