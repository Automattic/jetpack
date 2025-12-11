#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PERFORMANCE_DIR="$SCRIPT_DIR"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Jetpack Performance Testing - Quick Start           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Validate we're in the expected monorepo structure
if [ ! -f "$PERFORMANCE_DIR/package.json" ]; then
    echo "Error: package.json not found in $PERFORMANCE_DIR"
    exit 1
fi

if [ ! -f "$MONOREPO_ROOT/pnpm-workspace.yaml" ]; then
    echo "Error: This script must be run from within the Jetpack monorepo"
    exit 1
fi

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not found. Please install Docker first."
    exit 1
else
    if ! docker info &> /dev/null; then
        echo "✗ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    echo "✓ Docker is running"
fi

# Check Node.js version using Node itself for reliability across version managers
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 18+ first."
    exit 1
else
    if ! node -e "process.exit(parseInt(process.versions.node.split('.')[0], 10) < 18 ? 1 : 0)"; then
        echo "✗ Node.js version $(node -v) found. Please upgrade to Node.js 18+."
        exit 1
    fi
    echo "✓ Node.js $(node -v) found"
fi

echo ""

# Step 2: Build Jetpack (if not already built)
echo "Step 2: Building Jetpack plugin..."
echo "-----------------------------------"

cd "$MONOREPO_ROOT"

# Ensure pnpm is available via corepack (needed for later steps even if Jetpack is already built)
if ! command -v pnpm &> /dev/null; then
    echo "Enabling pnpm via corepack..."
    corepack enable
    corepack prepare pnpm@latest --activate
    echo "✓ pnpm enabled via corepack"
else
    echo "✓ pnpm found"
fi

if [ ! -d "$MONOREPO_ROOT/projects/plugins/jetpack/vendor" ]; then
    echo "Building Jetpack for the first time (this may take a while)..."

    echo "Installing dependencies..."
    pnpm install

    echo "Building Jetpack plugin..."
    pnpm jetpack build plugins/jetpack

    echo "✓ Jetpack built successfully"
else
    echo "✓ Jetpack already built (skipping rebuild)"
    echo ""
    echo "⚠ Warning: If you've modified Jetpack code, the build may be stale."
    echo "  To force a rebuild: pnpm jetpack build plugins/jetpack"
fi

echo ""

# Step 3: Install performance testing dependencies
echo "Step 3: Installing performance test dependencies..."
echo "-----------------------------------------------------"

cd "$PERFORMANCE_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing pnpm packages..."
    pnpm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

if ! pnpm exec playwright --version &> /dev/null; then
    echo "Installing Playwright browsers..."
    pnpm exec playwright install chromium --with-deps
    echo "✓ Playwright browsers installed"
else
    echo "✓ Playwright already installed"
fi

echo ""

# Step 4: Run performance tests (handles Docker setup automatically)
echo "Step 4: Running performance tests..."
echo "------------------------------------"
echo "The test runner will automatically:"
echo "  - Start Docker containers"
echo "  - Wait for MySQL to be ready"
echo "  - Set up WordPress instances"
echo "  - Run 3 iterations to verify everything works"
echo ""

# The orchestrator (run-performance-tests.js) handles all Docker/WordPress setup
# with proper polling-based readiness checks, so we delegate to it
ITERATIONS=3 pnpm test -- --skip-codevitals

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Setup Complete! 🎉                                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Your performance testing environment is ready!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Configure CodeVitals (optional):"
echo "     cp .env.example .env"
echo "     # Edit .env and add your CODEVITALS_TOKEN"
echo ""
echo "  2. Run full test suite:"
echo "     pnpm test"
echo ""
echo "  3. View WordPress instances (ports are dynamic):"
echo "     docker compose -f docker/docker-compose.yml port wordpress-baseline 80"
echo "     docker compose -f docker/docker-compose.yml port wordpress-jetpack 80"
echo "     # etc. - or just run 'pnpm test' which discovers ports automatically"
echo ""
echo "     Login: admin / password"
echo ""
echo "  4. View results:"
echo "     cat results/lcp-results.json"
echo ""
echo "  5. When done, stop containers:"
echo "     pnpm run docker:down"
echo ""
echo "For TeamCity setup, see: TEAMCITY-SETUP.md"
echo ""
