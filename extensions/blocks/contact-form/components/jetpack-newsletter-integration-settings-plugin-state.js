/**
 * External dependencies
 */
import { Button, ExternalLink, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { installAndActivatePlugin, activatePlugin } from './../../../shared/plugin-management';
import getJetpackData from './../../../shared/get-jetpack-data';
import { get } from 'lodash';

const pluginPathWithoutPhp = 'creative-mail-by-constant-contact/creative-mail-plugin';
const pluginSlug = 'creative-mail-by-constant-contact';

export const pluginStateEnum = Object.freeze( {
	ACTIVE: 1,
	INSTALLED: 2,
	NOT_INSTALLED: 3,
} );

const CreativeMailPluginIsInstalling = ( { isActivating } ) => {
	const btnTxt = isActivating ? __( 'Activating…', 'jetpack' ) : __( 'Installing…', 'jetpack' );
	return (
		<Button
			isSecondary
			icon={ <Icon style={ { animation: 'rotation 2s infinite linear' } } icon="update" /> }
			disabled
			aria-label={ btnTxt }
		>
			{ btnTxt }
		</Button>
	);
};

const CreativeMailPluginIsNotInstalled = ( {
	installAndActivateCreativeMailPlugin,
	isInstalling,
} ) => {
	return (
		<p>
			<em style={ { color: 'rgba(38, 46, 57, 0.7)' } }>
				{ __(
					'To start sending email campaigns, install the Creative Mail plugin for WordPress.',
					'jetpack'
				) }
				<br />
				{ isInstalling && <CreativeMailPluginIsInstalling /> }
				{ ! isInstalling && (
					<Button isSecondary onClick={ installAndActivateCreativeMailPlugin }>
						{ __( 'Install Creative Mail plugin', 'jetpack' ) }
					</Button>
				) }
			</em>
		</p>
	);
};

const CreativeMailPluginIsInstalled = ( { activateCreativeMailPlugin, isInstalling } ) => {
	return (
		<p>
			<em>
				{ __(
					'To start sending email campaigns, activate the Creative Mail plugin for WordPress.',
					'jetpack'
				) }
			</em>
			<br />
			{ isInstalling && <CreativeMailPluginIsInstalling isActivating /> }
			{ ! isInstalling && (
				<Button isSecondary onClick={ activateCreativeMailPlugin }>
					{ __( 'Activate Creative Mail Plugin', 'jetpack' ) }
				</Button>
			) }
		</p>
	);
};

const getCreativeMailPluginUrl = () => {
	const adminUrl = get( getJetpackData(), 'adminUrl', false );
	return `${ adminUrl }admin.php?page=creativemail`;
};

const CreativeMailPluginIsActive = () => {
	return (
		<p>
			<em>
				{ __( 'You’re all setup for email marketing with Creative Mail.', 'jetpack' ) }
				<br />
				<ExternalLink href={ getCreativeMailPluginUrl() }>
					{ __( 'Open Creative Mail settings', 'jetpack' ) }
				</ExternalLink>
			</em>
		</p>
	);
};

const CreativeMailPluginState = ( { pluginState, onCreativeMailPluginClick, isInstalling } ) => {
	return (
		<div aria-live="polite">
			{ pluginStateEnum.ACTIVE === pluginState && <CreativeMailPluginIsActive /> }
			{ pluginStateEnum.INSTALLED === pluginState && (
				<CreativeMailPluginIsInstalled
					activateCreativeMailPlugin={ () =>
						onCreativeMailPluginClick( activatePlugin, pluginPathWithoutPhp )
					}
					isInstalling={ isInstalling }
				/>
			) }
			{ pluginStateEnum.NOT_INSTALLED === pluginState && (
				<CreativeMailPluginIsNotInstalled
					installAndActivateCreativeMailPlugin={ () =>
						onCreativeMailPluginClick( installAndActivatePlugin, pluginSlug )
					}
					isInstalling={ isInstalling }
				/>
			) }
		</div>
	);
};

export default CreativeMailPluginState;
