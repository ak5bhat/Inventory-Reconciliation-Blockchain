const util = require("util");
const path = require('path');
const XLSX = require('xlsx');

const multer = require("multer");
const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/static/assets/uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);

const readXlsx = async (name)=> {
  const folderPath = `${__basedir}/resources/static/assets/uploads`;
  const inputFileName = name;
  // Build the full path to the file
  const filePath = path.join(folderPath, inputFileName);
  // Load XLSheet file
  const workbook = XLSX.readFile(filePath);

  const sheetName = workbook.SheetNames[0];
  
  // Get the first worksheet
  const worksheet = workbook.Sheets[sheetName];
  //const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convert to json or Convert the worksheet to a json string
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const assetList = [];
  rows.forEach(row => {
    assetList.push(row);
  });
  return assetList;

}


module.exports = { uploadFileMiddleware, readXlsx };
