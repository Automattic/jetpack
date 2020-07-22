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
	visible = true,
} ) => {
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
		<div className={ cssClasses } data-align={ align }>
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
