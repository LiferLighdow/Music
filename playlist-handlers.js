// 移除舊的結束事件監聽器
const oldEndedHandler = audio._endedHandler;
if (oldEndedHandler) {
    audio.removeEventListener('ended', oldEndedHandler);
}

// 新的結束事件處理函數
audio._endedHandler = () => {
    if (repeatMode === 'single') {
        // 單曲循環模式
        audio.currentTime = 0;
        audio.play();
    } else if (window.isPlayingFromPlaylist) {
        // 播放清單模式
        if (!playNextInPlaylist() && repeatMode === 'folder') {
            // 如果是最後一首且設定了資料夾循環，從頭開始播放
            currentPlaylistIndex = 0;
            const firstSong = currentPlayingPlaylist.songs[0];
            loadSong(firstSong.songData, firstSong.versionIndex);
            audio.play();
        }
    } else {
        // 一般模式
        nextSong();
    }
};

// 添加新的結束事件監聽器
audio.addEventListener('ended', audio._endedHandler);