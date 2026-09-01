<?php

if ( isset( $arg ) ) {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
	exit( $arg );
} else {
	exit();
}
