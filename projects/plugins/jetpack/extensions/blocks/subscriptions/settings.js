// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { Button, PanelRow, Dropdown, VisuallyHidden } from '@wordpress/components';
import { compose, useInstanceId } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { PostVisibilityCheck } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Visibility options for Newsletter settings
 */
const visibilityOptions = {
	public: {
		label: __( 'Public', 'jetpack' ),
		info: __( 'Visible to everyone', 'jetpack' ),
	},
	paid_members_only: {
		label: __( 'Subscribers', 'jetpack' ),
		info: __( 'Visible to only subscribers', 'jetpack' ),
	},
	nobody: {
		label: __( 'Private', 'jetpack' ),
		info: __( 'Visible to only admins and editors', 'jetpack' ),
	},
};

function SubscriptionPostSettings( { postMeta, setPostMeta } ) {
	const visibilityKey = postMeta._newsletter_visibility ?? 'public';
	const visibilityLabel = visibilityOptions[ visibilityKey ]?.label ?? 'Public';

	return (
		<>
			<PanelRow>
				<PostVisibilityCheck
					render={ ( { canEdit } ) => (
						<PanelRow className="edit-post-post-visibility">
							<span>{ __( 'Audience', 'jetpack' ) }</span>
							{ ! canEdit && <span>{ visibilityLabel }</span> }
							{ canEdit && (
								<Dropdown
									position="bottom left"
									contentClassName="edit-post-post-visibility__dialog"
									focusOnMount
									renderToggle={ ( { isOpen, onToggle } ) => (
										<Button
											isTertiary
											onClick={ onToggle }
											aria-expanded={ isOpen }
											aria-label={ sprintf(
												// translators: %s: Current newsletter post visibility.
												__( 'Select auudience: %s', 'jetpack' ),
												visibilityLabel
											) }
										>
											{ visibilityLabel }
										</Button>
									) }
									renderContent={ ( { onClose } ) => (
										<PostVisibility
											onClose={ onClose }
											visibility={ visibilityKey }
											setPostMeta={ setPostMeta }
										/>
									) }
								/>
							) }
						</PanelRow>
					) }
				/>
			</PanelRow>
		</>
	);
}

function PostVisibility( { visibility, setPostMeta, onClose } ) {
	const instanceId = useInstanceId( PostVisibility );
	const hanldeOnClick = event => {
		setPostMeta( { _newsletter_visibility: event?.target?.value } );
	};

	return (
		<div className="editor-post-visibility">
			<InspectorPopoverHeader
				title={ __( 'Audience', 'jetpack' ) }
				help={ __( 'Control how this newsletter is viewed.', 'jetpack' ) }
				onClose={ onClose }
			/>
			<fieldset className="editor-post-visibility__fieldset">
				<VisuallyHidden as="legend">{ __( 'Audience', 'jetpack' ) } </VisuallyHidden>
				{ Object.keys( visibilityOptions ).map( key => (
					<PostVisibilityChoice
						instanceId={ instanceId }
						key={ key }
						value={ key }
						label={ visibilityOptions[ key ].label }
						info={ visibilityOptions[ key ].info }
						checked={ key === visibility }
						onChange={ hanldeOnClick }
					/>
				) ) }
			</fieldset>
		</div>
	);
}

function PostVisibilityChoice( { instanceId, value, label, info, ...props } ) {
	return (
		<div className="editor-post-visibility__choice">
			<input
				type="radio"
				name={ `editor-post-visibility__setting-${ instanceId }` }
				value={ value }
				id={ `editor-post-${ value }-${ instanceId }` }
				aria-describedby={ `editor-post-${ value }-${ instanceId }-description` }
				className="editor-post-visibility__radio"
				{ ...props }
			/>
			<label
				htmlFor={ `editor-post-${ value }-${ instanceId }` }
				className="editor-post-visibility__label"
			>
				{ label }
			</label>
			<p
				id={ `editor-post-${ value }-${ instanceId }-description` }
				className="editor-post-visibility__info"
			>
				{ info }
			</p>
		</div>
	);
}

export default compose( [
	withSelect( select => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) ),
	withDispatch( dispatch => ( {
		setPostMeta( newMeta ) {
			dispatch( 'core/editor' ).editPost( { meta: newMeta } );
		},
	} ) ),
] )( SubscriptionPostSettings );
