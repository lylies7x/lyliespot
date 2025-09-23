// ===== API KEYS MULTIPLES =====
const API_KEYS = [
  "AIzaSyD9LImpQkyE_8W54N4aaQs5x_tJjeYfZ9c",
  "AIzaSyCFsRqSGtAJNK-RLOfVFbTDCEXoqbO3XZU",
  "AIzaSyAdeMlSeAaYKi5sbHb1WHY0w1UsomixvkI",
  "AIzaSyD6Np6XxVEy7zafAHW_1w4CdLCbXrZchEU",
  "AIzaSyBXVSdLOWvzYwR13UP944DnOCxbEPD2Nck",
  "AIzaSyCuhO0Ra75KJR8JqTym_VVrLioAF6GIfz4",
  "AIzaSyDjGMGxf0DeEjVVI8vrSTpxOw4Wyq5T-8U",
  "AIzaSyDA5R2i3DlgPsy2mfKn5OqAg_vndokCK5Y",
  "AIzaSyDKFamhkFrrmFs5YzQneS_wjDVAoX6n0oU",
  "AIzaSyCmyKzAmLSe1p20np_Qeha_nzV-eZyWczE",
];
let currentKeyIndex = 0;
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

// ===== ELEMENTOS UI =====
const libraryEl = document.getElementById("library");
const searchInput = document.getElementById("search");
const npTitle = document.getElementById("npTitle");
const npArtist = document.getElementById("npArtist");
const npCover = document.getElementById("npCover");
const playPauseBtn = document.getElementById("playPause");
const playIcon = document.getElementById("playIcon");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const volumeSlider = document.getElementById("volumeSlider");
const nowPlayingBar = document.getElementById("nowPlayingBar");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const createPlaylistModal = document.getElementById("createPlaylistModal");
const playlistCover = document.getElementById("playlistCover");
const playlistNameInput = document.getElementById("playlistName");
const confirmCreatePlaylist = document.getElementById("confirmCreatePlaylist");
const playlistSection = document.getElementById("playlistSection");
const likedBtn = document.getElementById("likedBtn");
const centerMessage = document.getElementById("centerMessage");
const selectPlaylistModal = document.getElementById("selectPlaylistModal");
const playlistSelectList = document.getElementById("playlistSelectList");
const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const openLogin = document.getElementById("openLogin");
const openRegister = document.getElementById("openRegister");
const logoutBtn = document.getElementById("logoutBtn");

// ===== VARIABLES =====
let ytPlayer;
let currentVideo = null;
let isPlaying = false;
let playlist = [];
let currentIndex = -1;
let playlists = [];
let likedSongs = [];
let token = null;
let isLoginMode = true;

// ===== YouTube API =====
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

function onYouTubeIframeAPIReady(){
  ytPlayer = new YT.Player("ytPlayer", {
    height: "0", width: "0", videoId: "",
    playerVars: { autoplay: 0 },
    events: {
      onReady: ()=> ytPlayer.setVolume(100),
      onStateChange: e=>{
        if(e.data === YT.PlayerState.PLAYING){ isPlaying=true; updatePlayUI(); }
        if(e.data === YT.PlayerState.PAUSED){ isPlaying=false; updatePlayUI(); }
        if(e.data === YT.PlayerState.ENDED){ isPlaying=false; updatePlayUI(); nextTrack(); }
      }
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

// ===== UI Funciones =====
function updatePlayUI(){ 
  if(isPlaying){ 
    nowPlayingBar.style.display="flex"; 
  }else{ 
    if(!currentVideo){ nowPlayingBar.style.display="none"; } 
  } 
}
function showCenterMessage(msg){ 
  centerMessage.textContent=msg; 
  centerMessage.style.display="block"; 
  setTimeout(()=>centerMessage.style.display="none",2000); 
}

// ===== Backend API =====
async function saveData(){ 
  if(!token) return; 
  await fetch("/api/data",{ 
    method:"POST", 
    headers:{"Content-Type":"application/json","Authorization": token}, 
    body:JSON.stringify({ playlists, likedSongs }) 
  }); 
}
async function loadData(){ 
  if(!token) return; 
  const res=await fetch("/api/data",{ headers:{"Authorization": token} }); 
  if(res.ok){ 
    const data=await res.json(); 
    playlists=data.playlists; 
    likedSongs=data.likedSongs; 
    renderPlaylists(); 
  } 
}
async function login(username,password){ 
  const res=await fetch("/api/login",{ 
    method:"POST", 
    headers:{"Content-Type":"application/json"}, 
    body:JSON.stringify({username,password}) 
  }); 
  const data=await res.json(); 
  if(res.ok){ 
    token=data.token; 
    localStorage.setItem("token", token);   // guardar token
    await loadData(); 
    showCenterMessage("Login exitoso"); 
    authModal.style.display="none"; 
    actualizarUIAuth(); 
  } else showCenterMessage(data.msg); 
}
async function register(username,password){ 
  const res=await fetch("/api/register",{ 
    method:"POST", 
    headers:{"Content-Type":"application/json"}, 
    body:JSON.stringify({username,password}) 
  }); 
  const data=await res.json(); 
  if(res.ok){ 
    token=data.token; 
    localStorage.setItem("token", token);   // guardar token
    await loadData(); 
    showCenterMessage("Registro exitoso"); 
    authModal.style.display="none"; 
    actualizarUIAuth(); 
  } else showCenterMessage(data.msg); 
}

// ===== Eventos Login/Register =====
authSubmit.onclick=()=>{
  const u=authUsername.value.trim();
  const p=authPassword.value.trim();
  if(!u || !p) return showCenterMessage("Rellena todos los campos");
  if(isLoginMode) login(u,p); else register(u,p);
};
authSwitch.onclick=()=>{ 
  isLoginMode=!isLoginMode; 
  authTitle.textContent=isLoginMode?"Login":"Registro"; 
  authSwitch.textContent=isLoginMode?"Cambiar a Registro":"Cambiar a Login"; 
};
openLogin.onclick=()=>{ 
  authModal.style.display="flex"; 
  isLoginMode=true; 
  authTitle.textContent="Login"; 
  authSwitch.textContent="Cambiar a Registro"; 
};
openRegister.onclick=()=>{ 
  authModal.style.display="flex"; 
  isLoginMode=false; 
  authTitle.textContent="Registro"; 
  authSwitch.textContent="Cambiar a Login"; 
};
logoutBtn.onclick=()=>{ 
  token=null; 
  localStorage.removeItem("token");   // borrar token
  playlists=[]; 
  likedSongs=[]; 
  renderPlaylists(); 
  showCenterMessage("Cerraste sesión"); 
  actualizarUIAuth(); 
};

// ===== Restaurar sesión al cargar la página =====
window.onload = async ()=>{ 
  const savedToken = localStorage.getItem("token"); 
  if(savedToken){ 
    token = savedToken; 
    try {
      await loadData(); 
      showCenterMessage("Sesión restaurada"); 
      actualizarUIAuth();
    } catch(e){
      console.log("Token inválido, borrando...");
      localStorage.removeItem("token");
      token=null;
      actualizarUIAuth();
    }
  } else {
    actualizarUIAuth();
  }
};

// ===== Control de UI según sesión =====
function actualizarUIAuth(){
  if(token){
    if(openLogin) openLogin.style.display="none";
    if(openRegister) openRegister.style.display="none";
    if(logoutBtn) logoutBtn.style.display="block";
  } else {
    if(openLogin) openLogin.style.display="block";
    if(openRegister) openRegister.style.display="block";
    if(logoutBtn) logoutBtn.style.display="none";
  }
}

// ===== YouTube Búsqueda y Reproducción =====
async function searchYouTube(query){ 
  const key = getNextApiKey(); // Tomamos la key siguiente
  const url=`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(query)}&key=${key}`; 
  const res=await fetch(url); 
  const data=await res.json(); 

  // Si key falla, intenta con siguiente
  if(data.error && data.error.code === 403){
    console.warn("Key agotada, usando siguiente...");
    return searchYouTube(query);
  }

  return data.items.map(item=>({
    id:item.id.videoId,
    title:item.snippet.title,
    artist:item.snippet.channelTitle,
    thumbnail:item.snippet.thumbnails.medium.url
  }));
}

function renderLibrary(items){ 
  libraryEl.innerHTML=""; 
  playlist=items; 
  currentIndex=-1; 
  items.forEach((song,i)=>{ 
    const card=document.createElement("div"); 
    card.className="card"; 
    card.innerHTML=`<div class="cover"><img src="${song.thumbnail}"></div><div class="meta"><div class="title">${song.title}</div><div class="artist">${song.artist}</div></div><div class="playbtn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div><div class="likeBtn"><i class="fa fa-heart"></i></div><div class="addPlaylistBtn"><i class="fa fa-plus"></i></div>`; 
    card.querySelector(".playbtn").onclick=()=>{ currentIndex=i; playYouTube(song); }; 
    card.querySelector(".likeBtn").onclick=(e)=>toggleLike(song,e.target); 
    card.querySelector(".addPlaylistBtn").onclick=()=>showPlaylistSelect(song); 
    libraryEl.appendChild(card); 
  }); 
}
function playYouTube(song){ 
  currentVideo=song; 
  ytPlayer.loadVideoById(song.id); 
  npTitle.textContent=song.title; 
  npArtist.textContent=song.artist; 
  npCover.innerHTML=`<img src="${song.thumbnail}">`; 
  isPlaying=true; 
  nowPlayingBar.style.display="flex"; 
  updatePlayUI(); 
}
function nextTrack(){ 
  if(currentIndex<playlist.length-1){ 
    currentIndex++; 
    playYouTube(playlist[currentIndex]); 
  } 
}
function prevTrack(){ 
  if(currentIndex>0){ 
    currentIndex--; 
    playYouTube(playlist[currentIndex]); 
  } 
}
playPauseBtn.onclick=()=>{ 
  if(!currentVideo) return; 
  isPlaying? ytPlayer.pauseVideo(): ytPlayer.playVideo(); 
};
prevBtn.onclick=()=>prevTrack();
nextBtn.onclick=()=>nextTrack();
volumeSlider.oninput=()=>ytPlayer.setVolume(volumeSlider.value);
let searchTimeout;
searchInput.oninput=()=>{ 
  clearTimeout(searchTimeout); 
  searchTimeout=setTimeout(async()=>{ 
    const results=await searchYouTube(searchInput.value); 
    renderLibrary(results); 
  },500); 
};

// ===== Playlist =====
function renderPlaylists(){ 
  playlistSection.innerHTML=""; 
  playlists.forEach(pl=>{ 
    const div=document.createElement("div"); 
    div.className="playlist"; 
    div.textContent=pl.name; 
    div.onclick=()=>showPlaylistSongs(pl); 
    playlistSection.appendChild(div); 
  }); 
}
function showPlaylistSongs(pl){ renderLibrary(pl.songs); }
createPlaylistBtn.onclick=()=>createPlaylistModal.style.display="flex";
confirmCreatePlaylist.onclick=()=>{ 
  const name=playlistNameInput.value.trim(); 
  if(!name) return showCenterMessage("Escribe nombre"); 
  const pl={name,songs:[]}; 
  playlists.push(pl); 
  renderPlaylists(); 
  playlistNameInput.value=""; 
  createPlaylistModal.style.display="none"; 
  saveData(); 
  showCenterMessage("Playlist creada"); 
};
function showPlaylistSelect(song){ 
  playlistSelectList.innerHTML="<h3>Selecciona Playlist</h3>"; 
  playlists.forEach((pl,i)=>{ 
    const btn=document.createElement("button"); 
    btn.textContent=pl.name; 
    btn.onclick=()=>{ 
      pl.songs.push(song); 
      saveData(); 
      selectPlaylistModal.style.display="none"; 
      showCenterMessage(`Agregado a ${pl.name}`); 
    }; 
    playlistSelectList.appendChild(btn); 
  }); 
  selectPlaylistModal.style.display="flex"; 
}
function toggleLike(song,iconEl){ 
  const idx=likedSongs.findIndex(s=>s.id===song.id); 
  if(idx===-1){ 
    likedSongs.push(song); 
    iconEl.classList.add("liked"); 
  } else{ 
    likedSongs.splice(idx,1); 
    iconEl.classList.remove("liked"); 
  } 
  saveData(); 
}
likedBtn.onclick=()=>renderLibrary(likedSongs);

// Cerrar modales al click fuera
[createPlaylistModal,selectPlaylistModal,authModal].forEach(modal=>{ 
  modal.onclick=e=>{ 
    if(e.target===modal) modal.style.display="none"; 
  }; 
});

// ================== NAVEGACIÓN SPA ==================
const homeBtn = document.getElementById("homeBtn");
const exploreBtn = document.getElementById("exploreBtn");
const libraryBtn = document.getElementById("libraryBtn");

if (homeBtn) {
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    searchInput.value = "";

    centerMessage.style.display = "block";
    libraryEl.innerHTML = "";
    setTimeout(() => centerMessage.style.display = "none", 2000);
  });
}

if (exploreBtn) {
  exploreBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const results = await searchYouTube("Top hits");
    renderLibrary(results);
  });
}

if (libraryBtn) {
  libraryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    renderPlaylists();
  });
}

// Mostrar app después de 5 segundos
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.querySelector('.app').style.display = 'flex';
  }, 5000);
});
