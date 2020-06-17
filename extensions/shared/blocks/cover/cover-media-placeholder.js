
/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isUpgradable, isVideoFile } from './utils';
import { CoverMediaContext } from './components';

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( ! isUpgradable( name ) ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		const { onError } = props;
		return (
			<div className="jetpack-cover-media-placeholder">
				<CoverMediaContext.Consumer>
					{ ( onFilesUpload ) => (
						<CoreMediaPlaceholder
							{ ...props }
							onFilesPreUpload={ onFilesUpload }
							multiple={ false }
							onError = { ( message ) => {
								// Try to pick up filename from the error message.
								// We should find a better way to do it. Unstable.
								const filename = message?.[0]?.props?.children;
								if ( filename && isVideoFile( filename ) ) {
									return onFilesUpload( [ filename ] );
								}
								return onError( message );
							} }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
						/>
					) }
				</CoverMediaContext.Consumer>
			</div>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
