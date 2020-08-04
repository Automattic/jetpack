/**
 * External dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import Circle from 'react-circle';

/**
 * Internal dependencies
 */
import './editor.scss';

/**
 * Intercepts the registration of the Core Twitter embed block, and adds functionality
 * to check whether the tweet being embedded is the start of a tweetstorm. If it is, offer
 * to import the tweetstorm.
 *
 * @param {object} blockSettings - The settings of the block being registered.
 *
 * @returns {object} The blockSettings, with our extra functionality inserted.
 */
const addTweetstormInfo = blockSettings => {
	// Bail if this is not the Twitter embed block, or if the hook has been triggered by a deprecation.
	if ( 'core/paragraph' !== blockSettings.name || blockSettings.isDeprecation ) {
		return blockSettings;
	}

	const { edit: CoreParagraphEdit } = blockSettings;

	function getProgressColour( characters ) {
		if ( characters < 260 ) {
			return '#007cba';
		} else if ( characters < 280 ) {
			return '#f0b849';
		}

		return '#d94f4f';
	}

	return {
		...blockSettings,
		edit: compose( [
			withSelect( select => ( {
				showInfo: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).jetpack_is_tweetstorm,
			} ) ),
		] )( props => {
			const { showInfo, ...passedProps } = props;
			const { content } = props.attributes;
			const count = content.length;
			const percent = Math.round( ( count / 280 ) * 100 );

			if ( ! showInfo ) {
				return <CoreParagraphEdit { ...passedProps } />;
			}

			if ( count > 280 ) {
				passedProps.attributes.content =
					content.substring( 0, 279 ) +
					'<span class="publicize-twitter__paragraph-count-overage">' +
					content.substring( 279 ) +
					'</span>';
			}

			return (
				<div className="wp-block publicize-twitter__paragraph">
					<div className="publicize-twitter__paragraph-count">
						<div>
							<Circle
								animate={ false }
								lineWidth="50"
								progress={ percent < 100 ? percent : 100 }
								progressColor={ getProgressColour( count ) }
								size="20"
								showPercentage={ false }
							/>
						</div>
					</div>
					<CoreParagraphEdit { ...passedProps } />
				</div>
			);
		} ),
	};
};

addFilter( 'blocks.registerBlockType', 'jetpack/publishing-tweetstorms', addTweetstormInfo );
