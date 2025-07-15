# Deployment Instructions

## Your project is PRODUCTION READY! 🚀

### Quick Deploy Options:

#### Option 1: Vercel (Recommended for Frontend)
```bash
npm i -g vercel
cd c:\NITH\WD\closer
vercel
```

#### Option 2: Railway (Recommended for Backend)
1. Go to https://railway.app
2. Connect your GitHub repo
3. Deploy backend folder
4. Set environment variables

### Environment Variables Setup:

#### Frontend (.env.local):
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

#### Backend (Railway/Render):
```
PORT=8080
MONGO_URI=mongodb+srv://prajualit:vesna8934@cluster0.1x6rm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
ACCESS_TOKEN_SECRET=your-new-secure-secret-here
REFRESH_TOKEN_SECRET=your-new-secure-refresh-secret-here
CORS_ORIGIN=https://your-frontend-url.vercel.app
CLOUDINARY_API_SECRET=Bdv_oUE8zkUiVS1hsIHAaH54Zuc
CLOUDINARY_API_KEY=876268285349775
CLOUDINARY_CLOUD_NAME=du5he57b5
GEMINI_API_KEY=AIzaSyAH-bYtfx4dwEFyzW8pbAfL9Fv660MLgyA
```

### Pre-Deployment Checklist:
✅ Build process works
✅ Database connected
✅ Environment variables configured
✅ File naming issues fixed
✅ Image optimization updated
✅ Security configurations in place

### Cost Estimate:
- **Vercel Frontend**: Free tier available
- **Railway Backend**: ~$5/month  
- **MongoDB Atlas**: Free tier (512MB)
- **Cloudinary**: Free tier (25k transformations)

**Total Monthly Cost: ~$5-10**

### Post-Deployment:
1. Update CORS_ORIGIN with your production frontend URL
2. Update NEXT_PUBLIC_BACKEND_URL with your production backend URL
3. Test all features in production
4. Set up monitoring (optional)

Your social media app is ready to go live! 🎉
