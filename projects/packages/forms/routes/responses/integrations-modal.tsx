/**
 * External dependencies
 */
import colorStudio from '@automattic/color-studio';
import jetpackAnalytics from '@automattic/jetpack-analytics';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import {
	Modal,
	Card,
	Button,
	ExternalLink,
	Spinner,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useState, useCallback, useMemo, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import AkismetIcon from '../../src/icons/akismet';
import MailPoetIcon from '../../src/icons/mailpoet';
import type { Integration } from '../../src/types';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

type IntegrationsModalProps = {
	isOpen: boolean;
	onClose: () => void;
	integrationsData: Integration[];
	refreshIntegrations: () => Promise< void >;
	context?: 'dashboard';
	attributes?: unknown;
	setAttributes?: unknown;
};

type IntegrationCardProps = {
	integration: Integration;
	refreshIntegrations: () => Promise< void >;
	isExpanded: boolean;
	onToggle: () => void;
};

const IntegrationCardComponent = ( {
	integration,
	refreshIntegrations,
	isExpanded,
	onToggle,
}: IntegrationCardProps ) => {
	const {
		id,
		title,
		subtitle,
		isInstalled,
		isActivated,
		isConnected,
		settingsUrl = '',
		marketingUrl = '',
	} = integration;

	const isLoading = typeof isInstalled === 'undefined';

	const getIcon = () => {
		switch ( id ) {
			case 'akismet':
				return <AkismetIcon width={ 28 } height={ 28 } />;
			case 'zero-bs-crm':
				return <JetpackLogo showText={ false } height={ 28 } logoColor={ COLOR_JETPACK } />;
			case 'mailpoet':
				return <MailPoetIcon width={ 28 } height={ 28 } />;
			default:
				return null;
		}
	};

	const renderStatus = () => {
		if ( isLoading ) {
			return <Spinner />;
		}
		if ( ! isInstalled ) {
			return (
				<span style={ { color: '#757575', fontSize: '13px' } }>
					{ __( 'Not installed', 'jetpack-forms' ) }
				</span>
			);
		}
		if ( ! isActivated ) {
			return (
				<span style={ { color: '#757575', fontSize: '13px' } }>
					{ __( 'Not activated', 'jetpack-forms' ) }
				</span>
			);
		}
		if ( ! isConnected ) {
			return (
				<span style={ { color: '#d63638', fontSize: '13px' } }>
					{ __( 'Setup required', 'jetpack-forms' ) }
				</span>
			);
		}
		return (
			<span style={ { color: '#00a32a', fontSize: '13px' } }>
				{ __( 'Connected', 'jetpack-forms' ) }
			</span>
		);
	};

	const renderBody = () => {
		if ( isLoading ) {
			return null;
		}

		if ( ! isInstalled ) {
			const message =
				id === 'akismet'
					? __(
							"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
							'jetpack-forms'
					  )
					: id === 'zero-bs-crm'
					? __(
							'You can save your form contacts in <a>Jetpack CRM</a>. To get started, please install the plugin.',
							'jetpack-forms'
					  )
					: __(
							'Add powerful email marketing to your forms with <a>MailPoet</a>. Simply install the plugin to start sending emails.',
							'jetpack-forms'
					  );

			return (
				<p style={ { color: '#50575e', margin: 0 } }>
					{ createInterpolateElement( message, {
						a: <ExternalLink href={ marketingUrl } />,
					} ) }
				</p>
			);
		}

		if ( ! isActivated ) {
			const message =
				id === 'akismet'
					? __(
							'Akismet is installed. Just activate the plugin to start blocking spam.',
							'jetpack-forms'
					  )
					: id === 'zero-bs-crm'
					? __(
							'Jetpack CRM is installed. To start saving contacts, simply activate the plugin.',
							'jetpack-forms'
					  )
					: __(
							'MailPoet is installed. Just activate the plugin to start sending emails.',
							'jetpack-forms'
					  );

			return <p style={ { color: '#50575e', margin: 0 } }>{ message }</p>;
		}

		if ( ! isConnected ) {
			return (
				<VStack spacing="3">
					<p style={ { color: '#50575e', margin: 0 } }>
						{ id === 'akismet'
							? createInterpolateElement(
									__(
										'Akismet is active. There is one step left. Please add your <a>Akismet key</a>.',
										'jetpack-forms'
									),
									{ a: <ExternalLink href={ settingsUrl } /> }
							  )
							: __( 'Setup is required to complete the integration.', 'jetpack-forms' ) }
					</p>
					<HStack spacing="3" justify="start">
						<Button
							variant="secondary"
							href={ settingsUrl }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize
						>
							{ __( 'Complete setup', 'jetpack-forms' ) }
						</Button>
						<Button variant="tertiary" onClick={ refreshIntegrations } __next40pxDefaultSize>
							{ __( 'Refresh status', 'jetpack-forms' ) }
						</Button>
					</HStack>
				</VStack>
			);
		}

		// Connected state
		return (
			<VStack spacing="3">
				<p style={ { color: '#50575e', margin: 0 } }>
					{ id === 'akismet'
						? __( 'Your forms are automatically protected with Akismet.', 'jetpack-forms' )
						: id === 'zero-bs-crm'
						? __( 'Jetpack CRM is connected.', 'jetpack-forms' )
						: __( 'MailPoet is connected.', 'jetpack-forms' ) }
				</p>
				<HStack spacing="2" justify="start">
					<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
						{ __( 'View settings', 'jetpack-forms' ) }
					</Button>
					{ id === 'akismet' && (
						<>
							<span>|</span>
							<ExternalLink href={ getRedirectUrl( 'akismet-jetpack-forms-docs' ) }>
								{ __( 'Learn about Akismet', 'jetpack-forms' ) }
							</ExternalLink>
						</>
					) }
				</HStack>
			</VStack>
		);
	};

	return (
		<Card isBorderless style={ { borderBottom: '1px solid #e0e0e0', borderRadius: 0 } }>
			<HStack
				as="button"
				onClick={ onToggle }
				style={ {
					width: '100%',
					padding: '16px',
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					textAlign: 'left',
				} }
				justify="space-between"
			>
				<HStack spacing="3">
					{ getIcon() }
					<VStack spacing="0">
						<span style={ { fontWeight: 500 } }>{ title }</span>
						<span style={ { fontSize: '13px', color: '#757575' } }>{ subtitle }</span>
					</VStack>
				</HStack>
				<HStack spacing="3">
					{ renderStatus() }
					{ isExpanded ? chevronUp : chevronDown }
				</HStack>
			</HStack>
			{ isExpanded && (
				<div style={ { padding: '0 16px 16px 16px', paddingLeft: '56px' } }>{ renderBody() }</div>
			) }
		</Card>
	);
};

const IntegrationsModal = ( {
	isOpen,
	onClose,
	integrationsData,
	refreshIntegrations,
}: IntegrationsModalProps ) => {
	const [ expandedCards, setExpandedCards ] = useState< Record< string, boolean > >( {} );

	const toggleCard = useCallback( ( id: string ) => {
		setExpandedCards( prev => {
			const isExpanding = ! prev[ id ];
			if ( isExpanding ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_card_expand', {
					card: id,
					origin: 'dashboard',
				} );
			}
			return { ...prev, [ id ]: isExpanding };
		} );
	}, [] );

	const filteredIntegrations = useMemo(
		() => integrationsData.filter( i => [ 'akismet', 'zero-bs-crm', 'mailpoet' ].includes( i.id ) ),
		[ integrationsData ]
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Manage integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			size="large"
			className="jetpack-forms-integrations-modal"
		>
			<VStack spacing="0">
				{ filteredIntegrations.map( integration => (
					<IntegrationCardComponent
						key={ integration.id }
						integration={ integration }
						refreshIntegrations={ refreshIntegrations }
						isExpanded={ !! expandedCards[ integration.id ] }
						onToggle={ () => toggleCard( integration.id ) }
					/>
				) ) }
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
