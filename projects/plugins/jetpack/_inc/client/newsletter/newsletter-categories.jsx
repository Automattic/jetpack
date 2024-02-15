import { ToggleControl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import { withModuleSettingsFormHelpers } from '../components/module-settings/with-module-settings-form-helpers';
import TextInput from '../components/text-input';

const mapCategoriesIds = categorie => {
	switch ( typeof categorie ) {
		case 'number':
			return categorie;
		case 'string':
			return parseInt( categorie );
		case 'object':
			return categorie.term_id;
	}
};

/**
 * NewsletterCategories settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Subscription settings component.
 */
function NewsletterCategories( props ) {
	const {
		updateFormStateModuleOption,
		isNewsletterCategoriesEnabled,
		newsletterCategories,
		updateFormStateOptionValue,
	} = props;

	const [ newCategories, setNewCategories ] = useState( '' );

	const handleEnagleNewsletterCategoriesToggleChange = useCallback( () => {
		updateFormStateModuleOption( 'subscriptions', 'wpcom_newsletter_categories_enabled' );
	}, [ updateFormStateModuleOption ] );

	const categoriesValue = JSON.stringify( newsletterCategories.map( mapCategoriesIds ) );
	const parseArray = useCallback( () => {
		try {
			updateFormStateOptionValue( 'wpcom_newsletter_categories', JSON.parse( newCategories ) );
		} catch ( error ) {
			alert( 'Invalid JSON' );
		}
	}, [ newCategories, updateFormStateOptionValue ] );

	const onCategoriesChange = useCallback( e => {
		setNewCategories( e.target.value );
	}, [] );

	return (
		<SettingsCard { ...props } module="subscriptions">
			<SettingsGroup hasChild disableInOfflineMode disableInSiteConnectionMode>
				<ToggleControl
					checked={ isNewsletterCategoriesEnabled }
					onChange={ handleEnagleNewsletterCategoriesToggleChange }
					label={ __( 'Enable newsletter categories', 'jetpack' ) }
				/>
				Categories state:
				<TextInput value={ categoriesValue } disabled />
				New value:
				<TextInput value={ newCategories } onChange={ onCategoriesChange } />
				<button onClick={ parseArray }>Parse array to state</button>
			</SettingsGroup>
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isNewsletterCategoriesEnabled: ownProps.getOptionValue(
				'wpcom_newsletter_categories_enabled'
			),
			newsletterCategories: ownProps.getOptionValue( 'wpcom_newsletter_categories' ),
		};
	} )( NewsletterCategories )
);
