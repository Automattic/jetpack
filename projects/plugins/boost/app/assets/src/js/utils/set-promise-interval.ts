/**
 * Promise-friendly version of setInterval. Accepts a function that returns a promise,
 * and ensures that each interval occurs <ms> after the previous one resolves
 *
 * @param {Function} fn Function that returns a promise
 * @param {number}   ms Interval in milliseconds
 */
export function setPromiseInterval( fn: () => Promise< void >, ms: number ) {
	let timer: number;

	async function loop() {
		await fn();
		timer = setTimeout( loop, ms );
	}

	timer = setTimeout( loop, ms );
	return () => clearTimeout( timer );
}
