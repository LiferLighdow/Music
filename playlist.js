/* playlist.js
   提供「自製播放清單」功能，使用 localStorage 儲存
   - 不會移除或改寫現有的 #playlist-list 內容；會在其下方附加自製清單 UI
   - 支援建立/重新命名/刪除清單、將歌曲加入/移除清單、載入清單成為目前播放序列
*/
(function(){
  const STORAGE_KEY = 'customPlaylists_v1';
  // Wait for DOM ready and retry if musicData isn't loaded yet
  document.addEventListener('DOMContentLoaded', () => { initWithRetry(0); });

  function initWithRetry(attempt){
    const maxAttempts = 10;
    const playlistListEl = document.getElementById('playlist-list');
    if (!playlistListEl) {
      console.warn('playlist.js: missing #playlist-list - custom playlists disabled');
      return;
    }
    if (typeof musicData === 'undefined' && typeof window.musicData === 'undefined') {
      if (attempt < maxAttempts) {
        setTimeout(()=> initWithRetry(attempt + 1), 200);
        return;
      }
      console.warn('playlist.js: musicData not found after retries - custom playlists will still allow creating empty playlists');
    }
    ensureUI();
    renderCustomPlaylists();
  }

  // 取得 localStorage 的清單資料
  function loadFromStorage(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch(e){
      console.warn('Failed to parse custom playlists from storage', e);
      return [];
    }
  }

  function saveToStorage(list){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch(e){
      console.warn('Failed to save custom playlists', e);
    }
  }

  // 建立 UI（按鈕與 modal），不移除原有內容
  function ensureUI(){
    const playlistsPage = document.getElementById('playlists');
    if (!playlistsPage) return;

    // 若已經建立過就跳過
    if (document.getElementById('custom-playlist-controls')) return;

    const container = document.createElement('div');
    container.id = 'custom-playlist-controls';
    container.style.margin = '12px 0 18px 0';
    container.innerHTML = `
      <button id="open-custom-playlists" class="custom-playlist-btn" style="display:inline-flex;align-items:center;gap:8px;">🎵 Custom Playlists</button>
      <div id="custom-playlist-list" style="margin-top:8px"></div>
  `;
    // append below playlist-list heading
    const playlistListEl = document.getElementById('playlist-list');
    playlistListEl.parentNode.insertBefore(container, playlistListEl.nextSibling);

    document.getElementById('open-custom-playlists').addEventListener('click', openManageModal);
  }

  // 將自製清單渲染到頁面（在 #playlist-list 下方的 custom-playlist-list）
  function renderCustomPlaylists(){
    const list = loadFromStorage();
    const holder = document.getElementById('custom-playlist-list');
    holder.innerHTML = '';
    if (!list || list.length === 0) {
      holder.innerHTML = '<small style="color:#b3b3b3">No custom playlists yet.</small>';
      return;
    }

    list.forEach((pl, idx) => {
      const el = document.createElement('div');
      el.className = 'custom-playlist-item';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'space-between';
      el.style.padding = '6px 8px';
      el.style.background = 'rgba(255,255,255,0.02)';
      el.style.marginBottom = '6px';
      el.style.borderRadius = '6px';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.flexDirection = 'column';
      const name = document.createElement('strong');
      name.innerText = pl.name;
  const meta = document.createElement('small');
  meta.style.color = '#b3b3b3';
  meta.innerText = `${pl.songs ? pl.songs.length : 0} song(s)`;
      left.appendChild(name);
      left.appendChild(meta);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

  const loadBtn = document.createElement('button');
  loadBtn.className = 'custom-playlist-btn';
  loadBtn.innerText = 'Load';
      loadBtn.addEventListener('click', ()=>{ loadCustomPlaylist(idx); });

  const renameBtn = document.createElement('button');
  renameBtn.className = 'custom-playlist-btn';
  renameBtn.innerText = 'Rename';
      renameBtn.addEventListener('click', ()=>{ renamePlaylistPrompt(idx); });

  const delBtn = document.createElement('button');
  delBtn.className = 'custom-playlist-btn';
  delBtn.innerText = 'Delete';
      delBtn.addEventListener('click', ()=>{ deletePlaylist(idx); });

      actions.appendChild(loadBtn);
      actions.appendChild(renameBtn);
      actions.appendChild(delBtn);

      el.appendChild(left);
      el.appendChild(actions);

      holder.appendChild(el);
    });
  }

  // 載入自製播放清單成為目前播放序列
  function loadCustomPlaylist(index){
    const list = loadFromStorage();
    const pl = list[index];
    if (!pl || !pl.songs || pl.songs.length === 0) {
      alert('Playlist is empty or not found');
      return;
    }
    // 將 currentAlbum 設為清單的歌曲標題陣列（與現有邏輯相容）
    try {
      // Use music.js helper to load titles as the current playlist
      if (typeof window.loadPlaylistTitles === 'function') {
        window.loadPlaylistTitles(pl.songs, 0, true);
      } else {
        // Fallback: set currentAlbum directly if helper missing
        window.currentAlbum = pl.songs.slice();
        window.currentSongIndex = 0;
      }
      alert(`Loaded playlist: ${pl.name} (${pl.songs.length} songs)`);
    } catch(e){
      console.error('Failed to load custom playlist', e);
      alert('Failed to load playlist, check console');
    }
  }

  function renamePlaylistPrompt(index){
    const list = loadFromStorage();
    const pl = list[index];
    if (!pl) return;
  const newName = prompt('Enter new playlist name', pl.name);
    if (!newName) return;
    pl.name = newName.trim();
    saveToStorage(list);
    renderCustomPlaylists();
  }

  function deletePlaylist(index){
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    const list = loadFromStorage();
    list.splice(index,1);
    saveToStorage(list);
    renderCustomPlaylists();
  }

  // 打開管理視窗（modal）
  function openManageModal(){
    // 如果已存在就顯示
    let modal = document.getElementById('custom-playlist-modal');
    if (modal) { modal.style.display = 'flex'; return; }

    modal = document.createElement('div');
    modal.id = 'custom-playlist-modal';
    Object.assign(modal.style, {
      position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex: 20000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)'
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {width:'92%', maxWidth:'920px', maxHeight:'86vh', overflow:'auto', background:'#121212', padding:'18px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)'});

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">Custom Playlists Manager</h3>
        <div>
          <button id="close-custom-playlist" class="custom-playlist-btn">Close</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <input id="new-playlist-name" placeholder="Enter new playlist name" style="flex:1;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:#111;color:#fff">
        <button id="create-playlist" class="custom-playlist-btn">Create</button>
      </div>
      <div style="display:flex;gap:12px;">
        <div style="flex:1;min-width:260px">
          <h4>All Songs</h4>
          <div id="all-songs-list" style="max-height:48vh;overflow:auto;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px"></div>
        </div>
        <div style="width:320px;min-width:220px">
          <h4>Playlists</h4>
          <div id="modal-playlists" style="max-height:48vh;overflow:auto;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px"></div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
        <button id="add-selected-to" class="custom-playlist-btn">Add selected to chosen playlist</button>
        <button id="remove-selected-from" class="custom-playlist-btn">Remove selected from chosen playlist</button>
      </div>
    `;

    modal.appendChild(panel);
    document.body.appendChild(modal);

    document.getElementById('close-custom-playlist').addEventListener('click', ()=>{ modal.style.display='none'; });
    document.getElementById('create-playlist').addEventListener('click', createPlaylistFromInput);
    document.getElementById('add-selected-to').addEventListener('click', addSelectedToPlaylist);
    document.getElementById('remove-selected-from').addEventListener('click', removeSelectedFromPlaylist);

    renderAllSongs();
    renderModalPlaylists();
  }

  function renderAllSongs(){
    const holder = document.getElementById('all-songs-list');
    holder.innerHTML = '';
      if (typeof musicData === 'undefined' || !Array.isArray(musicData)) {
        holder.innerHTML = '<small style="color:#b3b3b3">No song database available</small>';
        return;
      }
      musicData.forEach((s, i)=>{
        const title = s.title || s.name || ('song-' + i);
        const artist = s.artist || s.singer || 'Unknown';
        const row = document.createElement('label');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '6px';
        row.style.borderRadius = '6px';
        row.style.cursor = 'pointer';
        row.innerHTML = '<span style="flex:1">' + escapeHtml(title) + ' <small style="color:#b3b3b3">— ' + escapeHtml(artist) + '</small></span>' + '<input type="checkbox" data-title="' + escapeHtml(title) + '">';
        holder.appendChild(row);
      });
  }

  function renderModalPlaylists(){
    const holder = document.getElementById('modal-playlists');
    const list = loadFromStorage();
    holder.innerHTML = '';
    if (!list || list.length === 0) { holder.innerHTML = '<small style="color:#b3b3b3">No custom playlists</small>'; return; }
    list.forEach((pl, idx)=>{
      const el = document.createElement('div');
      el.style.display='flex';
      el.style.alignItems='center';
      el.style.justifyContent='space-between';
      el.style.padding='6px';
      el.style.borderRadius='6px';
      el.innerHTML = `<span style='flex:1'>${escapeHtml(pl.name)} <small style='color:#b3b3b3'>(${pl.songs ? pl.songs.length:0})</small></span><input type='radio' name='modal-selected-playlist' value='${idx}'>`;
      holder.appendChild(el);
    });
  }

  function createPlaylistFromInput(){
    const input = document.getElementById('new-playlist-name');
    const name = (input.value||'').trim();
  if (!name) { alert('Please enter a playlist name'); return; }
    const list = loadFromStorage();
    // 避免重複名稱
  if (list.some(p=>p.name===name)) { alert('A playlist with that name already exists, choose another name'); return; }
    list.push({name, songs: []});
    saveToStorage(list);
    input.value = '';
    renderModalPlaylists();
    renderCustomPlaylists();
  }

  function addSelectedToPlaylist(){
    const radio = document.querySelector('input[name="modal-selected-playlist"]:checked');
  if (!radio) { alert('Please select a playlist to add to'); return; }
    const idx = Number(radio.value);
    const list = loadFromStorage();
    const pl = list[idx];
    if (!pl) return;
    const checks = Array.from(document.querySelectorAll('#all-songs-list input[type=checkbox]:checked'));
  if (checks.length === 0) { alert('Please check at least one song to add'); return; }
    checks.forEach(ch => {
      const t = ch.dataset.title;
      if (!t) return;
      // 避免重複
      if (!pl.songs) pl.songs = [];
      if (!pl.songs.includes(t)) pl.songs.push(t);
    });
    saveToStorage(list);
    renderModalPlaylists();
    renderCustomPlaylists();
  alert('Added selected songs to "' + pl.name + '"');
  }

  function removeSelectedFromPlaylist(){
    const radio = document.querySelector('input[name="modal-selected-playlist"]:checked');
  if (!radio) { alert('Please select a playlist to remove from'); return; }
    const idx = Number(radio.value);
    const list = loadFromStorage();
    const pl = list[idx];
    if (!pl || !pl.songs) return;
    const checks = Array.from(document.querySelectorAll('#all-songs-list input[type=checkbox]:checked'));
  if (checks.length === 0) { alert('Please check at least one song to remove'); return; }
    const titlesToRemove = checks.map(c=>c.dataset.title);
    pl.songs = pl.songs.filter(s=>!titlesToRemove.includes(s));
    saveToStorage(list);
    renderModalPlaylists();
    renderCustomPlaylists();
  alert('Removed selected songs from "' + pl.name + '"');
  }

  // 安全的 HTML escape for attribute insertion
  function escapeHtml(str){
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // Public helper: open the modal and pre-check a single song title for quick add
  window.openCustomPlaylistAddDialog = function(title){
    if (!title) return;
    openManageModal();
    // ensure songs rendered
    setTimeout(()=>{
      // uncheck all
      document.querySelectorAll('#all-songs-list input[type=checkbox]').forEach(ch => ch.checked = false);
      // find matching checkbox by dataset
      const ch = Array.from(document.querySelectorAll('#all-songs-list input[type=checkbox]')).find(c => c.dataset.title === title || c.dataset.title === (title.replace(/\s*\(.+\)$/,'')));
      if (ch) ch.checked = true;
    }, 120);
  };

  // Public helper: add a single title to a given playlist index
  window.addSongToCustomPlaylistByIndex = function(title, playlistIndex){
    if (!title) return false;
    const list = loadFromStorage();
    const idx = Number(playlistIndex);
    if (!list || !list[idx]) return false;
    const pl = list[idx];
    if (!pl.songs) pl.songs = [];
    if (!pl.songs.includes(title)) pl.songs.push(title);
    saveToStorage(list);
    renderModalPlaylists();
    renderCustomPlaylists();
    return true;
  };

})();
