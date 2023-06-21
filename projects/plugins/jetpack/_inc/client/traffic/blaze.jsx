import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';

const trackDashboardClick = () => {
	analytics.tracks.recordJetpackClick( 'view-blaze-dashboard' );
};

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

	const blazeCard = () => {
		return (
			<Card
				className="blaze-card"
				href="tools.php?page=advertising"
				onClick={ trackDashboardClick }
			>
				{ __( 'Manage your campaigns and view your earnings in the Blaze dashboard', 'jetpack' ) }
			</Card>
		);
	};

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
			{ blazeActive && blazeCard() }
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
