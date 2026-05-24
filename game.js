(function () {
  "use strict";

  const STORAGE_KEY = "cyber-bonsai-daily-v4";
  const MAX_CLICKS = 6; /* 6 次点击，7 张生长图（含 background） */
  const COOLDOWN_MS = 0; /* 无冷却；上线可改回 3 * 60 * 60 * 1000 */
  const WILT_MS = 6 * 60 * 60 * 1000;
  const DEATH_MS = 5 * 24 * 60 * 60 * 1000;
  const SHELF_MAX = 5;
  const STAGE7_ADMIRE_MS = 3500;
  /** 越靠后的心情权重越高（第 n 次权重 = 1 + (n-1) × 此值） */
  const MOOD_CLICK_WEIGHT_STEP = 0.35;

  /** 五盆：左列上两格 + 右列上三格（与 flowerstand.png 对齐，%） */
  const SHELF_SLOTS = [
    { x: 50, y: 47 },
    { x: 50, y: 65 },
    { x: 70, y: 37 },
    { x: 70, y: 55 },
    { x: 70, y: 73 },
  ];

  const MOODS = [
    {
      id: "happy",
      label: "开心",
      emoji: "😊",
      type: "positive",
      traits: { bright: 3, elegant: 1 },
      messages: [
        "亮色已写入花盆，今天也请闪闪发亮。",
        "开心是会传染的，花瓣也跟着抬起了头。",
        "就把这份轻快留给这株花吧，它记得住。",
        "你笑的时候，它也多开了一片光晕。",
      ],
    },
    {
      id: "bliss",
      label: "幸福",
      emoji: "🥰",
      type: "positive",
      traits: { bright: 3, elegant: 2 },
      messages: [
        "暖意落进土里，花影变得柔软了许多。",
        "幸福不必很大，像现在这样就已经很好。",
        "这株花替你收好此刻的甜，慢慢发酵。",
        "被爱的感觉，也长成了新的纹路。",
      ],
    },
    {
      id: "calm",
      label: "平静",
      emoji: "😌",
      type: "positive",
      traits: { elegant: 3, bright: 1 },
      messages: [
        "风停了半拍，花枝也跟着安静下来。",
        "平静不是空白，是给自己留出的空隙。",
        "此刻很好，不必急着长成别的样子。",
        "呼吸浅一点，花盆里的光也会慢下来。",
      ],
    },
    {
      id: "excited",
      label: "兴奋",
      emoji: "🤩",
      type: "positive",
      traits: { bright: 2, weird: 2 },
      messages: [
        "能量有点溢出来了，花瓣闪着不规则的边。",
        "兴奋也很好，像短路的星星，亮得坦率。",
        "把雀跃交给花吧，它会长成奇特的模样。",
        "心跳快一拍没关系，花也在跟着加速生长。",
      ],
    },
    {
      id: "angry",
      label: "愤怒",
      emoji: "😤",
      type: "negative",
      traits: { dark: 3, weird: 2 },
      messages: [
        "怒气被花盆接住了，刺也长成了新的纹路。",
        "生气不代表你不好，只是边界在发声。",
        "火气压一压，花会往暗处开出棱角。",
        "这口气吐出来就好，花替你守着余温。",
      ],
    },
    {
      id: "anxious",
      label: "焦虑",
      emoji: "😰",
      type: "negative",
      traits: { dark: 2, weird: 3 },
      messages: [
        "乱跳的讯号已存档，花枝轻轻颤了一下。",
        "焦虑是大脑在加班，身体可以先歇一歇。",
        "不必立刻想通，花也在慢慢校准频率。",
        "把注意力放回呼吸，花盆还在这里。",
      ],
    },
    {
      id: "wronged",
      label: "委屈",
      emoji: "🥺",
      type: "negative",
      traits: { dark: 2, elegant: 1 },
      messages: [
        "委屈被看见了，花瓣垂下来陪了你一会儿。",
        "你没有错，只是想要一句「我懂你」。",
        "把说不出口的话交给花，它会慢慢消化。",
        "软下来的心，也需要被好好托住。",
      ],
    },
    {
      id: "sad",
      label: "低落",
      emoji: "😢",
      type: "negative",
      traits: { dark: 3, elegant: 1 },
      messages: [
        "低落的日子，花也会陪你暗一点、慢一点。",
        "哭过也没关系，土壤是湿的，正好养根。",
        "阴天不会一直在，你先允许自己难过。",
        "这株花不会催你振作，只会陪你等。",
      ],
    },
    {
      id: "tired",
      label: "疲惫",
      emoji: "😴",
      type: "negative",
      traits: { dark: 2, weird: 1 },
      messages: [
        "电量见底了，花枝也悄悄垂了一点。",
        "累了就歇，成长可以明天再继续。",
        "你已经撑了很久，今晚请对自己温柔些。",
        "花盆不催你，它也会进入低功耗模式。",
      ],
    },
    {
      id: "lonely",
      label: "孤独",
      emoji: "🌙",
      type: "negative",
      traits: { dark: 2, weird: 2, elegant: 1 },
      messages: [
        "孤独被记录下来了，月光色爬上了叶脉。",
        "一个人也没关系，至少还有这盆花亮着。",
        "寂静不是空无，是你和自己的对话。",
        "花不会走开，明天它还会在原地等你。",
      ],
    },
  ];

  const SEEDS = [
    { id: "iris", real: "鸢尾", name: "脉冲鸢尾", variant: "pulse_iris", origin: "源自水生鸢尾的赛博变体" },
    { id: "lotus", real: "莲花", name: "线弧白莲", variant: "wire_lotus", origin: "古法莲意象 × 光纤脉络" },
    { id: "sage", real: "鼠尾草", name: "全息鼠尾草", variant: "aurora_sage", origin: "芳香草本的数据体" },
    { id: "rose", real: "蔷薇", name: "霓虹蔷薇", variant: "neon_rose", origin: "刺与花瓣皆为光导纤维" },
    { id: "moss", real: "苔藓", name: "晶苔孢子", variant: "crystal_moss", origin: "湿地苔藓的硅基结晶" },
    { id: "poppy", real: "虞美人", name: "像素虞美人", variant: "pixel_poppy", origin: "田野花卉的栅格重译" },
  ];

  const STAGES = [
    { min: 0, label: "木盆初态" },
    { min: 1, label: "萌芽" },
    { min: 2, label: "展叶" },
    { min: 3, label: "生长中" },
    { min: 4, label: "含苞" },
    { min: 5, label: "绽放" },
    { min: 6, label: "完全体" },
  ];

  const MOOD_MSG_EXTRA = {
    happy: [
      "快乐会留下光斑，今天也请保持这份亮度。",
      "把笑容存进花盆，它正在回传温暖。",
      "开心不必理由，存在就已经很好。",
      "这一下点击，让花瓣多了一层柔光。",
      "你值得因为小事而高兴。",
      "把轻快交给风，交给花，也交给自己。",
    ],
    bliss: [
      "幸福像慢火炖煮，香气正在散开。",
      "被温柔包围的时刻，请多停留几秒。",
      "甜感已写入土壤，根会记得。",
      "你正在被爱，也包括被自己爱。",
      "把感恩留在心里，花会替你保管。",
      "此刻足够好，不必比较昨天。",
    ],
    calm: [
      "安静不是停滞，是给自己留白。",
      "水面平了，花枝也垂得温柔。",
      "慢一点，世界不会因此塌掉。",
      "把喧嚣关在门外，花盆里只有呼吸。",
      "平静是一种力量，你很擅长。",
      "此刻的松弛，会被花记住。",
    ],
    excited: [
      "雀跃的能量，长出了锯齿边花瓣。",
      "兴奋时，世界像被调高饱和度。",
      "把冲动变成创意，花也在试错生长。",
      "心跳很快没关系，记得补水。",
      "热烈是真实的，不必压扁它。",
      "让光在叶尖多跳几下。",
    ],
    angry: [
      "怒气有重量，花盆接住了，不会评判。",
      "边界被触碰时，愤怒是哨声。",
      "发泄完，记得把肩膀放下来。",
      "火会熄灭，刺却会长成新的纹路。",
      "你不必立刻和解，先承认不舒服。",
      "这株花陪你一起硬气一会儿。",
    ],
    anxious: [
      "焦虑是未读消息，不必一次回完。",
      "把担心写下来，大脑会轻一点。",
      "频率紊乱时，先摸一摸花盆。",
      "未来还没来，此刻可以站稳。",
      "你已经在尽力，这就够了。",
      "花枝轻轻颤，它在陪你共振。",
    ],
    wronged: [
      "委屈需要被命名，而不是被掩盖。",
      "你没有太敏感，只是想要公平。",
      "把说不出口的话，交给沉默的花。",
      "被误解时，先抱抱自己。",
      "眼泪是合法的，土壤接得住。",
      "柔软的心，同样需要盔甲。",
    ],
    sad: [
      "低落时，允许世界变窄一点。",
      "雨天天色暗，花也会陪你暗。",
      "不必强撑微笑，花盆不会催你。",
      "悲伤会流动，像潮水涨退。",
      "今天很难，但你还是来了。",
      "把难过拆小，一口一口消化。",
    ],
    tired: [
      "电量告急，休息是正经事。",
      "累了就停，成长不会跑远。",
      "眼皮沉的时候，世界可以模糊。",
      "你已经撑了很久，辛苦了。",
      "低功耗模式，也是一种智慧。",
      "花也在打盹，明天再长高。",
    ],
    lonely: [
      "孤独是空房间，但你有回声。",
      "一个人时，花是安静的同伴。",
      "寂静不等于被抛弃。",
      "月光色爬上叶脉，陪你过夜。",
      "想说话的时候，花一直在听。",
      "你并不多余，只是暂时独处。",
    ],
  };

  MOODS.forEach((m) => {
    m.messages = [...m.messages, ...(MOOD_MSG_EXTRA[m.id] || [])];
  });

  let profile = null;
  let state = null;
  let pendingComplete = null;
  let shelfViewPlant = null;
  let stage7AdmireTimer = null;
  let stage7AdmireUntil = 0;
  let previewSeed = null;
  let displayProgress = 0;
  let animPulse = 0;
  let shakeUntil = 0;
  let dpr = 1;
  let petals = [];
  let lastPalette = [];

  const $ = (s) => document.querySelector(s);

  const growthScene = $("#growth-scene");
  const previewImg = $("#preview-img");
  const petalCanvas = $("#petal-canvas");
  let petalCtx;
  let lastGrowthUrl = "";
  let lastGrowthSceneKey = "";
  const miniImageCache = new Map();

  function todayStr() {
    return new Date().toLocaleDateString("sv-SE");
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function moodMessage(mood) {
    return pick(mood.messages);
  }

  function randomSeed() {
    return { ...pick(SEEDS) };
  }

  function defaultState(seed) {
    const s = seed || randomSeed();
    const now = Date.now();
    return {
      seedId: s.id,
      variant: s.variant,
      cyberName: s.name,
      realName: s.real,
      origin: s.origin,
      clicks: 0,
      traits: { bright: 0, dark: 0, weird: 0, elegant: 0 },
      lastMoodClick: 0,
      lastPotClick: now,
      lastCare: now,
      lastDailyMood: todayStr(),
      adoptedAt: now,
      moodLog: [],
      awaitingShelfConfirm: false,
      shelfPromptDismissed: false,
    };
  }

  function defaultProfile() {
    return { current: null, shelf: [], codex: [], codexForms: {} };
  }

  function syncState() {
    state = profile ? profile.current : null;
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProfile();
      const data = JSON.parse(raw);
      if (data.seedId && !data.shelf) {
        const p = defaultProfile();
        p.current = data.clicks >= MAX_CLICKS ? null : data;
        if (data.clicks >= MAX_CLICKS) p.codex = [data.seedId];
        return p;
      }
      return {
        current: data.current || null,
        shelf: (data.shelf || []).slice(0, SHELF_MAX),
        codex: data.codex || [],
        codexForms: data.codexForms || {},
      };
    } catch {
      return defaultProfile();
    }
  }

  function saveProfile() {
    if (profile) {
      profile.current = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
    syncState();
  }

  function saveState() {
    saveProfile();
  }

  function plantFromState(s) {
    const formStyle =
      s.moodLog?.length > 0
        ? computeDynamicFormStyle(s.moodLog, s.clicks)
        : CyberPlants.resolveFormStyle(s.traits);
    return {
      uid: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      seedId: s.seedId,
      variant: s.variant,
      cyberName: s.cyberName,
      realName: s.realName,
      origin: s.origin,
      traits: { ...s.traits },
      formStyle,
      formLabel: CyberPlants.getFormLabel(formStyle),
      completedAt: Date.now(),
      lastCare: Date.now(),
      lastPotClick: Date.now(),
      lastDailyMood: todayStr(),
    };
  }

  function unlockCodex(seedId, formStyle) {
    if (!profile.codex.includes(seedId)) profile.codex.push(seedId);
    if (!profile.codexForms) profile.codexForms = {};
    if (!profile.codexForms[seedId]) profile.codexForms[seedId] = [];
    if (formStyle && !profile.codexForms[seedId].includes(formStyle)) {
      profile.codexForms[seedId].push(formStyle);
    }
  }

  function getPlantData(obj) {
    const formStyle =
      obj.formStyle || CyberPlants.resolveFormStyle(obj.traits || {});
    return {
      variant: obj.variant,
      seedId: obj.seedId,
      traits: obj.traits || {},
      formStyle,
    };
  }

  function refreshFormStyle() {
    if (!state) return;
    state.formStyle = computeDynamicFormStyle(state.moodLog, state.clicks);
    state.formLabel = CyberPlants.getFormLabel(state.formStyle);
  }

  /** 按心情记录顺序加权累计形态分（越靠后的点击权重越大） */
  function computeFormScores(moodLog, upToClicks) {
    const scores = { bright: 0, dark: 0, weird: 0 };
    const chronological = [...(moodLog || [])].reverse();
    const limit = upToClicks == null ? chronological.length : Math.min(upToClicks, chronological.length);
    for (let i = 0; i < limit; i++) {
      const entry = chronological[i];
      const mood = MOODS.find((m) => m.id === entry.id);
      if (!mood) continue;
      const clickNum = i + 1;
      const w = 1 + (clickNum - 1) * MOOD_CLICK_WEIGHT_STEP;
      if (mood.type === "positive") scores.bright += 2 * w;
      if (mood.type === "negative") scores.dark += 2 * w;
      for (const [k, v] of Object.entries(mood.traits)) {
        if (k === "bright") scores.bright += v * w;
        else if (k === "dark") scores.dark += v * w;
        else if (k === "weird") scores.weird += v * w;
      }
    }
    return scores;
  }

  /** 根据前 upToClicks 次心情判定当前生长形态（动态，随每次点击更新） */
  function computeDynamicFormStyle(moodLog, upToClicks) {
    const log = moodLog || [];
    const clicks = upToClicks == null ? log.length : upToClicks;
    if (clicks < 1) return "bright";
    return CyberPlants.resolveFormStyleFromScores(computeFormScores(log, clicks));
  }

  function getGrowthFormStyle() {
    if (!state) return "bright";
    return computeDynamicFormStyle(state.moodLog, state.clicks);
  }

  function getGrowthFormLabel() {
    return CyberPlants.getFormLabel(getGrowthFormStyle());
  }

  /** 已达 100% 但未进入入架流程时恢复（刷新/旧存档/漏触发） */
  function recoverFullyGrownState() {
    if (!state || state.clicks < MAX_CLICKS) return;
    refreshFormStyle();
    if (!state.awaitingShelfConfirm) {
      state.awaitingShelfConfirm = true;
      state.shelfPromptDismissed = false;
      saveProfile();
    }
    if (stage7AdmireTimer) {
      clearTimeout(stage7AdmireTimer);
      stage7AdmireTimer = null;
    }
    stage7AdmireUntil = 0;
    lastGrowthUrl = "";
    lastGrowthSceneKey = "";
    renderGrowthScene();
    showShelfPrompt();
    showMessage(
      profile.shelf.length >= SHELF_MAX
        ? "是否收入花架？满架需先放弃一株。"
        : "是否将这株完全体收入阳光房花架？"
    );
    updateUI();
  }

  function getCareWilt(entry) {
    const gap = Date.now() - entry.lastCare;
    if (gap > DEATH_MS) return { dead: true, level: 1 };
    if (gap <= WILT_MS) {
      return { dead: false, level: entry.lastDailyMood !== todayStr() ? 0.12 : 0 };
    }
    let level = Math.min(1, ((gap - WILT_MS) / (DEATH_MS - WILT_MS)) * 0.85);
    if (entry.lastDailyMood !== todayStr()) level = Math.min(1, level + 0.15);
    return { dead: false, level };
  }

  function pruneShelf() {
    profile.shelf = profile.shelf.filter((p) => !getCareWilt(p).dead);
  }

  function drawMiniPlant(canvas, plantData) {
    if (!canvas || typeof GrowthAssets === "undefined") return;
    const ctx = canvas.getContext("2d");
    const lw = 64;
    const lh = 80;
    const scale = 2;
    canvas.width = lw * scale;
    canvas.height = lh * scale;
    const form =
      plantData.formStyle || CyberPlants.resolveFormStyle(plantData.traits || {});
    const url = GrowthAssets.getStageUrl(
      plantData.seedId,
      plantData.cyberName,
      form,
      MAX_CLICKS
    );
    const drawImg = (img) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ir = img.width / img.height;
      const cr = lw / lh;
      let dw, dh, dx, dy;
      if (ir > cr) {
        dh = lh * scale;
        dw = dh * ir;
        dx = (lw * scale - dw) / 2;
        dy = 0;
      } else {
        dw = lw * scale;
        dh = dw / ir;
        dx = 0;
        dy = (lh * scale - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    };
    if (miniImageCache.has(url)) {
      drawImg(miniImageCache.get(url));
      return;
    }
    const img = new Image();
    img.onload = () => {
      miniImageCache.set(url, img);
      drawImg(img);
    };
    img.onerror = () => {
      const fb = new Image();
      fb.onload = () => drawImg(fb);
      fb.src = GrowthAssets.BASE;
    };
    img.src = url;
  }

  function showShelfPrompt() {
    const el = $("#shelf-prompt");
    if (el) el.hidden = false;
  }

  function hideShelfPrompt(dismissOnly) {
    const el = $("#shelf-prompt");
    if (el) el.hidden = true;
    if (!state) return;
    if (dismissOnly) state.shelfPromptDismissed = true;
    else {
      state.awaitingShelfConfirm = false;
      state.shelfPromptDismissed = false;
    }
  }

  function tryCompleteFlower() {
    hideShelfPrompt();
    const entry = plantFromState(state);
    unlockCodex(entry.seedId, entry.formStyle);
    if (profile.shelf.length < SHELF_MAX) {
      profile.shelf.push(entry);
      state = null;
      saveProfile();
      showMessage(`「${entry.cyberName}」已收入阳光房花架！`);
      setTimeout(showAdopt, 2000);
      return;
    }
    pendingComplete = entry;
    saveProfile();
    showAbandonPicker();
  }

  function onFlowerFullyGrown() {
    if (!state) return;
    refreshFormStyle();
    lastGrowthUrl = "";
    lastGrowthSceneKey = "";
    renderGrowthScene();
    state.awaitingShelfConfirm = true;
    state.shelfPromptDismissed = false;
    saveProfile();
    hideShelfPrompt();
    showMessage("完全体绽放，好好欣赏一下吧。");

    if (stage7AdmireTimer) clearTimeout(stage7AdmireTimer);
    stage7AdmireUntil = Date.now() + STAGE7_ADMIRE_MS;
    stage7AdmireTimer = setTimeout(() => {
      stage7AdmireTimer = null;
      stage7AdmireUntil = 0;
      if (!state || !state.awaitingShelfConfirm || state.shelfPromptDismissed) return;
      showShelfPrompt();
      showMessage(
        profile.shelf.length >= SHELF_MAX
          ? "是否收入花架？满架需先放弃一株。"
          : "是否将这株完全体收入阳光房花架？"
      );
      updateUI();
    }, STAGE7_ADMIRE_MS);

    updateUI();
  }

  function showAbandonPicker() {
    const list = $("#abandon-list");
    if (!list || !pendingComplete) return;
    const abandonTitle = $("#abandon-title");
    if (abandonTitle) {
      abandonTitle.textContent = `花架已满（${SHELF_MAX}/${SHELF_MAX}）`;
    }
    list.innerHTML = "";
    profile.shelf.forEach((p) => {
      const li = document.createElement("li");
      li.className = "abandon-item";
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      drawMiniPlant(canvas, p);
      const info = document.createElement("div");
      info.innerHTML = `<strong>${p.cyberName}</strong><br><span style="font-size:0.72rem;color:#8a847c">点击放弃此株</span>`;
      li.appendChild(canvas);
      li.appendChild(info);
      li.addEventListener("click", () => {
        profile.shelf = profile.shelf.filter((x) => x.uid !== p.uid);
        profile.shelf.push(pendingComplete);
        const name = pendingComplete.cyberName;
        pendingComplete = null;
        state = null;
        saveProfile();
        $("#abandon-overlay").hidden = true;
        showMessage(`已放弃一株，「${name}」入架。`);
        setTimeout(showAdopt, 1800);
      });
      list.appendChild(li);
    });
    $("#abandon-overlay").hidden = false;
  }

  function hideAllViews() {
    ["view-home", "view-shelf", "view-codex"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    closeShelfFlowerView();
  }

  function showView(name) {
    hideAllViews();
    $("#adopt-overlay").hidden = true;
    $("#abandon-overlay").hidden = true;
    if (name === "home") {
      if (!state) {
        showAdopt();
        return;
      }
      $("#view-home").hidden = false;
      updateUI();
      lastGrowthUrl = "";
      lastGrowthSceneKey = "";
      preloadGrowthForState();
      renderGrowthScene();
    } else if (name === "shelf") {
      $("#view-shelf").hidden = false;
      requestAnimationFrame(() => renderShelf());
    } else if (name === "codex") {
      $("#view-codex").hidden = false;
      requestAnimationFrame(() => renderCodex());
    }
  }

  function getShelfFlowerUrl(plant) {
    const form =
      plant.formStyle || CyberPlants.resolveFormStyle(plant.traits || {});
    return GrowthAssets.getStageUrl(
      plant.seedId,
      plant.cyberName,
      form,
      MAX_CLICKS
    );
  }

  function renderShelf() {
    pruneShelf();
    saveProfile();
    const countEl = $("#shelf-count");
    if (countEl) countEl.textContent = profile.shelf.length;
    const maxEl = $("#shelf-max");
    if (maxEl) maxEl.textContent = SHELF_MAX;
    const layers = $("#shelf-layers");
    if (!layers) return;
    layers.innerHTML = "";

    SHELF_SLOTS.forEach((slot, index) => {
      const plant = profile.shelf[index];
      const slotEl = document.createElement("div");
      slotEl.className = "shelf-slot" + (plant ? " is-filled" : "");
      slotEl.style.left = `${slot.x}%`;
      slotEl.style.top = `${slot.y}%`;
      slotEl.style.zIndex = String(10 + Math.round(slot.y));
      if (slot.scale && slot.scale !== 1) {
        slotEl.style.setProperty("--slot-scale", String(slot.scale));
      }

      if (!plant) {
        slotEl.setAttribute("aria-hidden", "true");
        layers.appendChild(slotEl);
        return;
      }

      const wilt = getCareWilt(plant);
      const btn = document.createElement("button");
      btn.type = "button";
      let potClass = "shelf-pot";
      if (wilt.level > 0.3) potClass += " wilted";
      if (plant.lastDailyMood !== todayStr()) potClass += " needs-care";
      btn.className = potClass;
      btn.setAttribute("aria-label", `查看${plant.cyberName}`);

      const frame = document.createElement("div");
      frame.className = "shelf-flower-frame";
      const img = document.createElement("img");
      img.className = "shelf-flower-img";
      img.alt = plant.cyberName;
      img.decoding = "async";
      img.src = getShelfFlowerUrl(plant);
      img.onerror = () => {
        img.onerror = null;
        img.src = GrowthAssets.BASE;
      };
      frame.appendChild(img);

      const meta = document.createElement("div");
      meta.className = "shelf-pot-meta";
      meta.innerHTML = `<span class="shelf-pot-name">${plant.cyberName}</span><span class="shelf-pot-form">${plant.formLabel || CyberPlants.getFormLabel(plant.formStyle)}</span>`;
      if (plant.lastDailyMood !== todayStr()) {
        meta.innerHTML += `<span class="shelf-pot-tag">待照料</span>`;
      }

      btn.appendChild(frame);
      btn.appendChild(meta);
      btn.addEventListener("click", () => showShelfFlowerView(plant));
      slotEl.appendChild(btn);
      layers.appendChild(slotEl);
    });
  }

  function showShelfFlowerView(plant) {
    shelfViewPlant = plant;
    const overlay = $("#shelf-view-overlay");
    const img = $("#shelf-view-img");
    const nameEl = $("#shelf-view-name");
    const formEl = $("#shelf-view-form");
    const careBtn = $("#btn-shelf-care");
    if (!overlay || !img) return;
    img.src = getShelfFlowerUrl(plant);
    img.alt = plant.cyberName;
    if (nameEl) nameEl.textContent = plant.cyberName;
    if (formEl) {
      formEl.textContent = plant.formLabel || CyberPlants.getFormLabel(plant.formStyle);
    }
    if (careBtn) {
      const needsCare = plant.lastDailyMood !== todayStr();
      careBtn.hidden = false;
      careBtn.disabled = !needsCare;
      careBtn.textContent = needsCare ? "今日照料" : "今日已照料";
    }
    overlay.hidden = false;
  }

  function closeShelfFlowerView() {
    shelfViewPlant = null;
    const overlay = $("#shelf-view-overlay");
    if (overlay) overlay.hidden = true;
  }

  function careShelfPlant(plant) {
    plant.lastCare = Date.now();
    plant.lastPotClick = Date.now();
    plant.lastDailyMood = todayStr();
    saveProfile();
    const msg = $("#shelf-message");
    if (msg) msg.textContent = `已照料「${plant.cyberName}」，阳光里的它今天又精神了。`;
    renderShelf();
    if (shelfViewPlant && shelfViewPlant.uid === plant.uid) {
      showShelfFlowerView(plant);
    }
  }

  function renderCodex() {
    const total = $("#codex-total");
    const count = $("#codex-count");
    const validIds = new Set(SEEDS.map((s) => s.id));
    const unlockedCount = profile.codex.filter((id) => validIds.has(id)).length;
    if (total) total.textContent = SEEDS.length;
    if (count) count.textContent = unlockedCount;
    const grid = $("#codex-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const forms = ["bright", "dark", "weird"];
    const formLabels = { bright: "明媚", dark: "幽暗", weird: "异变" };

    SEEDS.forEach((seed) => {
      const unlocked = profile.codex.includes(seed.id);
      const card = document.createElement("article");
      card.className = "codex-card" + (unlocked ? " is-unlocked" : " is-locked");

      const head = document.createElement("div");
      head.className = "codex-card-head";
      const formsGot = forms.filter(
        (f) => profile.codexForms?.[seed.id]?.includes(f)
      ).length;
      const badgeHtml = unlocked
        ? `<span class="codex-badge">形态 ${formsGot}/3</span>`
        : `<span class="codex-badge codex-badge-lock">未解锁</span>`;
      head.innerHTML = `
        <div class="codex-card-title">
          <h2 class="codex-name">${seed.name}</h2>
          <p class="codex-real">${seed.real === "—" ? "虚构种" : `原型 · ${seed.real}`}</p>
        </div>
        ${badgeHtml}
      `;

      const formsRow = document.createElement("div");
      formsRow.className = "codex-forms";
      forms.forEach((form) => {
        const formUnlocked = unlocked && profile.codexForms?.[seed.id]?.includes(form);
        const cell = document.createElement("div");
        cell.className = "codex-form-cell" + (formUnlocked ? " is-unlocked" : " is-locked");

        const thumb = document.createElement("div");
        thumb.className = "codex-form-thumb";
        const img = document.createElement("img");
        img.className = "codex-form-img";
        img.alt = `${seed.name} · ${CyberPlants.getFormLabel(form)}`;
        img.loading = "lazy";
        img.decoding = "async";
        if (formUnlocked && typeof GrowthAssets !== "undefined") {
          img.src = GrowthAssets.getStageUrl(seed.id, seed.name, form, MAX_CLICKS);
        }
        thumb.appendChild(img);

        const lbl = document.createElement("span");
        lbl.className = "codex-form-label";
        lbl.textContent = formLabels[form];

        cell.appendChild(thumb);
        cell.appendChild(lbl);
        formsRow.appendChild(cell);
      });

      card.appendChild(head);
      card.appendChild(formsRow);
      grid.appendChild(card);
    });
  }

  function isDead() {
    if (!state) return true;
    return Date.now() - state.lastCare > DEATH_MS;
  }

  function getWiltLevel() {
    if (!state || isDead()) return 1;
    const gap = Date.now() - state.lastCare;
    if (gap <= WILT_MS) return 0;
    const extra = Math.min(1, (gap - WILT_MS) / (DEATH_MS - WILT_MS));
    let w = extra * 0.85;
    if (state.lastDailyMood !== todayStr()) w = Math.min(1, w + 0.15);
    return w;
  }

  function hasMoodCooldown() {
    return state && Date.now() - state.lastMoodClick < COOLDOWN_MS;
  }

  function cooldownLeft() {
    return Math.max(0, COOLDOWN_MS - (Date.now() - state.lastMoodClick));
  }

  function formatCountdown(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h} 小时 ${m} 分后可再记录`;
    if (m > 0) return `${m} 分 ${s} 秒后可再记录`;
    return `${s} 秒后可再记录`;
  }

  function normalizeTraits(t) {
    const sum =
      t.bright + t.dark + t.weird + t.elegant || 1;
    return {
      bright: t.bright / sum,
      dark: t.dark / sum,
      weird: t.weird / sum,
      elegant: t.elegant / sum,
    };
  }

  function getPalette(t) {
    const n = normalizeTraits(t);
    const base = {
      stem: "#8fa68f",
      pot: "#a89f94",
      potDark: "#8f857a",
      soil: "#9a8b7a",
      glow: "rgba(168, 181, 165, 0.3)",
    };

    if (n.dark > n.bright + 0.1) {
      return {
        ...base,
        stem: "#5a6b7a",
        leaf: "#4a5568",
        petal: ["#6b5b7a", "#8a7a8f", "#4a4058"],
        accent: "#7b6b9a",
        glow: "rgba(90, 80, 120, 0.45)",
        neon: "#9d8ec4",
        core: "#3d3548",
      };
    }
    if (n.bright > n.dark + 0.1) {
      return {
        ...base,
        stem: "#8faa9a",
        leaf: "#a8c4b5",
        petal: ["#e8b8c8", "#f0d0c0", "#d4e8e0"],
        accent: "#88c4b8",
        glow: "rgba(200, 220, 210, 0.5)",
        neon: "#7ecfc4",
        core: "#f0e8dc",
      };
    }
    if (n.weird > n.elegant + 0.08) {
      return {
        ...base,
        stem: "#7a8a7a",
        leaf: "#9ab0a0",
        petal: ["#c4a8b8", "#a8c4c0", "#d8c8a0"],
        accent: "#b8a090",
        glow: "rgba(180, 160, 140, 0.4)",
        neon: "#d4a878",
        core: "#5a5048",
      };
    }
    return {
      ...base,
      stem: "#8fa090",
      leaf: "#a8b8a8",
      petal: ["#d4b8b8", "#c8d0c8", "#e0d0c8"],
      accent: "#b0a8a8",
      glow: "rgba(184, 169, 160, 0.35)",
      neon: "#a8b8c8",
      core: "#e8e0d8",
    };
  }

  function getStageLabel(clicks) {
    let label = STAGES[0].label;
    for (const s of STAGES) {
      if (clicks >= s.min) label = s.label;
    }
    return label;
  }

  function addTraits(mood) {
    for (const [k, v] of Object.entries(mood.traits)) {
      state.traits[k] = (state.traits[k] || 0) + v;
    }
  }

  function getShakeOffset() {
    if (!shakeUntil) return 0;
    const t = 1 - (shakeUntil - performance.now()) / 500;
    if (t >= 1) {
      shakeUntil = 0;
      return 0;
    }
    return Math.sin(t * Math.PI * 8) * (1 - t) * 6;
  }

  function triggerShake() {
    const hit = $("#pot-wrap");
    if (hit) {
      hit.classList.remove("shake");
      void hit.offsetWidth;
      hit.classList.add("shake");
    }
    shakeUntil = performance.now() + 500;
  }

  function showMessage(text) {
    const el = $("#message");
    if (!el) return;
    el.classList.add("fade");
    setTimeout(() => {
      el.textContent = text;
      el.classList.remove("fade");
    }, 180);
  }

  /* ——— 图片生长场景 ——— */
  function renderGrowthScene() {
    if (!state || typeof GrowthAssets === "undefined") return;
    refreshFormStyle();
    const scene = growthScene;
    if (!scene) return;
    const form = getGrowthFormStyle();
    const url = GrowthAssets.getStageUrl(
      state.seedId,
      state.cyberName,
      form,
      state.clicks
    );
    const sceneKey = `${state.seedId}:${form}:${state.clicks}:${url}`;
    if (sceneKey === lastGrowthSceneKey) return;
    const stage = GrowthAssets.stageFromClicks(state.clicks);
    scene.classList.add("is-fading");
    const img = new Image();
    img.onload = () => {
      scene.style.backgroundImage = `url("${url}")`;
      scene.style.backgroundSize = "";
      scene.style.backgroundPosition = "";
      scene.setAttribute(
        "aria-label",
        `${state.cyberName} · ${getGrowthFormLabel()} · 第 ${stage} 阶段`
      );
      scene.classList.remove("is-fading");
      lastGrowthUrl = url;
      lastGrowthSceneKey = sceneKey;
    };
    img.onerror = () => {
      console.warn(
        `[GrowthAssets] 加载失败: ${state.cyberName} ${getGrowthFormLabel()} stage${stage} → ${url}`
      );
      scene.style.backgroundImage = `url("${GrowthAssets.BASE}")`;
      scene.classList.remove("is-fading");
      lastGrowthUrl = GrowthAssets.BASE;
      lastGrowthSceneKey = `${state.seedId}:${form}:${state.clicks}:${GrowthAssets.BASE}:err`;
    };
    img.src = url;
  }

  function drawPreview() {
    if (previewImg) previewImg.src = GrowthAssets.BASE;
  }

  function preloadGrowthForState() {
    if (!state || typeof GrowthAssets === "undefined") return;
    ["bright", "dark", "weird"].forEach((form) => {
      GrowthAssets.preloadForPlant(state.seedId, state.cyberName, form);
    });
  }

  /* ——— Petals ——— */
  function setupPetals() {
    if (!petalCanvas) return;
    petalCtx = petalCanvas.getContext("2d");
    const w = window.innerWidth;
    const h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    petalCanvas.width = w * dpr;
    petalCanvas.height = h * dpr;
    petalCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.floor((w * h) / 12000);
    petals = [];
    for (let i = 0; i < count; i++) petals.push(createPetal(w, h, true));
  }

  function createPetal(w, h, anywhere) {
    const colors =
      lastPalette.length > 0
        ? lastPalette
        : ["#ffb8d0", "#ffe8a0", "#a8f0c8", "#98d8ff", "#f0e0ff"];
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -20,
      size: 4 + Math.random() * 6,
      speedY: 0.35 + Math.random() * 0.7,
      speedX: (Math.random() - 0.5) * 0.35,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.025,
      opacity: 0.3 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.012 + Math.random() * 0.018,
    };
  }

  function tickPetals() {
    if (!petalCtx || !petalCanvas) return;
    const w = petalCanvas.width / dpr;
    const h = petalCanvas.height / dpr;
    petalCtx.clearRect(0, 0, w, h);
    for (const p of petals) {
      p.sway += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.sway) * 0.3;
      p.y += p.speedY;
      p.rot += p.rotSpeed;
      if (p.y > h + 15) Object.assign(p, createPetal(w, h, false));
      petalCtx.save();
      petalCtx.translate(p.x, p.y);
      petalCtx.rotate(p.rot);
      petalCtx.globalAlpha = p.opacity;
      petalCtx.fillStyle = p.color;
      petalCtx.beginPath();
      petalCtx.moveTo(0, 0);
      petalCtx.bezierCurveTo(p.size * 0.4, -p.size * 0.25, p.size, p.size * 0.15, 0, p.size * 0.7);
      petalCtx.bezierCurveTo(-p.size, p.size * 0.15, -p.size * 0.4, -p.size * 0.25, 0, 0);
      petalCtx.fill();
      petalCtx.restore();
    }
  }

  /* ——— UI ——— */
  function buildMoodGrid() {
    const grid = $("#mood-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (const m of MOODS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `mood-btn active-type-${m.type}`;
      btn.dataset.mood = m.id;
      btn.innerHTML = `<span class="emoji">${m.emoji}</span><span>${m.label}</span>`;
      btn.addEventListener("click", () => onMoodClick(m));
      grid.appendChild(btn);
    }
  }

  function updateUI() {
    if (!state) return;

    const dead = isDead();
    const wilt = getWiltLevel();
    const progress = state.clicks / MAX_CLICKS;
    displayProgress += (progress - displayProgress) * 0.08;

    $("#flower-name").textContent = state.cyberName;
    const formHint =
      state.clicks > 0
        ? ` · ${getGrowthFormLabel()}`
        : " · 记录心情后渐成形";
    $("#flower-stage").textContent = `${getStageLabel(state.clicks)}${formHint} · 源自${state.realName === "—" ? "虚构种" : state.realName}`;

    const fill = $("#progress-fill");
    const pct = Math.min(100, (state.clicks / MAX_CLICKS) * 100);
    if (fill) {
      fill.style.width = `${pct}%`;
      fill.classList.toggle("complete", state.clicks >= MAX_CLICKS);
    }
    $("#progress-label").textContent = `${Math.round((state.clicks / MAX_CLICKS) * 100)}%`;

    const banner = $("#status-banner");
    if (banner) {
      if (dead) {
        banner.hidden = false;
        banner.className = "status-banner danger";
        banner.textContent = "花已枯萎……请重新领养一颗种子";
      } else if (wilt > 0.5) {
        banner.hidden = false;
        banner.className = "status-banner danger";
        banner.textContent = "花蔫得厉害，快点击心情或轻触花盆";
      } else if (wilt > 0.15) {
        banner.hidden = false;
        banner.className = "status-banner warn";
        banner.textContent = "有些蔫了，记得今日打卡或摸摸花盆";
      } else if (state.lastDailyMood !== todayStr()) {
        banner.hidden = false;
        banner.className = "status-banner warn";
        banner.textContent = "今日尚未记录心情，点击一种情绪吧";
      } else {
        banner.hidden = true;
      }
    }

    const shelfPrompt = $("#shelf-prompt");
    if (shelfPrompt) {
      const admireDone = !stage7AdmireUntil || Date.now() >= stage7AdmireUntil;
      shelfPrompt.hidden = !(state.awaitingShelfConfirm && admireDone);
    }

    const cd = $("#cooldown-text");
    const onCd = hasMoodCooldown();
    if (cd) {
      if (state.awaitingShelfConfirm && stage7AdmireUntil && Date.now() < stage7AdmireUntil) {
        cd.textContent = "完全体绽放中，请稍候欣赏…";
      } else if (state.awaitingShelfConfirm && state.shelfPromptDismissed) {
        cd.textContent = "完全体已就绪，可再次点击上方「收入花架」";
      } else {
        cd.textContent = onCd
          ? formatCountdown(cooldownLeft())
          : state.clicks >= MAX_CLICKS
            ? "已达完全体，仍可记录心情"
            : "点击情绪促进生长";
      }
    }

    $$(".mood-btn").forEach((btn) => {
      btn.disabled = dead || onCd;
    });
  }

  function $$(sel) {
    return document.querySelectorAll(sel);
  }

  function onMoodClick(mood) {
    if (!state || isDead()) {
      showAdopt();
      return;
    }
    if (hasMoodCooldown()) return;

    const wasComplete = state.clicks >= MAX_CLICKS;
    if (state.clicks < MAX_CLICKS) state.clicks += 1;
    addTraits(mood);
    const now = Date.now();
    state.lastMoodClick = now;
    state.lastCare = now;
    state.lastDailyMood = todayStr();
    state.moodLog.unshift({ id: mood.id, ts: now });
    if (state.moodLog.length > 30) state.moodLog.length = 30;

    refreshFormStyle();
    saveProfile();
    triggerShake();
    showMessage(moodMessage(mood));
    lastGrowthUrl = "";
    lastGrowthSceneKey = "";
    renderGrowthScene();

    if (state.clicks >= MAX_CLICKS && !wasComplete) {
      onFlowerFullyGrown();
    } else if (state.clicks >= MAX_CLICKS && !state.awaitingShelfConfirm) {
      recoverFullyGrownState();
    } else {
      updateUI();
    }
  }

  function onPotClick() {
    if (!state || isDead()) return;
    state.lastPotClick = Date.now();
    state.lastCare = Date.now();
    saveProfile();
    triggerShake();
    if (state.lastDailyMood !== todayStr()) {
      showMessage("花盆感受到了……今天也请记录一种心情吧");
    }
    updateUI();
  }

  function showAdopt() {
    hideAllViews();
    const overlay = $("#adopt-overlay");
    if (overlay) overlay.hidden = false;
    previewSeed = randomSeed();
    updatePreview();
  }

  function showMain() {
    hideAllViews();
    $("#adopt-overlay").hidden = true;
    $("#view-home").hidden = false;
    updateUI();
    lastGrowthUrl = "";
    lastGrowthSceneKey = "";
    preloadGrowthForState();
    requestAnimationFrame(() => renderGrowthScene());
    if (state) {
      if (state.clicks >= MAX_CLICKS && state.awaitingShelfConfirm) {
        /* 完全体状态保留 recover / onFlowerFullyGrown 的寄语 */
      } else {
        showMessage("点击一种心情，让这株赛博花记住今天。");
      }
    }
  }

  function updatePreview() {
    if (!previewSeed) return;
    $("#preview-name").textContent = previewSeed.name;
    $("#preview-origin").textContent = previewSeed.origin;
    drawPreview();
  }

  function adoptSeed() {
    state = defaultState(previewSeed);
    refreshFormStyle();
    saveProfile();
    lastGrowthUrl = "";
    lastGrowthSceneKey = "";
    showMain();
  }

  function checkDeath() {
    pruneShelf();
    if (state && isDead()) {
      state = null;
      saveProfile();
      showAdopt();
      return true;
    }
    return false;
  }

  function loop() {
    animPulse += 0.04;
    if (state && !checkDeath()) updateUI();
    tickPetals();
    requestAnimationFrame(loop);
  }

  function init() {
    if (typeof CyberPlants === "undefined" || typeof GrowthAssets === "undefined") {
      document.body.insertAdjacentHTML(
        "afterbegin",
        '<p style="padding:2rem;text-align:center;color:#c44;">plants.js / growth.js 未加载，请确认与 index.html 在同一文件夹，并用本地服务器打开。</p>'
      );
      return;
    }

    buildMoodGrid();
    GrowthAssets.validateConfiguredStages?.();

    $("#btn-shelf-yes")?.addEventListener("click", () => tryCompleteFlower());
    $("#btn-shelf-later")?.addEventListener("click", () => {
      showMessage("慢慢欣赏吧，准备好了点「收入花架」即可。");
    });

    $("#btn-adopt")?.addEventListener("click", adoptSeed);
    $("#btn-reroll")?.addEventListener("click", () => {
      previewSeed = randomSeed();
      updatePreview();
    });
    $("#btn-goto-shelf")?.addEventListener("click", () => showView("shelf"));
    $("#btn-goto-codex")?.addEventListener("click", () => showView("codex"));
    $("#btn-back-home")?.addEventListener("click", () => showView("home"));
    $("#btn-back-home2")?.addEventListener("click", () => showView("home"));
    $("#btn-abandon-cancel")?.addEventListener("click", () => {
      $("#abandon-overlay").hidden = true;
      pendingComplete = null;
      state = null;
      saveProfile();
      showMessage("新花暂未入架，可继续领养培育。");
      setTimeout(showAdopt, 1200);
    });

    $("#btn-shelf-view-close")?.addEventListener("click", closeShelfFlowerView);
    $("#shelf-view-overlay")?.addEventListener("click", (e) => {
      if (e.target.id === "shelf-view-overlay") closeShelfFlowerView();
    });
    $("#btn-shelf-care")?.addEventListener("click", () => {
      if (shelfViewPlant) careShelfPlant(shelfViewPlant);
    });

    const potWrap = $("#pot-wrap");
    potWrap?.addEventListener("click", onPotClick);
    potWrap?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onPotClick();
      }
    });

    setupPetals();
    profile = loadProfile();
    profile.shelf = profile.shelf || [];
    profile.codex = profile.codex || [];
    profile.codexForms = profile.codexForms || {};
    syncState();
    if (state) {
      refreshFormStyle();
      if (state.clicks >= MAX_CLICKS) {
        recoverFullyGrownState();
      } else if (
        state.awaitingShelfConfirm &&
        (!stage7AdmireUntil || Date.now() >= stage7AdmireUntil)
      ) {
        showShelfPrompt();
      }
    }
    profile.shelf.forEach((p) => {
      if (!p.formStyle) {
        p.formStyle = CyberPlants.resolveFormStyle(p.traits || {});
        p.formLabel = CyberPlants.getFormLabel(p.formStyle);
      }
    });
    pruneShelf();
    saveProfile();

    if (!state || isDead()) {
      if (state && isDead()) {
        state = null;
        saveProfile();
      }
      showAdopt();
    } else {
      showMain();
    }

    window.addEventListener("resize", () => {
      setupPetals();
    lastGrowthUrl = "";
    lastGrowthSceneKey = "";
    renderGrowthScene();
    });

    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
