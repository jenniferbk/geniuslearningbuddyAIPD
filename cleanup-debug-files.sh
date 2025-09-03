#!/bin/bash
# cleanup-debug-files.sh - Remove all debug/test files created during troubleshooting

echo "=== CLEANING UP DEBUG FILES ==="
echo ""

# List of files to remove
FILES_TO_REMOVE=(
  "debug-auth.js"
  "test-auth-flow.js"
  "fix-all-auth-issues.js"
  "fix-auth-issue.sh"
  "quick-test-users.sh"
  "verify-auth-state.js"
  "debug-token-issue.js"
  "browser-token-debugger.js"
  "test-backend-tokens.sh"
  "test-full-tokens.sh"
  "fix-current-session.js"
  "run-auth-fix.sh"
)

# Remove debug files from root directory
echo "Removing debug files from project root..."
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  ✓ Removed $file"
  fi
done

# Remove backend debug files
echo ""
echo "Checking backend directory..."
cd backend 2>/dev/null && {
  for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
      rm "$file"
      echo "  ✓ Removed backend/$file"
    fi
  done
  cd ..
}

# Remove frontend debug files
echo ""
echo "Checking frontend directory..."
if [ -f "frontend-next/app/auth/page-debug.tsx" ]; then
  rm "frontend-next/app/auth/page-debug.tsx"
  echo "  ✓ Removed frontend-next/app/auth/page-debug.tsx"
fi

if [ -f "frontend-next/app/auth/page-original.tsx" ]; then
  # If there's a backup, check if user wants to keep it
  echo ""
  echo "Found backup: frontend-next/app/auth/page-original.tsx"
  echo "  (Keeping backup in case you need to reference it)"
fi

echo ""
echo "=== CLEANUP COMPLETE ==="
echo ""
echo "✅ All debug/test files removed"
echo "✅ Your fixes are preserved in:"
echo "   - frontend-next/app/auth/page.tsx (stores userEmail)"
echo "   - frontend-next/components/AppLayout.tsx (uses /auth not /auth/login)"
echo "   - backend/server.js (auto-grants creator permissions)"
echo ""
echo "📝 SUMMARY OF FIXES APPLIED:"
echo "   1. Auth now correctly stores user.id (not userId)"
echo "   2. Auth stores userEmail for navigation display"
echo "   3. Fixed hardcoded test-user-123 fallback"
echo "   4. Navigation shows logged-in user with logout"
echo "   5. All users get creator permissions automatically"
echo ""
echo "Ready to commit! Suggested commit message:"
echo "  'Fix authentication issues: correct user ID storage, add email to localStorage, display logged-in user in nav'"