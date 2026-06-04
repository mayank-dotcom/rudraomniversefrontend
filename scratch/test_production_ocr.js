const axios = require('axios');

async function testOCR() {
    const adminKey = 'rx_admin_1212717f04b965a80eee54db0eb6777ff86a33730b64cd4ccf5fceb7331757ed';
    const baseUrl = 'https://rudra-omniverse-2-0.onrender.com/api/v1';

    try {
        console.log('--- Step 1: Onboarding a Test School to get a valid API Key ---');
        const onboardRes = await axios.post(`${baseUrl}/admin/onboard-school`, {
            school_name: "OCR Test School " + Date.now(),
            school_code: "TSOCR-" + Math.floor(Math.random() * 10000),
            admin_name: "Test Admin",
            admin_email: `admin_ocr_${Date.now()}@test.com`,
            admin_password: "password123",
            allowed_features: ["student_mode", "persona_mode"]
        }, {
            headers: { 'x-admin-key': adminKey }
        });

        const apiKey = onboardRes.data.admin.api_key;
        console.log('Successfully onboarded. API Key:', apiKey);

        console.log('\n--- Step 2: Querying Subscription Status (to check OCR limit) ---');
        const statusRes = await axios.get(`${baseUrl}/subscription/status`, {
            headers: { 'x-api-key': apiKey }
        });
        console.log('Plan:', statusRes.data.subscription.plan_name);
        console.log('Remaining Tokens:', statusRes.data.tokens_remaining);
        console.log('OCR Limit:', statusRes.data.subscription.details.ocr_limit);
        console.log('OCR Pages Used:', statusRes.data.usage.ocr_pages_used);

        console.log('\n--- Step 3: Making OCR Call with 1x1 transparent PNG base64 data ---');
        const png1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const ocrPayload = {
            modality: 'ocr',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Please extract all text visible in this image.' },
                        { type: 'image_url', image_url: { url: png1x1 } }
                    ]
                }
            ]
        };

        const ocrRes = await axios.post(`${baseUrl}/features/pdf/intel`, ocrPayload, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('OCR Success Response:', JSON.stringify(ocrRes.data, null, 2));

    } catch (e) {
        console.error('Test failed with error:', e.response?.data || e.message);
    }
}

testOCR();
