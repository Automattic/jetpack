import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { SeoPlaceholder } from '../../../../plugins/seo/components/placeholder';
import './style.scss';
import bigSkyIcon from './big-sky-icon.svg';
import SeoAssistantWizard from './seo-assistant-wizard';
import type { SeoAssistantProps } from './types';

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

export default function SeoAssistant( { disabled, onStep }: SeoAssistantProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const postIsEmpty = useSelect( select => select( editorStore ).isEditedPostEmpty(), [] );
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );

	debug( 'rendering seo-assistant entry point' );
	return (
		<div>
			<p>{ __( 'Improve post engagement.', 'jetpack' ) }</p>
			{ ( isModuleActive || isLoadingModules ) && (
				<Button
					onClick={ () => setIsOpen( true ) }
					variant="secondary"
					disabled={ isLoadingModules || isOpen || postIsEmpty || disabled }
					isBusy={ isLoadingModules || isOpen }
				>
					<img src={ bigSkyIcon } alt={ __( 'SEO Assistant icon', 'jetpack' ) } />
					&nbsp;
					{ __( 'SEO Assistant', 'jetpack' ) }
				</Button>
			) }
			{ ! isModuleActive && ! isLoadingModules && (
				<SeoPlaceholder
					isLoading={ isChangingStatus }
					isModuleActive={ isModuleActive }
					changeStatus={ changeStatus }
				/>
			) }
			<SeoAssistantWizard isOpen={ isOpen } onStep={ onStep } close={ () => setIsOpen( false ) } />
		</div>
	);
}
