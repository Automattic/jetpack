/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useMetaUpdate from '../../../hooks/use-meta-update';
import { fetchVideoItem } from '../../../lib/fetch-video-item';
import { uploadTrackForGuid } from '../../../lib/video-tracks';
import { isAutogeneratedChapterFile } from '../../../lib/video-tracks';
import { STORE_ID } from '../../../state';
import { VIDEO_PRIVACY_LEVELS } from '../../../state/constants';
import extractVideoChapters from '../../../utils/video-chapters/extract-video-chapters';
import generateChaptersFile from '../../../utils/video-chapters/generate-chapters-file';
import validateChapters from '../../../utils/video-chapters/validate-chapters';
import usePlaybackToken from '../../hooks/use-playback-token';
import usePosterEdit from '../../hooks/use-poster-edit';
import useVideo from '../../hooks/use-video';
/**
 * Types
 */
import type { UploadTrackDataProps } from '../../../lib/video-tracks/types';
import type { RatingProp } from '../../../types';

const debug = debugFactory( 'videopress:use-edit-details' );

const useMetaEdit = ( { videoId, formData, video, updateData } ) => {
	const updateMeta = useMetaUpdate( videoId );

	const isEmpty = value => {
		return value === undefined || value === '';
	};

	const hasFieldChanged = field => {
		const formDataField = formData?.[ field ];
		const videoField = video?.[ field ];
		const isDifferent = formDataField !== videoField;
		return ! ( isEmpty( formDataField ) && isEmpty( videoField ) ) && isDifferent;
	};

	const metaChanged = [
		'title',
		'description',
		'rating',
		'allowDownload',
		'displayEmbed',
	].some( field => hasFieldChanged( field ) );

	const hasPrivacySettingChanged = () => {
		const formDataPrivacySetting = formData?.privacySetting;
		const videoPrivacySetting = video?.privacySetting;
		const isDifferent = formDataPrivacySetting !== VIDEO_PRIVACY_LEVELS[ videoPrivacySetting ];
		return ! ( isEmpty( formDataPrivacySetting ) && isEmpty( videoPrivacySetting ) ) && isDifferent;
	};

	const setTitle = ( title: string ) => {
		updateData( { title } );
	};

	const setDescription = ( description: string ) => {
		updateData( { description } );
	};

	const setPrivacySetting = ( privacySetting: string ) => {
		updateData( { privacySetting } );
	};

	const setRating = ( rating: RatingProp ) => {
		updateData( { rating } );
	};

	const setAllowDownload = ( allowDownload: number ) => {
		updateData( { allowDownload } );
	};

	const setDisplayEmbed = ( displayEmbed: number ) => {
		updateData( { displayEmbed } );
	};

	const handleMetaUpdate = () => {
		return new Promise( ( resolve, reject ) => {
			if ( metaChanged ) {
				updateMeta( formData ).then( resolve ).catch( reject );
			} else {
				resolve( null );
			}
		} );
	};

	return {
		setTitle,
		setDescription,
		setPrivacySetting,
		setRating,
		setAllowDownload,
		setDisplayEmbed,
		handleMetaUpdate,
		metaChanged,
		hasFieldChanged,
		hasPrivacySettingChanged,
	};
};

export default () => {
	const history = useHistory();
	const dispatch = useDispatch( STORE_ID );
	const { isRegistered } = useConnection();

	if ( ! isRegistered ) {
		history.push( '/' );
	}

	const { videoId: videoIdFromParams } = useParams();
	const videoId = Number( videoIdFromParams );
	const { data: video, isFetching, processing, isDeleting, updateVideoPrivacy } = useVideo(
		Number( videoId )
	);

	const { playbackToken, isFetchingPlaybackToken } = usePlaybackToken( video );

	const [ libraryAttachment, setLibraryAttachment ] = useState( null );
	const [ posterImageSource, setPosterImageSource ] = useState<
		'default' | 'video' | 'upload' | null
	>( null );

	const [ updating, setUpdating ] = useState( false );
	const [ updated, setUpdated ] = useState( false );
	const [ deleted, setDeleted ] = useState( false );
	const [ formData, setFormData ] = useState( {
		title: video?.title,
		description: video?.description,
		privacySetting: VIDEO_PRIVACY_LEVELS[ video?.privacySetting ],
		rating: video?.rating,
		allowDownload: video?.allowDownload,
		displayEmbed: video?.displayEmbed,
	} );

	const updateData = newData => {
		setFormData( current => ( { ...current, ...newData } ) );
	};

	const {
		selectedTime,

		updatePosterImageFromFrame,

		selectAttachmentFromLibrary,
		updatePosterImageFromLibrary,
		...posterEditData
	} = usePosterEdit( { video } );
	const {
		metaChanged,
		handleMetaUpdate,
		hasFieldChanged,
		hasPrivacySettingChanged,
		...metaEditData
	} = useMetaEdit( {
		videoId,
		video,
		formData,
		updateData,
	} );

	useEffect( () => {
		if ( selectedTime == null ) {
			return;
		}

		setPosterImageSource( 'video' );
	}, [ selectedTime ] );

	const hasChanges =
		metaChanged || selectedTime != null || libraryAttachment != null || hasPrivacySettingChanged();

	const selectPosterImageFromLibrary = async () => {
		const attachment = await selectAttachmentFromLibrary();

		if ( attachment ) {
			setLibraryAttachment( attachment );
			setPosterImageSource( 'upload' );
		}
	};

	const handleChaptersUpdate = async () => {
		if ( hasFieldChanged( 'description' ) ) {
			const chapters = extractVideoChapters( formData.description );

			if ( formData.description.length && validateChapters( chapters ) ) {
				debug( 'Autogenerated chapters detected. Processing...' );
				let isAutogenerated = false;

				try {
					// Check for uploaded tracks.
					const response = await fetchVideoItem( {
						guid: video.guid,
						isPrivate: video.isPrivate,
					} );
					const chapterFileUrl = response?.tracks?.chapters?.en?.src;
					const hasChapterFile = typeof chapterFileUrl === 'string';

					if ( hasChapterFile ) {
						const chapterUrl = `https://videos.files.wordpress.com/${ video.guid }/${ chapterFileUrl }`;

						isAutogenerated = await isAutogeneratedChapterFile( chapterUrl, {
							guid: video.guid,
							isPrivate: video.isPrivate,
						} );

						debug(
							'Chapter %o detected. Overwritable: %o',
							chapterFileUrl,
							isAutogenerated ? 'yes' : 'no'
						);
					} else {
						debug( 'Allow overwrite chapter: File does not exist' );
					}

					if ( ! hasChapterFile || isAutogenerated ) {
						const track: UploadTrackDataProps = {
							label: __( 'English (auto-generated)', 'jetpack-videopress-pkg' ),
							srcLang: 'en',
							kind: 'chapters',
							tmpFile: generateChaptersFile( formData.description ),
						};

						debug( 'Autogenerated track: %o', track );
						return uploadTrackForGuid( track, video.guid );
					}
				} catch ( error ) {
					debug( 'Error on chapters processing', error );
				}
			}
		}

		return null;
	};

	const handleSaveChanges = () => {
		setUpdating( true );

		const promises = [ handleMetaUpdate(), handleChaptersUpdate() ];

		if ( posterImageSource === 'video' ) {
			promises.push( updatePosterImageFromFrame() );
		} else if ( posterImageSource === 'upload' ) {
			promises.push( updatePosterImageFromLibrary( libraryAttachment.id ) );
		}

		if ( hasFieldChanged( 'privacySetting' ) ) {
			promises.push( updateVideoPrivacy( formData.privacySetting ) );
		}

		// TODO: handle errors
		Promise.allSettled( promises ).then( () => {
			const videoData = { ...video, ...formData };
			// posterImage already set by the action
			delete videoData.posterImage;

			// privacySetting already set by the action
			delete videoData.privacySetting;

			setUpdating( false );
			dispatch?.setVideo( videoData );
			setUpdated( true );
		} );
	};

	const handleDelete = () => {
		setDeleted( true );
	};

	// Update the data when user enter directly to the edit page
	// This moment we fetch the video data and update after fetching

	const initialLoading =
		isFetching && formData?.title === undefined && formData?.description === undefined;

	useEffect( () => {
		let mounted = true;

		if ( ! initialLoading && mounted ) {
			setFormData( {
				title: video?.title,
				description: video?.description,
				privacySetting: VIDEO_PRIVACY_LEVELS[ video?.privacySetting ],
				rating: video?.rating,
				allowDownload: video?.allowDownload,
				displayEmbed: video?.displayEmbed,
			} );
		}

		// Avoid updating state if component is unmounted
		// From: https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies
		return () => {
			mounted = false;
		};
	}, [ initialLoading ] );

	return {
		playbackToken,
		isFetchingPlaybackToken,
		...video,
		...formData, // formData is the local representation of the video
		hasChanges,
		posterImageSource,
		libraryAttachment,
		selectPosterImageFromLibrary,
		handleSaveChanges,
		handleDelete,
		isFetching,
		processing,
		isDeleting,
		updating,
		updated,
		deleted,
		selectedTime,
		...metaEditData,
		...posterEditData,
	};
};
