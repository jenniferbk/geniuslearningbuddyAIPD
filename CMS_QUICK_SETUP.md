# CMS Quick Setup Guide

## 🚀 Simplified Setup - All Users Get Creator Access!

### Option 1: One Command Setup
```bash
cd backend
chmod +x setup-cms-full.sh
./setup-cms-full.sh
```

### Option 2: Manual Steps
```bash
cd backend

# Setup CMS database tables
node setup-cms-database.js

# Grant permissions to existing users (if any)
node grant-creator-permissions-to-all.js

# Start the system
npm start
```

### Option 3: Fresh Installation
If starting fresh, just run:
```bash
cd backend
node setup-cms-database.js
npm start
```
*New users will automatically get creator permissions!*

## ✅ What This Does

1. **Creates CMS database tables** for courses, modules, lessons, content
2. **Grants creator permissions** to all existing users
3. **Enables automatic permission granting** for all new users

## 🎯 Access the CMS

1. **Start backend:** `npm start` (in backend folder)
2. **Start frontend:** `npm run dev` (in frontend-next folder)  
3. **Login/Register** at `http://localhost:3000`
4. **Access CMS** at `http://localhost:3000/cms`
5. **Start creating courses!** 🎓

## 💡 Key Changes

- **All users** now automatically receive creator permissions
- **No manual permission granting** needed for new users
- **CMS menu item** appears for all logged-in users
- **Simplified onboarding** for team members

Perfect for development, testing, and small team environments!
