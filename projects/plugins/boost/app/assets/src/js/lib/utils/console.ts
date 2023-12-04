/**
 * Log pre-critical CSS generation message to the console.
 */
export function logPreCriticalCSSGeneration(): void {
	const styles = 'font-size: 1rem;line-height:1.6;';
	// eslint-disable-next-line no-console
	console.log(
		'%cGenerating Critical CSS will often leave errors in your console. Most of them are nothing to worry about - just the sounds of your browser complaining about our strict security settings. Check out the following page for more information: https://jetpack.com/support/performance/jetpack-boost/jetpack-boost-console-error/',
		styles
	);
}
