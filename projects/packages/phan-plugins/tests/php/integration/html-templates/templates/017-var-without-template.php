<?php
/**
 * @html-template-var string $a
 */

// @html-template-var string $b

'@phan-debug-var $a';
'@phan-debug-var $b';

// @html-template-var string $c

/**
 * @html-template-var string $d
 */

'@phan-debug-var $c';
'@phan-debug-var $d';
