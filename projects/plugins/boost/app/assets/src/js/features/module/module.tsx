import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Notice, Stack } from '@wordpress/ui';
import { useEffect } from 'react';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import { useNotices } from '$features/notice/context';
import Pill from '$features/ui/pill/pill';
import { isWoaHosting } from '$lib/utils/hosting';
import { useSingleModuleState } from './lib/stores';
import styles from './module.module.scss';
import type { ReactNode } from 'react';

type ModuleProps = {
	title: ReactNode;
	description: ReactNode;
	children?: ReactNode;
	slug: string;
	toggle?: boolean;
	worksOffline?: boolean;
	/**
	 * When true, render the module's toggle + body without wrapping in a
	 * `Card.Root`. Used when nesting one module inside another card (for
	 * example, the LCP module nested inside the Cornerstone Pages card).
	 */
	inline?: boolean;
	onEnable?: () => void;
	onBeforeToggle?: ( newStatus: boolean ) => void;
	onDisable?: () => void;
	onMountEnable?: () => void;
};

const Module = ( {
	title,
	description,
	children,
	slug,
	toggle = true,
	worksOffline = true,
	inline = false,
	onEnable,
	onBeforeToggle,
	onDisable,
	onMountEnable,
}: ModuleProps ) => {
	const { site } = Jetpack_Boost;
	const { setNotice } = useNotices();
	const [ status, setStatus ] = useSingleModuleState( slug, active => {
		const activatedMessage = __( 'Module activated', 'jetpack-boost' );
		const deactivatedMessage = __( 'Module deactivated', 'jetpack-boost' );

		setNotice( {
			id: 'update-module-state',
			type: 'success',
			message: active ? activatedMessage : deactivatedMessage,
		} );
		if ( active ) {
			onEnable?.();
		} else {
			onDisable?.();
		}
	} );
	const isModuleActive = status?.active ?? false;
	const isModuleAvailable = status?.available ?? false;
	// Page Cache is not available for WoA sites, but since WoA sites
	// have their own caching, we want to show that Page Cache is active.
	const isFakeActive = ! isModuleAvailable && isWoaHosting() && slug === 'page_cache';

	const showOfflineMessage = ! site.online && ! worksOffline;
	const offlineMessage = (
		<Notice.Root intent="warning">
			<Notice.Description>
				{ __(
					'This module will not work while your website is not publicly available.',
					'jetpack-boost'
				) }
			</Notice.Description>
		</Notice.Root>
	);

	const handleToggle = () => {
		const newState = ! isModuleActive;
		const deactivateMessage = __( 'Deactivating module', 'jetpack-boost' );
		const activateMessage = __( 'Activating module', 'jetpack-boost' );

		setNotice( {
			id: 'update-module-state',
			type: 'pending',
			message: newState ? activateMessage : deactivateMessage,
		} );

		if ( onBeforeToggle ) {
			onBeforeToggle( newState );
		}
		setStatus( newState );
	};

	useEffect( () => {
		if ( isModuleActive ) {
			onMountEnable?.();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Don't show unavailable modules
	if ( ! isModuleAvailable && slug !== 'page_cache' ) {
		return null;
	}

	const isDevelopmentFeature = Jetpack_Boost.developmentFeatures.includes( slug );
	const toggleLabel = isDevelopmentFeature ? (
		<>
			{ title }
			<Pill text={ __( 'Under Development', 'jetpack-boost' ) } variant="red" />
		</>
	) : (
		title
	);

	const extras = showOfflineMessage ? offlineMessage : isModuleActive ? children : null;
	const body = toggle ? (
		<>
			<ToggleControl
				__nextHasNoMarginBottom
				className={ `jb-feature-toggle-${ slug }` }
				label={ toggleLabel }
				help={ description }
				checked={ isModuleActive || isFakeActive }
				disabled={ ! isModuleAvailable }
				onChange={ handleToggle }
			/>
			{ extras && (
				<div className={ styles[ 'inline-extras' ] }>
					<Stack direction="column" gap="lg">
						{ extras }
					</Stack>
				</div>
			) }
		</>
	) : (
		<>
			<h3 className={ styles[ 'no-toggle-title' ] }>{ toggleLabel }</h3>
			<div>{ description }</div>
			{ extras }
		</>
	);

	if ( inline ) {
		return <div data-testid={ `module-${ slug }` }>{ body }</div>;
	}

	return (
		<Card.Root data-testid={ `module-${ slug }` }>
			<Card.Content>{ body }</Card.Content>
		</Card.Root>
	);
};

export default ( props: ModuleProps ) => {
	const errorNotice = ( error: Error ) => (
		<Notice.Root intent="error">
			<Notice.Title>{ __( 'Failed to load module', 'jetpack-boost' ) }</Notice.Title>
			<Notice.Description>
				{ createInterpolateElement(
					__(
						'We encountered an error while loading this module. Please refresh the page and try again. If the issue persists, <link>click here</link> to get help.',
						'jetpack-boost'
					),
					{
						link: (
							<Link
								openInNewTab
								href={ getRedirectUrl( 'jetpack-boost-help-module-load-failed' ) }
							/>
						),
					}
				) }{ ' ' }
				<code>{ `${ error.constructor.name }: ${ error.message }` }</code>
			</Notice.Description>
		</Notice.Root>
	);

	return (
		<ErrorBoundary
			fallback={ error =>
				props.inline ? (
					errorNotice( error )
				) : (
					<Card.Root>
						<Card.Header>
							<Card.Title>{ props.title }</Card.Title>
						</Card.Header>
						<Card.Content>{ errorNotice( error ) }</Card.Content>
					</Card.Root>
				)
			}
		>
			<Module { ...props } />
		</ErrorBoundary>
	);
};
