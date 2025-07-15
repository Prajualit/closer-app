# Production Deployment Guide

## Frontend Deployment (Vercel)

1. **Connect to Vercel:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables in Vercel:**
   - `NEXT_PUBLIC_BACKEND_URL`: Your backend URL
   - `GOOGLE_CLIENT_ID`: (if using Google auth)

3. **Build Command:** `npm run build`
4. **Output Directory:** `.next`

## Backend Deployment (Railway)

1. **Connect to Railway:**
   - Go to railway.app
   - Connect your GitHub repo
   - Select backend folder

2. **Environment Variables in Railway:**
   ```
   PORT=8080
   MONGO_URI=your-mongodb-connection-string
   ACCESS_TOKEN_SECRET=your-secure-secret
   REFRESH_TOKEN_SECRET=your-secure-refresh-secret  
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   GEMINI_API_KEY=your-gemini-key
   ```

3. **Start Command:** `node index.js`

## Database (MongoDB Atlas)
✅ Already configured and ready

## Domain Setup
1. **Custom Domain** (optional): Configure in Vercel
2. **SSL Certificate**: Automatic with Vercel/Railway

## Post-Deployment
1. Update CORS_ORIGIN in backend env
2. Update NEXT_PUBLIC_BACKEND_URL in frontend env
3. Test all functionality
4. Monitor performance
