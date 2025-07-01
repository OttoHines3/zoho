#!/usr/bin/env node

/**
 * Test Data Setup Script
 * Creates test data in the database for comprehensive application testing
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Test data configuration
const TEST_DATA = {
  user: {
    email: "test@example.com",
    password: "testpassword123", // plain text password
    name: "Test User",
  },
  checkoutSession: {
    id: "test-checkout-session-123",
    status: "requires_payment_method",
    createdAt: new Date(),
    updatedAt: new Date(),
    // userId will be set by relation
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
    // checkoutSessionId will be set by relation
  },
  agreement: {
    provider: "docusign",
    envelopeId: "test-envelope-123",
    status: "sent",
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // checkoutSessionId will be set by relation
  },
  zohoAccountLink: {
    zohoUserId: "test-zoho-id-123",
    orgId: "test-org-id-123",
    refreshToken: "test-refresh-token",
    // userId will be set by relation
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  salesOrder: {
    zohoSalesOrderId: "test-sales-order-123",
    amount: 29900,
    currency: "usd",
    createdAt: new Date(),
    updatedAt: new Date(),
    // checkoutSessionId will be set by relation
  },
  // signupLink removed or commented out
};

async function setupTestData() {
  console.log("🚀 Setting up test data...");

  try {
    // Clean up existing test data
    console.log("🧹 Cleaning up existing test data...");
    await cleanupTestData();

    // Hash the test user's password
    const hashedPassword = await bcrypt.hash(TEST_DATA.user.password, 12);

    // Create test user
    console.log("👤 Creating test user...");
    const user = await prisma.user.upsert({
      where: { email: TEST_DATA.user.email },
      update: {},
      create: {
        id: "test-user-id-123",
        email: TEST_DATA.user.email,
        password: hashedPassword,
        name: TEST_DATA.user.name,
        emailVerified: new Date(),
      },
    });
    console.log("✅ Test user created:", user.email);

    // Create test checkout session
    console.log("💳 Creating test checkout session...");
    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        ...TEST_DATA.checkoutSession,
        user: { connect: { email: TEST_DATA.user.email } },
      },
    });
    console.log("✅ Test checkout session created:", checkoutSession.id);

    // Create test company info
    console.log("🏢 Creating test company info...");
    const companyInfo = await prisma.companyInfo.create({
      data: {
        ...TEST_DATA.companyInfo,
        checkoutSessionId: checkoutSession.id,
      },
    });
    console.log("✅ Test company info created:", companyInfo.companyName);

    // Create test agreement
    console.log("📄 Creating test agreement...");
    const agreement = await prisma.agreementSignatureStatus.create({
      data: {
        ...TEST_DATA.agreement,
        checkoutSessionId: checkoutSession.id,
      },
    });
    console.log("✅ Test agreement created:", agreement.envelopeId);

    // Create test Zoho account link
    console.log("🔗 Creating test Zoho account link...");
    const zohoLink = await prisma.zohoAccountLink.create({
      data: {
        ...TEST_DATA.zohoAccountLink,
        userId: user.id,
      },
    });
    console.log("✅ Test Zoho account link created:", zohoLink.zohoUserId);

    // Create test sales order
    console.log("📋 Creating test sales order...");
    const salesOrder = await prisma.salesOrder.create({
      data: {
        ...TEST_DATA.salesOrder,
        checkoutSessionId: checkoutSession.id,
      },
    });
    console.log("✅ Test sales order created:", salesOrder.zohoSalesOrderId);

    // Create test signup link
    console.log("🔗 Creating test signup link...");
    // const signupLink = await prisma.signupLink.create({
    //   data: TEST_DATA.signupLink,
    // });
    // console.log("✅ Test signup link created:", signupLink.login_code);

    console.log("\n🎉 Test data setup completed successfully!");
    console.log("\n📋 Test Data Summary:");
    console.log(`👤 User: ${user.email}`);
    console.log(`💳 Checkout Session: ${checkoutSession.id}`);
    console.log(`🏢 Company: ${companyInfo.companyName}`);
    console.log(`📄 Agreement: ${agreement.envelopeId}`);
    console.log(`🔗 Zoho ID: ${zohoLink.zohoUserId}`);
    console.log(`📋 Sales Order: ${salesOrder.zohoSalesOrderId}`);
    // console.log(`🔗 Magic Link: ${signupLink.login_code}`);

    console.log("\n🔗 Test URLs:");
    console.log(`Dashboard: http://localhost:3000/dashboard`);
    // console.log(
    //   `Magic Link: http://localhost:3000/magic-link/${zohoLink.zoho_id}/${signupLink.login_code}`,
    // );
    // console.log(
    //   `CRM API: http://localhost:3000/api/crm/${zohoLink.zoho_id}/${signupLink.login_code}`,
    // );
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
    // await prisma.signupLink.deleteMany({
    //   where: { zoho_id: { startsWith: "test-" } },
    // });

    await prisma.salesOrder.deleteMany({
      where: { zohoSalesOrderId: { startsWith: "test-" } },
    });

    await prisma.zohoAccountLink.deleteMany({
      where: { zohoUserId: { startsWith: "test-" } },
    });

    await prisma.agreementSignatureStatus.deleteMany({
      where: { checkoutSessionId: { startsWith: "test-" } },
    });

    await prisma.companyInfo.deleteMany({
      where: { checkoutSessionId: { startsWith: "test-" } },
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
