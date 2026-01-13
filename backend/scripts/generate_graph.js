
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'coverage'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (EXTENSIONS.includes(path.extname(file))) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function getImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = new Set();

    // Regex for ESM imports
    // import x from './path'
    // import { x } from './path'
    // import './path'
    const importRegex = /import\s+(?:(?:[\w{}\s,*]+)\s+from\s+)?['"](.*?)['"]/g;
    
    // Regex for CommonJS requires
    // const x = require('./path')
    const requireRegex = /require\s*\(\s*['"](.*?)['"]\s*\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.add(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
        imports.add(match[1]);
    }

    return Array.from(imports);
}

function resolvePath(currentFile, importPath) {
    // Ignore non-relative imports (modules)
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        return null; // external dependency
    }

    const currentDir = path.dirname(currentFile);
    let absolutePath;

    try {
        absolutePath = path.resolve(currentDir, importPath);
        
        // Handle missing extensions
        if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
             // check for index.js
             if (fs.existsSync(path.join(absolutePath, 'index.js'))) return path.join(absolutePath, 'index.js');
        } else if (!fs.existsSync(absolutePath)) {
            for (const ext of EXTENSIONS) {
                if (fs.existsSync(absolutePath + ext)) {
                    return absolutePath + ext;
                }
            }
            // If still not found, it might be a partial path or alias (not handling aliases for now)
            return null;
        }
        return absolutePath;
    } catch (e) {
        return null;
    }
}

function getRelativeName(fullPath) {
    return path.relative(backendRoot, fullPath).replace(/\\/g, '/');
}

const files = getAllFiles(backendRoot);
const nodes = new Set();
const edges = [];
const inDegree = {}; // node -> count

// Build Graph
files.forEach(file => {
    const sourceNode = getRelativeName(file);
    nodes.add(sourceNode);
    if (!inDegree[sourceNode]) inDegree[sourceNode] = 0;

    const imports = getImports(file);
    imports.forEach(imp => {
        const resolved = resolvePath(file, imp);
        if (resolved) {
            // Check if resolved is within backendRoot (ignore if outside, though unlikely with ./)
            if (resolved.startsWith(backendRoot)) {
                const targetNode = getRelativeName(resolved);
                nodes.add(targetNode);
                edges.push({ from: sourceNode, to: targetNode });
                
                if (!inDegree[targetNode]) inDegree[targetNode] = 0;
                inDegree[targetNode]++;
            }
        }
    });
});

// Cycle Detection logic
// A cycle exists if there's a path from target to source
// For edge A->B, check if B can reach A
function canReach(start, target, visited = new Set()) {
    if (start === target) return true;
    if (visited.has(start)) return false;
    visited.add(start);

    // Find all neighbors of start
    const neighbors = edges.filter(e => e.from === start).map(e => e.to);
    for (const neighbor of neighbors) {
        if (canReach(neighbor, target, visited)) return true;
    }
    return false;
}

const cycles = new Set(); // Store indices of edges that are part of a cycle

edges.forEach((edge, index) => {
    // DFS to check if edge.to can reach edge.from
    if (canReach(edge.to, edge.from)) {
        cycles.add(index);
    }
});

// Generate DOT
let dot = 'digraph DependencyGraph {\n';
dot += '    node [shape=box, style=filled, color="#2c3e50", fontcolor=white];\n';

// Add nodes with coloring for high in-degree
nodes.forEach(node => {
    if ((inDegree[node] || 0) > 5) {
        dot += `    "${node}" [color="#c0392b", fillcolor="#e74c3c", label="${node} (God Object?)"];\n`;
    } else {
        dot += `    "${node}";\n`;
    }
});

// Add edges
edges.forEach((edge, index) => {
    const isCycle = cycles.has(index);
    const style = isCycle ? ' [color="red", penwidth=2.5]' : '';
    dot += `    "${edge.from}" -> "${edge.to}"${style};\n`;
});

dot += '}';

const outputPath = path.join(backendRoot, 'dependency_graph.dot');
fs.writeFileSync(outputPath, dot);

console.log(`Graph generated! Copy content of ${outputPath} to https://dreampuf.github.io/GraphvizOnline/ to view.`);
