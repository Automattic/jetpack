/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const mockAnswer = {
	response:
		'To add a new block, you can click on the <strong>+</strong> button (called the <a href="http://en.support.wordpress.com/wordpress-editor/add-content-blocks/">Block Inserter</a>). This button can be found in several places, such as the top left corner of the editor or at the side of an empty block. Additionally, you can press the Enter/Return key on your keyboard to create a new line below an existing block and click the <strong>+ Block Inserter</strong> there. Once you see the Block Inserter, you can search for a specific block type and click it to insert it into your content.',
	urls: [
		{
			url: 'http://en.support.wordpress.com/replacing-the-older-wordpress-com-editor-with-the-wordpress-block-editor/',
			title: 'Replacing the Older WordPress.com Editor with the WordPress Block Editor',
		},
		{
			url: 'http://en.support.wordpress.com/wordpress-editor/switching-from-the-classic-to-the-block-editor/',
			title: 'Convert from the Classic to the Block Editor',
		},
		{
			url: 'http://en.support.wordpress.com/video-tutorials/using-the-block-editor/',
			title: 'Video Tutorials: Using the Block Editor',
		},
		{
			url: 'http://en.support.wordpress.com/wordpress-editor/add-content-blocks/',
			title: 'Add Content Using Blocks',
		},
		{ url: 'http://en.support.wordpress.com/wordpress-editor/blocks/', title: 'Blocks' },
	],
};

export default function useSubmitQuestion() {
	const [ question, setQuestion ] = useState( '' );

	const [ answer, setAnswer ] = useState();
	const [ references, setReferences ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );

	const submitQuestion = async () => {
		setIsLoading( true );
		// apiFetch( {
		// 	path: `/wpcom/v2/sites/${ siteID }/jetpack-search/ai/search?_envelope=1&query=${ question }?&environment-id=development&_gutenberg_nonce=${ nonce }&_locale=user`,
		// 	method: 'GET',
		// } ).then( res => {
		// 	setIsLoading( false );
		// } );
		setTimeout( () => {
			setAnswer( mockAnswer.response );
			setReferences( mockAnswer.urls );
			setIsLoading( false );
		}, 3000 );
	};

	return { question, setQuestion, answer, isLoading, submitQuestion, references };
}
