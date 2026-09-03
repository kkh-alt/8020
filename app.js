'use strict';

/* =========================================================================
 *  설정  —  여기 CLIENT_ID 한 줄만 채우면 됩니다. (README 참고)
 * ======================================================================= */
const CONFIG = {
  // Google Cloud Console에서 발급한 "웹 애플리케이션" OAuth 클라이언트 ID
    CLIENT_ID: '800277046739-946glu8336qjpn1khe31q5h85p7ickt9.apps.googleusercontent.com',

  // 구글 드라이브 Audio 폴더 ID (이미 채워져 있음)
  FOLDER_ID: '1s4unsga_O2BOG5wvzr7t-CkA3XVEAmsB',

  // 읽기 전용 권한만 요청
  SCOPE: 'https://www.googleapis.com/auth/drive.readonly',

  SKIP_SECONDS: 3,
};

/* ========================= 상태 ========================= */
let tokenClient = null;
let accessToken = null;
let tracks = [];
let activeId = null;
let currentObjectUrl = null;

/* ========================= DOM ========================= */
const $ = (id) => document.getElementById(id);
const audio = $('audio');
const recAudio = $('recAudio');
const els = {
  now: $('nowPlaying'),
  seek: $('seek'),
  cur: $('curTime'),
  dur: $('durTime'),
  back3: $('back3'),
  fwd3: $('fwd3'),
  playPause: $('playPause'),
  ppIco: $('ppIco'),
  ppLbl: $('ppLbl'),
  record: $('record'),
  recIco: $('recIco'),
  recLbl: $('recLbl'),
  myrec: $('myrec'),
  playRec: $('playRec'),
  status: $('status'),
  authCard: $('authCard'),
  authMsg: $('authMsg'),
  signIn: $('signIn'),
  refresh: $('refresh'),
  list: $('tracks'),
  listEmpty: $('listEmpty'),
  note: $('note'),
  noteCount: $('noteCount'),
};

/* ========================= 유틸 ========================= */
function setStatus(msg) { els.status.textContent = msg || ''; }

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

// "60-2.MP3" < "60-10.MP3" 가 되도록 숫자 인식 정렬
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function isConfigured() {
  return CONFIG.CLIENT_ID && !CONFIG.CLIENT_ID.startsWith('YOUR_CLIENT_ID');
}

/* ========================= 인증 ========================= */
function initAuth() {
  if (!isConfigured()) {
    els.authMsg.innerHTML =
      'CLIENT_ID가 아직 설정되지 않았습니다. <br><code>app.js</code> 상단의 ' +
      '<code>CONFIG.CLIENT_ID</code> 를 채운 뒤 새로고침하세요. (README 참고)';
    els.signIn.disabled = true;
    return;
  }
  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    // GIS 스크립트가 아직 로드 안 됨 — 잠시 후 재시도
    return setTimeout(initAuth, 300);
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPE,
    callback: (resp) => {
      if (resp && resp.access_token) {
        accessToken = resp.access_token;
        els.authCard.classList.add('hidden');
        setStatus('로그인됨. 목록을 불러옵니다…');
        loadList();
      } else {
        setStatus('로그인에 실패했습니다.');
      }
    },
    error_callback: (err) => {
      setStatus('로그인이 취소되었거나 실패했습니다: ' + (err && err.type));
    },
  });

  els.signIn.disabled = false;
  // 이미 동의한 적이 있으면 조용히 토큰 시도
  requestToken(false);
}

function requestToken(interactive) {
  if (!tokenClient) return;
  tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
}

/* ========================= 드라이브 ========================= */
async function driveFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (res.status === 401) {
    accessToken = null;
    throw new Error('AUTH');
  }
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res;
}

async function loadList() {
  if (!accessToken) return requestToken(true);
  setStatus('음원 목록을 불러오는 중…');
  els.refresh.disabled = true;
  try {
    let files = [];
    let pageToken = '';
    do {
      const u = new URL('https://www.googleapis.com/drive/v3/files');
      u.searchParams.set(
        'q',
        `'${CONFIG.FOLDER_ID}' in parents and trashed = false`
      );
      u.searchParams.set('fields', 'nextPageToken, files(id,name,mimeType)');
      u.searchParams.set('pageSize', '1000');
      u.searchParams.set('orderBy', 'name');
      if (pageToken) u.searchParams.set('pageToken', pageToken);
      const data = await (await driveFetch(u.toString())).json();
      files = files.concat(data.files || []);
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    tracks = files
      .filter(
        (f) =>
          /^audio\//.test(f.mimeType || '') || /\.mp3$/i.test(f.name || '')
      )
      .sort((a, b) => naturalCompare(a.name, b.name));

    renderList();
    setStatus(tracks.length ? tracks.length + '개 음원' : '');
  } catch (e) {
    if (e.message === 'AUTH') {
      setStatus('세션이 만료되어 다시 로그인합니다…');
      requestToken(true);
    } else {
      setStatus('목록을 불러오지 못했습니다: ' + e.message);
    }
  } finally {
    els.refresh.disabled = false;
  }
}

function renderList() {
  els.list.innerHTML = '';
  els.listEmpty.hidden = tracks.length > 0;
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'track' + (t.id === activeId ? ' active' : '');
    b.innerHTML =
      `<span class="num">${i + 1}</span><span class="name"></span>`;
    b.querySelector('.name').textContent = t.name;
    b.addEventListener('click', () => selectTrack(t));
    li.appendChild(b);
    els.list.appendChild(li);
  });
}

async function selectTrack(t) {
  activeId = t.id;
  renderList();
  els.now.textContent = t.name;
  setStatus('불러오는 중… ' + t.name);
  try {
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${t.id}?alt=media`
    );
    const blob = await res.blob();
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(blob);
    audio.src = currentObjectUrl;
    await audio.play().catch(() => {});
    setStatus('');
  } catch (e) {
    if (e.message === 'AUTH') {
      setStatus('세션이 만료되어 다시 로그인합니다…');
      requestToken(true);
    } else {
      setStatus('재생할 수 없습니다: ' + e.message);
    }
  }
}

/* ========================= 재생기 ========================= */
function togglePlay() {
  if (!audio.src) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

function skip(delta) {
  if (!audio.src || !isFinite(audio.duration)) return;
  audio.currentTime = Math.min(
    Math.max(0, audio.currentTime + delta),
    audio.duration
  );
}

audio.addEventListener('play', () => {
  els.ppIco.textContent = '⏸';
  els.ppLbl.textContent = '일시정지';
});
audio.addEventListener('pause', () => {
  els.ppIco.textContent = '▶';
  els.ppLbl.textContent = '재생';
});
audio.addEventListener('loadedmetadata', () => {
  els.dur.textContent = fmtTime(audio.duration);
  els.seek.max = audio.duration || 100;
});
audio.addEventListener('timeupdate', () => {
  els.cur.textContent = fmtTime(audio.currentTime);
  if (!seeking) els.seek.value = audio.currentTime;
});
audio.addEventListener('ended', () => {
  els.ppIco.textContent = '▶';
  els.ppLbl.textContent = '재생';
});

let seeking = false;
els.seek.addEventListener('input', () => {
  seeking = true;
  els.cur.textContent = fmtTime(parseFloat(els.seek.value));
});
els.seek.addEventListener('change', () => {
  if (audio.src) audio.currentTime = parseFloat(els.seek.value);
  seeking = false;
});

els.playPause.addEventListener('click', togglePlay);
els.back3.addEventListener('click', () => skip(-CONFIG.SKIP_SECONDS));
els.fwd3.addEventListener('click', () => skip(CONFIG.SKIP_SECONDS));

/* ========================= 녹음 ========================= */
let mediaRecorder = null;
let recChunks = [];
let recStream = null;
let lastRecUrl = null;

async function toggleRecord() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    return;
  }
  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia ||
    typeof MediaRecorder === 'undefined'
  ) {
    setStatus('이 브라우저는 녹음을 지원하지 않습니다.');
    return;
  }
  try {
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    setStatus('마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.');
    return;
  }
  recChunks = [];
  try {
    mediaRecorder = new MediaRecorder(recStream);
  } catch (e) {
    setStatus('녹음을 시작할 수 없습니다: ' + e.message);
    recStream.getTracks().forEach((tr) => tr.stop());
    recStream = null;
    return;
  }
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size) recChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const type = recChunks[0] ? recChunks[0].type : 'audio/webm';
    const blob = new Blob(recChunks, { type });
    if (lastRecUrl) URL.revokeObjectURL(lastRecUrl);
    lastRecUrl = URL.createObjectURL(blob);
    recAudio.src = lastRecUrl;
    els.myrec.hidden = false;
    setRecUI(false);
    setStatus('녹음 완료. "내 녹음 듣기"로 확인하세요.');
    // 마이크 해제 (프라이버시)
    recStream.getTracks().forEach((tr) => tr.stop());
    recStream = null;
  };
  mediaRecorder.start();
  setRecUI(true);
  setStatus('녹음 중… 다시 누르면 정지');
}

function setRecUI(on) {
  els.record.classList.toggle('on', on);
  els.recIco.textContent = on ? '■' : '●';
  els.recLbl.textContent = on ? '정지' : '녹음';
}

els.record.addEventListener('click', toggleRecord);
els.playRec.addEventListener('click', () => {
  if (recAudio.src) recAudio.play().catch(() => {});
});

/* ========================= 타이핑 ========================= */
els.note.addEventListener('input', () => {
  els.noteCount.textContent = els.note.value.length + '자 · 저장되지 않음';
});

/* ========================= 키보드 (PC 편의) ========================= */
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    skip(-CONFIG.SKIP_SECONDS);
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    skip(CONFIG.SKIP_SECONDS);
  } else if (e.key.toLowerCase() === 'r') {
    toggleRecord();
  }
});

/* ========================= 버튼 배선 ========================= */
els.signIn.addEventListener('click', () => requestToken(true));
els.refresh.addEventListener('click', loadList);

/* ========================= 서비스 워커 ========================= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ========================= 시작 ========================= */
initAuth();
