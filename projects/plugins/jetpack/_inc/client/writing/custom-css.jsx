import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import { FormLegend } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { currentThemeIsBlockTheme, getSiteAdminUrl } from 'state/initial-state';
import { getModule } from 'state/modules';

const trackVisitGlobalStyles = () => {
	analytics.tracks.recordJetpackClick( {
		target: 'visit-global-styles',
		feature: 'custom-css',
		extra: 'not-supported-link',
	} );
};

const trackVisitCustomizer = () => {
	analytics.tracks.recordJetpackClick( {
		target: 'visit-customizer',
		feature: 'custom-css',
		extra: 'not-supported-link',
	} );
};

/**
 * Custom CSS settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Custom CSS settings component.
 */
function CustomCss( props ) {
	const {
		customCssActive,
		customCssModule: { name, description, module },
		isBlockThemeActive,
		isSavingAnyOption,
		siteAdminUrl,
		toggleModuleNow,
	} = props;

	const recommendSiteEditor = () => {
		return (
			<p>
				{ createInterpolateElement(
					__(
						'Hurray! Your theme supports site editing with blocks. <a>Tell me more.</a>',
						'jetpack'
					),
					{
						a: (
							<a
								href="https://wordpress.org/documentation/article/site-editor/"
								title={ __(
									'Customize every aspect of your site with the Site Editor.',
									'jetpack'
								) }
							/>
						),
					}
				) }
			</p>
		);
	};

	const siteEditorButton = () => {
		// If we're using a block theme and the feature is enabled, we don't want to show the button.
		if ( isBlockThemeActive && customCssActive ) {
			return null;
		}

		return (
			<Button
				onClick={ trackVisitGlobalStyles }
				href={ `${ siteAdminUrl }site-editor.php?path=%2Fwp_global_styles&canvas=edit` }
			>
				{ __( 'Use Site Editor', 'jetpack' ) }
			</Button>
		);
	};

	const customizerLink = () => {
		return (
			<>
				<p>
					{ createInterpolateElement(
						__(
							'Additional CSS can be added from the Customizer. Enable the enhanced Custom CSS feature below to add additional features. <a>Access the Customizer here.</a>',
							'jetpack'
						),
						{
							a: (
								<a
									onClick={ trackVisitCustomizer }
									href={ `${ siteAdminUrl }customize.php?autofocus%5Bsection%5D=custom_css` }
									title={ __(
										'Edit and add CSS directly on your site from the Customizer.',
										'jetpack'
									) }
								/>
							),
						}
					) }
				</p>
			</>
		);
	};

	const toggleModule = () => {
		// If we're using a block theme and the feature is disabled, we don't want to show the toggle.
		if ( isBlockThemeActive && ! customCssActive ) {
			return null;
		}

		return (
			<ModuleToggle
				slug="custom-css"
				activated={ !! customCssActive }
				toggling={ isSavingAnyOption( [ 'custom-css' ] ) }
				disabled={ isSavingAnyOption( [ 'custom-css' ] ) }
				toggleModule={ toggleModuleNow }
			>
				<span className="jp-form-toggle-explanation">
					{ __( 'Enhance CSS customization panel', 'jetpack' ) }
				</span>
			</ModuleToggle>
		);
	};

	return (
		<SettingsGroup
			module={ { module } }
			support={ {
				text: description,
				link: getRedirectUrl( 'jetpack-support-custom-css' ),
			} }
		>
			<FormLegend className="jp-form-label-wide">{ name }</FormLegend>
			{ isBlockThemeActive && recommendSiteEditor() }
			{ ! isBlockThemeActive && customizerLink() }
			{ toggleModule() }
			{ siteEditorButton() }
		</SettingsGroup>
	);
}

export default withModuleSettingsFormHelpers(
	connect( ( state, ownProps ) => {
		return {
			customCssActive: ownProps.getOptionValue( 'custom-css' ),
			customCssModule: getModule( state, 'custom-css' ),
			isBlockThemeActive: currentThemeIsBlockTheme( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
		};
	} )( CustomCss )
);
