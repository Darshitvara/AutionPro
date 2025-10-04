#!/bin/bash
# Production Build Script

echo "🚀 Starting Production Build Process..."

# Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm run build
cd ..

# Copy built frontend to backend public folder
echo "📁 Copying built files..."
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

# Install production dependencies
echo "📦 Installing production dependencies..."
cd backend
npm install --production

echo "✅ Production build complete!"
echo "🌐 Frontend built and copied to backend/public"
echo "🔧 Backend ready for deployment"