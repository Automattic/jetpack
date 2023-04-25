import debugFactory from 'debug';
import registerVideoPressBlock from './blocks/video/index';

// eslint-disable-next-line no-undef
if ( __DEV__ ) {
	debugFactory.enable( 'videopress:*' );
}

registerVideoPressBlock();
