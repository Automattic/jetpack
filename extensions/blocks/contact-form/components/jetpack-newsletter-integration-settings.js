/**
 * External dependencies
 */
import { BaseControl, Button, ExternalLink, PanelBody, Spinner, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import { useCallback, useMemo, useState, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import {
	installAndActivatePlugin,
	activatePlugin,
	getPlugins,
} from './../../../shared/plugin-management';
import { jetpackCreateInterpolateElement } from '../../../shared/create-interpolate-element';

const pluginPathWithoutPhp = 'creative-mail-by-constant-contact/creative-mail-plugin';
const pluginPath = `${ pluginPathWithoutPhp }.php`;
const pluginSlug = 'creative-mail-by-constant-contact';

const useInsertConsentBlock = () => {
	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );
	const { insertBlock } = useDispatch( 'core/block-editor' );

	const insertConsentBlock = useCallback( async () => {
		const buttonBlockIndex = ( selectedBlock.innerBlocks ?? [] ).findIndex(
			( { name } ) => name === 'jetpack/button'
		);
		if ( buttonBlockIndex === -1 ) {
			return;
		}

		const newConsentBlock = await createBlock( 'jetpack/field-consent' );
		await insertBlock( newConsentBlock, buttonBlockIndex, selectedBlock.clientId, false );
	}, [ insertBlock, selectedBlock.clientId, selectedBlock.innerBlocks ] );

	return { insertConsentBlock };
};

const NoConsentBlockSettings = () => {
	const { insertConsentBlock } = useInsertConsentBlock();

	return (
		<>
			<p>
				{ __(
					'You’re already collecting email contacts. Why not make sure you have permission to email them too?',
					'jetpack'
				) }
			</p>
			<Button isSecondary onClick={ insertConsentBlock } style={ { marginBottom: '1em' } }>
				{ __( 'Add email permission request', 'jetpack' ) }
			</Button>
		</>
	);
};

const pluginStateEnum = Object.freeze( {
	ACTIVE: 1,
	INSTALLED: 2,
	NOT_INSTALLED: 3,
} );

const CreativeMailPluginErrorState = () => {
	return (
		<p>
			<em style={ { color: 'red' } }>
				{ jetpackCreateInterpolateElement(
					__(
						'The plugin failed to install. Please check the <a>plugin information</a> to for detailed requirements.',
						'jetpack'
					),
					{
						a: (
							<ExternalLink href="https://wordpress.org/plugins/creative-mail-by-constant-contact" />
						),
					}
				) }
			</em>
		</p>
	);
};

const CreativeMailPluginIsInstalling = () => {
	const [ dots, setDots ] = useState( 1 );
	useEffect( () => {
		const dotsInterval = setInterval( () => {
			setDots( dots + 1 );
		}, 1000 );
		return () => clearInterval( dotsInterval );
	} );
	return (
		<Button isSecondary icon={ <Icon icon="update" /> } disabled>
			{ __( 'Installing', 'jetpack' ) }
			{ '.'.repeat( dots % 4 ) }
		</Button>
	);
};

const CreativeMailPluginIsNotInstalled = ( {
	installAndActivateCreativeMailPlugin,
	isInstalling,
} ) => {
	return (
		<p>
			<em>
				{ __(
					'To start sending email campaigns, install the Creative Mail plugin for WordPress.',
					'jetpack'
				) }
				<br />
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
					'To start sending email campaigns, active the Creative Mail plugin for WordPress.',
					'jetpack'
				) }
			</em>
			<br />
			<br />
			{ isInstalling && <CreativeMailPluginIsInstalling /> }
			{ ! isInstalling && (
				<Button isPrimary onClick={ activateCreativeMailPlugin }>
					{ __( 'Activate Creative Mail Plugin', 'jetpack' ) }
				</Button>
			) }
		</p>
	);
};

const CreativeMailPluginIsActive = () => {
	return (
		<p>
			<em>
				{ __( 'You’re all setup for email marketing with Creative Mail.', 'jetpack' ) }
				<br />
				<br />
				<ExternalLink href="/wp-admin/admin.php?page=creativemail">
					{ __( 'Open Creative Mail', 'jetpack' ) }
				</ExternalLink>
			</em>
		</p>
	);
};

const usePluginPromise = ( setIsFetchingPlugins, setPluginState ) => {
	useEffect( () => {
		getPlugins().then( plugins => {
			setIsFetchingPlugins( false );
			if ( get( plugins, pluginPath ) ) {
				if ( get( plugins, [ pluginPath, 'active' ] ) ) {
					setPluginState( pluginStateEnum.ACTIVE );
				} else {
					setPluginState( pluginStateEnum.INSTALLED );
				}
			}
		} );
	}, [ setPluginState, setIsFetchingPlugins ] );
};

const useOnCreativeMailPluginPromise = ( setPluginError, setIsInstalling, setPluginState ) => {
	const onCreativeMailPluginClick = useCallback( ( func, arg ) => {
		setPluginError( undefined );
		setIsInstalling( true );
		func( arg )
			.then( () => {
				setPluginState( pluginStateEnum.ACTIVE );
			} )
			.catch( err => {
				setPluginError( err );
			} )
			.finally( () => setIsInstalling( false ) );
	}, [] );
	return onCreativeMailPluginClick;
};

const CreativeMailPlugin = () => {
	const [ isFetchingPlugins, setIsFetchingPlugins ] = useState( true );
	const [ pluginState, setPluginState ] = useState( pluginStateEnum.NOT_INSTALLED );
	const [ pluginError, setPluginError ] = useState();
	const [ isInstalling, setIsInstalling ] = useState( false );
	const onCreativeMailPluginClick = useOnCreativeMailPluginPromise(
		setPluginError,
		setIsInstalling,
		setPluginState
	);
	usePluginPromise( setIsFetchingPlugins, setPluginState );

	if ( isFetchingPlugins ) {
		return <Spinner />;
	}
	if ( pluginError ) {
		return <CreativeMailPluginErrorState />;
	}
	return (
		<>
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
		</>
	);
};

const shouldHaveConsentBlockSelector = innerBlocks => {
	const hasEmailBlock = innerBlocks.some( ( { name } ) => name === 'jetpack/field-email' );
	const hasConsentBlock = innerBlocks.some( ( { name } ) => name === 'jetpack/field-consent' );
	if ( hasEmailBlock ) {
		return ! hasConsentBlock;
	}
	return false;
};

const NewsletterIntegrationSettings = () => {
	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );
	const shouldHaveConsentBlock = useMemo(
		() => shouldHaveConsentBlockSelector( selectedBlock.innerBlocks ),
		[ selectedBlock.innerBlocks ]
	);

	return (
		<PanelBody title={ __( 'Newsletter Integration', 'jetpack' ) } initialOpen={ false }>
			<BaseControl>
				{ shouldHaveConsentBlock && <NoConsentBlockSettings /> }
				<CreativeMailPlugin />
			</BaseControl>
		</PanelBody>
	);
};

export default NewsletterIntegrationSettings;
