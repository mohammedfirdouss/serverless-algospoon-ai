#!/bin/bash

# Validation script for AlgoSpoon AI Phase 1

set -e

echo "================================================"
echo "AlgoSpoon AI - Phase 1 Validation"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

validate_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

validate_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

ERRORS=0

echo "Validating CDK Infrastructure..."
validate_file "bin/algospoon.ts" || ((ERRORS++))
validate_file "lib/algospoon-stack.ts" || ((ERRORS++))
validate_file "lib/auth-service.ts" || ((ERRORS++))
validate_file "lib/recipe-data-store.ts" || ((ERRORS++))
validate_file "cdk.json" || ((ERRORS++))
validate_file "tsconfig.json" || ((ERRORS++))
echo ""

echo "Validating Auth Service Lambda Functions..."
validate_dir "services/auth/register" || ((ERRORS++))
validate_file "services/auth/register/index.ts" || ((ERRORS++))
validate_file "services/auth/register/package.json" || ((ERRORS++))

validate_dir "services/auth/update-profile" || ((ERRORS++))
validate_file "services/auth/update-profile/index.ts" || ((ERRORS++))
validate_file "services/auth/update-profile/package.json" || ((ERRORS++))

validate_dir "services/auth/get-user" || ((ERRORS++))
validate_file "services/auth/get-user/index.ts" || ((ERRORS++))
validate_file "services/auth/get-user/package.json" || ((ERRORS++))
echo ""

echo "Validating Recipe Service Lambda Functions..."
validate_dir "services/recipes/save-recipe" || ((ERRORS++))
validate_file "services/recipes/save-recipe/index.ts" || ((ERRORS++))
validate_file "services/recipes/save-recipe/package.json" || ((ERRORS++))

validate_dir "services/recipes/get-recipes" || ((ERRORS++))
validate_file "services/recipes/get-recipes/index.ts" || ((ERRORS++))
validate_file "services/recipes/get-recipes/package.json" || ((ERRORS++))

validate_dir "services/recipes/delete-recipe" || ((ERRORS++))
validate_file "services/recipes/delete-recipe/index.ts" || ((ERRORS++))
validate_file "services/recipes/delete-recipe/package.json" || ((ERRORS++))
echo ""

echo "Validating Documentation..."
validate_file "README.md" || ((ERRORS++))
validate_file "DEPLOYMENT.md" || ((ERRORS++))
validate_file "PROJECT_STRUCTURE.md" || ((ERRORS++))
validate_file "PHASE1_SUMMARY.md" || ((ERRORS++))
validate_file "QUICK_REFERENCE.md" || ((ERRORS++))
echo ""

echo "Validating Scripts..."
validate_file "scripts/install-all.sh" || ((ERRORS++))
echo ""

echo "================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo "================================================"
    echo ""
    echo "Phase 1 is complete and ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./scripts/install-all.sh"
    echo "  2. Run: npm run build"
    echo "  3. Run: npm run deploy"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s)${NC}"
    echo "================================================"
    exit 1
fi
