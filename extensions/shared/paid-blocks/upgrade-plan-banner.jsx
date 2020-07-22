/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getUpgradeUrl } from '../plan-utils';

function redirect( url, callback ) {
	if ( callback ) {
		callback( url );
	}
	window.top.location.href = url;
}

const UpgradePlanBanner = ( {
	checkoutUrl,
	isAutosaveablePost,
	isDirtyPost,
	savePost,
	onRedirect,
	align,
	className,
	title = __( 'Premium Block' ),
	description = __( 'Upgrade your plan to use this premium block' ),
	buttonText = __( 'Upgrade' ),
	blockName,
	visible = true,
} ) => {
	const bannerRef = useRef();

	/*
	 * Hack: Add CSS class to inspector control.
	 * It's used to move the position of the upgrade plan banner
	 * just below of the block card.
	 * It should be updated if https://github.com/WordPress/gutenberg/pull/23993 is merged.
	 */
	useEffect( () => {
		if ( ! bannerRef?.current ) {
			return;
		}
		const inspectorEl = bannerRef.current.closest( '.block-editor-block-inspector' );
		if ( ! inspectorEl ) {
			return;
		}

		inspectorEl.classList.add( `is-${ blockName.replace( '/', '-' ) }-premium-block` );
	}, [ blockName ] );

	if ( ! visible ) {
		return null;
	}

	const goToCheckoutPage = event => {
		if ( ! window?.top?.location?.href ) {
			return;
		}

		event.preventDefault();

		/*
		 * If there are not unsaved values, redirect.
		 * If the post is not autosaveable, redirect.
		 */
		if ( ! isDirtyPost || ! isAutosaveablePost ) {
			// Using window.top to escape from the editor iframe on WordPress.com
			return redirect( checkoutUrl, onRedirect );
		}

		// Save the post, then redirect.
		savePost( event ).then( () => redirect( checkoutUrl, onRedirect ) );
	};

	const cssClasses = classNames( className, 'jetpack-upgrade-plan-banner', `wp-block` );

	return (
		<div ref={ bannerRef } className={ cssClasses } data-align={ align }>
			{ title && <strong className={ `${ className }__title` }>{ title }</strong> }
			{ description && <span className={ `${ className }__description` }>{ description }</span> }
			<Button
				href={ checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
				onClick={ goToCheckoutPage }
				className="is-primary"
				label={ buttonText }
				title={ buttonText }
			>
				{ buttonText }
			</Button>
		</div>
	);
};

export default compose( [
	withSelect( select => {
		const editorSelector = select( 'core/editor' );
		const { id: postId, type: postType } = editorSelector.getCurrentPost();
		const PLAN_SLUG = 'value_bundle';
		const plan = select( 'wordpress-com/plans' ).getPlan( PLAN_SLUG );

		return {
			checkoutUrl: getUpgradeUrl( { plan, PLAN_SLUG, postId, postType } ),
			isAutosaveablePost: editorSelector.isEditedPostAutosaveable(),
			isDirtyPost: editorSelector.isEditedPostDirty(),
		};
	} ),
	withDispatch( dispatch => ( {
		savePost: dispatch( 'core/editor' ).savePost,
	} ) ),
] )( UpgradePlanBanner );
