import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import Button from 'components/button';
import ClipboardButtonInput from 'components/clipboard-button-input';
import ConnectUserBar from 'components/connect-user-bar';
import { FormFieldset, FormLegend, FormLabel } from 'components/forms';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';

class PostByEmail extends React.Component {
	regeneratePostByEmailAddress = event => {
		analytics.tracks.recordJetpackClick( 'pbe-regenerage-email' );
		event.preventDefault();
		this.props.regeneratePostByEmailAddress();
	};

	address = () => {
		const currentValue = this.props.getOptionValue( 'post_by_email_address' );
		// If the module Post-by-email is enabled BUT it's configured as disabled
		// the post_by_email_address value is set to false.
		// If there's no address generated yet, post_by_email_address is null.
		if ( false === currentValue || '1' === currentValue || null === currentValue ) {
			return '';
		}
		return currentValue;
	};

	render() {
		if ( ! this.props.isModuleFound( 'post-by-email' ) ) {
			return null;
		}

		const postByEmail = this.props.getModule( 'post-by-email' ),
			isPbeActive = this.props.getOptionValue( 'post-by-email' ),
			disabledControls =
				this.props.isUnavailableInOfflineMode( 'post-by-email' ) || ! this.props.isLinked,
			emailAddress = this.address();

		return (
			<SettingsCard { ...this.props } module="post-by-email" hideButton>
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ postByEmail }
					support={ {
						text: __(
							'Allows you to publish new posts by sending an email to a special address.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-post-by-email' ),
					} }
				>
					<p>
						{ __(
							'Post by email is a quick way to publish new posts without visiting your site. We’ll generate a unique email address for you to send your content to, which will then appear on your site just like any other post.',
							'jetpack'
						) }
					</p>
					{ this.props.userCanManageModules ? (
						<ModuleToggle
							slug="post-by-email"
							compact
							disabled={ disabledControls }
							activated={ isPbeActive }
							toggling={ this.props.isSavingAnyOption( 'post-by-email' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							<span className="jp-form-toggle-explanation">
								{ this.props.module( 'post-by-email' ).description }
							</span>
						</ModuleToggle>
					) : (
						<span className="jp-form-toggle-explanation">
							{ this.props.module( 'post-by-email' ).description }
						</span>
					) }
					<FormFieldset>
						<FormLabel>
							<FormLegend>
								{ __( 'Send your new posts to this email address:', 'jetpack' ) }
							</FormLegend>
							<ClipboardButtonInput
								value={ emailAddress }
								disabled={ ! isPbeActive || disabledControls }
								copy={ _x( 'Copy', 'verb', 'jetpack' ) }
								copied={ __( 'Copied!', 'jetpack' ) }
								prompt={ __(
									'Highlight and copy the following text to your clipboard:',
									'jetpack'
								) }
							/>
						</FormLabel>
						<Button
							disabled={ ! isPbeActive || disabledControls }
							onClick={ this.regeneratePostByEmailAddress }
						>
							{ emailAddress
								? __( 'Regenerate address', 'jetpack' )
								: __( 'Create address', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
						</Button>
					</FormFieldset>
				</SettingsGroup>

				{ ! this.props.isUnavailableInOfflineMode( 'post-by-email' ) && ! this.props.isLinked && (
					<ConnectUserBar
						feature="post-by-email"
						featureLabel={ __( 'Post by Email', 'jetpack' ) }
						text={ __( 'Connect to enable publishing via email.', 'jetpack' ) }
					/>
				) }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( PostByEmail ) );
