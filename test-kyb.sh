#!/bin/bash

# KYB API Test Script
# Make sure TEST_MODE=true is set in your .env file

BASE_URL="http://localhost:4000"
TOKEN="test-token"

echo "🚀 Starting KYB Test Flow..."
echo "Using test token: $TOKEN"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Start KYB
echo -e "${YELLOW}1. Starting KYB process...${NC}"
START_RESPONSE=$(curl -s -X POST $BASE_URL/kyb/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $START_RESPONSE"
echo ""

KYB_ID=$(echo $START_RESPONSE | grep -o '"kybId":"[^"]*' | cut -d'"' -f4)

if [ -z "$KYB_ID" ]; then
  echo -e "${RED}❌ Failed to start KYB. Please check:${NC}"
  echo "  1. Server is running on $BASE_URL"
  echo "  2. TEST_MODE=true is set in .env"
  echo "  3. Response: $START_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ KYB Started! ID: $KYB_ID${NC}"
echo ""

# 2. Get Status
echo -e "${YELLOW}2. Getting KYB status...${NC}"
curl -s -X GET $BASE_URL/kyb/status \
  -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "Status retrieved"
echo ""

# 3. Update Business Profile
echo -e "${YELLOW}3. Updating Business Profile...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BUSINESS_PROFILE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"entityType":"Pvt Ltd"}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Business Profile updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 4. Update Business Identity
echo -e "${YELLOW}4. Updating Business Identity...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BUSINESS_IDENTITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"legalName":"Test Company Pvt Ltd","registrationNumber":"U72900KA2020PTC123456"}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Business Identity updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 5. Update Business Address
echo -e "${YELLOW}5. Updating Business Address...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BUSINESS_ADDRESS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"registeredAddress":{"line1":"123 Business St","city":"Bangalore","state":"Karnataka","postalCode":"560001","country":"India"},"operatingAddress":{"line1":"123 Business St","city":"Bangalore","state":"Karnataka","postalCode":"560001","country":"India"}}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Business Address updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 6. Update Ownership Structure
echo -e "${YELLOW}6. Updating Ownership Structure...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/OWNERSHIP_STRUCTURE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"owners":[{"type":"individual","name":"John Doe","percentage":100,"pepFlag":false}]}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Ownership Structure updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 7. Update Management & Authority
echo -e "${YELLOW}7. Updating Management & Authority...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/MANAGEMENT_AUTHORITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"directors":[{"name":"John Doe","designation":"Director","email":"john@test.com","phone":"+919876543210"}]}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Management & Authority updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 8. Upload Document
echo -e "${YELLOW}8. Uploading Document...${NC}"
curl -s -X POST $BASE_URL/kyb/$KYB_ID/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sectionKey":"STATUTORY_DOCUMENTS","documentType":"Certificate of Incorporation","documentName":"COI.pdf","fileUrl":"https://example.com/coi.pdf"}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Document uploaded${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 9. Update Bank Account Declaration
echo -e "${YELLOW}9. Updating Bank Account Declaration...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BANK_ACCOUNT_DECLARATION \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"accountNumber":"1234567890","bankName":"HDFC Bank","accountHolderName":"Test Company Pvt Ltd"}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Bank Account Declaration updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 10. Update Business Activity Declaration
echo -e "${YELLOW}10. Updating Business Activity Declaration...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BUSINESS_ACTIVITY_DECLARATION \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"intendedServices":["Payment Processing"],"expectedVolume":1000000,"expectedTransactionCount":50000}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Business Activity Declaration updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 11. Update Risk & Regulatory Declarations
echo -e "${YELLOW}11. Updating Risk & Regulatory Declarations...${NC}"
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/RISK_REGULATORY_DECLARATIONS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"sanctionsCheck":false,"litigationCheck":false,"regulatoryActionCheck":false}}' | jq '.' 2>/dev/null && echo -e "${GREEN}✅ Risk & Regulatory Declarations updated${NC}" || echo -e "${RED}❌ Failed${NC}"
echo ""

# 12. Check Final Status
echo -e "${YELLOW}12. Checking final status...${NC}"
curl -s -X GET $BASE_URL/kyb/status \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 13. Submit KYB
echo -e "${YELLOW}13. Submitting KYB application...${NC}"
SUBMIT_RESPONSE=$(curl -s -X POST $BASE_URL/kyb/$KYB_ID/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$SUBMIT_RESPONSE" | jq '.' 2>/dev/null || echo "$SUBMIT_RESPONSE"

if echo "$SUBMIT_RESPONSE" | grep -q "success.*true"; then
  echo -e "${GREEN}✅ KYB Submitted Successfully!${NC}"
else
  echo -e "${RED}❌ Submission failed. Check if all sections are completed.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Test Flow Completed!${NC}"
echo "KYB ID: $KYB_ID"
echo "Use this ID for further testing or admin actions."

