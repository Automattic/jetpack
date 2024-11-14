<?php

if ( isset( $arg ) ) {
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
	die( $arg );
} else {
	die();
}
