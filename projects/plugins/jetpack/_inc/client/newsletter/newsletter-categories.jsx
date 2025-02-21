import { ToggleControl, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { createNotice } from 'components/global-notices/state/notices/actions';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { FEATURE_NEWSLETTER_JETPACK } from 'lib/plans/constants';
import {
	isUnavailableInOfflineMode,
	requiresConnection,
	hasConnectedOwner,
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
 * @return {React.Component} Subscription settings component.
 */
function NewsletterCategories( props ) {
	const {
		isSubscriptionsActive,
		isNewsletterCategoriesEnabled,
		newsletterCategories,
		categories,
		unavailableInOfflineMode,
		subscriptionsModule,
		updateFormStateOptionValue,
		isSavingAnyOption,
		siteHasConnectedUser,
		dispatch,
	} = props;

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

	const handleEnableNewsletterCategoriesToggleChange = useCallback( () => {
		updateFormStateOptionValue(
			NEWSLETTER_CATEGORIES_ENABLED_OPTION,
			! isNewsletterCategoriesEnabled
		);
	}, [ updateFormStateOptionValue, isNewsletterCategoriesEnabled ] );

	const isSaving = isSavingAnyOption( [
		NEWSLETTER_CATEGORIES_ENABLED_OPTION,
		NEWSLETTER_CATEGORIES_OPTION,
	] );
	const disabled =
		! siteHasConnectedUser || ! isSubscriptionsActive || unavailableInOfflineMode || isSaving;

	const handleSubmitForm = useCallback(
		event => {
			if ( isNewsletterCategoriesEnabled && checkedCategoriesIds.length === 0 ) {
				event.preventDefault();
				dispatch(
					createNotice(
						'is-error',
						__(
							'Please select at least one category when newsletter categories are enabled.',
							'jetpack'
						),
						{ id: 'newsletter-categories-error' }
					)
				);
				return;
			}
			props.onSubmit?.( event );
		},
		[ isNewsletterCategoriesEnabled, checkedCategoriesIds, props, dispatch ]
	);

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Newsletter categories', 'jetpack' ) }
			feature={ FEATURE_NEWSLETTER_JETPACK }
			module={ SUBSCRIPTIONS_MODULE_NAME }
			saveDisabled={ isSaving }
			isDisabled={ disabled }
			onSubmit={ handleSubmitForm }
		>
			<SettingsGroup
				hasChild
				disableInOfflineMode
				disableInSiteConnectionMode={ ! siteHasConnectedUser }
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
					{ createInterpolateElement(
						__(
							"Newsletter categories let you select the content that's emailed to subscribers. When enabled, only posts in the selected categories will be sent as newsletters. By default, subscribers can choose from your selected categories, or you can pre-select categories using the <docsLink>subscribe block</docsLink>.",
							'jetpack'
						),
						{
							docsLink: (
								<ExternalLink href={ getRedirectUrl( 'jetpack-support-subscribe-block' ) } />
							),
						}
					) }
				</p>
				<div className="newsletter-categories-toggle-wrapper">
					<ToggleControl
						disabled={ disabled }
						checked={ isNewsletterCategoriesEnabled && isSubscriptionsActive }
						onChange={ handleEnableNewsletterCategoriesToggleChange }
						label={
							<span className="jp-form-toggle-explanation">
								{ __( 'Enable newsletter categories', 'jetpack' ) }
							</span>
						}
					/>
				</div>
				<div
					className={ clsx( 'newsletter-collapsable', {
						hide: ! isNewsletterCategoriesEnabled || ! isSubscriptionsActive,
					} ) }
				>
					<p>
						{ __(
							'Which categories will you use for newsletter subscribers? Select all that apply:',
							'jetpack'
						) }
					</p>
					<TreeDropdown
						items={ mappedCategories }
						selectedItems={ checkedCategoriesIds }
						onChange={ onSelectedCategoryChange }
						disabled={ disabled }
					/>
				</div>
			</SettingsGroup>
			<div
				className={ clsx( 'newsletter-card-collapsable', {
					hide: ! isNewsletterCategoriesEnabled || ! isSubscriptionsActive,
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
			isSubscriptionsActive: ownProps.getOptionValue( SUBSCRIPTIONS_MODULE_NAME ),
			subscriptionsModule: getModule( state, SUBSCRIPTIONS_MODULE_NAME ),
			isNewsletterCategoriesEnabled: ownProps.getOptionValue(
				NEWSLETTER_CATEGORIES_ENABLED_OPTION
			),
			newsletterCategories: ownProps.getOptionValue( NEWSLETTER_CATEGORIES_OPTION ),
			categories: ownProps.getOptionValue( 'categories' ),
			requiresConnection: requiresConnection( state, SUBSCRIPTIONS_MODULE_NAME ),
			unavailableInOfflineMode: isUnavailableInOfflineMode( state, SUBSCRIPTIONS_MODULE_NAME ),
			siteHasConnectedUser: hasConnectedOwner( state ),
			dispatch: ownProps.dispatch,
		};
	} )( NewsletterCategories )
);
