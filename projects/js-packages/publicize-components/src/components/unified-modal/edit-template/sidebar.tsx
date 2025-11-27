import { SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSocialImageFontOptions } from '../../../hooks/use-social-image-font-options';
import styles from './styles.module.scss';
import { LocalState } from './types';

type SidebarProps = {
	setLocalState: ( localState: LocalState ) => void;
	localState: LocalState;
};

/**
 * Sidebar component for the edit template modal.
 *
 * @param {SidebarProps} props - The component props.
 * @return - Sidebar component.
 */
export function Sidebar( { localState, setLocalState }: SidebarProps ) {
	const updateLocalField = useCallback(
		( field: keyof LocalState ) => ( value: LocalState[ typeof field ] ) => {
			const newLocalState = { ...localState, [ field ]: value };
			setLocalState( newLocalState );
		},
		[ localState, setLocalState ]
	);
	const { isLoading: isLoadingFontOptions, fontOptions } = useSocialImageFontOptions();

	return (
		<div className={ styles.sidebar }>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Font', 'jetpack-publicize-components' ) }
				value={ localState.font ?? '' }
				disabled={ isLoadingFontOptions }
				options={ fontOptions }
				onChange={ updateLocalField( 'font' ) }
			/>
		</div>
	);
}
