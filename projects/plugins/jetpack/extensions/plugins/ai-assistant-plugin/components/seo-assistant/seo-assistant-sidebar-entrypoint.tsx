/**
 * External dependencies
 */
import { useModuleStatus, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { SeoPlaceholder } from '../../../../plugins/seo/components/placeholder';
import bigSkyIcon from './big-sky-icon.svg';
import { store as seoAssistantStore } from './store';
/**
 * Types
 */
import type { SeoAssistantSelect, SeoAssistantDispatch } from './types';

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

export default function SeoAssistant( { disabled, placement } ) {
	const postIsEmpty = useSelect( select => select( editorStore ).isEditedPostEmpty(), [] );
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );
	const { tracks } = useAnalytics();

	const isOpen = useSelect(
		select => ( select( seoAssistantStore ) as SeoAssistantSelect ).isOpen(),
		[]
	);
	const { open } = useDispatch( seoAssistantStore ) as SeoAssistantDispatch;

	const handleOpen = useCallback( () => {
		tracks.recordEvent( 'jetpack_wizard_chat_open', {
			placement,
			assistant_name: 'seo-assistant',
		} );
		open();
	}, [ placement, tracks, open ] );

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
		</div>
	);
}
