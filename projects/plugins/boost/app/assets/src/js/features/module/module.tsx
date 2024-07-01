import { ToggleControl } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import { useSingleModuleState } from './lib/stores';
import styles from './module.module.scss';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import { __ } from '@wordpress/i18n';

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
	const [ status, setStatus ] = useSingleModuleState( slug, active => {
		if ( active ) {
			onEnable?.();
		} else {
			onDisable?.();
		}
	} );
	const isModuleActive = status?.active ?? false;
	const isModuleAvailable = status?.available ?? false;

	const handleToggle = () => {
		if ( onBeforeToggle ) {
			onBeforeToggle( ! isModuleActive );
		}
		setStatus( ! isModuleActive );
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
						checked={ isModuleActive }
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
