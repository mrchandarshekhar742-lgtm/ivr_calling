const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function checkLoginIssue() {
    console.log('🔍 CHECKING LOGIN ISSUE');
    console.log('======================\n');

    try {
        // Check if admin user exists
        const adminUser = await User.findOne({
            where: { email: 'admin@ivr.com' }
        });

        if (!adminUser) {
            console.log('❌ Admin user not found. Creating admin user...');
            
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@ivr.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });
            
            console.log('✅ Admin user created:', newAdmin.email);
        } else {
            console.log('✅ Admin user exists:', adminUser.email);
            
            // Check password
            const isValidPassword = await bcrypt.compare('admin123', adminUser.password);
            if (isValidPassword) {
                console.log('✅ Password is correct');
            } else {
                console.log('❌ Password is incorrect. Updating password...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await adminUser.update({ password: hashedPassword });
                console.log('✅ Password updated');
            }
        }

        // Test database connection
        const userCount = await User.count();
        console.log(`✅ Database connected. Total users: ${userCount}`);

    } catch (error) {
        console.log('❌ Database error:', error.message);
    }
}

checkLoginIssue();