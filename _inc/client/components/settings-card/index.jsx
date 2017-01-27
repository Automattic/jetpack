/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import SectionHeader from 'components/section-header';
import Button from 'components/button';

const SettingsCard = props => {
	let module = props.module
			? props.getModule( props.module )
			: false,
		header = props.header
			? props.header
			: '',
		isSaving = props.isSavingAnyOption();

	if ( '' === header && module ) {
		header = module.name;
	}

	return (
		<form className="jp-form-settings-card">
			<SectionHeader label={ header }>
				{
					props.hideButton
						? ''
						: (
							<Button
								primary
								compact
								isSubmitting={ isSaving }
								onClick={ isSaving ? () => {} : props.onSubmit }
								disabled={ isSaving || ! props.isDirty() }>
								{
									isSaving
										? __( 'Saving…', { context: 'Button caption' } )
										: __( 'Save settings', { context: 'Button caption' } )
								}
							</Button>
						)
				}
			</SectionHeader>
			{ props.children }
		</form>
	);
};

export default SettingsCard;
