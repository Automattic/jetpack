/**
 * External dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import React from 'react';
import { translate as __ } from 'i18n-calypso';

const JetpackDisconnectDialogSurvey = ( { onDisconnectButtonClick } ) => {
	return (
		<div className="jetpack-disconnect-dialog__survey">
			<Card>
				<h1 className="jetpack-disconnect-dialog__header">{ __( 'Disable Jetpack' ) }</h1>
			</Card>
			<Card>
				<div className="jetpack-disconnect-dialog__button-row">
					<Button scary onClick={ onDisconnectButtonClick }>
						{ __( 'Disconnect' ) }
					</Button>
				</div>
			</Card>
		</div>
	);
};
export default JetpackDisconnectDialogSurvey;
