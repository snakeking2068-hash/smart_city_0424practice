"""
台南民族路至林森路段  ——  三方案決策支援系統 (DSS v2.0)
方案：純植樹 (PT)、純高架結構 (PES)、混合模型 (HM)
場域：歷史文化資產保護區（民族路 – 林森路段）
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.ticker as ticker
from matplotlib import font_manager

# ── 繁體中文字型 ─────────────────────────────────────────────
for _ttc in [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]:
    font_manager.fontManager.addfont(_ttc)
plt.rcParams["font.family"]        = "Noto Sans CJK JP"
plt.rcParams["axes.unicode_minus"] = False


# ═══════════════════════════════════════════════════════════════
# 常數與輸入參數（來源：建築師現地分析）
# ═══════════════════════════════════════════════════════════════

YEARS             = 30
BASELINE_PET      = 45.4   # °C — 台南夏季正午尖峰 PET（無遮蔭）
COMFORT_THRESHOLD = 35.0   # °C — 人體熱舒適上限（PET）

# 遮蔭-PET換算：100%遮蔭 → 76%輻射削減 → PET降低11.4°C
PET_PER_SHADE = 11.4

# ── PT：純植樹 ──────────────────────────────────────────────
PT_INITIAL_SHADE  = 0.10   # 第0年遮蔭率
PT_MAX_NAT_SHADE  = 0.70   # 理想地面全冠層遮蔭率
PT_SOIL_PENALTY   = 0.30   # 鐵路箱涵土層深度限制造成之效率損失
PT_MAX_SHADE      = PT_MAX_NAT_SHADE * (1 - PT_SOIL_PENALTY)   # 0.49
PT_GROWTH_K       = 0.28
PT_GROWTH_MID     = 13.0
# 氣候韌性係數：反映颱風、熱壓力對幼樹之損害
PT_RESILIENCE_BASE    = 0.75   # 第0年存活有效率（颱風/熱壓力下）
PT_RESILIENCE_MAX     = 0.93
PT_RESILIENCE_RATE    = 0.18   # 年回復率

# ── PES：純高架結構 ─────────────────────────────────────────
PES_SHADE = 1.00   # 100% 即時遮蔭（含太陽能板及綠色頂篷）
PES_PET   = BASELINE_PET - PES_SHADE * PET_PER_SHADE   # = 34.0°C

# ── HM：混合模型 ────────────────────────────────────────────
HM_STRUCT_SHADE  = 0.82   # 高架結構覆蓋主線（即時，箱涵正上方）
HM_SIDE_TREE_MAX = 0.13   # 側植喬木成熟後額外遮蔭率（一般土壤，無限制）
HM_TREE_K        = 0.38   # 側植喬木生長速率（一般地基）
HM_TREE_MID      = 8.0    # 側植喬木生長中點（年）
HM_MAX_ET_BONUS  = 1.5    # °C — 喬木蒸發散熱之額外降溫效益（成熟期）
HM_ET_K          = 0.28
HM_ET_MID        = 12.0

# ── 日間可用小時模型 ─────────────────────────────────────────
SUMMER_DAYS   = 214    # 4月至10月（台南高溫季）
ACTIVE_HOURS  = 14     # 07:00–21:00 行人活動時窗
PET_MIN_FLOOR = 30.0   # °C — 都市熱島效應下夏季日最低PET底限


# ═══════════════════════════════════════════════════════════════
# 雷達圖評分（五項指標，0–100分，越高越優）
# ═══════════════════════════════════════════════════════════════
# 成本效益：生命週期成本回收比（植樹低資本但高風險；高架高資本但太陽能收益；混合中等）
# 即時見效：達成熱舒適效益之速度
# 生態效益：碳封存 + 太陽能 + 生物多樣性 + 蒸發散熱 + 文資景觀協調
# 熱舒適度：30年加權平均PET達標表現
# 空間自由度：行人自由度指數（高架帶來立體分層；植樹根系限制地坪）

RADAR_LABELS = ['成本效益', '即時見效', '生態效益', '熱舒適度', '空間自由度\n（文資協調）']
RADAR_PT     = [62,  12,  60,  15,  52]
RADAR_PES    = [58,  98,  52,  87,  68]
RADAR_HM     = [78,  80,  92,  95,  91]


# ═══════════════════════════════════════════════════════════════
# 模型函式
# ═══════════════════════════════════════════════════════════════

def _logistic(year, k, mid):
    return 1.0 / (1.0 + np.exp(-k * (year - mid)))

# ── PT ──────────────────────────────────────────────────────
def pt_base_shade(year):
    s = PT_INITIAL_SHADE + (PT_MAX_SHADE - PT_INITIAL_SHADE) * _logistic(year, PT_GROWTH_K, PT_GROWTH_MID)
    return float(np.clip(s, PT_INITIAL_SHADE, PT_MAX_SHADE))

def pt_resilience(year):
    return min(PT_RESILIENCE_BASE + PT_RESILIENCE_RATE * (1 - np.exp(-0.18 * year)),
               PT_RESILIENCE_MAX)

def pt_pet(year):
    return BASELINE_PET - pt_base_shade(year) * pt_resilience(year) * PET_PER_SHADE

# ── PES ─────────────────────────────────────────────────────
def pes_pet(_year):
    return PES_PET

# ── HM ──────────────────────────────────────────────────────
def hm_shade(year):
    return HM_STRUCT_SHADE + HM_SIDE_TREE_MAX * _logistic(year, HM_TREE_K, HM_TREE_MID)

def hm_et_bonus(year):
    return HM_MAX_ET_BONUS * _logistic(year, HM_ET_K, HM_ET_MID)

def hm_pet(year):
    return BASELINE_PET - hm_shade(year) * PET_PER_SHADE - hm_et_bonus(year)

# ── 生態效益分數（隨時間演進）────────────────────────────────
def eco_score_pt(year):
    # 碳封存隨冠層成長，但土層限制及颱風損耗使得效益受限
    carbon = 40 * _logistic(year, 0.25, 15) * pt_resilience(year)
    return 10 + carbon   # max ~47

def eco_score_pes(_year):
    # 太陽能發電立即效益，無生物碳；略隨板效率衰退但維持穩定
    return 52 - 2 * _logistic(_year, 0.08, 20)   # 52→50

def eco_score_hm(year):
    # 太陽能（即時）＋ 碳封存（成長）＋ 蒸發散熱（成長）＋ 生物多樣性
    solar   = 42
    carbon  = 28 * _logistic(year, 0.30, 10)
    biodiv  = 22 * _logistic(year, 0.25, 12)
    return min(solar + carbon + biodiv, 98)

# ── 每日可用小時 ─────────────────────────────────────────────
def daily_usable_hours(noon_pet):
    daily_min = max(PET_MIN_FLOOR, noon_pet * 0.72)
    if noon_pet <= COMFORT_THRESHOLD:
        return float(ACTIVE_HOURS)
    if daily_min >= COMFORT_THRESHOLD:
        return 0.0
    t     = np.linspace(0.0, ACTIVE_HOURS, 2000)
    pet_t = daily_min + (noon_pet - daily_min) * np.sin(np.pi * t / ACTIVE_HOURS)
    return float(np.sum(pet_t < COMFORT_THRESHOLD) / len(t) * ACTIVE_HOURS)


# ═══════════════════════════════════════════════════════════════
# 模擬（第0年 → 第30年）
# ═══════════════════════════════════════════════════════════════

years   = np.arange(0, YEARS + 1)
arr_PT  = np.array([pt_pet(y)  for y in years])
arr_PES = np.array([pes_pet(y) for y in years])
arr_HM  = np.array([hm_pet(y)  for y in years])

aus_PT  = np.array([daily_usable_hours(p) * SUMMER_DAYS for p in arr_PT])
aus_PES = np.array([daily_usable_hours(p) * SUMMER_DAYS for p in arr_PES])
aus_HM  = np.array([daily_usable_hours(p) * SUMMER_DAYS for p in arr_HM])

eco_PT  = np.array([eco_score_pt(y)  for y in years])
eco_PES = np.array([eco_score_pes(y) for y in years])
eco_HM  = np.array([eco_score_hm(y)  for y in years])

cum_PT  = np.cumsum(aus_PT)
cum_PES = np.cumsum(aus_PES)
cum_HM  = np.cumsum(aus_HM)

total_PT  = float(cum_PT[-1])
total_PES = float(cum_PES[-1])
total_HM  = float(cum_HM[-1])

# 關鍵年份
hm_comfort_year   = next((int(y) for y in years if hm_pet(y) <= COMFORT_THRESHOLD), None)
hm_beats_pes_year = next((int(y) for y in years if hm_pet(y) < pes_pet(y)),         None)

# 雷達綜合評分
ws_PT  = float(np.mean(RADAR_PT))
ws_PES = float(np.mean(RADAR_PES))
ws_HM  = float(np.mean(RADAR_HM))


# ═══════════════════════════════════════════════════════════════
# 主控台報告（繁體中文）
# ═══════════════════════════════════════════════════════════════

SEP  = "=" * 72
SEP2 = "  " + "─" * 68

print(SEP)
print("    台南民族路至林森路段  ——  三方案決策支援系統分析報告")
print("    場域：歷史文化資產保護區 | 分析框架：DSS v2.0")
print(SEP)
print(f"  基準PET：{BASELINE_PET} °C（夏季正午無遮蔭）   舒適門檻：PET < {COMFORT_THRESHOLD} °C")
print(SEP2)
print(f"  {'指標':<30}{'PT 純植樹':>14}{'PES 純高架':>14}{'HM 混合模型':>14}")
print(SEP2)

rows = [
    ("第  0 年 PET（°C）",       f"{arr_PT[0]:.1f}",   f"{arr_PES[0]:.1f}",  f"{arr_HM[0]:.1f}"),
    ("第  5 年 PET（°C）",       f"{arr_PT[5]:.1f}",   f"{arr_PES[5]:.1f}",  f"{arr_HM[5]:.1f}"),
    ("第 10 年 PET（°C）",       f"{arr_PT[10]:.1f}",  f"{arr_PES[10]:.1f}", f"{arr_HM[10]:.1f}"),
    ("第 20 年 PET（°C）",       f"{arr_PT[20]:.1f}",  f"{arr_PES[20]:.1f}", f"{arr_HM[20]:.1f}"),
    ("第 30 年 PET（°C）",       f"{arr_PT[30]:.1f}",  f"{arr_PES[30]:.1f}", f"{arr_HM[30]:.1f}"),
    ("最大遮蔭覆蓋率",           "49%（土層限）",       "100%（即時）",        "95%（漸進）"),
    ("首次達舒適區（年）",       "從未達到",            "第 0 年",            f"第 {hm_comfort_year} 年"),
    ("熱舒適超越PES（年）",      "—",                   "—",                  f"第 {hm_beats_pes_year} 年"),
    ("30年累計可用小時（千）",   f"{total_PT/1000:.0f}",f"{total_PES/1000:.0f}",f"{total_HM/1000:.0f}"),
    ("第30年生態效益分數",       f"{eco_PT[-1]:.0f}",  f"{eco_PES[-1]:.0f}", f"{eco_HM[-1]:.0f}"),
    ("五項雷達綜合評分",         f"{ws_PT:.0f} 分",     f"{ws_PES:.0f} 分",   f"{ws_HM:.0f} 分"),
]

for label, v1, v2, v3 in rows:
    print(f"  {label:<30}{v1:>14}{v2:>14}{v3:>14}")

print(SEP2)
print(f"  ▶ 熱舒適：HM 第{hm_comfort_year}年進入舒適區，第{hm_beats_pes_year}年超越PES；PT 從未達標。")
print(f"  ▶ 生態效益：HM 第30年得分 {eco_HM[-1]:.0f}，遠高於PES（{eco_PES[-1]:.0f}）及PT（{eco_PT[-1]:.0f}）。")
print(f"  ▶ 綜合評分：HM {ws_HM:.0f}分 > PES {ws_PES:.0f}分 > PT {ws_PT:.0f}分。")
print(f"  ▶ 結論：混合模型兼具即時遮蔭、生態永續與文資空間協調，")
print(f"          為歷史保護區中城市整合之最優解。")
print(SEP)


# ═══════════════════════════════════════════════════════════════
# 視覺化（三圖版面）
# ═══════════════════════════════════════════════════════════════

COLOR_PT  = "#EF5350"    # 紅 — 純植樹
COLOR_PES = "#1E88E5"    # 藍 — 純高架
COLOR_HM  = "#2E7D32"    # 深綠 — 混合（最優）
COLOR_OK  = "#F57C00"    # 橘 — 舒適線

fig = plt.figure(figsize=(18, 14), facecolor="white")
fig.suptitle(
    "台南民族路至林森路段  ——  高架綠廊三方案決策支援系統（歷史文化資產保護區）\n"
    "PT：純植樹   PES：純高架結構   HM：混合模型（建議方案）",
    fontsize=14, fontweight="bold", y=0.995,
)

gs = gridspec.GridSpec(
    2, 2,
    figure=fig,
    height_ratios=[1.05, 1.15],
    hspace=0.52,
    wspace=0.38,
    top=0.935,
    bottom=0.06,
)


# ══════════════════════════════════════════════════════════════
# 圖1（上方，橫跨全幅）：三方案PET趨勢
# ══════════════════════════════════════════════════════════════

ax1 = fig.add_subplot(gs[0, :])

# 背景舒適區
ax1.axhspan(0, COMFORT_THRESHOLD, color=COLOR_OK, alpha=0.06, zorder=0)

# 參考線
ax1.axhline(BASELINE_PET, color="#BDBDBD", lw=1.0, ls=":",
            label=f"基準值（無遮蔭）{BASELINE_PET} °C", zorder=1)
ax1.axhline(COMFORT_THRESHOLD, color=COLOR_OK, lw=1.8, ls="--",
            label=f"舒適門檻（PET < {COMFORT_THRESHOLD:.0f} °C）", zorder=2)

# 三條趨勢線
ax1.plot(years, arr_PT,  color=COLOR_PT,  lw=2.2, ls="--",
         label="PT — 純植樹（土層限制＋氣候韌性衰減）", zorder=4)
ax1.plot(years, arr_PES, color=COLOR_PES, lw=2.2,
         label="PES — 純高架結構（100%即時遮蔭）", zorder=4)
ax1.plot(years, arr_HM,  color=COLOR_HM,  lw=3.0,
         label="HM — 混合模型（建議方案）", zorder=5)

# HM 舒適區填色
ax1.fill_between(years, COMFORT_THRESHOLD, arr_HM,
                 where=(arr_HM <= COMFORT_THRESHOLD),
                 color=COLOR_HM, alpha=0.10, zorder=3)

# ── 標註：HM 進入舒適區 ──────────────────────────────────────
if hm_comfort_year is not None:
    ax1.axvline(hm_comfort_year, color=COLOR_HM, lw=1.2, ls=":", alpha=0.6)
    ax1.annotate(
        f"HM 第{hm_comfort_year}年\n進入舒適區",
        xy=(hm_comfort_year, COMFORT_THRESHOLD),
        xytext=(hm_comfort_year + 1.5, 37.2),
        arrowprops=dict(arrowstyle="->", color=COLOR_HM, lw=1.3),
        fontsize=9, color=COLOR_HM,
        bbox=dict(boxstyle="round,pad=0.35", fc="white", ec=COLOR_HM, alpha=0.92),
    )

# ── 標註：HM 超越 PES ────────────────────────────────────────
if hm_beats_pes_year is not None:
    ax1.annotate(
        f"第{hm_beats_pes_year}年起\nHM 熱舒適超越 PES\n（蒸發散熱效益顯現）",
        xy=(hm_beats_pes_year, arr_HM[hm_beats_pes_year]),
        xytext=(hm_beats_pes_year + 2.0, 31.8),
        arrowprops=dict(arrowstyle="->", color=COLOR_HM, lw=1.3),
        fontsize=9, color=COLOR_HM,
        bbox=dict(boxstyle="round,pad=0.35", fc="#F1F8E9", ec=COLOR_HM, alpha=0.92),
    )

# ── 標註：PT 第30年 ──────────────────────────────────────────
ax1.annotate(
    f"PT 第30年仍達 {arr_PT[30]:.1f}°C\n（從未達到舒適區）",
    xy=(30, arr_PT[30]),
    xytext=(23.5, 43.5),
    arrowprops=dict(arrowstyle="->", color=COLOR_PT, lw=1.3),
    fontsize=9, color=COLOR_PT,
    bbox=dict(boxstyle="round,pad=0.35", fc="#FFF3F3", ec=COLOR_PT, alpha=0.92),
)

# ── 標註：HM 第0年 ───────────────────────────────────────────
ax1.annotate(
    f"HM 第0年：{arr_HM[0]:.1f}°C\n（結構即時提供82%遮蔭）",
    xy=(0, arr_HM[0]),
    xytext=(3.5, 38.5),
    arrowprops=dict(arrowstyle="->", color=COLOR_HM, lw=1.3),
    fontsize=9, color=COLOR_HM,
    bbox=dict(boxstyle="round,pad=0.35", fc="#F1F8E9", ec=COLOR_HM, alpha=0.92),
)

ax1.text(1.0, COMFORT_THRESHOLD - 1.3, "  舒適區（PET < 35°C）",
         color=COLOR_OK, fontsize=9.5, style="italic")

ax1.set_xlim(0, YEARS)
ax1.set_ylim(28, 47)
ax1.set_xlabel("年份", fontsize=11)
ax1.set_ylabel("夏季正午 PET（°C）", fontsize=11)
ax1.set_title("30年夏季生理等效溫度（PET）三方案趨勢比較", fontsize=12, pad=8)
ax1.legend(loc="lower left", fontsize=9.5, framealpha=0.93, ncol=2)
ax1.grid(True, alpha=0.22)
ax1.xaxis.set_major_locator(ticker.MultipleLocator(5))
ax1.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"第{int(x)}年"))


# ══════════════════════════════════════════════════════════════
# 圖2（下左）：五項指標雷達圖
# ══════════════════════════════════════════════════════════════

ax2 = fig.add_subplot(gs[1, 0], polar=True)

N      = len(RADAR_LABELS)
angles = np.linspace(0, 2 * np.pi, N, endpoint=False)

def _close(lst):
    return lst + [lst[0]]

ang_c = _close(angles.tolist())
rPT   = _close(RADAR_PT)
rPES  = _close(RADAR_PES)
rHM   = _close(RADAR_HM)

ax2.plot(ang_c, rPT,  color=COLOR_PT,  lw=2.0, ls="--", label=f"PT   純植樹（{ws_PT:.0f} 分）")
ax2.plot(ang_c, rPES, color=COLOR_PES, lw=2.0,           label=f"PES  純高架（{ws_PES:.0f} 分）")
ax2.plot(ang_c, rHM,  color=COLOR_HM,  lw=2.8,           label=f"HM   混合模型（{ws_HM:.0f} 分）★")

ax2.fill(ang_c, rPT,  color=COLOR_PT,  alpha=0.07)
ax2.fill(ang_c, rPES, color=COLOR_PES, alpha=0.08)
ax2.fill(ang_c, rHM,  color=COLOR_HM,  alpha=0.16)

ax2.set_xticks(angles)
ax2.set_xticklabels(RADAR_LABELS, fontsize=10)
ax2.set_yticks([20, 40, 60, 80, 100])
ax2.set_yticklabels(["20", "40", "60", "80", "100"], fontsize=7.5, color="#777")
ax2.set_ylim(0, 105)
ax2.set_title("五項指標綜合評估雷達圖\n（分數越高越優）", fontsize=11, pad=20)
ax2.legend(loc="upper right", bbox_to_anchor=(1.42, 1.18), fontsize=9.5, framealpha=0.93)
ax2.grid(True, alpha=0.30)

# 在雷達中央標示各方案得分
ax2.text(0, 0, f"HM\n{ws_HM:.0f}分", ha="center", va="center",
         fontsize=8.5, color=COLOR_HM, fontweight="bold",
         bbox=dict(boxstyle="round,pad=0.25", fc="white", ec=COLOR_HM, alpha=0.85))


# ══════════════════════════════════════════════════════════════
# 圖3（下右）：每年可用小時 ＋ 生態效益分數疊圖
# ══════════════════════════════════════════════════════════════

ax3 = fig.add_subplot(gs[1, 1])
ax3b = ax3.twinx()   # 右側Y軸：生態效益分數

# ── 每年可用小時（左Y軸）────────────────────────────────────
ax3.fill_between(years, aus_HM / 1000, aus_PES / 1000,
                 where=(aus_HM <= aus_PES),
                 color="#CFD8DC", alpha=0.30, label="_缺口")
ax3.plot(years, aus_PT  / 1000, color=COLOR_PT,  lw=2.0, ls="--",
         label=f"PT  可用小時")
ax3.plot(years, aus_PES / 1000, color=COLOR_PES, lw=2.0,
         label=f"PES 可用小時")
ax3.plot(years, aus_HM  / 1000, color=COLOR_HM,  lw=2.6,
         label=f"HM  可用小時")

# ── 生態效益分數（右Y軸，虛線）──────────────────────────────
ax3b.plot(years, eco_PT,  color=COLOR_PT,  lw=1.5, ls=":",  alpha=0.7)
ax3b.plot(years, eco_PES, color=COLOR_PES, lw=1.5, ls=":",  alpha=0.7)
ax3b.plot(years, eco_HM,  color=COLOR_HM,  lw=1.8, ls="-.", alpha=0.8,
          label="─ · 生態效益分數（右軸）")

# ── 標示 HM 進入舒適區之年份線 ──────────────────────────────
if hm_comfort_year is not None:
    ax3.axvline(hm_comfort_year, color=COLOR_HM, lw=1.1, ls=":", alpha=0.55)
    ax3.text(hm_comfort_year + 0.3, 0.3,
             f"HM 第{hm_comfort_year}年\n進入舒適區",
             fontsize=8.0, color=COLOR_HM,
             bbox=dict(boxstyle="round,pad=0.25", fc="white", ec=COLOR_HM, alpha=0.85))

ax3.set_xlim(0, YEARS)
ax3.set_ylim(0, 3.5)
ax3b.set_ylim(0, 105)

ax3.set_xlabel("年份", fontsize=10)
ax3.set_ylabel("年度舒適可用小時（×1,000 小時）", fontsize=10, color="#333")
ax3b.set_ylabel("生態效益分數（/ 100）", fontsize=10, color="#555")
ax3b.tick_params(axis="y", colors="#666")
ax3.set_title("年度可用小時 ＆ 生態效益分數（雙軸）", fontsize=11, pad=8)

# 合併圖例
lines1, labels1 = ax3.get_legend_handles_labels()
lines2, labels2 = ax3b.get_legend_handles_labels()
ax3.legend(lines1 + lines2, labels1 + labels2,
           fontsize=8.5, loc="center right", framealpha=0.93)

ax3.grid(True, alpha=0.22)
ax3.xaxis.set_major_locator(ticker.MultipleLocator(5))
ax3.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"第{int(x)}年"))


# ══════════════════════════════════════════════════════════════
# 儲存輸出
# ══════════════════════════════════════════════════════════════

out_file = "tainan_dss_v2_three_scenarios.png"
plt.savefig(out_file, dpi=150, bbox_inches="tight", facecolor="white")
plt.show()
print(f"\n  圖表已儲存 → {out_file}")
