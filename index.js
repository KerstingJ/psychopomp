const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Deque = require("collections/deque");
//import something from "somewhere"

const test = require("./src/psychopomp");
const test2 = require("./src/utills");

const isWin = /^win/.test(process.platform) ? true : false;

// get the list of all files/dirs in the given directory
// for each file in that list - add file to imports then read File and count imports
// for each dir in that list - enter dir and list file

/**
 * generateFileList navigates our project structure and
 */
function generateFileList() {
  const imports = new Set();
  const queue = new Deque([["", ""]]); // This is our entrypoint
  while (queue.length > 0) {
    const [name, currentPath] = queue.shift();
    const currentLocation = path.join(currentPath, name);

    // What are we working with
    // I think there is a better way to do this :think:
    const item = fs.statSync(path.join(process.cwd(), currentLocation));

    if (item.isDirectory()) {
      // Ignore node_modules
      if (currentLocation.match(/node_modules/)) continue;

      const fileList = fs.readdirSync(currentLocation);
      fileList.forEach(item => {
        // for now ignore hidden dirs like .git
        if (item.slice(0, 1) !== ".") queue.push([item, currentLocation]);
      });
    } else if (item.isFile()) {
      // if we have a js file
      if ([".js"].includes(path.extname(name))) {
        imports.add(currentLocation);
      }
    }
  }

  return imports;
}

/**
 *
 *  Defining Functions down here for now
 *  TODO: Everything down here should go into modules eventually
 *
 */

async function getImportsFromFile(name, currentPath) {
  // I wonder what would be the way to do this in Async/Await syntax?
  return new Promise((resolve, reject) => {
    const currentLocation = path.join(currentPath, name);
    let imports = [];

    // TODO: research more what this is doing
    const readInterface = readline.createInterface({
      input: fs.createReadStream(currentLocation),
      console: false
    });

    readInterface.on("line", line => {
      const _import = importFromLine(line);
      if (_import) imports.push(_import);
    });

    readInterface.on("close", () => resolve(imports));
  });
}

function importFromLine(line, currentPath) {
  const importPath = getImportPath(line);
  return importPath && getFilePath(importPath, currentPath);
}

/**
 * Uses Regex patterns to find import statements in a line of code
 * then returns the path used for the import
 *
 * ex. line `const myModule = require("./../myAwesomeModule")
 * would return "./../myAwesomeModule"
 *
 * returns null if no match found
 * @param {*} line
 */
function getImportPath(line) {
  // import with require or import
  let match =
    line.match(/require\(["']([\w\./@-]+)["']\)/) ||
    line.match(/import [\w\d{},]+ from ['"]([\w\./@-]+)['"];?/);
  return match ? match[1] : null;
}

/**
 * takes in the string used in an import statement and uses
 * that to determine the absolute path to a file location
 *
 * Needs to be built out more
 * @param {*} importName
 * @param {*} currentPath
 */
function getFilePath(importName, currentPath) {
  let importPath = path.join(currentPath, path.normalize(importName));
  return path.extname(importPath) ? importPath : `${importPath}.js`;
}

function navigateImports(imports, entry = "index.js") {
  console.log(imports);

  const queue = new Deque([[entry, ""]]);

  while (queue.length > 0) {
    const [currentFile, currentPath] = queue.shift();

    // Get a list of the
  }
}

navigateImports(generateFileList());
