/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	FormLegend,
	FormLabel,
	FormButton
} from 'components/forms';
import SectionHeader from 'components/section-header';
import Card from 'components/card';
import Button from 'components/button';

export const SettingsCard = props => {
	return (
		<form>
			<SectionHeader label={ props.header }>
				{
					! props.hideButton
						? <Button
								primary
								compact
								isSubmitting={ props.isSavingAnyOption() }
								onClick={ props.onSubmit }
							>
								{
									props.isSavingAnyOption() ?
										__( 'Saving…', { context: 'Button caption' } ) :
										__( 'Save settings', { context: 'Button caption' } )
								}
						  </Button>
						: ''
				}
			</SectionHeader>
			<Card>
				{ props.children }
			</Card>
		</form>
	);
};

export default SettingsCard;