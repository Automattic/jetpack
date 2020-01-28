namespace {namespace};

use phpmock\generator\MockFunctionGenerator;

function {name}({signatureParameters})
{
    $arguments = [{bodyParameters}];

    $variadics = \array_slice(\func_get_args(), \count($arguments));
    $arguments = \array_merge($arguments, $variadics);

    return MockFunctionGenerator::call(
        '{name}',
        '{fqfn}',
        $arguments
    );
}