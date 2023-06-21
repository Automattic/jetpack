import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';

/**
 * Blaze settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Blaze settings component.
 */
function Blaze( props ) {
	const {
		blazeActive,
		blazeModule: { description },
		isSavingAnyOption,
		toggleModuleNow,
	} = props;

	return (
		<SettingsCard
			{ ...props }
			header={ _x( 'Blaze', 'Settings header', 'jetpack' ) }
			module="blaze"
			hideButton
		>
			<SettingsGroup
				module={ { module: 'blaze' } }
				support={ {
					text: description,
					link: getRedirectUrl( 'jetpack-support-blaze' ),
				} }
			>
				<ModuleToggle
					slug="blaze"
					activated={ blazeActive }
					toggling={ isSavingAnyOption( 'blaze' ) }
					toggleModule={ toggleModuleNow }
				>
					{ __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack' ) }
				</ModuleToggle>
			</SettingsGroup>
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			blazeActive: ownProps.getOptionValue( 'blaze' ),
			blazeModule: getModule( state, 'blaze' ),
		};
	} )( Blaze )
);
