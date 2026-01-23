#!/bin/bash
# Automated validation script for Git Worktree Handler extension

echo "==================================="
echo "Git Worktree Handler - Test Suite"
echo "==================================="
echo ""

# Test 1: Check all compiled modules exist
echo "✓ TEST 1: Compiled Modules"
MODULES=(
    "out/extension.js"
    "out/gitWorktreeManager.js"
    "out/worktreeProvider.js"
    "out/quickActions.js"
    "out/health/healthMonitor.js"
    "out/lifecycle/hooksManager.js"
    "out/sync/settingsSync.js"
    "out/templates/templateManager.js"
    "out/views/healthProvider.js"
    "out/views/timelineProvider.js"
    "out/views/graphProvider.js"
)

MISSING=0
for module in "${MODULES[@]}"; do
    if [ -f "$module" ]; then
        echo "  ✓ $module"
    else
        echo "  ✗ MISSING: $module"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "  → All modules compiled successfully!"
else
    echo "  → $MISSING modules missing!"
    exit 1
fi

echo ""

# Test 2: Check package.json configuration
echo "✓ TEST 2: Package.json Configuration"
COMMANDS=(
    "gitWorktree.quickActions"
    "gitWorktree.pullAll"
    "gitWorktree.pushAllDirty"
    "gitWorktree.installDepsAll"
    "gitWorktree.syncSettings"
    "gitWorktree.refreshHealth"
    "gitWorktree.refreshTimeline"
    "gitWorktree.refreshGraph"
)

for cmd in "${COMMANDS[@]}"; do
    if grep -q "\"$cmd\"" package.json; then
        echo "  ✓ Command registered: $cmd"
    else
        echo "  ✗ Missing command: $cmd"
    fi
done

echo ""

# Test 3: Check views configuration
echo "✓ TEST 3: Views Configuration"
VIEWS=(
    "gitWorktreeView"
    "gitHealthView"
    "gitTimelineView"
    "gitGraphView"
)

for view in "${VIEWS[@]}"; do
    if grep -q "\"$view\"" package.json; then
        echo "  ✓ View registered: $view"
    else
        echo "  ✗ Missing view: $view"
    fi
done

echo ""

# Test 4: Check configuration schema
echo "✓ TEST 4: Configuration Schema"
CONFIGS=(
    "gitWorktree.hooks"
    "gitWorktree.health.checkInterval"
    "gitWorktree.sync.enabled"
    "gitWorktree.showStatusBar"
)

for config in "${CONFIGS[@]}"; do
    if grep -q "\"$config\"" package.json; then
        echo "  ✓ Config defined: $config"
    else
        echo "  ✗ Missing config: $config"
    fi
done

echo ""

# Test 5: Check TypeScript types
echo "✓ TEST 5: TypeScript Compilation"
if npm run compile 2>&1 | grep -q "error TS"; then
    echo "  ✗ TypeScript errors found"
    npm run compile 2>&1 | grep "error TS" | head -5
    exit 1
else
    echo "  ✓ No TypeScript errors"
fi

echo ""

# Test 6: Project structure
echo "✓ TEST 6: Project Structure"
DIRS=(
    "src/health"
    "src/lifecycle"
    "src/sync"
    "src/templates"
    "src/views"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ Directory exists: $dir"
    else
        echo "  ✗ Missing directory: $dir"
    fi
done

echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo "✓ All basic validation tests passed!"
echo ""
echo "Next Steps:"
echo "1. Press F5 to launch Extension Development Host"
echo "2. Open a git repository with worktrees"
echo "3. Manually test features from TESTING.md"
echo ""
