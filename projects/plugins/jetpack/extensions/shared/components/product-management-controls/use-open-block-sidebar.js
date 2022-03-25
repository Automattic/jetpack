/**
 * WordPress dependencies
 */
import { useDispatch, select } from '@wordpress/data';

export default function useOpenBlockSidebar() {
	const { enableComplementaryArea } = useDispatch( 'core/interface' );
	const isSiteEditor = !! select( 'core/edit-site' );
	const isWidgetsEditor = !! select( 'core/edit-widgets' );

	return () => {
		if ( isSiteEditor ) {
			enableComplementaryArea( 'core/edit-site', 'edit-site/block-inspector' );
			return;
		}
		if ( isWidgetsEditor ) {
			enableComplementaryArea( 'core/edit-widgets', 'edit-widgets/block-inspector' );
			return;
		}
		enableComplementaryArea( 'core/edit-post', 'edit-post/block' );
	};
}
