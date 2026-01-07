const { Campaign, AudioFile, User } = require('./src/models');

async function analyzeCampaignError() {
    console.log('🔍 ANALYZING CAMPAIGN CREATION ERROR');
    console.log('==================================\n');

    try {
        // Check if Campaign model exists and is properly defined
        console.log('1. Checking Campaign model...');
        const campaignAttributes = Object.keys(Campaign.rawAttributes);
        console.log('✅ Campaign attributes:', campaignAttributes);

        // Check if AudioFile model exists
        console.log('\n2. Checking AudioFile model...');
        const audioAttributes = Object.keys(AudioFile.rawAttributes);
        console.log('✅ AudioFile attributes:', audioAttributes);

        // Check if User model exists
        console.log('\n3. Checking User model...');
        const userAttributes = Object.keys(User.rawAttributes);
        console.log('✅ User attributes:', userAttributes);

        // Test campaign creation directly
        console.log('\n4. Testing campaign creation...');
        
        // Get a user first
        const user = await User.findOne();
        if (!user) {
            console.log('❌ No user found in database');
            return;
        }
        console.log('✅ User found:', user.email);

        // Try to create a campaign
        const campaignData = {
            name: 'Test Campaign ' + Date.now(),
            description: 'Test campaign for debugging',
            type: 'broadcast',
            createdBy: user.id,
            settings: {}
        };

        console.log('📤 Creating campaign with data:', JSON.stringify(campaignData, null, 2));

        const campaign = await Campaign.create(campaignData);
        console.log('✅ Campaign created successfully:', campaign.id);

        // Clean up test campaign
        await campaign.destroy();
        console.log('✅ Test campaign cleaned up');

    } catch (error) {
        console.log('❌ Error during analysis:', error.message);
        console.log('Stack trace:', error.stack);
    }
}

analyzeCampaignError();