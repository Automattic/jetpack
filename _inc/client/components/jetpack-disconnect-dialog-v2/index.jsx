/**
 * External dependencies
 */
import Card from 'components/card';
import React from 'react';
import { useTranslate } from 'i18n-calypso';

const JetpackDisconnectDialog = () => {
	const __ = useTranslate();

	return (
		<Card>
			<h2>{ __( 'Log Out of Jetpack (and deactivate)?' ) }</h2>
		</Card>
	);
};

export default JetpackDisconnectDialog;
