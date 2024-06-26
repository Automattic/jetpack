import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink, Notice } from '@wordpress/components';
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

const CustomizerLink = ( { children, siteAdminUrl } ) => (
	<a
		onClick={ trackVisitCustomizer }
		href={ `${ siteAdminUrl }customize.php?autofocus%5Bsection%5D=custom_css` }
		title={ __( 'Edit and add CSS directly on your site from the Customizer.', 'jetpack' ) }
	>
		{ children }
	</a>
);

export const StartFreshDeprecationWarning = ( { siteAdminUrl } ) =>
	createInterpolateElement(
		__(
			"The <i>Start Fresh</i> option in the <a1>CSS customization panel</a1> is enabled, which means the theme's original CSS is not applied. <b>This option will no longer be supported after August 6, 2024.</b> <a2>See how to keep your site intact</a2>.",
			'jetpack'
		),
		{
			i: <i />,
			b: <b />,
			a1: <CustomizerLink siteAdminUrl={ siteAdminUrl } />,
			a2: <ExternalLink href={ getRedirectUrl( 'jetpack-support-custom-css' ) } />,
		}
	);

/**
 * Custom CSS settings component.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Custom CSS settings component.
 */
function CustomCss( props ) {
	const {
		customCssActive,
		customCssModule: { name, description, module, options },
		isBlockThemeActive,
		isSavingAnyOption,
		siteAdminUrl,
		toggleModuleNow,
	} = props;

	const recommendSiteEditor = () => {
		return (
			<div className="jp-custom-css-site-editor">
				<div className="jp-custom-css-site-editor__text">
					{ createInterpolateElement(
						__(
							'Your site has a block theme that allows you to apply custom CSS from the Site Editor. <a>Learn more.</a>',
							'jetpack'
						),
						{
							a: (
								<ExternalLink
									href="https://wordpress.org/documentation/article/styles-overview/#applying-custom-css"
									title={ __(
										'Customize every aspect of your site with the Site Editor.',
										'jetpack'
									) }
								/>
							),
						}
					) }
				</div>
				{ ! customCssActive && (
					<div className="jp-custom-css-site-editor__button">
						<Button
							rna
							onClick={ trackVisitGlobalStyles }
							href={ `${ siteAdminUrl }site-editor.php?path=%2Fwp_global_styles&canvas=edit` }
							primary={ true }
						>
							{ __( 'Use Site Editor', 'jetpack' ) }
						</Button>
					</div>
				) }
			</div>
		);
	};

	const customizerLink = () => {
		return (
			<div>
				{ createInterpolateElement(
					__(
						'Additional CSS can be added from the Customizer. Enable the enhanced Custom CSS feature below to add additional features. <a>Access the Customizer here.</a>',
						'jetpack'
					),
					{
						a: <CustomizerLink siteAdminUrl={ siteAdminUrl } />,
					}
				) }
			</div>
		);
	};

	const toggleModule = () => {
		// If we're using a block theme and the feature is disabled, we don't want to show the toggle.
		if ( isBlockThemeActive && ! customCssActive ) {
			return null;
		}

		return (
			<ModuleToggle
				className="jp-custom-css__module-toggle"
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

	const supportText = () => {
		if ( isBlockThemeActive ) {
			return {};
		}

		return {
			text: description,
			link: getRedirectUrl( 'jetpack-support-custom-css' ),
		};
	};

	return (
		<SettingsGroup module={ { module } } support={ supportText() }>
			<FormLegend className="jp-form-label-wide">{ name }</FormLegend>
			{ options?.replace && (
				<Notice
					className="jp-custom-css__deprecation-warning"
					isDismissible={ false }
					status="warning"
				>
					<StartFreshDeprecationWarning siteAdminUrl={ siteAdminUrl } />{ ' ' }
				</Notice>
			) }
			{ isBlockThemeActive && recommendSiteEditor() }
			{ ! isBlockThemeActive && customizerLink() }
			{ toggleModule() }
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
