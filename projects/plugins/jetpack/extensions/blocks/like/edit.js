import { isSimpleSite, isAtomicSite } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, ToggleControl, PanelBody } from '@wordpress/components';
import { useEffect, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import useFetchReblogSetting from './use-fetch-reblog-setting';
import useSetReblogSetting from './use-set-reblog-setting';
import './editor.scss';

function LikeEdit() {
	const blockProps = useBlockProps();
	const blogId = window?.Jetpack_LikeBlock?.blog_id;

	const {
		fetchReblog,
		reblogSetting: currentReblogSetting,
		isLoading: fetchingReblog,
	} = useFetchReblogSetting( blogId );
	const {
		setReblog,
		success: reblogSetSuccessfully,
		resetSuccess: clearReblogSetStatus,
		isLoading: settingReblog,
	} = useSetReblogSetting( blogId );

	const handleReblogSetting = newValue => {
		setReblog( newValue );
	};

	useEffect( () => {
		if ( ! isSimpleSite() ) {
			return;
		}
		fetchReblog();
	}, [ fetchReblog ] );

	useEffect( () => {
		if ( ! isSimpleSite() ) {
			return;
		}

		if ( reblogSetSuccessfully ) {
			fetchReblog();
			clearReblogSetStatus();
		}
	}, [ reblogSetSuccessfully, fetchReblog, clearReblogSetStatus ] );

	const learnMoreUrl =
		isAtomicSite() || isSimpleSite()
			? 'https://wordpress.com/support/likes/'
			: 'https://jetpack.com/support/likes/';

	const showReblogButton = currentReblogSetting;

	// These A12s gave their permission to use their gravatars.
	const gravatarHashes = [
		'7fdcad31a04def0ab9583af475c9036c',
		'4d346581a3340e32cf93703c9ce46bd4',
		'c0ccdd53794779bcc07fcae7b79c4d80',
		'0619d4de8aef78c81b2194ff1d164d85',
		'b3618d70c63bbc5cc7caee0beded5ff0',
	];

	const preventDefault = event => event.preventDefault();

	return (
		<div { ...blockProps }>
			<InspectorControls key="like-inspector">
				<div className="wp-block-jetpack-like__learn-more">
					<ExternalLink href={ learnMoreUrl }>{ __( 'Learn more', 'jetpack' ) }</ExternalLink>
				</div>
				{ isSimpleSite() && (
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show reblog button', 'jetpack' ) }
							checked={ currentReblogSetting }
							disabled={ settingReblog || fetchingReblog }
							onChange={ newValue => {
								handleReblogSetting( newValue );
							} }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<div className="wpl-likebox wpl-new-layout">
				{ showReblogButton && (
					<div className="wpl-button reblog">
						<a
							href="#"
							title={ __( 'Reblog this post on your main site.', 'jetpack' ) }
							className="reblog sd-button"
							rel="nofollow"
						>
							<span>{ __( 'Reblog', 'jetpack' ) }</span>
						</a>
					</div>
				) }
				<div className="wpl-button like">
					<a href="#" className="sd-button like" rel="nofollow" onClick={ preventDefault }>
						<span>{ __( 'Like', 'jetpack' ) }</span>
					</a>
				</div>
				<ul className="wpl-avatars">
					{ gravatarHashes.map( gravatarHash => (
						<li key={ gravatarHash } className="wp-liker-me">
							<a className="wpl-liker" href="#" rel="nofollow" onClick={ preventDefault }>
								<img
									src={ `https://0.gravatar.com/avatar/${ gravatarHash }` }
									className="avatar avatar-30"
									width={ 30 }
									height={ 30 }
									alt=""
								/>
							</a>
						</li>
					) ) }
				</ul>
				<div className="wpl-count">
					<span className="wpl-count-text">
						<a href="#" onClick={ preventDefault }>
							{ createInterpolateElement(
								sprintf(
									// translators: %$1s: Number of likes
									__( '<span>%1$d</span> likes', 'jetpack' ),
									gravatarHashes.length
								),
								{
									span: <span className="wpl-count-number"></span>,
								}
							) }
						</a>
					</span>
				</div>
			</div>
		</div>
	);
}

export default LikeEdit;
