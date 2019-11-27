const fs = require("fs");
const path = require("path");
const readline = require("readline");

const test = require("./src/psychopomp");

const isWin = /^win/.test(process.platform) ? true : false;

// get the list of all files/dirs in the given directory
// for each file in that list - add file to fileCounts then read File and count imports
// for each dir in that list - enter dir and list file
const fileCounts = new Map();
const queue = [["", ""]]; // This is out entrypoint

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
      const readInterface = readline.createInterface({
        input: fs.createReadStream(currentLocation),
        console: false
      });

      readInterface.on("line", line => {
        const match = line.match(/require\("([\w./]+)"\)/);
        if (match) {
          console.log(match[1]);
          // need to normalize matched import to fit the files
        }
      });
    }
  }
}
console.log(fileCounts);
