const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const songCover = document.getElementById('song-cover');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist'); // 新增作者元素
const musicPlayer = document.querySelector('.music-player'); // 添加音樂播放器元素
const progress = document.getElementById('progress');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const sidebarLinks = document.querySelectorAll('.sidebar ul li');
const pages = document.querySelectorAll('.page');
const playlistContainer = document.querySelector('.playlist-container');
const playlistList = document.getElementById('playlist-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const libraryGenres = document.querySelectorAll('#library .genre-list li');
const musicListContainer = document.getElementById('music-list');

// --- Debug overlay: show runtime JS errors on page to help debugging ---
;(function(){
    try {
        const errDiv = document.createElement('div');
        errDiv.id = 'error-overlay';
        errDiv.style.position = 'fixed';
        errDiv.style.right = '20px';
        errDiv.style.bottom = '20px';
        errDiv.style.zIndex = 99999;
        errDiv.style.maxWidth = '380px';
        errDiv.style.background = 'rgba(0,0,0,0.85)';
        errDiv.style.color = '#fff';
        errDiv.style.padding = '12px';
        errDiv.style.borderRadius = '8px';
        errDiv.style.fontSize = '13px';
        errDiv.style.display = 'none';
        errDiv.style.boxShadow = '0 6px 18px rgba(0,0,0,0.6)';
        errDiv.innerHTML = '<strong>JS Error</strong><div id="error-overlay-msg" style="margin-top:8px;white-space:pre-wrap;max-height:220px;overflow:auto;"></div><button id="error-overlay-close" style="margin-top:8px;background:#1db954;border:none;padding:6px 8px;border-radius:6px;cursor:pointer;color:#000">Close</button>';
        document.body.appendChild(errDiv);
        document.getElementById('error-overlay-close').addEventListener('click', () => { errDiv.style.display = 'none'; });

        window.addEventListener('error', function(event){
            const msgEl = document.getElementById('error-overlay-msg');
            msgEl.textContent = (event && event.message ? event.message : String(event));
            errDiv.style.display = 'block';
            console.error('Captured error:', event.error || event.message || event);
        });

        window.addEventListener('unhandledrejection', function(ev){
            const msgEl = document.getElementById('error-overlay-msg');
            msgEl.textContent = (ev && ev.reason ? (ev.reason.stack || ev.reason) : String(ev));
            errDiv.style.display = 'block';
            console.error('Unhandled promise rejection:', ev.reason || ev);
        });
    } catch(e) {
        console.warn('Could not init error overlay', e);
    }
})();


const searchResultsPopup = document.getElementById('search-results-popup');
const searchResultsContainer = document.getElementById('search-results');
const closeButton = document.querySelector('#search-results-popup .close-button');
// 取得下載按鈕的參照
const downloadButton = document.getElementById('download-button');

// 左側漢堡按鈕與側邊欄
const menuToggle = document.querySelector('.menu-toggle');
const sidebarEl = document.querySelector('.sidebar');

// 右側資訊欄和按鈕
const rightSidebar = document.querySelector('.right-sidebar');
const showInfoBtn = document.getElementById('show-info');
const infoCover = document.getElementById('info-cover');
const infoTitle = document.getElementById('info-title');
const infoArtist = document.getElementById('info-artist');

let currentGenre = 'pop'; // 預設類型
let currentAlbum = albumData[currentGenre];
let currentSongIndex = 0;
let currentVersionIndex = -1;

let shuffle = false; // 隨機播放狀態
let repeatMode = 'off'; // 循環播放模式 ('off', 'single', 'folder')

// 播放列表資料 (現在與資料夾名稱相同)
const playlists = Object.keys(albumData).map(genre => {
    const firstSongInAlbum = albumData[genre].length > 0 ? albumData[genre][0] : null;
    let cover = 'images/logo.ico'; // Default cover
    if (firstSongInAlbum) {
        const firstSongTitle = typeof firstSongInAlbum === 'string' ? firstSongInAlbum : firstSongInAlbum.title;
        const firstSongData = musicData.find(s => s.title === firstSongTitle);
        if (firstSongData) {
            cover = firstSongData.versions ? firstSongData.versions[0].cover : firstSongData.cover;
        }
    }
    return {
        name: genre,
        description: `Lifer_Lighdow's ${genre} music genre`,
        cover: cover,
        songs: albumData[genre]
    };
});


// 初始化
loadInitialSong();
loadPlaylists();
loadPlaylistItems();
loadMusicList(currentGenre); // 載入預設類型的音樂列表
updateGenreSelection(currentGenre);

const imageViewerPopup = document.getElementById('image-viewer-popup');
const imageViewerImage = document.getElementById('image-viewer-image');
const imageViewerCloseButton = document.querySelector('#image-viewer-popup .close-button');

function findSongInMusicData(title) {
    return musicData.find(song => song.title === title);
}

function findGenreForSong(songTitle) {
    for (const genre in albumData) {
        if (albumData[genre].some(s => (typeof s === 'string' ? s : s.title) === songTitle)) {
            return genre;
        }
    }
    return null;
}

function loadInitialSong() {
    if (currentAlbum && currentAlbum.length > 0) {
        const initialAlbumSong = currentAlbum[currentSongIndex];
        const songTitle = typeof initialAlbumSong === 'string' ? initialAlbumSong : initialAlbumSong.title;
        const songData = findSongInMusicData(songTitle);
        if (songData) {
            currentVersionIndex = songData.versions ? 0 : -1;
            loadSong(songData, currentVersionIndex);
        }
    } else if (musicData.length > 0) {
        const songData = musicData[0];
        const genre = findGenreForSong(songData.title);
        if (genre) {
            currentGenre = genre;
            currentAlbum = albumData[genre];
            currentSongIndex = currentAlbum.findIndex(s => (typeof s === 'string' ? s : s.title) === songData.title);
            currentVersionIndex = songData.versions ? 0 : -1;
            loadSong(songData, currentVersionIndex);
            updateGenreSelection(currentGenre);
        }
    }
}

// 載入歌曲
function loadSong(song, versionIndex = -1) {
    let songToLoad = song;
    let title = song.title;
    let cover = song.cover;
    let src = song.src;

    if (versionIndex !== -1 && song.versions && song.versions[versionIndex]) {
        const version = song.versions[versionIndex];
        title = `${song.title} (${version.version})`;
        cover = version.cover;
        src = version.src;
    }

    songTitle.innerText = title;
    songArtist.innerText = "Lifer_Lighdow"; // 設置作者
    songCover.src = cover;
    audio.src = src;
	 // 初始載入歌曲後更新動畫狀態
    updateTitleAnimation(); 
	 
	 // 更新下載連結
    updateDownloadLink(title, src);

    // 更新右側欄資訊
    if (infoCover) infoCover.src = cover;
    if (infoTitle) infoTitle.innerText = title;
    if (infoArtist) infoArtist.innerText = "Lifer_Lighdow";

    // 嘗試載入 nfo/metadata JSON（若有提供 URL）
    // 優先順序：版本內的 info -> song.info -> song.nfo -> song.metadataUrl -> song.meta.url
    let nfoUrl = null;
    if (versionIndex !== -1 && song.versions && song.versions[versionIndex]) {
        const version = song.versions[versionIndex];
        nfoUrl = version.info || null;
    }
    nfoUrl = nfoUrl || song.info || song.nfo || song.metadataUrl || (song.meta && song.meta.url) || null;
    if (nfoUrl) {
        loadNfo(nfoUrl);
    } else {
        // 清空或顯示預設值
        const fields = ['singer','genre','bpm','year','lyrics'];
        fields.forEach(f => {
            const el = document.getElementById('meta-' + f);
            if (el) el.innerText = '-';
        });
    }
}

// 從 nfo (JSON) 取得資料並顯示在右側欄
async function loadNfo(url) {
    try {
        const res = await fetch(url, {cache: 'no-cache'});
        if (!res.ok) throw new Error('Failed to fetch metadata: ' + res.status);
        const data = await res.json();

        // 支援多種命名（防呆）
        const singer = data.singer || data.artist || data.vocal || '-';
        const genre = data.genre || data.type || '-';
        const bpm = data.bpm || data.BPM || '-';
        const year = data.year || data.date || '-';
        const lyrics = data.lyrics || data.text || '-';

        const map = {singer, genre, bpm, year, lyrics};
        Object.keys(map).forEach(k => {
            const el = document.getElementById('meta-' + k);
            if (el) {
                if (k === 'lyrics') el.innerText = map[k] || '-';
                else el.innerText = map[k] || '-';
            }
        });
    } catch (err) {
        console.warn('loadNfo error', err);
        const fields = ['singer','genre','bpm','year','lyrics'];
        fields.forEach(f => {
            const el = document.getElementById('meta-' + f);
            if (el) el.innerText = '-';
        });
    }
}

// 更新下載連結
function updateDownloadLink(title, src) {
    const artist = "Lifer_Lighdow"; // 固定藝術家名稱
    const fileName = `${title} - ${artist}.mp3`; // 自訂檔名
    if (downloadButton) {
        downloadButton.onclick = () => {
            downloadFile(src, fileName);
        };
    }
}

// 下載檔案函式
function downloadFile(url, fileName) {
    fetch(url)
        .then(res => res.blob())
        .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(a.href); // 釋放記憶體
            document.body.removeChild(a); // 移除元素
        });
}

songCover.addEventListener('click', () => {
    imageViewerImage.src = songCover.src; // 設定圖片來源
    imageViewerPopup.style.display = 'flex'; // 顯示圖片檢視器
});
// 關閉圖片檢視器
imageViewerCloseButton.addEventListener('click', () => {
    imageViewerPopup.style.display = 'none';
});

// 播放 / 暫停
function playSong() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
    updatePlayButton();
}

// 下一首
function nextSong() {
    if (shuffle) {
        const randomSongIndex = Math.floor(Math.random() * currentAlbum.length);
        const randomAlbumSong = currentAlbum[randomSongIndex];
        const randomSongTitle = typeof randomAlbumSong === 'string' ? randomAlbumSong : randomAlbumSong.title;
        const songData = findSongInMusicData(randomSongTitle);
        let randomVersionIndex = -1;
        if (songData.versions) {
            randomVersionIndex = Math.floor(Math.random() * songData.versions.length);
        }
        currentSongIndex = randomSongIndex;
        currentVersionIndex = randomVersionIndex;
        loadSong(songData, currentVersionIndex);
        audio.play();
        updatePlayButton();
        return;
    }

    const currentAlbumSong = currentAlbum[currentSongIndex];
    const currentSongTitle = typeof currentAlbumSong === 'string' ? currentAlbumSong : currentAlbumSong.title;
    const songData = findSongInMusicData(currentSongTitle);

    if (songData.versions && currentVersionIndex >= 0 && currentVersionIndex < songData.versions.length - 1) {
        currentVersionIndex++;
    } else {
        currentSongIndex = (currentSongIndex + 1) % currentAlbum.length;
        const nextAlbumSong = currentAlbum[currentSongIndex];
        const nextSongTitle = typeof nextAlbumSong === 'string' ? nextAlbumSong : nextAlbumSong.title;
        const nextSongData = findSongInMusicData(nextSongTitle);
        currentVersionIndex = nextSongData.versions ? 0 : -1;
    }
    
    const nextAlbumSongToLoad = currentAlbum[currentSongIndex];
    const nextSongTitleToLoad = typeof nextAlbumSongToLoad === 'string' ? nextAlbumSongToLoad : nextAlbumSongToLoad.title;
    const nextSongDataToLoad = findSongInMusicData(nextSongTitleToLoad);
    loadSong(nextSongDataToLoad, currentVersionIndex);
    audio.play();
    updatePlayButton();
}

// 上一首
function prevSong() {
    if (shuffle) {
        const randomSongIndex = Math.floor(Math.random() * currentAlbum.length);
        const randomAlbumSong = currentAlbum[randomSongIndex];
        const randomSongTitle = typeof randomAlbumSong === 'string' ? randomAlbumSong : randomAlbumSong.title;
        const songData = findSongInMusicData(randomSongTitle);
        let randomVersionIndex = -1;
        if (songData.versions) {
            randomVersionIndex = Math.floor(Math.random() * songData.versions.length);
        }
        currentSongIndex = randomSongIndex;
        currentVersionIndex = randomVersionIndex;
        loadSong(songData, currentVersionIndex);
        audio.play();
        updatePlayButton();
        return;
    }

    if (currentVersionIndex > 0) {
        currentVersionIndex--;
    } else {
        currentSongIndex = (currentSongIndex - 1 + currentAlbum.length) % currentAlbum.length;
        const prevAlbumSong = currentAlbum[currentSongIndex];
        const prevSongTitle = typeof prevAlbumSong === 'string' ? prevAlbumSong : prevAlbumSong.title;
        const prevSongData = findSongInMusicData(prevSongTitle);
        currentVersionIndex = prevSongData.versions ? prevSongData.versions.length - 1 : -1;
    }

    const prevAlbumSongToLoad = currentAlbum[currentSongIndex];
    const prevSongTitleToLoad = typeof prevAlbumSongToLoad === 'string' ? prevAlbumSongToLoad : prevAlbumSongToLoad.title;
    const prevSongDataToLoad = findSongInMusicData(prevSongTitleToLoad);
    loadSong(prevSongDataToLoad, currentVersionIndex);
    audio.play();
    updatePlayButton();
}

// 隨機播放
function toggleShuffle() {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('active', shuffle); // 使用 active class 來視覺化狀態
}

// 循環播放
function nextRepeatMode() {
    if (repeatMode === 'off') {
        repeatMode = 'single';
        repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>'; // Font Awesome 圖示
    } else {
        repeatMode = 'off';
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i>'; // Font Awesome 圖示
    }
    // 更新 active class
    repeatBtn.classList.toggle('active', repeatMode !== 'off');
}

// 音訊播放結束時的處理
audio.addEventListener('ended', () => {
    if (repeatMode === 'single') {
        audio.currentTime = 0;
        audio.play();
    } else {
        // 停止播放，或者可以設定為播放下一首
        nextSong()
    }
});

// 處理下載按鈕（委託）
musicListContainer.addEventListener('click', function(e) {
    const dl = e.target.closest('.download-button');
    if (dl) {
        e.stopPropagation();
        const src = dl.dataset.src;
        const title = dl.dataset.title || 'download';
        const fileName = `${title} - Lifer_Lighdow.mp3`;
        if (src) {
            downloadFile(src, fileName);
        }
    }
});

// 隨機歌曲索引
function getRandomSongIndex() {
    let randomIndex = Math.floor(Math.random() * currentAlbum.length);
    // 確保不重複播放同一首歌
    while (randomIndex === currentSongIndex) {
        randomIndex = Math.floor(Math.random() * currentAlbum.length);
    }
    return randomIndex;
}

// 更新進度條
function updateProgress(e) {
    const { duration, currentTime } = e.target;
    const progressPercent = (currentTime / duration) * 100;
    progress.value = progressPercent;
    progress.style.setProperty('--progress-percent', `${progressPercent}%`); // 設定 CSS 變數
    currentTimeDisplay.innerText = formatTime(currentTime);
    durationDisplay.innerText = formatTime(duration);
}

// 設定進度條
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

// 格式化時間
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// 載入播放列表項目
function loadPlaylistItems() {
    playlistContainer.innerHTML = '';
    playlists.forEach(playlist => {
        const playlistItem = document.createElement('div');
        playlistItem.classList.add('playlist-item');
        // 圖片網址自動設定
        const albumImgUrl = `Album/${playlist.name}.jpg`;
        playlistItem.innerHTML = `
            <img src="${albumImgUrl}" alt="${playlist.name}">
            <h3>${playlist.name}</h3>
            <p>${playlist.description}</p>
        `;
        playlistContainer.appendChild(playlistItem);

        playlistItem.addEventListener('click', () => {
            const genre = playlist.name.toLowerCase();
            currentGenre = genre;
            loadMusicList(genre);
            updateGenreSelection(genre);
            switchPage('library');
        });
    });
}

// 載入推薦歌曲
function loadFeaturedSongs() {
    const featuredSongsContainer = document.querySelector('.featured-songs-container');
    featuredSongsContainer.innerHTML = ''; // 清空之前的內容

    const featuredCount = 6; // 推薦歌曲數量
    const featuredSongs = [];
    const allSongs = musicData;

    // 如果歌曲總數少於推薦數量，則只顯示所有歌曲
    const availableCount = Math.min(featuredCount, allSongs.length);

    // 隨機選擇歌曲
    while (featuredSongs.length < availableCount) {
        const randomIndex = Math.floor(Math.random() * allSongs.length);
        const song = allSongs[randomIndex];

        if (!featuredSongs.some(s => s.title === song.title)) {
            featuredSongs.push(song);
        }
    }

    // 建立推薦歌曲元素
    featuredSongs.forEach(song => {
        const featuredSong = document.createElement('div');
        featuredSong.classList.add('featured-song');
        
        const songGenre = findGenreForSong(song.title);
        let displayTitle = song.title;
        let cover = song.cover;

        if (song.versions) {
            const firstVersion = song.versions[0];
            displayTitle = `${song.title} (${firstVersion.version})`;
            cover = firstVersion.cover;
        }

        featuredSong.innerHTML = `
            <img src="${cover}" alt="${displayTitle}">
            <div class="song-info">
                <h3>${displayTitle}</h3>
                <p>Lifer_Lighdow (${songGenre || ''})</p>
            </div>
        `;
        featuredSongsContainer.appendChild(featuredSong);

        featuredSong.addEventListener('click', () => {
            const genre = findGenreForSong(song.title);
            if (genre) {
                currentGenre = genre;
                currentAlbum = albumData[genre];
                currentSongIndex = currentAlbum.findIndex(s => (typeof s === 'string' ? s : s.title) === song.title);
                currentVersionIndex = song.versions ? 0 : -1;
                
                loadSong(song, currentVersionIndex);
                audio.play();
                updatePlayButton();
                switchPage('library');
                loadMusicList(genre);
                updateGenreSelection(genre);
            }
        });
    });
}

// 在初始化時呼叫 loadFeaturedSongs()
loadFeaturedSongs();

// 載入播放列表
function loadPlaylists() {
    playlistList.innerHTML = ''; // 清空之前的內容
    playlists.forEach((playlist, index) => {
        const li = document.createElement('li');
        li.innerText = playlist.name;
        playlistList.appendChild(li);

        li.addEventListener('click', () => {
            // 播放列表項目點擊事件
            const genre = playlist.name.toLowerCase();
            currentGenre = genre;
            loadMusicList(genre);
            updateGenreSelection(genre);
switchPage('library');
            //  切換到 Your Library 頁面
        });
    });
}

// 切換頁面
function switchPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`.sidebar ul li[data-page="${pageId}"]`).classList.add('active');
}

// 載入音樂列表 (根據類型)
function loadMusicList(genre) {
    musicListContainer.innerHTML = '';
    currentAlbum = albumData[genre];
    if (!currentAlbum) {
        musicListContainer.innerHTML = '<p>No songs in this genre.</p>';
        return;
    }

    currentAlbum.forEach((albumSong, index) => {
        const isObjectEntry = typeof albumSong === 'object' && albumSong !== null;
        const songTitle = isObjectEntry ? albumSong.title : albumSong;
        const songData = findSongInMusicData(songTitle);
        if (!songData) return;

        const li = document.createElement('li');
        li.classList.add('song-item');

        // Case 1: albumData entry is { title, versions } and it has versions in musicData
        if (isObjectEntry && albumSong.versions && songData.versions) {
            li.innerHTML = `
                <div class="song-details expandable">
                    <span>${songData.title}</span> <i class="fas fa-chevron-down"></i>
                </div>
                <ul class="versions-list" style="display: none;">
                    ${albumSong.versions.map(versionName => {
const versionIndex = songData.versions.findIndex(v => v.version === versionName);
                        if (versionIndex === -1) return ''; // Skip if this version from albumData is not in musicData
                        
                        return `
                        <li class="version-item">
                            <div class="song-details">${versionName}</div>
                            <div class="song-actions">
                                <button class="play-song" data-genre="${genre}" data-index="${index}" data-version="${versionIndex}"><i class="fas fa-play"></i></button>
                                <button class="download-button" data-src="${songData.versions[versionIndex].src}" data-title="${songData.title} (${versionName})" title="下載"><i class="fas fa-download"></i></button>
                            </div>
                        </li>
                        `;
                    }).join('')}
                </ul>
            `;
        } 
        // Case 2: All other cases (single version songs, or string entries in albumData)
        else {
            li.innerHTML = `
                <div class="song-details">
                    <span>${songData.title}</span>
                </div>
                <div class="song-actions">
                    <button class="play-song" data-genre="${genre}" data-index="${index}"><i class="fas fa-play"></i></button>
                    <button class="download-button" data-src="${songData.src}" data-title="${songData.title}" title="下載"><i class="fas fa-download"></i></button>
                </div>
            `;
        }
        musicListContainer.appendChild(li);
    });
    
    // Re-add event listeners for expandable sections
    musicListContainer.querySelectorAll('.expandable').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.song-actions')) {
                return;
            }
            const versionsList = item.nextElementSibling;
            const icon = item.querySelector('i');
            if (versionsList.style.display === 'none') {
                versionsList.style.display = 'block';
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                versionsList.style.display = 'none';
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });
    });
}


// 搜尋功能 (包含任何字)
function searchSongs() {
    const searchTerm = searchInput.value.toLowerCase();
    const results = [];

    // 檢查搜尋詞是否為空
    if (searchTerm.trim() === "") {
        displaySearchResults(results); // 顯示空結果
        return; // 停止搜尋
    }

    musicData.forEach(song => {
        // 只顯示單一版本（無 versions 陣列）
        if (!song.versions && song.title.toLowerCase().includes(searchTerm)) {
            results.push({ song: song, versionIndex: -1 });
        }
        // 只顯示實際存在的版本
        if (song.versions) {
            song.versions.forEach((version, index) => {
                const fullTitle = `${song.title} (${version.version})`;
                if (
                    fullTitle.toLowerCase().includes(searchTerm) ||
                    song.title.toLowerCase().includes(searchTerm) ||
                    version.version.toLowerCase().includes(searchTerm)
                ) {
                    results.push({ song: song, versionIndex: index });
                }
            });
        }
    });

    // 顯示搜尋結果
    displaySearchResults(results);
}

// 顯示搜尋結果
function displaySearchResults(results) {
    searchResultsContainer.innerHTML = ''; // 清空之前的內容

    if (results.length === 0) {
        searchResultsContainer.innerHTML = '<p>No results found.</p>';
    } else {
        const ul = document.createElement('ul');
        results.forEach(result => {
            const { song, versionIndex } = result;
            const genre = findGenreForSong(song.title);
            const albumSongIndex = genre && albumData[genre] ? albumData[genre].findIndex(s => s.title === song.title) : -1;

            let displayTitle = song.title;
            if (versionIndex !== -1 && song.versions) {
                displayTitle = `${song.title} (${song.versions[versionIndex].version})`;
            }

            const li = document.createElement('li');
            li.innerHTML = `
                <div class="song-details">
                    ${displayTitle} (${genre || 'N/A'})
                </div>
                <div class="song-actions">
                    <button class="play-song" data-genre="${genre}" data-index="${albumSongIndex}" data-version="${versionIndex}"><i class="fas fa-play"></i></button>
                </div>
            `;
            ul.appendChild(li);
        });

        searchResultsContainer.appendChild(ul);
    }
    searchResultsPopup.style.display = 'block'; // 顯示彈出視窗
}

// 事件委託：將事件監聽器添加到父元素

 searchResultsContainer.addEventListener('click', function(e) {
    const playButton = e.target.closest('.play-song');
    if (playButton) {
        const genre = playButton.dataset.genre;
        const index = parseInt(playButton.dataset.index);
        const version = playButton.dataset.version;

        if (genre && genre !== 'null' && index > -1) {
            currentGenre = genre;
            currentAlbum = albumData[genre];
            currentSongIndex = index;
            
            const songData = findSongInMusicData(currentAlbum[index].title);

            if (songData) {
                currentVersionIndex = parseInt(version);
                loadSong(songData, currentVersionIndex);
                audio.play();
                updatePlayButton();
                searchResultsPopup.style.display = 'none';
                loadMusicList(genre);
                updateGenreSelection(genre);
                switchPage('library');
            }
        }
    }
});

musicListContainer.addEventListener('click', function(e) {
    const playButton = e.target.closest('.play-song');
    if (playButton) {
        const genre = playButton.dataset.genre;
        const index = parseInt(playButton.dataset.index);
        const version = playButton.dataset.version;

        currentGenre = genre;
        currentAlbum = albumData[genre];
        currentSongIndex = index;
        
        const albumSong = currentAlbum[index];
        const songTitle = typeof albumSong === 'string' ? albumSong : albumSong.title;
        const songData = findSongInMusicData(songTitle);

        if (songData) {
            // Case 1: A specific version was clicked from an expanded list
            if (version !== undefined && version !== 'undefined') {
                currentVersionIndex = parseInt(version);
                loadSong(songData, currentVersionIndex);
            } 
            // Case 2: A main song entry was clicked
            else {
                if (songData.versions) {
                    // If it's a multi-version song, try to find a version that matches the genre name
                    let versionToPlay = songData.versions.findIndex(v => v.version.toLowerCase() === genre.toLowerCase());
                    // If no match, default to the first version
                    if (versionToPlay === -1) {
                        versionToPlay = 0; 
                    }
                    currentVersionIndex = versionToPlay;
                    loadSong(songData, currentVersionIndex);
                } else {
                    // It's a simple single-version song
                    currentVersionIndex = -1;
                    loadSong(songData);
                }
            }
            audio.play();
            updatePlayButton();
        }
    }
});

// 更新 Genre 選取狀態
function updateGenreSelection(genre) {
    libraryGenres.forEach(g => g.classList.remove('active'));
    document.querySelector(`#library .genre-list li[data-genre="${genre}"]`).classList.add('active');
}

// 更新播放按鈕的圖片
function updatePlayButton() {
    if (audio.paused) {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function isFullwidth(char) {
    // 全形字元的 Unicode 範圍 (大致)
    const fullwidthRanges = [
        [0x1100, 0x115f], // Hangul Jamo
        [0x2e80, 0x303e], // CJK Radicals Supplement, Kangxi Radicals, Ideographic Description Characters, CJK Symbols and Punctuation
        [0x3041, 0x30ff], // Hiragana, Katakana
        [0x3130, 0x318e], // Hangul Compatibility Jamo, Hangul Syllables
        [0x3200, 0x32fe], // Enclosed CJK Letters and Months, CJK Compatibility
        [0x4e00, 0xa4cf], // CJK Unified Ideographs
        [0xac00, 0xd7a3], // Hangul Syllables
        [0xf900, 0xfaff], // CJK Compatibility Ideographs
        [0xfe10, 0xfe19], // Vertical Forms
        [0xfe30, 0xfe6b], // CJK Compatibility Forms, Small Form Variants
        [0xff01, 0xff60], // Halfwidth and Fullwidth Forms
        [0xffe0, 0xffe6]  // CJK Compatibility Forms
    ];

    const charCode = char.charCodeAt(0);

    for (const range of fullwidthRanges) {
        if (charCode >= range[0] && charCode <= range[1]) {
            return true; // 是全形字元
        }
    }

    return false; // 不是全形字元
}

function updateTitleAnimation() {
    const titleText = songTitle.innerText;
    let fullwidthCount = 0;
    let halfwidthCount = 0;

    for (let i = 0; i < titleText.length; i++) {
        if (isFullwidth(titleText[i])) {
            fullwidthCount++;
        } else {
            halfwidthCount++;
        }
    }

    const equivalentFullwidthLength = fullwidthCount + (halfwidthCount / 2);
    const shouldAnimate = equivalentFullwidthLength > 12;// 判斷全形字是否超過12個

    if (shouldAnimate) {
        songTitle.classList.add('animate-title');
    } else {
        songTitle.classList.remove('animate-title');
    }
}

// 音訊播放結束時的處理
audio.addEventListener('ended', () => {
    if (repeatMode === 'single') {
        audio.currentTime = 0;
        audio.play();
    } else {
        // 停止播放，或者可以設定為播放下一首
        nextSong()
    }
});

// 控制播放器顯示/隱藏的函數
function toggleMusicPlayer(show) {
    musicPlayer.style.transform = show ? 'translateY(0)' : 'translateY(100%)';
}

// 播放時顯示播放器
audio.addEventListener('play', () => {
    toggleMusicPlayer(true);
});

// 暫停時隱藏播放器（延遲2秒）
audio.addEventListener('pause', () => {
    setTimeout(() => {
        if (audio.paused) { // 確保2秒後還是暫停狀態
            toggleMusicPlayer(false);
        }
    }, 2000);
});

// 事件監聽器
playBtn.addEventListener('click', playSong);
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);
shuffleBtn.addEventListener('click', toggleShuffle);
repeatBtn.addEventListener('click', nextRepeatMode);
audio.addEventListener('timeupdate', updateProgress);
progress.addEventListener('click', setProgress);
searchButton.addEventListener('click', function() {
    searchSongs();
    // 搜尋後自動隱藏側邊欄
    if (sidebarEl) sidebarEl.classList.remove('active');
});

sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
        switchPage(link.dataset.page);
        // 點選選單自動隱藏側邊欄
        if (sidebarEl) sidebarEl.classList.remove('active');
    });
});

libraryGenres.forEach(genre => {
    genre.addEventListener('click', () => {
        libraryGenres.forEach(g => g.classList.remove('active'));
        genre.classList.add('active');
        currentGenre = genre.dataset.genre;
        loadMusicList(currentGenre);
    });
});

// 音訊播放狀態改變時更新按鈕
audio.addEventListener('play', updatePlayButton);
audio.addEventListener('pause', updatePlayButton);

// 搜尋欄按下 Enter 鍵
searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // 防止表單提交
        searchSongs();
        searchResultsPopup.style.display = 'block'; // 顯示彈出視窗
        switchPage('library'); // 跳轉到 Library 頁面
    }
});

// 初始化時顯示 Home 頁面
switchPage('home');

// 關閉彈出視窗
closeButton.addEventListener('click', () => {
    searchResultsPopup.style.display = 'none';
});

searchResultsPopup.style.display = 'none'; //  搜尋結果彈出視窗
imageViewerPopup.style.display = 'none'; // 圖片檢視器

// 左側漢堡按鈕行為
if (menuToggle && sidebarEl) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebarEl.classList.toggle('active');
    });

    // 點擊頁面其他地方關閉側邊欄
    document.addEventListener('click', (e) => {
        if (!sidebarEl.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebarEl.classList.remove('active');
        }
    });
}

// 右側資訊欄行為
if (showInfoBtn && rightSidebar) {
    showInfoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = rightSidebar.classList.toggle('open');
        rightSidebar.setAttribute('aria-hidden', !isOpen);
    });

    const closeRightBtn = document.querySelector('.close-right');
    if (closeRightBtn) {
        closeRightBtn.addEventListener('click', () => {
            rightSidebar.classList.remove('open');
            rightSidebar.setAttribute('aria-hidden', 'true');
        });
    }

    // 在播放時自動顯示右側欄（但不自動隱藏）
    audio.addEventListener('play', () => {
        rightSidebar.classList.add('open');
        rightSidebar.setAttribute('aria-hidden', 'false');
    });
}