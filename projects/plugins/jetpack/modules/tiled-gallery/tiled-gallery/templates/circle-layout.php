<?php
/**
 * Square layout Tiled Gallery template.
 *
 * @package automattic/jetpack
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Defined by the caller. Let Phan handle it.
'@phan-var-force Jetpack_Tiled_Gallery_Layout $this';
'@phan-var-force array $context';

$this->template( 'square-layout', $context ); // @phan-suppress-current-line PhanAccessMethodPrivate -- Called in the scope of the class.
