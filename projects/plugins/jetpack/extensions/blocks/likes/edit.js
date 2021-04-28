/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import '../../../modules/likes/style.css';

const LikesEdit = props => {
	const { className } = props;

	const classes = `${ className } sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded`;

	const onClick = event => {
		event.preventDefault();
	};

	return (
		<div className={ classes }>
			<div class="sd-content wpl-likebox">
				<div class="wpl-button like">
					<a
						href="#"
						onClick={ onClick }
						title={ __( 'Be the first to like this.', 'jetpack' ) }
						class="like sd-button"
						rel="nofollow"
					>
						<span>Like</span>
					</a>
				</div>

				<div class="wpl-count sd-like-count">
					<span class="wpl-count-text">{ __( 'Be the first to like this.', 'jetpack' ) }</span>
				</div>
			</div>
		</div>
	);
};

export default LikesEdit;
