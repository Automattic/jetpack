import { getRedirectUrl } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import { useSingleModuleState } from './lib/stores';
import styles from './module.module.scss';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import { __ } from '@wordpress/i18n';
import { isAtomicPlatform } from '$lib/utils/hosting';
import { useNotices } from '$features/notice/context';
import { createInterpolateElement } from '@wordpress/element';
import { Notice, Link } from '@wordpress/ui';
import Pill from '$features/ui/pill/pill';
import ModuleRow from './module-row';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { ReactNode } from 'react';

type ModuleProps = {
	title: ReactNode;
	description: ReactNode;
	children?: ReactNode;
	slug: string;
	toggle?: boolean;
	worksOffline?: boolean;
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
	// When the Atomic platform's own cache makes Page Cache unavailable, show the module as active.
	const isFakeActive = ! isModuleAvailable && isAtomicPlatform() && slug === 'page_cache';

	const showOfflineMessage = ! site.online && ! worksOffline;
	const offlineMessage = (
		<Notice.Root intent="warning">
			<Notice.Description>
				<div className={ styles.offlineMessage }>
					{ __(
						'This module will not work while your website is not publicly available.',
						'jetpack-boost'
					) }
				</div>
			</Notice.Description>
		</Notice.Root>
	);

	const handleToggle = () => {
		const newState = ! isModuleActive;
		recordBoostEvent( 'module_toggle_clicked', { module: slug, status: newState ? 'on' : 'off' } );
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

	const label = (
		<>
			{ title }
			{ Jetpack_Boost.developmentFeatures.includes( slug ) && (
				<Pill text={ __( 'Under Development', 'jetpack-boost' ) } variant="red" />
			) }
		</>
	);
	const extras = showOfflineMessage ? offlineMessage : isModuleActive && children;

	return (
		<ModuleRow
			testId={ `module-${ slug }` }
			label={ label }
			description={ description }
			toggle={
				toggle
					? {
							className: `jb-feature-toggle-${ slug }`,
							checked: isModuleActive || isFakeActive,
							disabled: ! isModuleAvailable,
							onChange: handleToggle,
						}
					: undefined
			}
		>
			{ extras }
		</ModuleRow>
	);
};

const FailedModuleNotice = ( { error }: { error: Error } ) => (
	<Notice.Root intent="error">
		<Notice.Title>{ __( 'Failed to load module', 'jetpack-boost' ) }</Notice.Title>
		<Notice.Description>
			<p>
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
				) }
			</p>
			<code>{ `${ error.constructor.name }: ${ error.message }` }</code>
		</Notice.Description>
	</Notice.Root>
);

const ModuleWithErrorBoundary = ( props: ModuleProps ) => (
	<ErrorBoundary
		fallback={ error => (
			<ModuleRow label={ props.title } description={ <FailedModuleNotice error={ error } /> } />
		) }
	>
		<Module { ...props } />
	</ErrorBoundary>
);

export default ModuleWithErrorBoundary;
