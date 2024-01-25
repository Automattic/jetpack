import { ToggleControl } from '@automattic/jetpack-components';
import { useEffect } from 'react';
import { useSingleModuleState } from './lib/stores';
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
	const [ status, setActive ] = useSingleModuleState( slug, active => {
		if ( active ) {
			onEnable?.();
		} else {
			onDisable?.();
		}
	} );
	const isModuleActive = status?.active ?? false;
	const isModuleAvailable = status?.available ?? false;

	const handleToggle = () => {
		setActive( ! isModuleActive );
	};

	useEffect( () => {
		if ( isModuleActive ) {
			onMountEnable?.();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Don't show unavailable modules
	if ( ! isModuleAvailable ) {
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

export default Module;
