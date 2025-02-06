import { ToggleControl } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import { useSingleModuleState } from './lib/stores';
import styles from './module.module.scss';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import { __ } from '@wordpress/i18n';
import { isWoaHosting } from '$lib/utils/hosting';
import { useNotices } from '$features/notice/context';

type ModuleProps = {
	title: React.ReactNode;
	description: React.ReactNode;
	children?: React.ReactNode;
	slug: string;
	toggle?: boolean;
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
	onEnable,
	onBeforeToggle,
	onDisable,
	onMountEnable,
}: ModuleProps ) => {
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

	return (
		<div className={ styles.module } data-testid={ `module-${ slug }` }>
			<div className={ styles.toggle }>
				{ toggle && (
					<ToggleControl
						className={ `jb-feature-toggle-${ slug }` }
						size="small"
						checked={ isModuleActive || isFakeActive }
						disabled={ ! isModuleAvailable }
						onChange={ handleToggle }
					/>
				) }
			</div>

			<div className={ styles.content }>
				<h3>{ title }</h3>

				<div className={ styles.description }>{ description }</div>

				{ isModuleActive && children }
			</div>
		</div>
	);
};

export default ( props: ModuleProps ) => {
	return (
		<ErrorBoundary
			fallback={
				<div>
					<div className={ styles.content }>
						<h3>{ props.title }</h3>

						<div className={ styles.description }>
							{ __( `Failed to load module.`, 'jetpack-boost' ) }
						</div>
					</div>
				</div>
			}
		>
			<Module { ...props } />
		</ErrorBoundary>
	);
};
