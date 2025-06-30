#!/usr/bin/env node

/**
 * Test Data Setup Script
 * Creates test data in the database for comprehensive application testing
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Test data configuration
const TEST_DATA = {
  user: {
    email: "test@example.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8eG", // testpassword123
    name: "Test User",
  },
  checkoutSession: {
    id: "test-checkout-session-123",
    email: "test@example.com",
    amount: 29900, // $299.00
    currency: "usd",
    status: "requires_payment_method",
    stripe_payment_intent_id: "pi_test_1234567890",
    modules: ["CRM", "Sales"],
    created_at: new Date(),
    updated_at: new Date(),
  },
  companyInfo: {
    companyName: "Test Company Inc.",
    contactName: "John Test Smith",
    email: "john.smith@testcompany.com",
    phone: "+1-555-123-4567",
    address: "123 Test Street",
    city: "Test City",
    state: "CA",
    zipCode: "90210",
    country: "US",
    industry: "Technology",
    companySize: "10-50 employees",
    checkout_session_id: "test-checkout-session-123",
  },
  agreement: {
    checkout_session_id: "test-checkout-session-123",
    docusign_envelope_id: "test-envelope-123",
    status: "sent",
    signed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  zohoAccountLink: {
    zoho_id: "test-zoho-id-123",
    user_id: "test-user-id-123",
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_at: new Date(Date.now() + 3600000), // 1 hour from now
    created_at: new Date(),
    updated_at: new Date(),
  },
  salesOrder: {
    zoho_id: "test-sales-order-123",
    checkout_session_id: "test-checkout-session-123",
    contact_id: "test-contact-123",
    order_number: "SO-2024-001",
    status: "draft",
    total_amount: 29900,
    currency: "usd",
    created_at: new Date(),
    updated_at: new Date(),
  },
  signupLink: {
    zoho_id: "test-zoho-id-123",
    login_code: "test-login-code-123",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    usage_limit: 5,
    usage_count: 0,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
};

async function setupTestData() {
  console.log("🚀 Setting up test data...");

  try {
    // Clean up existing test data
    console.log("🧹 Cleaning up existing test data...");
    await cleanupTestData();

    // Create test user
    console.log("👤 Creating test user...");
    const user = await prisma.user.upsert({
      where: { email: TEST_DATA.user.email },
      update: {},
      create: {
        id: "test-user-id-123",
        email: TEST_DATA.user.email,
        password: TEST_DATA.user.password,
        name: TEST_DATA.user.name,
        emailVerified: new Date(),
      },
    });
    console.log("✅ Test user created:", user.email);

    // Create test checkout session
    console.log("💳 Creating test checkout session...");
    const checkoutSession = await prisma.checkoutSession.create({
      data: TEST_DATA.checkoutSession,
    });
    console.log("✅ Test checkout session created:", checkoutSession.id);

    // Create test company info
    console.log("🏢 Creating test company info...");
    const companyInfo = await prisma.companyInfo.create({
      data: TEST_DATA.companyInfo,
    });
    console.log("✅ Test company info created:", companyInfo.companyName);

    // Create test agreement
    console.log("📄 Creating test agreement...");
    const agreement = await prisma.agreement.create({
      data: TEST_DATA.agreement,
    });
    console.log("✅ Test agreement created:", agreement.docusign_envelope_id);

    // Create test Zoho account link
    console.log("🔗 Creating test Zoho account link...");
    const zohoLink = await prisma.zohoAccountLink.create({
      data: TEST_DATA.zohoAccountLink,
    });
    console.log("✅ Test Zoho account link created:", zohoLink.zoho_id);

    // Create test sales order
    console.log("📋 Creating test sales order...");
    const salesOrder = await prisma.salesOrder.create({
      data: TEST_DATA.salesOrder,
    });
    console.log("✅ Test sales order created:", salesOrder.order_number);

    // Create test signup link
    console.log("🔗 Creating test signup link...");
    const signupLink = await prisma.signupLink.create({
      data: TEST_DATA.signupLink,
    });
    console.log("✅ Test signup link created:", signupLink.login_code);

    console.log("\n🎉 Test data setup completed successfully!");
    console.log("\n📋 Test Data Summary:");
    console.log(`👤 User: ${user.email}`);
    console.log(`💳 Checkout Session: ${checkoutSession.id}`);
    console.log(`🏢 Company: ${companyInfo.companyName}`);
    console.log(`📄 Agreement: ${agreement.docusign_envelope_id}`);
    console.log(`🔗 Zoho ID: ${zohoLink.zoho_id}`);
    console.log(`📋 Sales Order: ${salesOrder.order_number}`);
    console.log(`🔗 Magic Link: ${signupLink.login_code}`);

    console.log("\n🔗 Test URLs:");
    console.log(`Dashboard: http://localhost:3000/dashboard`);
    console.log(
      `Magic Link: http://localhost:3000/magic-link/${zohoLink.zoho_id}/${signupLink.login_code}`,
    );
    console.log(
      `CRM API: http://localhost:3000/api/crm/${zohoLink.zoho_id}/${signupLink.login_code}`,
    );
  } catch (error) {
    console.error("❌ Error setting up test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupTestData() {
  try {
    // Delete in reverse order to respect foreign key constraints
    await prisma.signupLink.deleteMany({
      where: { zoho_id: { startsWith: "test-" } },
    });

    await prisma.salesOrder.deleteMany({
      where: { zoho_id: { startsWith: "test-" } },
    });

    await prisma.zohoAccountLink.deleteMany({
      where: { zoho_id: { startsWith: "test-" } },
    });

    await prisma.agreement.deleteMany({
      where: { checkout_session_id: { startsWith: "test-" } },
    });

    await prisma.companyInfo.deleteMany({
      where: { checkout_session_id: { startsWith: "test-" } },
    });

    await prisma.checkoutSession.deleteMany({
      where: { id: { startsWith: "test-" } },
    });

    await prisma.user.deleteMany({
      where: { email: "test@example.com" },
    });

    console.log("✅ Test data cleanup completed");
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
  }
}

async function generateTestMagicLink() {
  console.log("🔗 Generating test magic link...");

  try {
    const zohoId = "test-zoho-id-123";
    const loginCode = crypto.randomBytes(16).toString("hex");

    const signupLink = await prisma.signupLink.create({
      data: {
        zoho_id: zohoId,
        login_code: loginCode,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        usage_limit: 10,
        usage_count: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("✅ Test magic link generated:");
    console.log(`URL: http://localhost:3000/magic-link/${zohoId}/${loginCode}`);
    console.log(`API: http://localhost:3000/api/crm/${zohoId}/${loginCode}`);
    console.log(`Expires: ${signupLink.expires_at.toISOString()}`);
    console.log(`Usage Limit: ${signupLink.usage_limit}`);

    return signupLink;
  } catch (error) {
    console.error("❌ Error generating magic link:", error);
    throw error;
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "setup":
      await setupTestData();
      break;
    case "cleanup":
      await cleanupTestData();
      break;
    case "magic-link":
      await generateTestMagicLink();
      break;
    default:
      console.log("Usage:");
      console.log("  node setup-test-data.js setup     - Set up all test data");
      console.log(
        "  node setup-test-data.js cleanup   - Clean up all test data",
      );
      console.log(
        "  node setup-test-data.js magic-link - Generate a new magic link",
      );
      break;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}

module.exports = {
  setupTestData,
  cleanupTestData,
  generateTestMagicLink,
  TEST_DATA,
};
