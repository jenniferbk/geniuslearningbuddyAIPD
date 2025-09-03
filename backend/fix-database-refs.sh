#!/bin/bash

# Fix all database references to use learning_buddy.db consistently

echo "🔧 Fixing database references..."
echo "================================"

cd /Users/jenniferkleiman/Documents/GitHub/geniuslearningbuddyAIPD/backend

# List of files that might reference databases
FILES=(
    "setup-cms-database.js"
    "grant-creator-permissions-to-all.js"
    "setup-database.js"
    "memory-service.js"
    "database-enhancements.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Check current reference
        if grep -q "learning_buddy.db" "$file"; then
            echo "📝 Updating $file..."
            # macOS compatible sed
            sed -i '' 's/learning_buddy\.db/learning_buddy.db/g' "$file"
            echo "  ✅ Changed learning_buddy.db → learning_buddy.db"
        else
            echo "  ✓ $file already uses correct database"
        fi
    fi
done

echo ""
echo "✅ Database references fixed!"
echo ""
echo "Run this to verify:"
echo "  grep -r 'learning_buddy.db' *.js"
echo ""
echo "Should return no results if all fixed."
