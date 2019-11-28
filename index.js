const fs = require("fs");
const path = require("path");
const readline = require("readline");

const test = require("./src/psychopomp");
const test2 = require("./src/utills");

const isWin = /^win/.test(process.platform) ? true : false;

// get the list of all files/dirs in the given directory
// for each file in that list - add file to fileCounts then read File and count imports
// for each dir in that list - enter dir and list file
const fileCounts = new Map();
const queue = [["", ""]]; // This is our entrypoint

let promiseList = [];

while (queue.length > 0) {
  const [name, relativePath] = queue.pop();
  const currentLocation = path.join(relativePath, name);

  const item = fs.statSync(path.join(process.cwd(), currentLocation));
  if (item.isDirectory()) {
    // If item is a directory push the new files to the queue
    const fileList = fs.readdirSync(currentLocation);
    fileList.forEach(item => {
      // for now ignore hidden dirs like .git
      if (item.slice(0, 1) !== ".") queue.push([item, currentLocation]);
    });
  } else if (item.isFile()) {
    const { length } = name;
    // if we have a js file
    if (name.slice(length - 3, length) === ".js") {
      if (!fileCounts.has(currentLocation)) fileCounts.set(currentLocation, 0);
      // how do I get the logs to print
      promiseList.push(getImportsFromFile(name, relativePath));
    }
  }
}

printFiles();

async function getImportsFromFile(name, relativePath) {
  return new Promise((resolve, reject) => {
    const currentLocation = path.join(relativePath, name);

    const readInterface = readline.createInterface({
      input: fs.createReadStream(currentLocation),
      console: false
    });

    readInterface.on("line", line => {
      const match = line.match(/require\("([\w./]+)"\)/);
      if (match) {
        // resolve import path to path from root
        let importPath;
        if (relativePath === ".") {
          importPath = match[1].replace("./", "");
        } else {
          importPath = match[1].replace(".", relativePath);
        }
        // adjust importPath for OS
        adjustedPath = isWin ? importPath.replace("/", "\\") : importPath;
        // add filetype
        let { length } = adjustedPath;
        finalPath =
          adjustedPath.slice(length - 3, length) === ".js"
            ? adjustedPath
            : `${adjustedPath}.js`;

        // now the path should match the filepath
        if (fileCounts.has(finalPath)) {
          fileCounts.set(finalPath, fileCounts.get(finalPath) + 1);
        } else {
          fileCounts.set(finalPath, 1);
        }
      }
    });

    readInterface.on("close", () => {
      resolve(true);
    });
  });
}

async function printFiles() {
  Promise.all(promiseList).then(() => {
    console.log(fileCounts);
  });
}
