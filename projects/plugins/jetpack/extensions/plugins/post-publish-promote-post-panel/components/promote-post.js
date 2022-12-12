import { getSiteFragment, getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

export function PromotePostButton() {
	const siteFragment = getSiteFragment();

	const wpcomBlogId = getJetpackData().wpcomBlogId;

	const currentPostId = useSelect( select => {
		return select( editorStore ).getCurrentPostId();
	}, [] );

	function openBlazePressWidget() {
		showDSP( siteFragment, wpcomBlogId, currentPostId );
	}

	function showDSP(
		siteSlug,
		siteId,
		postId,
		// onClose: () => void,
		// translateFn: ( value: string, options?: any ) => string,
		domNodeOrId = null
		// setShowCancelButton?: ( show: boolean ) => void
	) {
		if ( window.BlazePress ) {
			window.BlazePress.render( {
				siteSlug: siteSlug,
				domNode: typeof domNodeOrId !== 'string' ? domNodeOrId : undefined,
				domNodeId: typeof domNodeOrId === 'string' ? domNodeOrId : undefined,
				stripeKey:
					'pk_live_51LYYzQF53KN4RFN0ePTwefdm7seki4pRuc4a19gPMGUba5mzuosz0IBR0cp4T57FiBgxK911ky0LNwlX2IHbm0SS00uPHEQNBO',
				apiHost: 'https://public-api.wordpress.com',
				apiPrefix: `/wpcom/v2/sites/${ siteId }/wordads/dsp`,
				// todo fetch rlt somehow
				authToken: 'wpcom-proxy-request',
				template: 'article',
				// onLoaded: () => resolve( true ),
				// onClose: onClose,
				// translateFn: translateFn,
				urn: `urn:wpcom:post:${ siteId }:${ postId || 0 }`,
				// setShowCancelButton: setShowCancelButton,
			} );
		}
	}

	return (
		<>
			<div className="qr-post-button">
				<Button isSecondary onClick={ openBlazePressWidget }>
					{ __( 'Promote Post', 'jetpack' ) }
				</Button>
			</div>
		</>
	);
}
