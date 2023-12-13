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

	// TODO: Remove true at the end
	const showReblogButton = currentReblogSetting || true;

	// TODO: Replace the names & images with something else
	const likers = [
		{
			name: 'Yan Sern',
			imageUrl:
				'https://1.gravatar.com/avatar/73dd953a7aa0d5e1c623cdb1ee2bb73575a29649264be20064188d9a952e9cde?s=96&d=identicon&r=G',
		},
		{
			name: 'Veselin',
			imageUrl:
				'https://2.gravatar.com/avatar/5f0ee9d86c04bc37653bb6adfeba93e6d5b57f2356d32c06fd2de25ad4adfbe6?s=96&d=identicon&r=G',
		},
		{
			name: 'Mikael Korpela',
			imageUrl:
				'https://2.gravatar.com/avatar/8337f2645519be33dbb5497e73ed4dcb2a69ca9eee8486c774db5bb95d41b019?s=96&d=identicon&r=G',
		},
		{
			name: 'Dale du Preez',
			imageUrl:
				'https://2.gravatar.com/avatar/e41b9ac486d96628e9667c1c302829fa93cb80254f3812cb453e62b0fa526a24?s=96&d=identicon&r=G',
		},
		{
			name: 'Jeffikus',
			imageUrl:
				'https://1.gravatar.com/avatar/1a939a5d268b9c93805dda20d80cd49941b29bfa70539f5e8e57d57523254c92?s=96&d=identicon&r=G',
		},
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
					{ likers.map( ( liker, i ) => (
						<li key={ `liker-${ i }` } className="wp-liker-me">
							<a
								className="wpl-liker"
								href="#"
								title={ liker.name }
								rel="nofollow"
								onClick={ preventDefault }
							>
								<img
									src={ liker.imageUrl }
									className="avatar avatar-30"
									alt={ liker.name }
									width={ 30 }
									height={ 30 }
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
									likers.length
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
