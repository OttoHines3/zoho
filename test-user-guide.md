# Comprehensive Test User Guide

This guide will help you thoroughly test the entire Zoho integration application from start to finish.

## Prerequisites

1. **Environment Setup**
   - Ensure all environment variables are configured in `.env.local`
   - Database is running and migrations are applied
   - Application is running on `http://localhost:3000`

2. **Required Environment Variables**
   ```bash
   DATABASE_URL="postgresql://..."
   AUTH_SECRET="your-auth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   DOCUSIGN_ACCOUNT_ID="your-docusign-account-id"
   DOCUSIGN_USER_ID="your-docusign-user-id"
   DOCUSIGN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   DOCUSIGN_CLIENT_ID="your-docusign-client-id"
   ZOHO_ACCESS_TOKEN="your-zoho-access-token"
   ```

## Test User Data

### Test User Account

- **Email**: `test@example.com`
- **Password**: `testpassword123`
- **Name**: `Test User`

### Test Company Information

- **Company Name**: `Test Company Inc.`
- **Contact Name**: `John Test Smith`
- **Email**: `john.smith@testcompany.com`
- **Phone**: `+1-555-123-4567`
- **Address**: `123 Test Street`
- **City**: `Test City`
- **State**: `CA`
- **Zip Code**: `90210`
- **Country**: `US`
- **Industry**: `Technology`
- **Company Size**: `10-50 employees`

## Test Scenarios

### 1. Home Page & Navigation

**Objective**: Verify the application loads and navigation works

**Steps**:

1. Open `http://localhost:3000`
2. Verify the home page loads with proper styling
3. Check that all navigation links are present
4. Test responsive design on different screen sizes

**Expected Results**:

- ✅ Home page loads without errors
- ✅ All UI components render correctly
- ✅ Navigation is functional

### 2. Authentication System

**Objective**: Test user authentication flow

**Steps**:

1. Navigate to `/signin`
2. Try accessing `/dashboard` without authentication (should redirect)
3. Test signin with valid credentials
4. Test signin with invalid credentials
5. Test signout functionality

**Expected Results**:

- ✅ Signin page loads correctly
- ✅ Unauthenticated users are redirected
- ✅ Valid credentials allow access
- ✅ Invalid credentials show error messages
- ✅ Signout works properly

### 3. Checkout Flow - Step 1 (Payment)

**Objective**: Test module selection and payment processing

**Steps**:

1. Navigate to `/checkout/step-1`
2. Select different modules (CRM, Sales, Marketing)
3. Verify pricing updates correctly
4. Enter test Stripe card details:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: `12/25`
   - **CVC**: `123`
   - **ZIP**: `90210`
5. Submit payment
6. Verify payment intent creation

**Expected Results**:

- ✅ Module selection works
- ✅ Pricing calculations are correct
- ✅ Stripe integration functions
- ✅ Payment intent is created
- ✅ User proceeds to step 2

### 4. Checkout Flow - Step 2 (Company Information)

**Objective**: Test company information collection

**Steps**:

1. After payment, navigate to `/checkout/step-2`
2. Fill out all company information fields
3. Test form validation:
   - Try submitting with empty required fields
   - Test email format validation
   - Test phone number format
4. Submit valid form data
5. Verify data is saved to database

**Expected Results**:

- ✅ Form loads with proper validation
- ✅ Required field validation works
- ✅ Email format validation works
- ✅ Data is saved to database
- ✅ User proceeds to step 3

### 5. Checkout Flow - Step 3 (Agreement Signing)

**Objective**: Test DocuSign integration

**Steps**:

1. Navigate to `/checkout/step-3`
2. Verify DocuSign iframe loads
3. Test agreement signing process
4. Verify webhook receives completion event
5. Check agreement status in database

**Expected Results**:

- ✅ DocuSign iframe loads
- ✅ Agreement can be signed
- ✅ Webhook processes completion
- ✅ Database is updated with agreement status

### 6. Dashboard Functionality

**Objective**: Test admin dashboard features

**Steps**:

1. Sign in as admin user
2. Navigate to `/dashboard`
3. Test all dashboard tabs:
   - **Checkout Sessions**: View all sessions
   - **Company Info**: View company data
   - **Agreements**: View agreement statuses
   - **Zoho Integration**: Test contact creation
   - **CRM Data**: View fetched CRM data
   - **Magic Links**: Generate and manage links

**Expected Results**:

- ✅ All dashboard tabs load correctly
- ✅ Data is displayed properly
- ✅ CRUD operations work
- ✅ Real-time updates function

### 7. Zoho Integration Testing

**Objective**: Test Zoho CRM integration

**Steps**:

1. In dashboard, go to "Zoho Integration" tab
2. Test contact creation:
   - Enter contact details
   - Submit to create Zoho contact
   - Verify contact appears in Zoho CRM
3. Test contact search:
   - Search for existing contacts
   - Verify search results
4. Test sales order creation:
   - Create sales order for existing contact
   - Verify order appears in Zoho CRM

**Expected Results**:

- ✅ Contact creation works
- ✅ Contact search functions
- ✅ Sales order creation works
- ✅ Data syncs with Zoho CRM

### 8. CRM Data Fetching

**Objective**: Test CRM data retrieval

**Steps**:

1. In dashboard, go to "CRM Data" tab
2. Test data fetching for different types:
   - Contacts
   - Sales Orders
   - Deals
   - Tasks
   - Notes
3. Test data inclusion options
4. Verify data is displayed correctly

**Expected Results**:

- ✅ All data types are fetched
- ✅ Data is displayed properly
- ✅ Inclusion options work
- ✅ Error handling functions

### 9. Magic Link System

**Objective**: Test pre-loaded signup link functionality

**Steps**:

1. In dashboard, go to "Magic Links" tab
2. Generate a new magic link:
   - Set expiration (e.g., 7 days)
   - Set usage limit (e.g., 5 uses)
   - Generate link
3. Copy the generated link
4. Open link in incognito/private browser
5. Test link validation:
   - Verify link works for valid Zoho ID
   - Test expired link
   - Test exceeded usage limit
   - Test invalid login code

**Expected Results**:

- ✅ Magic link generation works
- ✅ Links are secure and unique
- ✅ Expiration handling works
- ✅ Usage limits are enforced
- ✅ Invalid links are rejected

### 10. Public API Testing

**Objective**: Test public CRM data access

**Steps**:

1. Use a valid magic link URL
2. Test API endpoint: `/api/crm/{zohoId}/{loginCode}`
3. Test with different data inclusion parameters
4. Test error scenarios:
   - Invalid Zoho ID
   - Invalid login code
   - Expired link
   - Exceeded usage limit

**Expected Results**:

- ✅ API returns correct data
- ✅ Data inclusion options work
- ✅ Error responses are proper
- ✅ Security measures are enforced

### 11. Webhook Testing

**Objective**: Test webhook integrations

**Steps**:

1. **Stripe Webhook**:
   - Use Stripe CLI to simulate webhook events
   - Test payment confirmation
   - Test refund processing
2. **DocuSign Webhook**:
   - Simulate agreement completion
   - Verify database updates
   - Test error handling

**Expected Results**:

- ✅ Webhooks receive events
- ✅ Database is updated correctly
- ✅ Error handling works
- ✅ Logging is functional

### 12. Error Handling & Edge Cases

**Objective**: Test application resilience

**Steps**:

1. Test network failures
2. Test invalid data submissions
3. Test concurrent user access
4. Test large data sets
5. Test browser compatibility
6. Test mobile responsiveness

**Expected Results**:

- ✅ Graceful error handling
- ✅ User-friendly error messages
- ✅ Application remains stable
- ✅ Performance is acceptable

## Test Data Cleanup

After testing, clean up test data:

1. **Database Cleanup**:

   ```sql
   -- Remove test checkout sessions
   DELETE FROM checkout_session WHERE email = 'test@example.com';

   -- Remove test company info
   DELETE FROM company_info WHERE email = 'john.smith@testcompany.com';

   -- Remove test agreements
   DELETE FROM agreement WHERE checkout_session_id IN (
     SELECT id FROM checkout_session WHERE email = 'test@example.com'
   );

   -- Remove test signup links
   DELETE FROM signup_link WHERE zoho_id = 'test-zoho-id';
   ```

2. **Zoho CRM Cleanup**:
   - Remove test contacts created during testing
   - Remove test sales orders
   - Clean up any test data in Zoho CRM

## Performance Testing

### Load Testing

- Test with multiple concurrent users
- Monitor response times
- Check database performance
- Verify memory usage

### Security Testing

- Test authentication bypass attempts
- Test SQL injection attempts
- Test XSS vulnerabilities
- Test CSRF protection

## Browser Compatibility

Test the application in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Browser and version**
4. **Console errors**
5. **Network tab information**
6. **Screenshots if applicable**

## Success Criteria

The application is ready for production when:

- ✅ All test scenarios pass
- ✅ No critical errors occur
- ✅ Performance is acceptable
- ✅ Security measures are effective
- ✅ User experience is smooth
- ✅ Data integrity is maintained
- ✅ Integration points work reliably

## Next Steps

After successful testing:

1. Deploy to staging environment
2. Conduct user acceptance testing
3. Prepare production deployment
4. Set up monitoring and logging
5. Create user documentation
6. Plan maintenance schedule
