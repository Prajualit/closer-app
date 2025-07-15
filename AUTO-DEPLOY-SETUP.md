# 🚀 Auto-Deploy Setup Guide

## GitHub Actions Workflow Created!

I've created two workflows for automatic deployment:

### 1. `deploy-render.yml` - Simple deployment trigger
### 2. `deploy-backend.yml` - Full backend deployment with testing and notifications

## 📋 Setup Instructions:

### Step 1: Get Your Render API Key
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your profile (top right) → **Account Settings**
3. Go to **API Keys** tab
4. Click **Create API Key**
5. Copy the generated key (starts with `rnd_...`)

### Step 2: Get Your Render Service ID
1. Go to your [Render Services](https://dashboard.render.com)
2. Click on your backend service (`closer-app`)
3. In the URL, copy the service ID (format: `srv-xxxxxxxxxxxxxxxxxxxxx`)
   - Example: `https://dashboard.render.com/web/srv-abc123def456` → Service ID is `srv-abc123def456`

### Step 3: Add GitHub Secrets
1. Go to your GitHub repository: `https://github.com/Prajualit/Social-Media-App-Closer-Mern`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   **Secret 1:**
   ```
   Name: RENDER_API_KEY
   Value: rnd_your_api_key_here
   ```

   **Secret 2:**
   ```
   Name: RENDER_SERVICE_ID  
   Value: srv-your_service_id_here
   ```

### Step 4: Test the Workflow
1. Make any small change to your backend code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "test: trigger auto-deploy"
   git push origin main
   ```
3. Go to **Actions** tab in your GitHub repo to see the workflow running

## 🎯 How It Works:

✅ **Automatic Trigger**: Deploys when you push to `main` branch  
✅ **Backend Focus**: Only triggers when backend files change  
✅ **Dependency Check**: Installs and validates npm packages  
✅ **Test Running**: Runs tests if they exist  
✅ **Deployment Status**: Shows real-time deployment progress  
✅ **Manual Trigger**: Can also trigger manually from Actions tab  

## 🔄 Workflow Triggers:

- **Automatic**: Push to `main` branch with backend changes
- **Manual**: Click "Run workflow" in GitHub Actions tab
- **Path-based**: Only runs when `backend/**` files change

## 📊 Monitoring:

After each deployment:
- Check **GitHub Actions** for workflow status
- Monitor **Render Dashboard** for deployment progress  
- App will be live at: `https://closer-app.onrender.com`

## 🛠️ Troubleshooting:

If deployment fails:
1. Check GitHub Actions logs for errors
2. Verify API key and service ID are correct
3. Ensure environment variables are set on Render
4. Check backend code for syntax errors

Now every time you push backend changes, they'll automatically deploy to Render! 🚀
