
import fs from 'fs';

const content = fs.readFileSync('src/translations.ts', 'utf8');

function findDuplicates(block) {
    const lines = block.split('\n');
    const keys = [];
    const duplicates = [];
    lines.forEach((line, index) => {
        const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
        if (match) {
            const key = match[1];
            if (keys.includes(key)) {
                duplicates.push({ key, line: index + 1 });
            }
            keys.push(key);
        }
    });
    return duplicates;
}

const enBlockMatch = content.match(/en: \{([\s\S]*?)\},/);
const ptBlockMatch = content.match(/pt: \{([\s\S]*?)\}/);

if (enBlockMatch) {
    console.log('EN Duplicates:');
    console.log(findDuplicates(enBlockMatch[1]));
}

if (ptBlockMatch) {
    console.log('PT Duplicates:');
    console.log(findDuplicates(ptBlockMatch[1]));
}
