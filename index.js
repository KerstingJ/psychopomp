const fs = require("fs");
const path = require("path");
const readline = require("readline");
//import something from "somewhere"

const test = require("./src/psychopomp");
const test2 = require("./src/utills");

const isWin = /^win/.test(process.platform) ? true : false;

// get the list of all files/dirs in the given directory
// for each file in that list - add file to importCounts then read File and count imports
// for each dir in that list - enter dir and list file
const importCounts = new Map();

const queue = [["", ""]]; // This is our entrypoint
let promiseList = [];
while (queue.length > 0) {
  const [name, currentPath] = queue.pop();
  const currentLocation = path.join(currentPath, name);

  // What are we working with
  // I think there is a better way to do this :think:
  const item = fs.statSync(path.join(process.cwd(), currentLocation));

  if (item.isDirectory()) {
    // If item is a directory push the new files to the queue
    const fileList = fs.readdirSync(currentLocation);
    fileList.forEach(item => {
      // for now ignore hidden dirs like .git
      if (item.slice(0, 1) !== ".") queue.push([item, currentLocation]);
    });
  } else if (item.isFile()) {
    // if we have a js file
    if (name.match(/\.js$/)) {
      // I dont know that we need to do this but will decide later
      if (!importCounts.has(currentLocation))
        importCounts.set(currentLocation, 0);

      //
      promiseList.push(getImportsFromFile(name, currentPath));
    }
  }
}

printFiles();

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

    // TODO: research more what this is doing
    const readInterface = readline.createInterface({
      input: fs.createReadStream(currentLocation),
      console: false
    });

    readInterface.on("line", line => parseImport(line, currentPath));

    readInterface.on("close", () => {
      resolve(true);
    });
  });
}

function parseImport(line, currentPath) {
  const importPath = getImportPath(line);
  if (importPath) {
    // resolve import path to path from root
    let filePath = getFilePath(importPath, currentPath);
    // now the path should match the filepath
    if (importCounts.has(filePath)) {
      importCounts.set(filePath, importCounts.get(filePath) + 1);
    } else {
      importCounts.set(filePath, 1);
    }
  }
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
    line.match(/require\(["']([\w./]+)["']\)/) ||
    line.match(/import [\w\d{},]+ from ['"]([\w./]+)['"];?/);
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
  let importPath;
  if (currentPath === ".") {
    importPath = importName.replace("./", "");
  } else {
    importPath = importName.replace(".", currentPath);
  }
  // adjust importPath for OS
  adjustedPath = isWin ? importPath.replace("/", "\\") : importPath;
  // add filetype
  let { length } = adjustedPath;
  const fileName =
    adjustedPath.slice(length - 3, length) === ".js"
      ? adjustedPath
      : `${adjustedPath}.js`;

  return fileName;
}

async function printFiles() {
  Promise.all(promiseList).then(() => {
    console.log(importCounts);
  });
}
