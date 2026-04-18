const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const changedNames = new Set();

// 1. Rename files/folders starting with _
function renameRecursively(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            renameRecursively(fullPath);
        }

        if (item.name.startsWith('_')) {
            const newName = item.name.replace(/^_/, 'ext-'); 
            const newPath = path.join(dir, newName);
            fs.renameSync(fullPath, newPath);
            changedNames.add({ old: item.name, new: newName });
            console.log(`Renamed: ${item.name} -> ${newName}`);
        }
    }
}

// 2. Update paths AND Rip out illegal inline scripts
function updateCodeReferences(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            updateCodeReferences(fullPath);
        } else if (/\.(html|js|css|json|map)$/.test(item.name)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Fix the _next paths
            changedNames.forEach(({ old: oldName, new: newName }) => {
                const slashRegex = new RegExp(`/${oldName}`, 'g');
                const quoteRegex = new RegExp(`"${oldName}`, 'g');
                content = content.replace(slashRegex, `/${newName}`);
                content = content.replace(quoteRegex, `"${newName}`);
            });

            // >>> THE MAGIC: Extract Inline Scripts from HTML <<<
            if (item.name.endsWith('.html')) {
                let scriptCounter = 0;
                // Find all <script> tags and their contents
                content = content.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attributes, innerText) => {
                    // If the script actually contains code (not just a src attribute)
                    if (innerText.trim() !== '') {
                        const fileName = `inline-${item.name.replace('.html', '')}-${scriptCounter++}.js`;
                        const filePath = path.join(dir, fileName);
                        
                        // Save the illegal inline code to a safe external file
                        fs.writeFileSync(filePath, innerText, 'utf8');
                        console.log(`Extracted inline script to: ${fileName}`);
                        
                        // Replace the inline block with a safe external link
                        return `<script${attributes} src="./${fileName}"></script>`;
                    }
                    return match;
                });
            }

            // Only overwrite if we actually changed something
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

console.log('Starting deep-scan rename and script extraction...');
renameRecursively(outDir);
console.log('Updating internal code references and extracting inline scripts...');
updateCodeReferences(outDir);
console.log('✅ Chrome Extension build completely sanitized!');