/**
 * 生长阶段图片资源
 * stage 1 = background.png（所有花共用）
 * stage 2–7 = 各品种×形态 的 stage 图
 */
window.GrowthAssets = (function () {
  "use strict";

  const BASE = "background.png";
  const MAX_STAGE = 7;
  const FORM_LABEL = { bright: "明媚型", dark: "幽暗型", weird: "异变型" };

  /** 生成某品种×形态的 7 张图路径（stage1=BASE, 2–7=阶段图） */
  function stageList(cyberName, formLabel) {
    return [
      BASE,
      ...[2, 3, 4, 5, 6, 7].map((s) => `${cyberName}${formLabel}stage${s}.png`),
    ];
  }

  /** 已配置完整 2–7 阶段的路径（seedId:formStyle） */
  const CYBER_PLANTS = [
    ["iris", "脉冲鸢尾"],
    ["lotus", "线弧白莲"],
    ["sage", "全息鼠尾草"],
    ["rose", "霓虹蔷薇"],
    ["moss", "晶苔孢子"],
    ["poppy", "像素虞美人"],
  ];
  const FORM_KEYS = ["bright", "dark", "weird"];

  const FULL_STAGES = Object.fromEntries(
    CYBER_PLANTS.flatMap(([seedId, cyberName]) =>
      FORM_KEYS.map((form) => [
        `${seedId}:${form}`,
        stageList(cyberName, FORM_LABEL[form]),
      ])
    )
  );

  function stageFromClicks(clicks) {
    return Math.min(Math.max(0, clicks | 0) + 1, MAX_STAGE);
  }

  function stageFile(cyberName, formStyle, stage) {
    const label = FORM_LABEL[formStyle] || FORM_LABEL.bright;
    return `${cyberName}${label}stage${stage}.png`;
  }

  function getStageUrl(seedId, cyberName, formStyle, clicks) {
    const stage = stageFromClicks(clicks);
    const key = `${seedId}:${formStyle}`;
    const list = FULL_STAGES[key];
    if (list && list[stage - 1]) return list[stage - 1];
    if (stage === 1) return BASE;
    if (stage === MAX_STAGE && cyberName) return stageFile(cyberName, formStyle, MAX_STAGE);
    return BASE;
  }

  function hasFullStages(seedId, formStyle) {
    return Boolean(FULL_STAGES[`${seedId}:${formStyle}`]);
  }

  function preload(urls) {
    const list = [...new Set(urls.filter(Boolean))];
    list.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  function preloadForPlant(seedId, cyberName, formStyle) {
    const key = `${seedId}:${formStyle}`;
    const urls = FULL_STAGES[key] ? [...FULL_STAGES[key]] : [BASE, stageFile(cyberName, formStyle, MAX_STAGE)];
    preload(urls);
  }

  /** 开发期校验：已配置路径能否加载（控制台 warn） */
  function validateConfiguredStages() {
    Object.entries(FULL_STAGES).forEach(([key, list]) => {
      list.forEach((src, i) => {
        if (src === BASE) return;
        const img = new Image();
        img.onerror = () =>
          console.warn(`[GrowthAssets] 文件缺失: ${key} stage${i + 1} → ${src}`);
        img.src = src;
      });
    });
  }

  return {
    BASE,
    MAX_STAGE,
    stageFromClicks,
    getStageUrl,
    hasFullStages,
    preload,
    preloadForPlant,
    validateConfiguredStages,
    FULL_STAGES,
  };
})();
