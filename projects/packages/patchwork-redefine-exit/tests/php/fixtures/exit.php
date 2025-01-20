<?php

if ( isset( $arg ) ) {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
	exit( $arg );
} else {
	// @phan-suppress-current-line UnusedPluginSuppression @phan-suppress-next-line PhanParamTooFewInternal -- Phan bug with PHP 8.4: https://github.com/phan/phan/issues/4888
	exit();
}
