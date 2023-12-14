import { ToggleControl } from '@automattic/jetpack-components';
import styles from './module.module.scss';
import { useEffect } from 'react';

type ModuleProps = {
	title: string;
	description: React.ReactNode;
	children: React.ReactNode;
	slug: string;
	toggle?: boolean;
	onEnable?: () => void;
	onDisable?: () => void;
	onMountEnabled?: () => void;
};

const defaultCallback = () => {};

const Module = ( {
	title,
	description,
	children,
	slug,
	toggle = true,
	onEnable = defaultCallback,
	onDisable = defaultCallback,
	onMountEnabled: _onMountEnabled = defaultCallback,
}: ModuleProps ) => {
	const isModuleActive = true;
	const isModuleAvailable = true;
	const handleToggle = () => {};

	// TODO: If the module is active at the time of mounting, call onMountEnabled.

	// Call onEnable and onDisable when the toggle is changed.
	useEffect( () => {
		if ( isModuleActive ) {
			onEnable();
		} else {
			onDisable();
		}
	}, [ isModuleActive, onEnable, onDisable ] );

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
