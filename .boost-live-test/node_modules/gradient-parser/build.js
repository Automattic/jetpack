const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// Determine which build to run based on command-line args
const args = process.argv.slice(2);
const buildNode = args.includes('--node') || !args.length;
const buildWeb = args.includes('--web') || !args.length;
const minify = args.includes('--minify');

// Helper to ensure directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Helper function for minification
const minifyCode = async (code, outputFile) => {
  const result = await esbuild.transform(code, {
    minify: true,
    target: 'es6',
  });
  
  fs.writeFileSync(outputFile, result.code);
  return result.code;
};

// Make sure the build directory exists
ensureDir(path.join(__dirname, 'build'));

// Async function to handle potential async operations like minification
async function build() {
  // Build for Node.js
  if (buildNode) {
    console.log('Building node.js bundle...');
    
    // Read the source files
    const stringifyContent = fs.readFileSync(path.join(__dirname, 'lib', 'stringify.js'), 'utf8');
    const parserContent = fs.readFileSync(path.join(__dirname, 'lib', 'parser.js'), 'utf8');
    const indexContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
    
    // Concatenate the files
    const nodeBundle = `${stringifyContent}\n${parserContent}\n${indexContent}`;
    
    // Write the bundle
    const outputPath = path.join(__dirname, 'build', 'node.js');
    
    if (minify) {
      await minifyCode(nodeBundle, outputPath);
      console.log('✓ Node.js bundle created and minified successfully');
    } else {
      fs.writeFileSync(outputPath, nodeBundle);
      console.log('✓ Node.js bundle created successfully');
    }
  }

  // Build for Web
  if (buildWeb) {
    console.log('Building web.js bundle...');
    
    // Read the source files
    const webifyContent = fs.readFileSync(path.join(__dirname, 'webify.js'), 'utf8');
    const parserContent = fs.readFileSync(path.join(__dirname, 'lib', 'parser.js'), 'utf8');
    const stringifyContent = fs.readFileSync(path.join(__dirname, 'lib', 'stringify.js'), 'utf8');
    
    // Concatenate the files
    const webBundle = `${webifyContent}\n${parserContent}\n${stringifyContent}`;
    
    // Write the bundle
    const outputPath = path.join(__dirname, 'build', 'web.js');
    
    if (minify) {
      await minifyCode(webBundle, outputPath);
      console.log('✓ Web bundle created and minified successfully');
    } else {
      fs.writeFileSync(outputPath, webBundle);
      console.log('✓ Web bundle created successfully');
    }
  }

  // Build ESM entry point (always, when building node)
  if (buildNode) {
    console.log('Building esm.mjs bundle...');

    const stringifyContent = fs.readFileSync(path.join(__dirname, 'lib', 'stringify.js'), 'utf8');
    const parserContent = fs.readFileSync(path.join(__dirname, 'lib', 'parser.js'), 'utf8');

    const esmBundle = `${stringifyContent}\n${parserContent}\nexport const parse = GradientParser.parse;\nexport const stringify = GradientParser.stringify;\nexport default { parse: GradientParser.parse, stringify: GradientParser.stringify };\n`;

    const esmOutputPath = path.join(__dirname, 'build', 'esm.mjs');

    if (minify) {
      await minifyCode(esmBundle, esmOutputPath);
      console.log('✓ ESM bundle created and minified successfully');
    } else {
      fs.writeFileSync(esmOutputPath, esmBundle);
      console.log('✓ ESM bundle created successfully');
    }
  }

  // If no arguments were provided, we built both bundles
  if (!args.length) {
    console.log('✓ All bundles built successfully');
  }
}

// Execute the build
console.log(`Building with options: ${minify ? 'minify' : 'no minify'} ${buildNode ? 'node' : ''} ${buildWeb ? 'web' : ''}`)
build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
