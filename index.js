import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "cambiar_a_un_secreto_muy_seguro";

// Para servir archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(bodyParser.json());

// ===== MONGOOSE MODELS =====
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  playlists: [
    {
      name: String,
      cover: String,
      songs: [
        {
          id: String,
          title: String,
          artist: String,
          thumbnail: String
        }
      ]
    }
  ],
  likedSongs: [
    {
      id: String,
      title: String,
      artist: String,
      thumbnail: String
    }
  ]
});

const User = mongoose.model("User", userSchema);

// ===== RUTAS =====

// Registro
app.post("/api/register", async (req,res)=>{
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ msg:"Faltan datos" });
  const exists = await User.findOne({ username });
  if(exists) return res.status(400).json({ msg:"Usuario ya existe" });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash, playlists: [], likedSongs: [] });
  const token = jwt.sign({ id:user._id }, JWT_SECRET, { expiresIn:"7d" });
  res.json({ token, username: user.username });
});

// Login
app.post("/api/login", async (req,res)=>{
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if(!user) return res.status(400).json({ msg:"Usuario no encontrado" });
  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch) return res.status(400).json({ msg:"Contraseña incorrecta" });
  const token = jwt.sign({ id:user._id }, JWT_SECRET, { expiresIn:"7d" });
  res.json({ token, username: user.username });
});

// Middleware para verificar token
const auth = async (req,res,next)=>{
  const token = req.headers["authorization"];
  if(!token) return res.status(401).json({ msg:"No autorizado" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch(e){
    res.status(401).json({ msg:"Token inválido" });
  }
};

// Obtener playlists y likedSongs
app.get("/api/data", auth, (req,res)=>{
  res.json({ playlists:req.user.playlists, likedSongs:req.user.likedSongs });
});

// Guardar playlists y likedSongs
app.post("/api/data", auth, async (req,res)=>{
  const { playlists, likedSongs } = req.body;
  req.user.playlists = playlists;
  req.user.likedSongs = likedSongs;
  await req.user.save();
  res.json({ msg:"Datos guardados" });
});

// ===== CONECTAR MONGO =====
mongoose.connect("mongodb+srv://ander:ander1337@cluster0.gj2iedg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser:true, useUnifiedTopology:true
}).then(()=>console.log("MongoDB conectado"))
  .catch(err=>console.log(err));

app.listen(PORT, ()=>console.log(`Servidor corriendo en http://localhost:${PORT}`));