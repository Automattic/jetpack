import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { select, select as syncSelect, useSelect, withSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar.js';
import { PromotePostButton } from './components/promote-post.js';
import './editor.scss';
import {
	getSiteFragment,
	isAtomicSite,
	isPrivateSite,
	isSimpleSite,
} from '@automattic/jetpack-shared-extension-utils';

export const name = 'post-publish-promote-post-panel';

/*
*
 * Return information and loader of Backup functioality Capabilities
 *
 * @returns {Object} capabilities, capabilitiesError, capabilitiesLoaded, fetchCapabilities
export default function usePromotePost() {
	// useCapabilities
	const [ capabilities, setCapabilities ] = useState( null );
	const [ connectionStatus ] = useConnection();

	useEffect( () => {
		const connectionLoaded = 0 < Object.keys( connectionStatus ).length;
		if ( ! connectionLoaded ) {
			return;
		}
		let url = 'https://public-api.wordpress.com/rest/v1.1/me?http_envelope=1'
		apiFetch( { path: '/jetpack/v4/backup-capabilities' } ).then(
			res => {
				setCapabilities( res.capabilities );
				setCapabilitiesLoaded( true );
			},
			() => {
				setCapabilitiesLoaded( true );
				if ( ! connectionStatus.isUserConnected ) {
					setCapabilitiesError( 'is_unlinked' );
				} else {
					setCapabilitiesError( 'fetch_capabilities_failed' );
				}
			}
		);
	}, [ connectionStatus ] );

	return {
		capabilities,
		capabilitiesError,
		capabilitiesLoaded,
		hasBackupPlan: Array.isArray( capabilities ) && capabilities.includes( 'backup' ),
	};
}
*/

export const settings = {
	render: function PluginPostPublishPanelPromotePost() {
		const panelBodyProps = {
			name: 'post-publish-promote-post-panel',
			title: __( 'Promote this post', 'jetpack' ),
			className: 'post-publish-promote-post-panel',
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		};
		const isPostPublished = useSelect( select => {
			console.log( select( editorStore ) );
			return select( editorStore ).isCurrentPostPublished();
		}, [] );

		const currentPostType = useSelect( select => {
			console.log( select( editorStore ) );
			return select( editorStore ).getCurrentPostType();
		}, [] );

		const currentPost = useSelect( select => {
			console.log( select( editorStore ) );
			return select( editorStore ).getCurrentPost();
		}, [] );

		const { getMedia, getUser } = select( 'core' );
		const { getCurrentPost, getEditedPostAttribute } = select( 'core/editor' );

		const authorId = useSelect(
			theSelect => theSelect( 'core/editor' ).getEditedPostAttribute( 'author' ),
			[]
		);
		const site = useSelect( theSelect => theSelect( 'core' ).getSite(), [] );
		const user = useSelect( theSelect => theSelect( 'core' ).getUser( authorId ), [] ); // not valid, we still need to call wpcomapi
		const post = useSelect( theSelect => theSelect( 'core/editor' ).getCurrentPost(), [] );
		console.log( authorId );
		console.log( site );
		console.log( post );
		console.log( user );
		if ( user ) {
			debugger;
		}

		/*		const woSite = useSelect( select => {
			console.log( select( coreStore ) );
			const test = select( coreStore );
			const test2 = test.getSite();
			const test3 = test.getUser();

			if ( test2 ) {
				debugger;
			}
			if ( test3 ) {
				debugger;
			}

			return select( coreStore ).isWoASite();
		}, [] );*/

		// const tracksUser = syncSelect( STORE_ID ).getWpcomUser();
		// console.log( tracksUser );

		const test = getSiteFragment();
		const isWPCOMSite = isSimpleSite() || isAtomicSite();

		console.log( 'postTYpe', currentPostType );
		console.log( 'getCurrentPost', currentPost );
		// console.log( 'woSite', woSite );
		console.log( 'test', test );
		console.log( 'isWPCOM', isWPCOMSite );
		// console.log( 'atomicPlatform', atomicPlatform );

		function PromotePostPanelBodyContent() {
			return (
				<>
					<PanelRow>
						<p>
							{ __(
								'Reach a larger audience boosting the content to the WordPress.com community of blogs and sites.',
								'jetpack'
							) }
						</p>
					</PanelRow>
					<PromotePostButton />
				</>
			);
		}

		return (
			<>
				<PluginPostPublishPanel { ...panelBodyProps }>
					<PromotePostPanelBodyContent />
				</PluginPostPublishPanel>

				{ isPostPublished && (
					<JetpackPluginSidebar>
						<PanelBody { ...panelBodyProps }>
							<PromotePostPanelBodyContent />
						</PanelBody>
					</JetpackPluginSidebar>
				) }
			</>
		);
	},
};
