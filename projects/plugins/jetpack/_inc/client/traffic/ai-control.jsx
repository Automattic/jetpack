import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';

/**
 * AI Crawler Control settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} AiControl settings component.
 */
function AiControl( props ) {
	const {
		aiControlActive,
		aiControlModule: { description },
		isSavingAnyOption,
		toggleModuleNow,
	} = props;

	return (
		<SettingsCard
			{ ...props }
			header={ __( 'AI Crawler Control', 'jetpack' ) }
			module="ai-crawler-control"
			hideButton
		>
			<SettingsGroup
				module={ { module: 'ai-crawler-control' } }
				support={ {
					text: description,
					link: getRedirectUrl( 'jetpack-support-ai-crawler-control' ),
				} }
			>
				<ModuleToggle
					slug="ai-crawler-control"
					activated={ aiControlActive }
					disabled={ isSavingAnyOption( 'ai-crawler-control' ) }
					toggling={ isSavingAnyOption( 'ai-crawler-control' ) }
					toggleModule={ toggleModuleNow }
				>
					{ __(
						'Indicate to AI crawlers that they should not index your site’s content.',
						'jetpack'
					) }
				</ModuleToggle>
			</SettingsGroup>
		</SettingsCard>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			aiControlActive: ownProps.getOptionValue( 'ai-crawler-control' ),
			aiControlModule: getModule( state, 'ai-crawler-control' ),
		};
	} )( AiControl )
);
