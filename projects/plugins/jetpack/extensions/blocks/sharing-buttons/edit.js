/**
 * External dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { Placeholder, withNotices } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, useState, useContext, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SocialButton from './components/SocialButton';
import SharingButtonsContext from './context';
import './editor.scss';

function SharingButtonsEdit({ attributes, className, noticeOperations, noticeUI, setAttributes }) {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	const [notice, setNotice] = useState();

	const { post } = useSelect(
		select => {
			const { getCurrentPost } = select('core/editor');
			return {
				post: getCurrentPost(),
			};
		},
		[attributes]
	);

	useEffect(() => {
		setAttributes({ link: post.link });
	}, [post, setAttributes]);

	return (
		<div className={className}>
			<SharingButtonsContext.Provider
				value={{
					post,
				}}
			>
				<div className="wp-block-jetpack-sharing-buttons">
					<div className="cool_sharing_elements">
						<div className="sharedaddy sd-sharing-enabled">
							<div className="robots-nocontent sd-block sd-social sd-social-icon-text sd-sharing">
								<h3 className="sd-title">Share this:</h3>

								<div className="sd-content">
									<ul>
										<li>
											<SocialButton service="facebook" />
										</li>
										<li>
											<SocialButton service="twitter" />
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</SharingButtonsContext.Provider>
			<Instructions />
		</div>
	);
}

function Instructions() {
	return createInterpolateElement(
		__('Customize your sharing settings via <a>Jetpack Sharing Settings</a>', 'jetpack'),
		{
			a: <a href="/wp-admin/admin.php?page=jetpack#/sharing" target="_blank" />,
		}
	);
}

export default SharingButtonsEdit;
