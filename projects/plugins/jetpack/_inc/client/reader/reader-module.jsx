import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWoASite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SimpleNotice from 'components/notice';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { getModule } from 'state/modules';

/**
 * ReaderModule component.
 *
 * @param {object} props - Component props.
 * @return {import('react').Component} ReaderModule component.
 */
function ReaderModule( props ) {
	const {
		isSavingAnyOption,
		isReaderModuleActive,
		readerModule,
		updateOptions,
		getOptionValue,
		refreshSettings,
		moduleName,
	} = props;

	const cannotBeToggled = isWoASite();

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

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'Visibility', 'jetpack' ) }
			hideButton
			module={ moduleName }
		>
			{ cannotBeToggled && (
				<SimpleNotice
					status={ 'is-info' }
					showDismiss={ false }
					text={ __(
						'This feature is automatically managed for you on WordPress.com sites.',
						'jetpack'
					) }
				/>
			) }
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
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			isReaderModuleActive: ownProps.getOptionValue( ownProps.moduleName ),
			readerModule: getModule( state, ownProps.moduleName ),
		};
	} )( ReaderModule )
);
