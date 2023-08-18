import debugFactory from 'debug';
import registerVideoPressBlock from './blocks/video/index';

// eslint-disable-next-line no-undef
if ( __DEV__ && process.env.JEST_WORKER_ID === undefined ) {
	debugFactory.enable( 'videopress:*' );
}

registerVideoPressBlock();
