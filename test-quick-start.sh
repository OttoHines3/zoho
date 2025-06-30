#!/bin/bash

# Quick Start Test Script for Zoho Integration Application
# This script sets up the test environment and provides testing instructions

set -e

echo "🚀 Zoho Integration Application - Quick Start Test Script"
echo "========================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found"
    echo "Please ensure you have configured all required environment variables:"
    echo ""
    echo "Required variables:"
    echo "- DATABASE_URL"
    echo "- AUTH_SECRET"
    echo "- NEXTAUTH_URL"
    echo "- NEXTAUTH_SECRET"
    echo "- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    echo "- STRIPE_SECRET_KEY"
    echo "- STRIPE_WEBHOOK_SECRET"
    echo "- DOCUSIGN_ACCOUNT_ID"
    echo "- DOCUSIGN_USER_ID"
    echo "- DOCUSIGN_PRIVATE_KEY"
    echo "- DOCUSIGN_CLIENT_ID"
    echo "- ZOHO_ACCESS_TOKEN"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if database is running
echo "🗄️  Checking database connection..."
if ! npm run db:check 2>/dev/null; then
    echo "⚠️  Database connection failed. Please ensure your database is running."
    echo "You can start the database with: ./start-database.sh"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate
echo "✅ Database migrations completed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate
echo "✅ Prisma client generated"
echo ""

# Set up test data
echo "🧪 Setting up test data..."
node setup-test-data.js setup
echo "✅ Test data setup completed"
echo ""

# Start the development server
echo "🌐 Starting development server..."
echo "The application will be available at: http://localhost:3000"
echo ""
echo "📋 Test Credentials:"
echo "Email: test@example.com"
echo "Password: testpassword123"
echo ""
echo "🔗 Test URLs:"
echo "- Home: http://localhost:3000"
echo "- Sign In: http://localhost:3000/signin"
echo "- Dashboard: http://localhost:3000/dashboard"
echo "- Checkout Step 1: http://localhost:3000/checkout/step-1"
echo "- Magic Link: http://localhost:3000/magic-link/test-zoho-id-123/test-login-code-123"
echo ""
echo "📖 For detailed testing instructions, see: test-user-guide.md"
echo ""
echo "🛑 To stop the server, press Ctrl+C"
echo ""

# Start the development server
npm run dev 