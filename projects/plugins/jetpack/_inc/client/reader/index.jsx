import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWoASite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import QuerySite from 'components/data/query-site';
import { FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SimpleNotice from 'components/notice';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { getModule } from 'state/modules';
import { isModuleFound as isModuleFoundSelector } from 'state/search';
import './style.scss';

/**
 * Reader Section.
 *
 * @param {object} props - Component props.
 * @return {import('react').Component} Reader settings component.
 */
function Reader( props ) {
	const {
		active,
		isModuleFound,
		searchTerm,
		blogID,
		isSavingAnyOption,
		isReaderModuleActive,
		readerModule,
		updateOptions,
		getOptionValue,
		refreshSettings,
		moduleName,
	} = props;

	const toggleModule = useCallback(
		module => {
			const status = getOptionValue( module );
			// Track the toggle (analytics)
			analytics.tracks.recordEvent( 'jetpack_wpa_settings_toggle', {
				module: module,
				setting: module,
				toggled: status ? 'off' : 'on',
			} );

			updateOptions( { [ module ]: ! status } ).then( () => {
				// Refresh settings if the module is being activated
				if ( ! status ) {
					refreshSettings();
				}
			} );
		},
		[ getOptionValue, updateOptions, refreshSettings ]
	);

	const trackReaderClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( 'open-reader-from-admin-bar' );
	}, [] );

	if ( ! searchTerm && ! active ) {
		return null;
	}

	const foundReader = isModuleFound( moduleName );

	if ( ! foundReader ) {
		return null;
	}

	const cannotBeToggled = isWoASite();
	const woaNotice = cannotBeToggled && (
		<SimpleNotice
			status={ 'is-info' }
			showDismiss={ false }
			text={ __(
				'This feature is automatically managed for you on WordPress.com sites.',
				'jetpack'
			) }
		/>
	);

	const readerToggle = (
		<SettingsGroup
			hasChild
			module={ readerModule }
			support={ {
				text: __(
					'Quickly access the WordPress.com Reader from your site’s admin bar.',
					'jetpack'
				),
				link: getRedirectUrl( 'jetpack-support-reader' ),
			} }
		>
			<FormLegend className="jp-form-label-wide">
				{ __(
					'Connect with millions of creators and readers across the WordPress.com and Jetpack network.',
					'jetpack'
				) }
			</FormLegend>
			<ul role="list" className="jp-reader-discover__list">
				<li>{ __( 'Follow sites you love and explore content by topic', 'jetpack' ) }</li>
				<li>{ __( 'Reach new readers through Reader feeds and tag pages', 'jetpack' ) }</li>
				<li>{ __( 'Recommend creators you enjoy and get recommended back', 'jetpack' ) }</li>
			</ul>
			<ModuleToggle
				slug={ moduleName }
				activated={ isReaderModuleActive }
				toggling={ isSavingAnyOption( moduleName ) }
				toggleModule={ toggleModule }
				disabled={ cannotBeToggled }
			>
				<span className="jp-form-toggle-explanation">
					{ __( 'Add a link to the Reader in the top navigation bar', 'jetpack' ) }
				</span>
			</ModuleToggle>
		</SettingsGroup>
	);

	const readerUrl = addQueryArgs(
		'https://wordpress.com/reader/',
		blogID ? { origin_site_id: blogID } : {}
	);
	const visitReaderLink = (
		<Card
			compact
			className="jp-settings-card__configure-link"
			onClick={ trackReaderClick }
			href={ readerUrl }
			target="_blank"
			rel="noopener noreferrer"
		>
			{ __( 'Visit the Reader', 'jetpack' ) }
		</Card>
	);

	return (
		<div>
			<QuerySite />
			<h1 className="screen-reader-text">{ __( 'Jetpack Reader Settings', 'jetpack' ) }</h1>
			<h2 className="jp-settings__section-title">
				{ searchTerm
					? __( 'Reader', 'jetpack' )
					: __(
							'Stay up to date with your favorite sites and find new ones with the WordPress.com Reader.',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</h2>
			<SettingsCard
				{ ...props }
				header={ __( 'Visibility', 'jetpack' ) }
				hideButton
				module={ moduleName }
			>
				{ woaNotice }
				{ readerToggle }
				{ visitReaderLink }
			</SettingsCard>
		</div>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		const moduleName = 'wpcom-reader';
		return {
			moduleName,
			isReaderModuleActive: ownProps.getOptionValue( moduleName ),
			readerModule: getModule( state, moduleName ),
			isModuleFound: module_name => isModuleFoundSelector( state, module_name ),
		};
	} )( Reader )
);
