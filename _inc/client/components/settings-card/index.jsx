/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import {
	FormLegend,
	FormLabel,
	FormButton
} from 'components/forms';
import SectionHeader from 'components/section-header';
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
		isSaving = props.isSavingAnyOption();

	return (
		<form className="jp-form-settings-card">
			<SectionHeader label={ header }>
				{
					props.hideButton
						? ''
						: <Button
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
				}
			</SectionHeader>
			{ props.children }
		</form>
	);
};

export const SettingsGroup = props => {
	let support = props.support
		? props.support
		: module && '' !== module.learn_more_button
			? module.learn_more_button
			: false;

	return (
		<Card className={ classNames( 'jp-form-settings-group', { 'jp-form-has-child': props.hasChild } ) }>
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
	);
};