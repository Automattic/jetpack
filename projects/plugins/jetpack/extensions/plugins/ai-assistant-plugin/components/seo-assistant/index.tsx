import { useModuleStatus, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { SeoPlaceholder } from '../../../../plugins/seo/components/placeholder';
import './style.scss';
import bigSkyIcon from './big-sky-icon.svg';
import SeoAssistantWizard from './seo-assistant-wizard';

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

export default function SeoAssistant( { disabled, placement } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const postIsEmpty = useSelect( select => select( editorStore ).isEditedPostEmpty(), [] );
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );
	const { tracks } = useAnalytics();

	const handleOpen = useCallback( () => {
		tracks.recordEvent( 'jetpack_seo_assistant_open', { placement } );
		setIsOpen( true );
	}, [ placement, tracks ] );
	const handleClose = useCallback( () => setIsOpen( false ), [] );

	debug( 'rendering seo-assistant entry point' );
	return (
		<div>
			<p>{ __( 'Improve post engagement.', 'jetpack' ) }</p>
			{ ( isModuleActive || isLoadingModules ) && (
				<Button
					onClick={ handleOpen }
					variant="secondary"
					disabled={ isLoadingModules || isOpen || postIsEmpty || disabled }
				>
					<img src={ bigSkyIcon } alt={ __( 'SEO Assistant icon', 'jetpack' ) } />
					&nbsp;
					{ __( 'Optimize with AI', 'jetpack' ) }
				</Button>
			) }
			{ ! isModuleActive && ! isLoadingModules && (
				<SeoPlaceholder
					isLoading={ isChangingStatus }
					isModuleActive={ isModuleActive }
					changeStatus={ changeStatus }
				/>
			) }
			{ isOpen && <SeoAssistantWizard close={ handleClose } /> }
		</div>
	);
}
