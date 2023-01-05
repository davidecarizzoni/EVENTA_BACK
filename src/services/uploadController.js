const multer = require("multer");

var path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, '/Users/federico/Desktop/EVENTA_BACK/src/uploads')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({storage: storage})


module.exports = upload