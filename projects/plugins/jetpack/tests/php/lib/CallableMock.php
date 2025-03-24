<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Simple interface for mocking callables in PHPUnit 11+.
 *
 * @project automattic/jetpack
 */

/**
 * Simple interface for mocking callables in PHPUnit 11+.
 *
 * @template T
 */
interface CallableMock {
	/** @return T */
	public function __invoke();
}
