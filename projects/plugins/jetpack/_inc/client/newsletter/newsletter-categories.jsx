import './style.scss';
import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
	isUnavailableInOfflineMode,
	isUnavailableInSiteConnectionMode,
	requiresConnection,
} from 'state/connection';
import { getModule } from 'state/modules';
import Card from '../components/card';
import { withModuleSettingsFormHelpers } from '../components/module-settings/with-module-settings-form-helpers';
import TreeDropdown from '../components/tree-dropdown';
import { SUBSCRIPTIONS_MODULE_NAME } from './constants';

const mapCategoriesIds = category => {
	switch ( typeof category ) {
		case 'number':
			return category;
		case 'string':
			return parseInt( category );
		case 'object':
			return category.term_id;
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
		categories,
		isUnavailableDueOfflineMode,
		isUnavailableDueSiteConnectionMode,
		subscriptionsModule,
		updateFormStateOptionValue,
		isSavingAnyOption,
	} = props;

	const handleEnableNewsletterCategoriesToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, 'wpcom_newsletter_categories_enabled' );
	}, [ updateFormStateModuleOption ] );

	const checkedCategoriesIds = newsletterCategories.map( mapCategoriesIds );

	const mappedCategories = useMemo(
		() =>
			categories.map( category => ( {
				...category,
				name: category.cat_name,
				id: category.term_id,
			} ) ),
		[ categories ]
	);

	const onSelectedCategoryChange = useCallback(
		( id, checkedValue ) => {
			let newCheckedCategoriesIds;
			if ( checkedValue ) {
				if ( ! checkedCategoriesIds.includes( id ) ) {
					newCheckedCategoriesIds = [ ...checkedCategoriesIds, id ].sort( ( a, b ) => a - b );
				}
			} else {
				newCheckedCategoriesIds = checkedCategoriesIds.filter( category => category !== id );
			}
			updateFormStateOptionValue( 'wpcom_newsletter_categories', newCheckedCategoriesIds );
		},
		[ checkedCategoriesIds, updateFormStateOptionValue ]
	);

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Newsletter categories', 'jetpack' ) }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ isSavingAnyOption( [ 'subscription_options' ] ) }
		>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode
				module={ subscriptionsModule }
				support={ {
					text: __(
						'When you add a new category, your existing subscribers will be automatically subscribed to it.',
						'jetpack'
					),
					link: getRedirectUrl( 'jetpack-support-subscriptions' ),
				} }
			>
				<p>
					{ __(
						'Newsletter categories allow visitors to subscribe only to specific topics. When enabled, only posts published under the categories selected below will be emailed to your subscribers.',
						'jetpack'
					) }
				</p>
				<ToggleControl
					disabled={ isUnavailableDueOfflineMode || isUnavailableDueSiteConnectionMode }
					checked={ isNewsletterCategoriesEnabled }
					onChange={ handleEnableNewsletterCategoriesToggleChange }
					label={ __( 'Enable newsletter categories', 'jetpack' ) }
				/>
				<div
					className={ classNames( 'newsletter-colapsable', {
						hide: ! isNewsletterCategoriesEnabled,
					} ) }
				>
					<TreeDropdown
						items={ mappedCategories }
						selectedItems={ checkedCategoriesIds }
						onChange={ onSelectedCategoryChange }
						disabled={ isSavingAnyOption( [ 'wpcom_newsletter_categories' ] ) }
					/>
				</div>
			</SettingsGroup>
			<div
				className={ classNames( 'newsletter-card-colapsable', {
					hide: ! isNewsletterCategoriesEnabled,
				} ) }
			>
				<Card
					compact
					className="jp-settings-card__configure-link"
					href="/wp-admin/edit-tags.php?taxonomy=category"
					target="_blank"
				>
					{ __( 'Add New Category', 'jetpack' ) }
				</Card>
			</div>
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			subscriptionsModule: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			isNewsletterCategoriesEnabled: ownProps.getOptionValue(
				'wpcom_newsletter_categories_enabled'
			),
			newsletterCategories: ownProps.getOptionValue( 'wpcom_newsletter_categories' ),
			categories: ownProps.getOptionValue( 'categories' ),
			requiresConnection: requiresConnection( state, SUBSCRIPTIONS_MODULE_NAME ),
			isUnavailableDueOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			isUnavailableDueSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( NewsletterCategories )
);
