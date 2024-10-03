import apiFetch from '@wordpress/api-fetch';
import {
	SelectControl,
	Button,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Spinner,
	withNotices,
} from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useState, useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { dataPhotos } from './data';
import { getTopicsElementsFormat } from './utils';
import './styles.module.scss';

// source "data" definition

// "defaultLayouts" definition
const primaryField = 'id';
const mediaField = 'img_src';

const defaultLayouts = {
	table: {
		layout: {
			primaryField,
		},
	},
	grid: {
		layout: {
			primaryField,
			mediaField,
		},
	},
};

// "fields" definition
const fields = [
	{
		id: 'img_src',
		label: __( 'Image', 'jetpack-protect' ),
		render: ( { item } ) => <img alt={ item.alt_description } src={ item.urls.thumb } />,
		enableSorting: false,
	},
	{
		id: 'id',
		label: __( 'ID', 'jetpack-protect' ),
		enableGlobalSearch: true,
	},
	{
		id: 'author',
		label: __( 'Author', 'jetpack-protect' ),
		getValue: ( { item } ) => `${ item.user.first_name } ${ item.user.last_name }`,
		render: ( { item } ) => (
			<a target="_blank" href={ item.user.url } rel="noreferrer">
				{ item.user.first_name } { item.user.last_name }
			</a>
		),
		enableGlobalSearch: true,
	},
	{
		id: 'alt_description',
		label: __( 'Description', 'jetpack-protect' ),
		enableGlobalSearch: true,
	},
	{
		id: 'topics',
		label: __( 'Topics', 'jetpack-protect' ),
		elements: getTopicsElementsFormat( dataPhotos ),
		render: ( { item } ) => {
			return (
				<div className="topic_photos">
					{ item.topics.map( topic => (
						<span key={ topic } className="topic_photo_item">
							{ topic.toUpperCase() }
						</span>
					) ) }
				</div>
			);
		},
		filterBy: {
			operators: [ 'isAny', 'isNone', 'isAll', 'isNotAll' ],
		},
		enableSorting: false,
	},
	{
		id: 'width',
		label: __( 'Width', 'jetpack-protect' ),
		getValue: ( { item } ) => parseInt( item.width ),
		enableSorting: true,
	},
	{
		id: 'height',
		label: __( 'Height', 'jetpack-protect' ),
		getValue: ( { item } ) => parseInt( item.height ),
		enableSorting: true,
	},
];
const ThreatsDataViews = withNotices( ( { noticeOperations, noticeUI } ) => {
	const { createNotice } = noticeOperations;

	const [ isUploadingItems, setIsUploadingItems ] = useState( [] );

	// "view" and "setView" definition
	const [ view, setView ] = useState( {
		type: 'table',
		perPage: 10,
		layout: defaultLayouts.table.layout,
		fields: [ 'img_src', 'id', 'alt_description', 'author', 'topics', 'width', 'height' ],
	} );

	// "processedData" and "paginationInfo" definition
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( dataPhotos, view, fields );
	}, [ view ] );

	const onSuccessMediaUpload = oImageUploaded => {
		const title = oImageUploaded.title.rendered;
		setIsUploadingItems( prevIsUploadingItems =>
			prevIsUploadingItems.filter( slugLoading => slugLoading !== title )
		);

		createNotice( {
			status: 'success',
			// translators: %s is the image title
			content: `${ title }.jpg ` + __( 'succesfully uploaded to Media Library', 'jetpack-protect' ),
			isDismissible: true,
		} );
	};

	const onErrorMediaUpload = () => {
		setIsUploadingItems( [] );
		createNotice( {
			status: 'error',
			content: __( 'An error occurred!', 'jetpack-protect' ),
			isDismissible: true,
		} );
	};

	// "actions" definition
	const actions = [
		{
			id: 'upload-media',
			label: __( 'Upload Media', 'jetpack-protect' ),
			isPrimary: true,
			icon: 'upload',
			supportsBulk: true,
			callback: images => {
				window.scrollTo( 0, 0 );
				images.forEach( async image => {
					setIsUploadingItems( prevIsUploadingItems => [ ...prevIsUploadingItems, image.slug ] );

					// 1- Download the image and convert it to a blob
					const responseRequestImage = await fetch( image.urls.raw );
					const blobImage = await responseRequestImage.blob();

					// 2- Create FormData with the image blob
					const formDataWithImage = new FormData();
					formDataWithImage.append( 'file', blobImage, `${ image.slug }.jpg` );

					// 3- Send the request to the WP REST API with apiFetch
					await apiFetch( {
						path: '/wp/v2/media',
						method: 'POST',
						body: formDataWithImage,
					} )
						.then( onSuccessMediaUpload )
						.catch( onErrorMediaUpload );
				} );
			},
		},
		{
			id: 'see-original',
			label: __( 'See Original', 'jetpack-protect' ),
			modalHeader: __( 'See Original Image', 'jetpack-protect' ),
			RenderModal: ( { items: [ item ], closeModal } ) => {
				const [ size, setSize ] = useState( 'raw' );
				const handleClick = useCallback( () => {
					closeModal();
					window.open( item.urls[ size ], '_blank' );
				}, [ closeModal, item, size ] );

				return (
					<VStack spacing="5">
						<Text>{ `Select the size you want to open for "${ item.slug }"` }</Text>
						<HStack justify="left">
							<SelectControl
								__nextHasNoMarginBottom
								label="Size"
								value={ size }
								options={ Object.keys( item.urls )
									.filter( url => url !== 'small_s3' )
									.map( url => ( {
										label: url,
										value: url,
									} ) ) }
								onChange={ setSize }
							/>
						</HStack>
						<HStack justify="right">
							<Button __next40pxDefaultSize variant="primary" onClick={ handleClick }>
								Open image from original location
							</Button>
						</HStack>
					</VStack>
				);
			},
		},
	];
	return (
		<>
			{ !! isUploadingItems.length && <Spinner /> }
			{ noticeUI }
			<DataViews
				data={ processedData }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				defaultLayouts={ defaultLayouts }
				actions={ actions }
				paginationInfo={ paginationInfo }
			/>
		</>
	);
} );

export default ThreatsDataViews;
