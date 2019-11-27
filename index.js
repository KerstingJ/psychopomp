const fs = require("fs");
const path = require("path");

const test = require("./src/psychopomp");

const fileCounts = new Map();

// get the list of all files/dirs in the given directory
// for each file in that list - add file to fileCounts then read File and count imports
// for each dir in that list - enter dir and list file

const files = [["", ""]];

while (files.length > 0) {
  const [name, relativePath] = files.pop();
  const currentLocation = path.join(relativePath, name);

  const item = fs.statSync(path.join(process.cwd(), currentLocation));
  if (item.isDirectory()) {
    const fileList = fs.readdirSync(currentLocation);
    fileList.forEach(item => {
      // for now ignore hidden dirs like .git
      if (item.slice(0, 1) !== ".") files.push([item, currentLocation]);
    });
  } else if (item.isFile()) {
    const { length } = name;
    if (name.slice(length - 3, length) === ".js")
      fileCounts.set(currentLocation, 0);
  }
}

console.log(fileCounts);
