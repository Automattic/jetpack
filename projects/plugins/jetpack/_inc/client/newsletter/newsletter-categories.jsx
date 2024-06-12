import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
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

const NEWSLETTER_CATEGORIES_ENABLED_OPTION = 'wpcom_newsletter_categories_enabled';
const NEWSLETTER_CATEGORIES_OPTION = 'wpcom_newsletter_categories';

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
		unavailableInOfflineMode,
		unavailableInSiteConnectionMode,
		subscriptionsModule,
		updateFormStateOptionValue,
		isSavingAnyOption,
	} = props;

	const handleEnableNewsletterCategoriesToggleChange = useCallback( () => {
		updateFormStateModuleOption( SUBSCRIPTIONS_MODULE_NAME, NEWSLETTER_CATEGORIES_ENABLED_OPTION );
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
			updateFormStateOptionValue( NEWSLETTER_CATEGORIES_OPTION, newCheckedCategoriesIds );
		},
		[ checkedCategoriesIds, updateFormStateOptionValue ]
	);

	const disabled =
		unavailableInOfflineMode ||
		unavailableInSiteConnectionMode ||
		isSavingAnyOption( [ NEWSLETTER_CATEGORIES_ENABLED_OPTION, NEWSLETTER_CATEGORIES_OPTION ] );

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Newsletter categories', 'jetpack' ) }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ disabled }
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
				<div className="newsletter-categories-toggle-wrapper">
					<ToggleControl
						disabled={ disabled }
						checked={ isNewsletterCategoriesEnabled }
						onChange={ handleEnableNewsletterCategoriesToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Enable newsletter categories', 'jetpack' ) }
							</span>
						}
					/>
				</div>
				<div
					className={ clsx( 'newsletter-colapsable', {
						hide: ! isNewsletterCategoriesEnabled,
					} ) }
				>
					<TreeDropdown
						items={ mappedCategories }
						selectedItems={ checkedCategoriesIds }
						onChange={ onSelectedCategoryChange }
						disabled={ disabled }
					/>
				</div>
			</SettingsGroup>
			<div
				className={ clsx( 'newsletter-card-colapsable', {
					hide: ! isNewsletterCategoriesEnabled,
				} ) }
			>
				<Card
					compact
					className="jp-settings-card__configure-link"
					href="/wp-admin/edit-tags.php?taxonomy=category&referer=newsletter-categories"
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
				NEWSLETTER_CATEGORIES_ENABLED_OPTION
			),
			newsletterCategories: ownProps.getOptionValue( NEWSLETTER_CATEGORIES_OPTION ),
			categories: ownProps.getOptionValue( 'categories' ),
			requiresConnection: requiresConnection( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInSiteConnectionMode: isUnavailableInSiteConnectionMode(
				state,
				SUBSCRIPTIONS_MODULE_NAME
			),
		};
	} )( NewsletterCategories )
);
