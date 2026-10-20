# 小狗素材与生成记录

日期：2026-10-21。使用内置 imagegen 工具，按用户在聊天中提供的两只直立小狗参考图生成；不是官方原始动画，也没有复制第三方 GitHub 仓库的表情包素材。

最终图片：`source/pet/dogs-sprites.png`，1536 × 1024 RGBA，透明背景。3 列 × 2 行，单格 512 × 512。上排小白，下排小金毛；每排依次为站立、迈步、闭眼休息。前进、轻跳、靠近和贴贴由网页控制，不是骨骼动画。

生成提示词：

> Edit / character extraction and faithful pose sheet for browser pet sprites. Use ONLY this provided drawing as the exact character source. Preserve its recognizable Maltese / Line Puppy identity with maximum fidelity. NO creative redesign: same tiny circular eyes, tiny broad horizontal moustache-shaped curved mouth and black nose, same very squat bipedal upright silhouettes, thick imperfect black marker line. Tan dog: beige fill #e7d0a1, large smooth drooping ears framing oval head, thin coral red collar, little arms and very short stubby legs, three little tail strokes. White dog: distinct tall rectangular fluffy biped silhouette, broken/dashed black contour with round fluffy ear bumps and little side tail, pure white body fill (NOT transparent body). No blush, no extra head tuft, no highlights, no shadows, no soft glow. Produce an EXACT 3-column by 2-row transparent sprite atlas, 1536x1024, six 512x512 equal cells, no labels/grid/background. Row1 white dog only, Row2 tan dog only. Col1 faithful front-facing full standing pose as in reference, reconstructed only where occluded; Col2 same dog lifting one tiny arm and one stubby foot to step; Col3 dog asleep sitting/curled with closed eyes, maintaining exact face and contour style. Each character fully isolated with clear separation, center of each cell, 64px safe padding, consistent scale and baseline. Each cell contains ONE dog, never both together. The reference drawing's flat simplicity and proportions must be followed, NOT four-legged realistic dog anatomy and NOT cute generic furry puppy redesign.


## 双狗依偎休息

`source/pet/dogs-sleep-pair.png`：内置 imagegen 按同一张用户参考制作的透明双狗休息图。小黄趴着，小白的头与前爪枕在小黄的肩背上。休息时使用合体姿势，唤醒或拖动后恢复独立宠物。

生成提示词：

> Use case: illustration-story. Make ONE transparent sleeping-pair sprite for a browser pet. EXACT characters and drawing style of provided reference image: white Maltese puppy with broken/dashed fluffy black contour, and flat beige golden puppy with smooth droopy ears and thin coral red collar. Same tiny black dot eyes, little black nose and broad horizontal moustache-like smiling mouth, VERY simple imperfect bold black marker line. No blush, no redesign, no shading, no glow, no background or shadow. Both dogs are LYING DOWN sleeping together. Crucial requested pose: the beige/yellow puppy lies horizontally on its belly, relaxed, eyes closed, and the WHITE puppy nestles against it, its head and front paws resting visibly ON the yellow puppy's back/shoulder like a pillow. White puppy's body curls along the left side, beige puppy's head on right. Tender cuddled contact and clearly recognizable separate bodies, intact outlines and limbs. NOT two dogs sitting beside one another, NOT upright poses, NOT stacked vertically, NOT a new generic quadruped style. Keep exactly the original reference identities, proportions simplified for curled lying pose. Transparent PNG, landscape composition approximately 3:2, pair fills frame with 10% safe clear padding, no text, no Z letters, no heart symbols.
