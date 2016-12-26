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
import Gridicon from 'components/gridicon';

export const SettingsCard = props => {
	let module = props.module
			? props.getModule( props.module )
			: false,
		header = props.header
			? props.header
			: module
				? module.name
				: '',
		support = props.support
			? props.support
			: module && '' !== module.learn_more_button
				? module.learn_more_button
				: false,
		isSaving = props.isSavingAnyOption();

	return (
		<form>
			<SectionHeader label={ header }>
				{
					props.hideButton
						? ''
						: <Button
							primary
							compact
							isSubmitting={ isSaving }
							onClick={ isSaving ? () => {} : props.onSubmit }
							disabled={ isSaving }>
							{
								isSaving
									? __( 'Saving…', { context: 'Button caption' } )
									: __( 'Save settings', { context: 'Button caption' } )
							}
						  </Button>
				}
			</SectionHeader>
			<Card>
				{
					support
						? <div className="jp-module-settings__learn-more">
							<Button borderless compact href={ support }>
								<Gridicon icon="help-outline" />
								<span className="screen-reader-text">{ __( 'Learn More' ) }</span>
							</Button>
						  </div>
						: ''
				}
				{ props.children }
			</Card>
		</form>
	);
};

export default SettingsCard;