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
	const module = props.module || false,
		isSaving = props.isSavingAnyOption();

	let header = props.header
			? props.header
			: '';

	if ( '' === header && module ) {
		header = module.name;
	}
	React.Children.map( props.children.map, console.log );

	return (
		<form className="jp-form-settings-card">
			<SectionHeader label={ header }>
				{
					! props.hideButton && (
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
