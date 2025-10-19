// 自製播放清單的相關功能
let customPlaylists = JSON.parse(localStorage.getItem('customPlaylists')) || [];

// 當前播放清單的狀態
let currentPlayingPlaylist = null;
let currentPlaylistIndex = -1;

// 播放清單相關的 DOM 元素
const createPlaylistBtn = document.getElementById('create-playlist');
const playlistDialog = document.getElementById('playlist-dialog');
const playlistNameInput = document.getElementById('playlist-name');
const savePlaylistBtn = document.getElementById('save-playlist');
const cancelPlaylistBtn = document.getElementById('cancel-playlist');

// 顯示建立播放清單對話框
createPlaylistBtn.addEventListener('click', () => {
    playlistDialog.classList.add('show');
    playlistNameInput.value = '';
    playlistNameInput.focus();
});

// 取消建立播放清單
cancelPlaylistBtn.addEventListener('click', () => {
    playlistDialog.classList.remove('show');
});

// 儲存新的播放清單
savePlaylistBtn.addEventListener('click', () => {
    const name = playlistNameInput.value.trim();
    if (name) {
        const newPlaylist = {
            id: Date.now(), // 使用時間戳作為唯一ID
            name: name,
            songs: [], // 儲存歌曲資訊的陣列
            createdAt: new Date().toISOString()
        };
        
        customPlaylists.push(newPlaylist);
        savePlaylistsToStorage();
        renderCustomPlaylists();
        playlistDialog.classList.remove('show');
    }
});

// 儲存播放清單到 localStorage
function savePlaylistsToStorage() {
    localStorage.setItem('customPlaylists', JSON.stringify(customPlaylists));
}

// 渲染自製播放清單
function renderCustomPlaylists() {
    const playlistList = document.getElementById('playlist-list');
    playlistList.innerHTML = '';

    customPlaylists.forEach(playlist => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="playlist-item">
                <div class="playlist-info">
                    <h3 class="playlist-title">${playlist.name}</h3>
                    <p class="playlist-count">${playlist.songs.length} 首歌曲</p>
                </div>
                <div class="playlist-actions">
                    <button class="playlist-action-button play-playlist" data-id="${playlist.id}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="playlist-action-button edit-playlist" data-id="${playlist.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="playlist-action-button delete-playlist" data-id="${playlist.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // 播放播放清單
        li.querySelector('.play-playlist').addEventListener('click', (e) => {
            const playlistId = e.currentTarget.dataset.id;
            const playlist = customPlaylists.find(p => p.id === parseInt(playlistId));
            if (playlist && playlist.songs.length > 0) {
                playPlaylist(playlist);
            }
        });

        // 編輯播放清單
        li.querySelector('.edit-playlist').addEventListener('click', (e) => {
            const playlistId = e.currentTarget.dataset.id;
            editPlaylist(playlistId);
        });

        // 刪除播放清單
        li.querySelector('.delete-playlist').addEventListener('click', (e) => {
            const playlistId = e.currentTarget.dataset.id;
            if (confirm('確定要刪除這個播放清單嗎？')) {
                deletePlaylist(playlistId);
            }
        });

        playlistList.appendChild(li);
    });
}

// 播放播放清單中的歌曲
function playPlaylist(playlist) {
    if (playlist.songs.length === 0) return;
    
    // 設定當前播放清單狀態
    currentPlayingPlaylist = playlist;
    currentPlaylistIndex = 0;
    
    // 載入播放清單中的第一首歌
    const firstSong = playlist.songs[0];
    loadSong(firstSong.songData, firstSong.versionIndex);
    audio.play();
    
    // 標記為播放清單模式
    window.isPlayingFromPlaylist = true;
}

// 播放清單中的下一首歌
function playNextInPlaylist() {
    if (!currentPlayingPlaylist || !window.isPlayingFromPlaylist) return false;
    
    currentPlaylistIndex++;
    if (currentPlaylistIndex >= currentPlayingPlaylist.songs.length) {
        // 直接回到第一首
        currentPlaylistIndex = 0;
    }
    
    const nextSong = currentPlayingPlaylist.songs[currentPlaylistIndex];
    loadSong(nextSong.songData, nextSong.versionIndex);
    audio.play();
    return true;
}

// 播放清單中的上一首歌
function playPreviousInPlaylist() {
    if (!currentPlayingPlaylist || !window.isPlayingFromPlaylist) return false;
    
    currentPlaylistIndex--;
    if (currentPlaylistIndex < 0) {
        // 如果是循環播放模式，跳到最後一首
        if (window.repeatMode === 'folder') {
            currentPlaylistIndex = currentPlayingPlaylist.songs.length - 1;
        } else {
            currentPlaylistIndex = 0;
        }
    }
    
    const prevSong = currentPlayingPlaylist.songs[currentPlaylistIndex];
    loadSong(prevSong.songData, prevSong.versionIndex);
    audio.play();
    return true;
}

// 編輯播放清單
function editPlaylist(playlistId) {
    const playlist = customPlaylists.find(p => p.id === parseInt(playlistId));
    if (!playlist) return;

    const dialog = document.getElementById('edit-playlist-dialog');
    const nameInput = document.getElementById('edit-playlist-name');
    const songsList = dialog.querySelector('.playlist-songs');
    const cancelBtn = document.getElementById('cancel-edit-playlist');
    const saveBtn = document.getElementById('save-edit-playlist');

    // 設置播放清單名稱
    nameInput.value = playlist.name;

    // 渲染歌曲列表
    songsList.innerHTML = playlist.songs.map((song, index) => `
        <div class="playlist-song-item" data-index="${index}">
            <div class="playlist-song-info">
                <div class="playlist-song-title">${song.songData.title}</div>
                <div class="playlist-song-artist">Lifer_Lighdow</div>
            </div>
            <div class="playlist-song-actions">
                ${index > 0 ? `
                    <button class="move-up" title="上移">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                ` : ''}
                ${index < playlist.songs.length - 1 ? `
                    <button class="move-down" title="下移">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                ` : ''}
                <button class="remove-song" title="移除">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');

    // 綁定歌曲操作事件
    songsList.querySelectorAll('.playlist-song-item').forEach(item => {
        const index = parseInt(item.dataset.index);

        // 上移歌曲
        const moveUpBtn = item.querySelector('.move-up');
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', () => {
                if (index > 0) {
                    const temp = playlist.songs[index];
                    playlist.songs[index] = playlist.songs[index - 1];
                    playlist.songs[index - 1] = temp;
                    editPlaylist(playlistId); // 重新渲染
                }
            });
        }

        // 下移歌曲
        const moveDownBtn = item.querySelector('.move-down');
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', () => {
                if (index < playlist.songs.length - 1) {
                    const temp = playlist.songs[index];
                    playlist.songs[index] = playlist.songs[index + 1];
                    playlist.songs[index + 1] = temp;
                    editPlaylist(playlistId); // 重新渲染
                }
            });
        }

        // 移除歌曲
        const removeBtn = item.querySelector('.remove-song');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                playlist.songs.splice(index, 1);
                editPlaylist(playlistId); // 重新渲染
            });
        }
    });

    // 取消編輯
    cancelBtn.onclick = () => {
        dialog.classList.remove('show');
    };

    // 儲存變更
    saveBtn.onclick = () => {
        const newName = nameInput.value.trim();
        if (newName) {
            playlist.name = newName;
            savePlaylistsToStorage();
            renderCustomPlaylists();
            dialog.classList.remove('show');
        }
    };

    // 顯示對話框
    dialog.classList.add('show');
}

// 刪除播放清單
function deletePlaylist(playlistId) {
    customPlaylists = customPlaylists.filter(p => p.id !== parseInt(playlistId));
    savePlaylistsToStorage();
    renderCustomPlaylists();
}

// 新增歌曲到播放清單
function addSongToPlaylist(playlistId, song, versionIndex = -1) {
    const playlist = customPlaylists.find(p => p.id === parseInt(playlistId));
    if (playlist) {
        // 檢查歌曲是否已在播放清單中
        const exists = playlist.songs.some(s => 
            s.songData.title === song.title && s.versionIndex === versionIndex
        );
        
        if (!exists) {
            playlist.songs.push({
                songData: song,
                versionIndex: versionIndex,
                addedAt: new Date().toISOString()
            });
            savePlaylistsToStorage();
            renderCustomPlaylists();
        }
    }
}

// 從播放清單中移除歌曲
function removeSongFromPlaylist(playlistId, songIndex) {
    const playlist = customPlaylists.find(p => p.id === parseInt(playlistId));
    if (playlist) {
        playlist.songs.splice(songIndex, 1);
        savePlaylistsToStorage();
        renderCustomPlaylists();
    }
}

// 初始化載入播放清單
document.addEventListener('DOMContentLoaded', () => {
    renderCustomPlaylists();
});

// 為音樂列表中的每首歌曲添加"加入播放清單"功能
function addToPlaylistContextMenu(songElement, song, versionIndex = -1) {
    const addToPlaylistButton = document.createElement('button');
    addToPlaylistButton.className = 'add-to-playlist-button';
    addToPlaylistButton.innerHTML = '<i class="fas fa-plus"></i>';
    addToPlaylistButton.title = '加入播放清單';
    
    addToPlaylistButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showPlaylistSelector(song, versionIndex);
    });
    
    songElement.querySelector('.song-actions').prepend(addToPlaylistButton);
}

// 顯示播放清單選擇器
function showPlaylistSelector(song, versionIndex) {
    const selector = document.createElement('div');
    selector.className = 'playlist-selector';
    selector.innerHTML = `
        <div class="playlist-selector-content">
            <h4>加入播放清單</h4>
            <div class="playlist-options">
                ${customPlaylists.map(playlist => `
                    <button data-id="${playlist.id}">${playlist.name}</button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(selector);
    
    // 點擊播放清單選項
    selector.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const playlistId = parseInt(button.dataset.id);
            addSongToPlaylist(playlistId, song, versionIndex);
            selector.remove();
        });
    });
    
    // 點擊外部關閉選擇器
    selector.addEventListener('click', (e) => {
        if (e.target === selector) {
            selector.remove();
        }
    });
}

// 更新歌曲列表渲染函數，加入播放清單按鈕
const originalLoadMusicList = window.loadMusicList;
window.loadMusicList = function(genre) {
    originalLoadMusicList(genre);
    
    // 為每個歌曲項目添加加入播放清單按鈕
    document.querySelectorAll('#music-list .song-item').forEach(item => {
        const songTitle = item.querySelector('h3').textContent;
        const song = findSongInMusicData(songTitle);
        if (song) {
            addToPlaylistContextMenu(item, song);
        }
    });
};