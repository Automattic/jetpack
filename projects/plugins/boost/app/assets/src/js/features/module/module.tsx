import { ToggleControl } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import { useModuleState } from './lib/stores';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import styles from './module.module.scss';

type ModuleProps = {
	title: React.ReactNode;
	description: React.ReactNode;
	children?: React.ReactNode;
	slug: string;
	toggle?: boolean;
	onEnable?: () => void;
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
	onDisable,
	onMountEnable,
}: ModuleProps ) => {
	const [ status, setStatus ] = useModuleState( slug );
	const isModuleActive = status?.active ?? false;
	const isModuleAvailable = status?.available ?? false;

	const handleToggle = () => {
		setStatus( ! isModuleActive, {
			onEnable,
			onDisable,
		} );
	};

	useEffect( () => {
		if ( isModuleActive ) {
			onMountEnable?.();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	if ( ! isModuleAvailable && slug !== 'lazy_images' ) {
		return null;
	}

	return (
		<div className={ styles.module }>
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
		<DataSyncProvider>
			<Module { ...props } />
		</DataSyncProvider>
	);
};
