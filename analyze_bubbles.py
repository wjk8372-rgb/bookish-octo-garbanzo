#!/usr/bin/env python3
"""v4: 精确判断每个气泡的背景色。
对每个气泡，从其内部边缘（padding区域，避开文字）采样，
取出现频率最高的非背景、非文字颜色作为气泡背景色。
"""
from PIL import Image
import sys
import numpy as np
from collections import Counter

def get_bg_color(arr):
    h, w, _ = arr.shape
    samples = []
    corners = [(5, 5), (5, w-6), (h-6, 5), (h-6, w-6)]
    for y, x in corners:
        for dy in range(-5, 6):
            for dx in range(-5, 6):
                yy, xx = y+dy, x+dx
                if 0 <= yy < h and 0 <= xx < w:
                    samples.append(arr[yy, xx])
    samples = np.array(samples)
    return tuple(np.median(samples, axis=0).astype(int))

def find_bubble_rows(mask, gap=6):
    h = mask.shape[0]
    rows = []
    for y in range(h):
        xs = np.where(mask[y])[0]
        if len(xs) > 3:
            rows.append((y, int(xs.min()), int(xs.max())))
    clusters = []
    cur = None
    for y, xmin, xmax in rows:
        if cur is None:
            cur = [y, y, xmin, xmax]
        elif y - cur[1] <= gap:
            cur[1] = y
            cur[2] = min(cur[2], xmin)
            cur[3] = max(cur[3], xmax)
        else:
            clusters.append(tuple(cur))
            cur = [y, y, xmin, xmax]
    if cur:
        clusters.append(tuple(cur))
    return clusters

def sample_bubble_bg(arr, y0, y1, x0, x1, bg):
    """从气泡内部边缘采样背景色，避开文字和外部背景。"""
    h, w, _ = arr.shape
    # 取气泡顶部和底部的几行（padding区，通常没有文字）
    sample_colors = []
    # 顶部padding: y0+2 到 y0+15
    for y in range(y0+2, min(y0+18, y1-2)):
        for x in range(x0+5, min(x1-5, w-1)):
            c = arr[y, x]
            # 排除文字（深色）和背景
            if (c[0]+c[1]+c[2]) < 100:  # 文字
                continue
            if abs(int(c[0])-bg[0]) < 15 and abs(int(c[1])-bg[1]) < 15 and abs(int(c[2])-bg[2]) < 15:
                continue
            sample_colors.append(tuple(c))
    # 底部padding
    for y in range(max(y1-18, y0+2), y1-2):
        for x in range(x0+5, min(x1-5, w-1)):
            c = arr[y, x]
            if (c[0]+c[1]+c[2]) < 100:
                continue
            if abs(int(c[0])-bg[0]) < 15 and abs(int(c[1])-bg[1]) < 15 and abs(int(c[2])-bg[2]) < 15:
                continue
            sample_colors.append(tuple(c))
    
    if not sample_colors:
        return None
    
    # 量化颜色到16级，找最频繁的
    quantized = [(c[0]//32*32, c[1]//32*32, c[2]//32*32) for c in sample_colors]
    most_common = Counter(quantized).most_common(1)[0][0]
    return most_common

def classify_color(c, bg):
    if c is None:
        return '???'
    r, g, b = c
    # 蓝色气泡: B明显大于R，且B较高
    if b > r + 20 and b > 120:
        return 'me(蓝)'
    # 白色气泡: 三通道都高且接近
    if r > 200 and g > 200 and b > 200 and abs(r-g) < 30 and abs(g-b) < 30:
        return 'her(白)'
    return f'?({r},{g},{b})'

def analyze(path):
    img = Image.open(path).convert('RGB')
    arr = np.array(img)
    h, w, _ = arr.shape
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    bg = get_bg_color(arr)
    print(f"尺寸 {w}x{h}, 背景 {bg}")
    bg_bright = sum(bg)/3

    # 蓝色气泡(我) - 更宽松
    blue_mask = (b.astype(int) - r.astype(int) > 20) & (b > 130) & (r < 180)
    # 白色气泡(她) - 比背景亮
    brightness = (r.astype(int) + g.astype(int) + b.astype(int)) / 3
    white_mask = (brightness > bg_bright + 8) & (r > 220) & (g > 220) & (b > 215)

    blue_clusters = find_bubble_rows(blue_mask)
    white_clusters = find_bubble_rows(white_mask)

    all_bubbles = []
    for c in blue_clusters:
        all_bubbles.append([c[0], c[1], c[2], c[3], 'blue'])
    for c in white_clusters:
        all_bubbles.append([c[0], c[1], c[2], c[3], 'white'])
    all_bubbles.sort(key=lambda x: x[0])

    # 过滤状态栏和底部
    top_cut = int(h * 0.05)
    bot_cut = int(h * 0.92)
    all_bubbles = [b for b in all_bubbles if b[0] > top_cut and b[1] < bot_cut]

    # 合并重叠的（同色且垂直重叠 -> 合并；异色重叠 -> 取更大的）
    merged = []
    for b in all_bubbles:
        found = False
        for i, m in enumerate(merged):
            if not (b[1] < m[0] or b[0] > m[1]):
                found = True
                if b[4] == m[4]:
                    merged[i] = [min(m[0],b[0]), max(m[1],b[1]), min(m[2],b[2]), max(m[3],b[3]), m[4]]
                else:
                    # 异色：保留面积大的
                    if (b[3]-b[2])*(b[1]-b[0]) > (m[3]-m[2])*(m[1]-m[0]):
                        merged[i] = b
                break
        if not found:
            merged.append(b)
    merged.sort(key=lambda x: x[0])

    # 去重：如果两个块垂直距离很近且颜色相同，合并
    final = []
    for b in merged:
        if final and b[4] == final[-1][4] and b[0] - final[-1][1] < 10:
            m = final[-1]
            final[-1] = [m[0], max(m[1], b[1]), min(m[2], b[2]), max(m[3], b[3]), m[4]]
        else:
            final.append(b)

    print(f"\n{'#':<4}{'行范围':<14}{'左x':<7}{'右x':<7}{'采样背景色':<16}{'归属'}")
    for i, b in enumerate(final, 1):
        y0, y1, x0, x1, color_type = b
        # 采样实际背景色
        actual_bg = sample_bubble_bg(arr, y0, y1, x0, x1, bg)
        side = classify_color(actual_bg, bg)
        print(f"{i:<4}{y0}-{y1:<10}{x0:<7}{x1:<7}{str(actual_bg):<16}{side}")

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(f"\n{'='*70}")
        print(f"分析: {p.split('/')[-1]}")
        print(f"{'='*70}")
        analyze(p)
