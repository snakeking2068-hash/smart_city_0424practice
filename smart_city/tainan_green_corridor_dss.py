"""
台南高架綠廊決策支援系統 (DSS)
比較「方案A：傳統植樹」與「方案B：高架結構」
於30年期間之生理等效溫度 (PET) 效益。

輸入資料來源：建築師現地分析報告。
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.ticker as ticker
from matplotlib import font_manager

# ── 載入繁體中文字型 ──────────────────────────────────────────
# NotoSansCJK TTC 包含所有 CJK 字符；matplotlib 以第一個字型面（JP）命名，
# 但字符集完整涵蓋繁體中文。
for _ttc in [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]:
    font_manager.fontManager.addfont(_ttc)

plt.rcParams["font.family"]        = "Noto Sans CJK JP"
plt.rcParams["axes.unicode_minus"] = False


# ─────────────────────────────────────────────
# 常數與輸入資料（來自建築師現地分析）
# ─────────────────────────────────────────────

YEARS             = 30
BASELINE_PET      = 45.4   # °C — 台南夏季正午尖峰 PET（無遮蔭）
COMFORT_THRESHOLD = 35.0   # °C — 舒適區上限

# 方案B — 高架綠廊
OPT_B_SHADING        = 1.00   # 即時 100% 遮蔭
OPT_B_RADIATION_REDN = 0.76   # 太陽輻射削減率 76%
OPT_B_PET_REDUCTION  = 11.4   # °C — PET 降低幅度

# 方案A — 傳統植樹
OPT_A_INITIAL_SHADING   = 0.10   # 第0年遮蔭率 10%
OPT_A_MAX_NATURAL_SHADE = 0.70   # 自然地面全冠層遮蔭率 70%
OPT_A_SOIL_PENALTY      = 0.30   # 箱涵土層限制造成效率降低 30%
OPT_A_FULL_CANOPY_YEAR  = 25     # 達到全冠層所需年數

# 箱涵土層限制下之實際最大遮蔭率
OPT_A_MAX_SHADE = OPT_A_MAX_NATURAL_SHADE * (1.0 - OPT_A_SOIL_PENALTY)   # = 0.49

# 每日PET分布模型（夏季戶外活動時段）
SUMMER_DAYS_PER_YEAR = 214     # 4月至10月約214天
DAILY_ACTIVE_HOURS   = 14      # 07:00–21:00 行人活動時窗
PET_DAILY_MIN_ABS    = 30.0    # °C — 都市熱島效應下夏季最低PET底限


# ─────────────────────────────────────────────
# 模型函式
# ─────────────────────────────────────────────

def tree_shading(year: int) -> float:
    """
    樹木冠層遮蔭率之邏輯成長模型：
    起始值10%，受土層限制，約25年後趨近最大值49%。
    """
    k = 0.28
    midpoint = 13.0
    growth = 1.0 / (1.0 + np.exp(-k * (year - midpoint)))
    shade = OPT_A_INITIAL_SHADING + (OPT_A_MAX_SHADE - OPT_A_INITIAL_SHADING) * growth
    return float(np.clip(shade, OPT_A_INITIAL_SHADING, OPT_A_MAX_SHADE))


def shading_to_pet(shading_fraction: float) -> float:
    """
    依遮蔭率計算PET（線性模型）：
    100% 遮蔭 → PET 降低 11.4°C（來源：建築師分析數據）。
    """
    return BASELINE_PET - shading_fraction * OPT_B_PET_REDUCTION


def daily_usable_hours(noon_pet: float) -> float:
    """
    以正弦日變化曲線估算每日 PET < 舒適門檻之可用小時數，
    峰值出現於正午。
    """
    daily_min = max(PET_DAILY_MIN_ABS, noon_pet * 0.72)

    if noon_pet <= COMFORT_THRESHOLD:
        return float(DAILY_ACTIVE_HOURS)

    if daily_min >= COMFORT_THRESHOLD:
        return 0.0

    t = np.linspace(0.0, DAILY_ACTIVE_HOURS, 2000)
    pet_t = daily_min + (noon_pet - daily_min) * np.sin(np.pi * t / DAILY_ACTIVE_HOURS)
    return float(np.sum(pet_t < COMFORT_THRESHOLD) / len(t) * DAILY_ACTIVE_HOURS)


# ─────────────────────────────────────────────
# 模擬（第0年至第30年）
# ─────────────────────────────────────────────

years    = np.arange(0, YEARS + 1)
shade_A  = np.array([tree_shading(y)         for y in years])
pet_A    = np.array([shading_to_pet(s)       for s in shade_A])
pet_B    = np.full_like(years, shading_to_pet(OPT_B_SHADING), dtype=float)

annual_usable_A = np.array([daily_usable_hours(p) * SUMMER_DAYS_PER_YEAR for p in pet_A])
annual_usable_B = np.array([daily_usable_hours(p) * SUMMER_DAYS_PER_YEAR for p in pet_B])

cumulative_A = np.cumsum(annual_usable_A)
cumulative_B = np.cumsum(annual_usable_B)

total_A       = float(cumulative_A[-1])
total_B       = float(cumulative_B[-1])
benefit_ratio = total_B / max(total_A, 1.0)
extra_hours   = total_B - total_A


# ─────────────────────────────────────────────
# 主控台報告（繁體中文）
# ─────────────────────────────────────────────

SEP  = "=" * 65
SEP2 = "  " + "─" * 61

print(SEP)
print("       台南高架綠廊  ——  決策支援系統分析報告")
print(SEP)
print(f"  地點            ：台灣台南市")
print(f"  分析期間        ：第0年 至 第{YEARS}年")
print(f"  基準PET         ：{BASELINE_PET} °C（夏季正午、無遮蔭）")
print(f"  舒適區門檻      ：PET < {COMFORT_THRESHOLD} °C")
print(SEP2)
print(f"  {'指標':<30} {'方案A（植樹）':>14}  {'方案B（高架）':>12}")
print(SEP2)

rows = [
    ("第 0 年 PET（°C）",            f"{pet_A[0]:.1f}",    f"{pet_B[0]:.1f}"),
    ("第10年 PET（°C）",             f"{pet_A[10]:.1f}",   f"{pet_B[10]:.1f}"),
    ("第25年 PET（°C）",             f"{pet_A[25]:.1f}",   f"{pet_B[25]:.1f}"),
    ("第30年 PET（°C）",             f"{pet_A[30]:.1f}",   f"{pet_B[30]:.1f}"),
    ("最大遮蔭覆蓋率",               f"{shade_A[-1]*100:.0f} %",  "100 %"),
    ("首次達舒適區（年）",           "從未達到",           "第0年即達成"),
    ("30年累計可用小時（×1,000）",   f"{total_A/1000:,.0f}", f"{total_B/1000:,.0f}"),
]

for label, val_a, val_b in rows:
    print(f"  {label:<30} {val_a:>14}  {val_b:>12}")

print(SEP2)
print(f"  效益比          ：方案B比方案A多 {benefit_ratio:.1f} 倍舒適小時數")
print(f"  額外可用小時    ：30年累計多出 {extra_hours:,.0f} 小時")
print()
if pet_A[-1] > COMFORT_THRESHOLD:
    print("  >> 方案A（植樹）在30年內從未達到35°C舒適門檻。")
print("  >> 方案B（高架綠廊）從第0年起即提供全日舒適環境。")
print("  >> 結論：在台南特定工程限制下，高架綠廊是唯一能即時")
print("           緩解都市熱環境、實現以人為本交通空間的可行方案。")
print(SEP)


# ─────────────────────────────────────────────
# 圖表（繁體中文）
# ─────────────────────────────────────────────

COLOR_A  = "#EF5350"
COLOR_B  = "#1E88E5"
COLOR_OK = "#43A047"

fig = plt.figure(figsize=(16, 11), facecolor="white")
fig.suptitle(
    "台南高架綠廊  |  決策支援系統\n"
    "方案A：傳統植樹  vs  方案B：高架綠廊結構",
    fontsize=15, fontweight="bold", y=0.99,
)

gs = gridspec.GridSpec(2, 2, figure=fig, hspace=0.50, wspace=0.38,
                       top=0.91, bottom=0.07)

# ── 圖1（上，橫跨兩欄）：PET趨勢 ────────────────────────────
ax1 = fig.add_subplot(gs[0, :])

ax1.fill_between(years, COMFORT_THRESHOLD, pet_A,
                 where=(pet_A >= COMFORT_THRESHOLD),
                 color=COLOR_A, alpha=0.10, zorder=1)
ax1.fill_between(years, COMFORT_THRESHOLD, pet_B,
                 where=(pet_B <= COMFORT_THRESHOLD),
                 color=COLOR_B, alpha=0.10, zorder=1)
ax1.axhspan(0, COMFORT_THRESHOLD, color=COLOR_OK, alpha=0.06, zorder=0)

ax1.axhline(BASELINE_PET, color="#9E9E9E", linewidth=1.0, linestyle=":",
            label=f"基準值（無遮蔭）{BASELINE_PET} °C", zorder=2)
ax1.axhline(COMFORT_THRESHOLD, color=COLOR_OK, linewidth=1.6, linestyle="--",
            label=f"舒適區門檻（PET < {COMFORT_THRESHOLD:.0f} °C）", zorder=2)
ax1.plot(years, pet_A, color=COLOR_A, linewidth=2.5, linestyle="--",
         label="方案A — 傳統植樹", zorder=4)
ax1.plot(years, pet_B, color=COLOR_B, linewidth=2.5,
         label="方案B — 高架綠廊", zorder=4)

ax1.annotate(
    f"第0年\n方案A：{pet_A[0]:.1f} °C\n方案B：{pet_B[0]:.1f} °C",
    xy=(0, (pet_A[0] + pet_B[0]) / 2),
    xytext=(3, 38.5),
    arrowprops=dict(arrowstyle="->", color="#555", lw=1.2),
    fontsize=9,
    bbox=dict(boxstyle="round,pad=0.35", fc="white", ec="#ccc", alpha=0.9),
)
ax1.annotate(
    f"第30年  方案A：{pet_A[-1]:.1f} °C\n（仍高於舒適區 {pet_A[-1]-COMFORT_THRESHOLD:.1f} °C）",
    xy=(30, pet_A[-1]),
    xytext=(21.5, 43.0),
    arrowprops=dict(arrowstyle="->", color=COLOR_A, lw=1.2),
    fontsize=9, color=COLOR_A,
    bbox=dict(boxstyle="round,pad=0.35", fc="#FFF3F3", ec=COLOR_A, alpha=0.9),
)
ax1.text(0.8, COMFORT_THRESHOLD - 1.5, "  舒適區（PET < 35 °C）",
         color=COLOR_OK, fontsize=9, va="top", style="italic")

ax1.set_xlim(0, YEARS)
ax1.set_ylim(29, 48)
ax1.set_xlabel("年份", fontsize=11)
ax1.set_ylabel("夏季正午 PET（°C）", fontsize=11)
ax1.set_title("30年夏季生理等效溫度（PET）預測比較", fontsize=12)
ax1.legend(loc="lower left", fontsize=10, framealpha=0.9)
ax1.grid(True, alpha=0.25)
ax1.xaxis.set_major_locator(ticker.MultipleLocator(5))
ax1.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"第{int(x)}年"))

# ── 圖2（下左）：遮蔭覆蓋率 ──────────────────────────────────
ax2 = fig.add_subplot(gs[1, 0])

ax2.fill_between(years, shade_A * 100, 100,
                 color=COLOR_B, alpha=0.10, label="遮蔭差距（方案A vs B）")
ax2.plot(years, shade_A * 100, color=COLOR_A, linewidth=2.2, linestyle="--",
         label="方案A — 樹木冠層遮蔭率")
ax2.axhline(100, color=COLOR_B, linewidth=2.2,
            label="方案B — 高架結構（100%，第0年）")
ax2.axhline(OPT_A_MAX_SHADE * 100, color=COLOR_A, linewidth=1.0, linestyle=":",
            alpha=0.7,
            label=f"方案A理論上限（{OPT_A_MAX_SHADE*100:.0f}%，受土層限制）")

ax2.text(28, OPT_A_MAX_SHADE * 100 + 1.5,
         f"{OPT_A_MAX_SHADE*100:.0f}%",
         color=COLOR_A, fontsize=8.5, ha="right")

ax2.set_xlim(0, YEARS)
ax2.set_ylim(0, 112)
ax2.set_xlabel("年份", fontsize=10)
ax2.set_ylabel("遮蔭覆蓋率（%）", fontsize=10)
ax2.set_title("冠層／結構遮蔭覆蓋率隨時間變化", fontsize=11)
ax2.legend(fontsize=8.5, loc="lower right", framealpha=0.9)
ax2.grid(True, alpha=0.25)
ax2.xaxis.set_major_locator(ticker.MultipleLocator(5))
ax2.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"第{int(x)}年"))

# ── 圖3（下右）：累計可用小時 ────────────────────────────────
ax3 = fig.add_subplot(gs[1, 1])

ax3.fill_between(years, cumulative_A / 1_000, cumulative_B / 1_000,
                 color=COLOR_B, alpha=0.15, label="方案B額外舒適小時數")
ax3.plot(years, cumulative_B / 1_000, color=COLOR_B, linewidth=2.2,
         label=f"方案B（累計：{total_B/1000:,.0f} 千小時）")
ax3.plot(years, cumulative_A / 1_000, color=COLOR_A, linewidth=2.2, linestyle="--",
         label=f"方案A（累計：{total_A/1000:,.0f} 千小時）")

ax3.annotate(
    f"第30年差距\n多出 {extra_hours/1000:,.0f} 千小時\n（{benefit_ratio:.1f} 倍）",
    xy=(30, (cumulative_A[-1] + cumulative_B[-1]) / 2 / 1_000),
    xytext=(17, cumulative_B[-1] * 0.42 / 1_000),
    arrowprops=dict(arrowstyle="->", color=COLOR_B, lw=1.2),
    fontsize=9, color=COLOR_B,
    bbox=dict(boxstyle="round,pad=0.35", fc="#EFF6FF", ec=COLOR_B, alpha=0.9),
)

ax3.set_xlim(0, YEARS)
ax3.set_xlabel("年份", fontsize=10)
ax3.set_ylabel("累計可用小時（× 1,000 小時）", fontsize=10)
ax3.set_title("累計舒適可用小時數（PET < 35 °C，夏季）", fontsize=11)
ax3.legend(fontsize=9, loc="upper left", framealpha=0.9)
ax3.grid(True, alpha=0.25)
ax3.xaxis.set_major_locator(ticker.MultipleLocator(5))
ax3.xaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f"第{int(x)}年"))


# ─────────────────────────────────────────────
# 儲存與顯示
# ─────────────────────────────────────────────

out_file = "tainan_green_corridor_dss.png"
plt.savefig(out_file, dpi=150, bbox_inches="tight", facecolor="white")
plt.show()
print(f"\n  圖表已儲存 → {out_file}")
