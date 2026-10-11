#!/usr/bin/env python3
"""v3: 对每个检测到的气泡区域，输出平均色和中心点色，人工确认归属。"""
from PIL import Image
import sys
import numpy as np

def get_bg_color(arr):
    h, w, _ = arr.shape
    samples = []
    corners = [(5, 5), (5, w-6), (h-6, 5), (h-6, w-6),
               (h//2, 5), (h//2, w-6), (5, w//2), (h-6, w//2)]
    for y, x in corners:
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                yy, xx = y+dy, x+dx
                if 0 <= yy < h and 0 <= xx < w:
                    samples.append(arr[yy, xx])
    samples = np.array(samples)
    return tuple(np.median(samples, axis=0).astype(int))

def find_clusters(mask, min_rows=2, gap=4):
    h = mask.shape[0]
    rows_with = []
    for y in range(h):
        xs = np.where(mask[y])[0]
        if len(xs) > 3:
            rows_with.append((y, int(xs.min()), int(xs.max())))
    clusters = []
    cur = None
    for y, xmin, xmax in rows_with:
        if cur is None:
            cur = [y, y, xmin, xmax]
        elif y - cur[1] <= gap:
            cur[1] = y
            cur[2] = min(cur[2], xmin)
            cur[3] = max(cur[3], xmax)
        else:
            if cur[1] - cur[0] >= min_rows:
                clusters.append(tuple(cur))
            cur = [y, y, xmin, xmax]
    if cur and cur[1] - cur[0] >= min_rows:
        clusters.append(tuple(cur))
    return clusters

def avg_color(arr, y0, y1, x0, x1):
    region = arr[y0:y1+1, x0:x1+1]
    return tuple(region.reshape(-1, 3).mean(axis=0).astype(int))

def analyze(path):
    img = Image.open(path).convert('RGB')
    arr = np.array(img)
    h, w, _ = arr.shape
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    bg = get_bg_color(arr)
    print(f"尺寸 {w}x{h}, 背景 {bg}")
    bg_bright = sum(bg)/3

    blue_mask = (b.astype(int) - r.astype(int) > 25) & (b > 140) & (r < 170)
    brightness = (r.astype(int) + g.astype(int) + b.astype(int)) / 3
    white_mask = (brightness > bg_bright + 12) & (r > 230) & (g > 230) & (b > 220)

    blue_clusters = find_clusters(blue_mask)
    white_clusters = find_clusters(white_mask)

    all_bubbles = []
    for c in blue_clusters:
        all_bubbles.append((c[0], c[1], c[2], c[3], 'me(蓝)'))
    for c in white_clusters:
        all_bubbles.append((c[0], c[1], c[2], c[3], 'her(白)'))
    all_bubbles.sort(key=lambda x: x[0])

    top_cut = int(h * 0.02)  # 只裁状态栏
    bot_cut = int(h * 0.90)
    all_bubbles = [b for b in all_bubbles if b[0] > top_cut and b[1] < bot_cut]

    # 合并重叠
    merged = []
    for b in all_bubbles:
        overlap = False
        for i, m in enumerate(merged):
            if not (b[1] < m[0] or b[0] > m[1]):
                overlap = True
                if b[4] != m[4]:
                    if (b[3]-b[2]) > (m[3]-m[2]):
                        merged[i] = b
                break
        if not overlap:
            merged.append(list(b))
    merged.sort(key=lambda x: x[0])

    print(f"\n{'#':<4}{'行范围':<13}{'左x':<7}{'右x':<7}{'平均色':<16}{'归属':<10}")
    for i, (y0, y1, xmin, xmax, side) in enumerate(merged, 1):
        ac = avg_color(arr, y0, y1, xmin, xmax)
        # 取气泡中心附近的颜色（避开边框）
        cy = (y0+y1)//2
        cx = (xmin+xmax)//2
        center_col = tuple(arr[cy, min(cx, w-1)])
        print(f"{i:<4}{y0}-{y1:<9}{xmin:<7}{xmax:<7}{str(ac):<16}{side}  中心色={center_col}")

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(f"\n{'='*70}")
        print(f"分析: {p.split('/')[-1]}")
        print(f"{'='*70}")
        analyze(p)
