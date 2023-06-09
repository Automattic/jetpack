type AiWritterCallbackProp = ( text: string ) => void;

type AiWritterOptionsProps = {
	speed: number; // typing speed in milliseconds
	speedVariance: number; // typing speed variance in milliseconds
};

/**
 * Simulate the AI writing
 *
 * @param {string} text                    - text to write
 * @param {AiWritterCallbackProp} fn       - callback function
 * @param {AiWritterOptionsProps} options  - writter options
 */
export default async function aiWriter(
	text: string,
	fn: AiWritterCallbackProp,
	options: AiWritterOptionsProps = {
		speed: 50,
		speedVariance: 50,
	}
) {
	for ( let i = 0; i < text.length; i++ ) {
		const delay = options.speed * i + Math.random() * options.speedVariance;
		setTimeout( () => {
			fn( text.substring( 0, i + 1 ) );
		}, delay );
	}
}
