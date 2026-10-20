Q版素材：碧蓝航线 拉菲换装10，原图保持不变。
来源页面：https://wiki.biligame.com/blhx/拉菲
来源文件：https://patchwiki.biligame.com/images/blhx/9/96/lb1lof2hoficrmn40llx68xp9ukl5rr.png
网页动态通过 CSS 与 JavaScript 实现；该 PNG 本身为静态图。

2026-10-21 双宠更新：
默认伙伴为小白与小金毛，点击右下角“小狗伙伴 · 设置”可切换到拉菲。
支持分别拖动、点击互动、方向键调整位置、自动散步、跟随同伴、靠近贴贴、一起休息与 love 爱心联动。
手机首次默认收起。选择、位置、收起和睡眠状态保存在 localStorage 的 moonsea-companions-v2 项中。
旧 laffey-pet-v1 项不再使用，但保留不删除。
动作过渡：靠近与退开使用缓入缓出；贴贴包含单次靠拢、轻蹭、停留和退开，爱心延后浮起。休息先收身再交叉淡入双狗睡姿，唤醒交叉淡出并轻伸展。拖动、收起、切换会取消未完成的动作；减少动态效果模式跳过位移和姿态补间。
小狗姿势图 dogs-sprites.png 使用内置 imagegen 按用户提供的参考图生成，未拷贝第三方 GitHub 表情包。生成说明与提示词见工程 docs/dogs-assets.md。
