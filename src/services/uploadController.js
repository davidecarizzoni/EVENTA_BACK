const multer = require("multer");
var path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, './src/uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + `_` + Date.now() + path.extname(`${file.originalname}`))
    }
})

const upload = multer({
    storage: storage,
    fileFilter (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname =  filetypes.test(path.extname(file.originalname).toLowerCase());
       const mimetype = filetypes.test(file.mimetype);

       if(mimetype && extname){
           return cb(null,true);
       } else {
           cb('Error: Images Only!');
       }
      }
})


module.exports = upload
