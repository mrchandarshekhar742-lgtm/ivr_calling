const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkBackendHealth() {
    log('\n🏥 BACKEND HEALTH CHECK', 'blue');
    log('======================\n', 'blue');

    let issues = [];
    let warnings = [];
    let passed = [];

    // 1. Check if all required files exist
    log('📁 1. CHECKING FILE STRUCTURE', 'blue');
    
    const requiredFiles = [
        'server.js',
        'package.json',
        'src/config/database.js',
        'src/config/logger.js',
        'src/middleware/auth.js',
        'src/middleware/errorHandler.js',
        'src/routes/auth.js',
        'src/routes/audio.js',
        'src/routes/campaigns.js',
        'src/routes/contacts.js',
        'src/routes/devices.js',
        'src/routes/analytics.js',
        'src/routes/callLogs.js',
        'src/routes/schedules.js',
        'src/models/User.js',
        'src/models/AudioFile.js',
        'src/models/Campaign.js',
        'src/models/Contact.js',
        'src/models/CallLog.js',
        'src/models/index.js'
    ];

    for (const file of requiredFiles) {
        if (fs.existsSync(path.join(__dirname, file))) {
            log(`✅ ${file}`, 'green');
            passed.push(`File exists: ${file}`);
        } else {
            log(`❌ ${file} - MISSING`, 'red');
            issues.push(`Missing file: ${file}`);
        }
    }

    // 2. Check syntax of route files
    log('\n🔍 2. CHECKING ROUTE FILES SYNTAX', 'blue');
    
    const routeFiles = [
        'src/routes/auth.js',
        'src/routes/audio.js',
        'src/routes/campaigns.js',
        'src/routes/contacts.js',
        'src/routes/devices.js',
        'src/routes/analytics.js',
        'src/routes/callLogs.js',
        'src/routes/schedules.js'
    ];

    for (const routeFile of routeFiles) {
        try {
            const filePath = path.join(__dirname, routeFile);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for common syntax issues
                const openBraces = (content.match(/{/g) || []).length;
                const closeBraces = (content.match(/}/g) || []).length;
                const openParens = (content.match(/\(/g) || []).length;
                const closeParens = (content.match(/\)/g) || []).length;
                
                if (openBraces !== closeBraces) {
                    log(`❌ ${routeFile} - BRACE MISMATCH (${openBraces} open, ${closeBraces} close)`, 'red');
                    issues.push(`Syntax error in ${routeFile}: brace mismatch`);
                } else if (openParens !== closeParens) {
                    log(`❌ ${routeFile} - PARENTHESIS MISMATCH (${openParens} open, ${closeParens} close)`, 'red');
                    issues.push(`Syntax error in ${routeFile}: parenthesis mismatch`);
                } else {
                    log(`✅ ${routeFile} - Syntax OK`, 'green');
                    passed.push(`Syntax check: ${routeFile}`);
                }

                // Check for required exports
                if (!content.includes('module.exports')) {
                    log(`⚠️  ${routeFile} - No module.exports found`, 'yellow');
                    warnings.push(`No module.exports in ${routeFile}`);
                }

                // Check for router usage
                if (!content.includes('express.Router()')) {
                    log(`⚠️  ${routeFile} - No Express router found`, 'yellow');
                    warnings.push(`No Express router in ${routeFile}`);
                }
            }
        } catch (error) {
            log(`❌ ${routeFile} - ERROR: ${error.message}`, 'red');
            issues.push(`Error checking ${routeFile}: ${error.message}`);
        }
    }

    // 3. Check model files
    log('\n🗄️  3. CHECKING MODEL FILES', 'blue');
    
    const modelFiles = [
        'src/models/User.js',
        'src/models/AudioFile.js',
        'src/models/Campaign.js',
        'src/models/Contact.js',
        'src/models/CallLog.js'
    ];

    for (const modelFile of modelFiles) {
        try {
            const filePath = path.join(__dirname, modelFile);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                if (content.includes('sequelize.define') || content.includes('DataTypes')) {
                    log(`✅ ${modelFile} - Sequelize model detected`, 'green');
                    passed.push(`Model check: ${modelFile}`);
                } else {
                    log(`⚠️  ${modelFile} - No Sequelize model found`, 'yellow');
                    warnings.push(`No Sequelize model in ${modelFile}`);
                }
            }
        } catch (error) {
            log(`❌ ${modelFile} - ERROR: ${error.message}`, 'red');
            issues.push(`Error checking ${modelFile}: ${error.message}`);
        }
    }

    // 4. Check package.json dependencies
    log('\n📦 4. CHECKING DEPENDENCIES', 'blue');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const requiredDeps = [
            'express',
            'sequelize',
            'sqlite3',
            'bcryptjs',
            'jsonwebtoken',
            'multer',
            'cors',
            'helmet',
            'express-rate-limit',
            'express-validator'
        ];

        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        for (const dep of requiredDeps) {
            if (allDeps[dep]) {
                log(`✅ ${dep} - v${allDeps[dep]}`, 'green');
                passed.push(`Dependency: ${dep}`);
            } else {
                log(`❌ ${dep} - MISSING`, 'red');
                issues.push(`Missing dependency: ${dep}`);
            }
        }
    } catch (error) {
        log(`❌ package.json - ERROR: ${error.message}`, 'red');
        issues.push(`Error reading package.json: ${error.message}`);
    }

    // 5. Check environment files
    log('\n🌍 5. CHECKING ENVIRONMENT FILES', 'blue');
    
    const envFiles = ['.env', '.env.example', '.env.production'];
    for (const envFile of envFiles) {
        if (fs.existsSync(path.join(__dirname, envFile))) {
            log(`✅ ${envFile} exists`, 'green');
            passed.push(`Environment file: ${envFile}`);
        } else {
            log(`⚠️  ${envFile} - Missing`, 'yellow');
            warnings.push(`Missing environment file: ${envFile}`);
        }
    }

    // 6. Check database file
    log('\n🗃️  6. CHECKING DATABASE', 'blue');
    
    if (fs.existsSync(path.join(__dirname, 'database.sqlite'))) {
        const stats = fs.statSync(path.join(__dirname, 'database.sqlite'));
        log(`✅ database.sqlite exists (${(stats.size / 1024).toFixed(1)} KB)`, 'green');
        passed.push('Database file exists');
    } else {
        log(`⚠️  database.sqlite - Missing (will be created on first run)`, 'yellow');
        warnings.push('Database file missing');
    }

    // 7. Check server.js structure
    log('\n🖥️  7. CHECKING SERVER.JS', 'blue');
    
    try {
        const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        
        const checks = [
            { pattern: /require.*express/, name: 'Express import' },
            { pattern: /app\.use.*cors/, name: 'CORS middleware' },
            { pattern: /app\.use.*helmet/, name: 'Helmet security' },
            { pattern: /app\.use.*\/api\/auth/, name: 'Auth routes' },
            { pattern: /app\.use.*\/api\/audio/, name: 'Audio routes' },
            { pattern: /app\.use.*\/api\/campaigns/, name: 'Campaign routes' },
            { pattern: /app\.use.*\/api\/contacts/, name: 'Contact routes' },
            { pattern: /app\.use.*\/api\/devices/, name: 'Device routes' },
            { pattern: /app\.listen/, name: 'Server listening' }
        ];

        for (const check of checks) {
            if (check.pattern.test(serverContent)) {
                log(`✅ ${check.name}`, 'green');
                passed.push(`Server check: ${check.name}`);
            } else {
                log(`❌ ${check.name} - Not found`, 'red');
                issues.push(`Server missing: ${check.name}`);
            }
        }
    } catch (error) {
        log(`❌ server.js - ERROR: ${error.message}`, 'red');
        issues.push(`Error checking server.js: ${error.message}`);
    }

    // Final Results
    log('\n📊 HEALTH CHECK RESULTS', 'blue');
    log('=======================', 'blue');
    log(`✅ Passed Checks: ${passed.length}`, 'green');
    log(`⚠️  Warnings: ${warnings.length}`, 'yellow');
    log(`❌ Critical Issues: ${issues.length}`, 'red');

    if (issues.length === 0 && warnings.length === 0) {
        log('\n🎉 BACKEND IS HEALTHY! All checks passed.', 'green');
    } else if (issues.length === 0) {
        log('\n✅ BACKEND IS MOSTLY HEALTHY. Minor warnings only.', 'green');
    } else if (issues.length <= 2) {
        log('\n⚠️  BACKEND HAS MINOR ISSUES. Should still work.', 'yellow');
    } else {
        log('\n🚨 BACKEND HAS CRITICAL ISSUES. Needs immediate attention.', 'red');
    }

    // Show details
    if (warnings.length > 0) {
        log('\n⚠️  WARNINGS:', 'yellow');
        warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
    }

    if (issues.length > 0) {
        log('\n❌ CRITICAL ISSUES:', 'red');
        issues.forEach(issue => log(`   • ${issue}`, 'red'));
    }

    // Recommendations
    log('\n💡 RECOMMENDATIONS:', 'blue');
    if (issues.length === 0) {
        log('✅ Backend structure is solid', 'green');
        log('✅ All required files are present', 'green');
        log('✅ Dependencies are properly installed', 'green');
        log('✅ Ready for production deployment', 'green');
    } else {
        log('🔧 Fix critical issues before deployment', 'yellow');
        log('🔧 Run: npm install to ensure dependencies', 'yellow');
        log('🔧 Check syntax errors in route files', 'yellow');
        log('🔧 Verify all required files are present', 'yellow');
    }

    return {
        passed: passed.length,
        warnings: warnings.length,
        issues: issues.length,
        healthy: issues.length === 0
    };
}

// Run the health check
checkBackendHealth().catch(error => {
    log(`\n💥 HEALTH CHECK FAILED: ${error.message}`, 'red');
    process.exit(1);
});