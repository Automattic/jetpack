import { useSelect } from '@wordpress/data';
import extractVideoChapters from '../../../plugins/video-chapters/utils/extract-video-chapters';

export default ( { videoPressBlockId } ) => {
	const blocks = useSelect( select => select( 'core/block-editor' ).getBlocks() );
	const currentBlock = blocks
		.filter( block => block.name === 'videopress/video' )
		.find( block => block.attributes.uid === videoPressBlockId );

	const description = currentBlock?.attributes?.description;

	const chapters = extractVideoChapters( description );

	return chapters.map( chapter => ( {
		chapter: chapter.title,
		time: chapter.startAt,
	} ) );
};
