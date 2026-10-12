#!/usr/bin/env python3
"""
v5: 最可靠的气泡颜色检测。
原理：对每一行找到所有非背景像素段，对每段采样最左和最右的
非背景像素（这些是气泡边缘的背景色，永远不是文字）。
蓝=我，白=她，灰=引用。
"""
from PIL import Image
import numpy as np
import sys

def analyze(path):
    img = Image.open(path).convert('RGB')
    arr = np.array(img)
    h, w, _ = arr.shape
    print(f"尺寸 {w}x{h}")

    # 背景色：取左上角和右上角各 10x10 的中位数
    bg_samples = []
    for y in range(5, 15):
        for x in list(range(5, 15)) + list(range(w-15, w-5)):
            bg_samples.append(arr[y, x])
    bg = np.median(np.array(bg_samples), axis=0).astype(int)
    print(f"背景色: rgb({bg[0]},{bg[1]},{bg[2]})")

    def is_bg(px):
        return abs(int(px[0])-bg[0]) < 20 and abs(int(px[1])-bg[1]) < 20 and abs(int(px[2])-bg[2]) < 20

    def classify(px):
        r, g, b = int(px[0]), int(px[1]), int(px[2])
        if b > r + 20 and b > 120:
            return 'BLUE'
        if r > 200 and g > 200 and b > 200 and abs(r-g) < 25 and abs(g-b) < 25:
            return 'WHITE'
        if 100 < r < 215 and abs(r-g) < 25 and abs(g-b) < 25:
            return 'GRAY'
        return f'UNK({r},{g},{b})'

    # 逐行扫描，找非背景段
    all_segments = []  # (y, x_start, x_end, color_left, color_right)
    for y in range(h):
        x = 0
        while x < w:
            if not is_bg(arr[y, x]):
                x_start = x
                x_end = x
                while x_end < w and not is_bg(arr[y, x_end]):
                    x_end += 1
                x_end -= 1
                # 采样段的左边缘和右边缘像素
                c_left = classify(arr[y, x_start])
                c_right = classify(arr[y, x_end])
                # 取一个非UNK的颜色
                color = c_left if c_left != 'UNK' else c_right
                if color != 'UNK':
                    all_segments.append((y, x_start, x_end, color))
                x = x_end + 1
            else:
                x += 1

    # 合并相邻同色段为气泡块
    # 按 y 分组，相邻行（间隔<=6）且颜色相同且 x 范围重叠的合并
    blocks = []
    for seg in all_segments:
        y, x0, x1, color = seg
        merged = False
        for b in blocks:
            if (b['color'] == color and 
                y - b['y1'] <= 8 and 
                not (x1 < b['xmin'] - 50 or x0 > b['xmax'] + 50)):
                b['y1'] = y
                b['xmin'] = min(b['xmin'], x0)
                b['xmax'] = max(b['xmax'], x1)
                merged = True
                break
        if not merged:
            blocks.append({'y0': y, 'y1': y, 'xmin': x0, 'xmax': x1, 'color': color})

    # 过滤太小的块（噪点）
    blocks = [b for b in blocks if b['y1'] - b['y0'] > 3 and b['xmax'] - b['xmin'] > 10]
    blocks.sort(key=lambda b: b['y0'])

    print(f"\n共 {len(blocks)} 个气泡：")
    print(f"{'#':<4}{'行范围':<13}{'左x':<7}{'右x':<7}{'颜色':<10}{'归属'}")
    for i, b in enumerate(blocks, 1):
        side = {'BLUE': 'me(我)', 'WHITE': 'her(她)', 'GRAY': 'quote(引用)'}.get(b['color'], b['color'])
        print(f"{i:<4}{b['y0']}-{b['y1']:<8}{b['xmin']:<7}{b['xmax']:<7}{b['color']:<10}{side}")

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(f"\n{'='*60}")
        print(f"分析: {p.split('/')[-1]}")
        print(f"{'='*60}")
        analyze(p)
