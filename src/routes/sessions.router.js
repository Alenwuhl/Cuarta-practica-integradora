import { Router } from "express";
import userModel from "../daos/mongo/models/user.model.js";
import { isValidPassword } from "../utils.js";
import * as UserController from "../controllers/user.controller.js";
import { createHash } from "../utils.js";
import { UserManager } from "../daos/UserManager.js";
import path from 'path'
import { __dirname } from "../utils.js";
import fs from 'fs'
import multer from "multer";
import multerUpload from '../config/multer.config.js'
import { authorization } from "../utils.js";

const router = Router();
const userManager = new UserManager();

router.get("/", UserController.getAllUsers);
router.post("/", UserController.saveUser);
router.get("/current", UserController.currentUser);

router.post("/process-to-reset-password", (req, res) =>
  userManager.sendEmailToResetPasssword(req, res)
);
router.post("/resetPassword/:token", (req, res) =>
  userManager.resetPassword(req, res)
);
router.post("/premium/:uid", (req, res) =>
  userManager.changeUserRole(req, res)
);
const storagePaths = ['profiles', 'products', 'documents', 'other'];
storagePaths.forEach(dir => {
  const storagePath = path.join(__dirname, '..', 'uploads', dir);
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'other';
    console.log(file.fieldname)
    switch (file.fieldname) {
      
      case 'profileImage':
        folder = 'profiles';
        break;
      case 'productImage':
        folder = 'products';
        break;
      case '1':
      case '2':
      case '3':
        folder = 'documents';
        break;
    }
    cb(null, path.join(__dirname, '..', 'uploads', folder));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error(`Invalid file type. Only ${allowedTypes.join(", ")} are allowed.`);
    error.code = "LIMIT_FILE_TYPES";
    cb(error, false);
  } else {
    cb(null, true);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB
  }
}).fields([
  { name: '1', maxCount: 1 },
  { name: '2', maxCount: 1 },
  { name: '3', maxCount: 1 }
]);

router.post('/:uid/documents', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      if (err.message === 'Unexpected field') {
        return res.status(400).json({ error: "One of the uploaded fields is not recognized." });
      }
      return res.status(500).json({ error: 'A server error occurred.' });
    }

    userManager.uploadDocuments(req, res);
  });
});





//Register
router.post("/register", async (req, res) => {
  const { first_name, last_name, email, age, password, role } = req.body;
  req.logger.debug("Registrando usuario:");
  req.logger.debug(req.body);

  //Validamos si el user existe en la DB
  const exist = await userModel.findOne({ email });
  if (exist) {
    return res
      .status(400)
      .send({ status: "error", message: "Usuario ya existe!" });
  }
  const user = {
    first_name,
    last_name,
    email,
    age,
    password: createHash(password),
    role,
  };

  const result = await userModel.create(user);
  res.send({
    status: "success",
    message: "Usuario creado con extito con ID: " + result.id,
  });
});

//login
router.post("/login", async (req, res) => {
  req.logger.http("se entró a api/users/login");
  const { email, password } = req.body;
  // Encuentra al usuario por email primero
  const user = await userModel.findOne({ email });

  if (!user) {
    // Si no se encuentra el usuario, enviar una respuesta de error.
    return res.status(401).send({ status: "error", error: "User not found" });
  }

  // Utiliza isValidPassword para verificar la contraseña
  if (!isValidPassword(user, password)) {
    // Si la contraseña no coincide, enviar una respuesta de error.
    return res
      .status(401)
      .send({ status: "error", error: "Incorrect credentials" });
  }

  // Actualiza la última conexión del usuario
  user.last_connection = new Date();
  await user.save();

  // Si el usuario se autentica correctamente, procede con la sesión o lo que necesites hacer a continuación
  req.session.user = {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    age: user.age,
    id: user.id,
    role: user.role,
  };

  // Redirecciona o envía la respuesta que consideres apropiada
 // res.redirect("/changeRole");
 res.send({
  status: "success",
  message: "Usuario con login exitoso",
});
});

export default router;
