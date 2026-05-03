const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

console.log('--- SCAN RESULTS ---');

// 1. Check Duplicate IDs
const ids = content.match(/id="([^"]+)"/g) || [];
const idMap = {};
ids.forEach(id => {
    const val = id.split('"')[1];
    idMap[val] = (idMap[val] || 0) + 1;
});

const duplicates = Object.keys(idMap).filter(k => idMap[k] > 1);
if (duplicates.length > 0) {
    console.log('\u26A0 DUPLICATE IDs FOUND:');
    duplicates.forEach(k => console.log('  - ' + k + ' (' + idMap[k] + ' times)'));
} else {
    console.log('\u2705 No duplicate IDs found.');
}

// 2. Simple Tag Balancing (Ignoring self-closing and scripts)
const tags = [];
const tagRegex = /<(\/?[a-zA-Z1-6]+)(?:\s+[^>]*)?>/g;
let match;
const voidTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'keygen', 'param', 'track', 'wbr'];

while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    
    if (tagName.startsWith('/')) {
        const closingName = tagName.substring(1);
        if (tags.length > 0 && tags[tags.length - 1] === closingName) {
            tags.pop();
        } else {
            console.log('\u274C MISMATCHED TAG: Found ' + fullTag + ' but expected closing for <' + (tags[tags.length-1] || 'none') + '>');
        }
    } else {
        if (!voidTags.includes(tagName) && !fullTag.endsWith('/>')) {
            tags.push(tagName);
        }
    }
}

if (tags.length > 0) {
    console.log('\u26A0 UNCLOSED TAGS: ' + tags.join(', '));
} else {
    console.log('\u2705 All tags are balanced.');
}

// 3. Check for undefined function calls in onclick
const onClicks = content.match(/onclick="([^"]+)"/g) || [];
const functionRegex = /([a-zA-Z0-9_]+)\(/;
onClicks.forEach(oc => {
    const attr = oc.split('"')[1];
    const funcMatch = attr.match(functionRegex);
    if (funcMatch) {
        const funcName = funcMatch[1];
        if (!content.includes('function ' + funcName)) {
            // Check if it's a known native or common function
            const common = ['closeModal', 'openModal', 'confirm', 'alert', 'goTo', 'toggleTheme', 'toggleSetting', 'reEnableConsent', 'doRevokeConsent', 'showBypassModal', 'doSkip', 'playVerseAudio', 'toggleMic', 'showAnotherVerse', 'resetProgress', 'setDailyVerses', 'toggleReminderSetting', 'updateReminderTime', 'setReminderAndStart', 'skipReminder', 'showOnboardingStep'];
            if (!common.includes(funcName)) {
                console.log('\u26A0 POTENTIALLY UNDEFINED FUNCTION: ' + funcName + ' in ' + oc);
            }
        }
    }
});
