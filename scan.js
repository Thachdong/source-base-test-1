const fs = require('fs');
const path = require('path');

/**
 * Recursively scans a directory for files with specific extensions.
 * Reads and returns the content of these files.
 * 
 * @param {string} dir - The directory to scan.
 * @param {Array<string>} extensions - An array of file extensions to filter.
 * @returns {Promise<Array<{ filePath: string, content: string }>>} - A promise that resolves to an array of objects containing file paths and contents.
 */
async function scanDirectory(dir, extensions = []) {
    const files = [];

    async function readDir(currentDir) {
        const items = await fs.promises.readdir(currentDir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(currentDir, item.name);

            if (item.isDirectory()) {
                await readDir(fullPath);
            } else if (item.isFile()) {
                if (extensions.length === 0 || extensions.includes(path.extname(item.name))) {
                    const content = await fs.promises.readFile(fullPath, 'utf8');
                    files.push({ filePath: fullPath, content });
                }
            }
        }
    }

    await readDir(dir);

    return files;
}

/**
 * Scans a directory and also includes specified external files.
 * 
 * @param {string} dir - The directory to scan.
 * @param {Array<string>} extensions - An array of file extensions to filter.
 * @param {Array<string>} externalFiles - An array of external file paths to include.
 * @returns {Promise<Array<{ filePath: string, content: string }>>} - A promise that resolves to an array of objects containing file paths and contents.
 */
async function scanFiles(dir, extensions = [], externalFiles = []) {
    // Scan the directory and get nested files
    const directoryFiles = await scanDirectory(dir, extensions);

    // Get the content of external files
    const externalFilePromises = externalFiles.map(async (filePath) => {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            return { filePath, content };
        } catch (error) {
            console.error(`Error reading external file ${filePath}:`, error);
            return null; // Return null if there's an error reading the file
        }
    });

    // Wait for all external file reads to complete
    const externalFileContents = await Promise.all(externalFilePromises);

    // Filter out any null results (files that failed to be read)
    const validExternalFileContents = externalFileContents.filter(file => file !== null);

    // Combine directory files and external file contents
    return directoryFiles.concat(validExternalFileContents);
}

// Usage Example:
const directoryToScan = './src'; // Replace with your directory
const fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss']; // Add your desired extensions
const externalFiles = ['tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs', 'package.json', 'next.config.mjs']; // Add external file paths

scanFiles(directoryToScan, fileExtensions, externalFiles)
    .then(result => {
        console.log('Found files with content:', result);
    })
    .catch(error => {
        console.error('Error scanning files:', error);
    });
