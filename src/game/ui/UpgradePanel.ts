import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { UpgradeDefinition } from '../data/upgrades';

const RARITY_THEMES: Record<string, { bg: number; border: number; shadow: number; label: string }> = {
    common: { bg: 0x1e293b, border: 0x64748b, shadow: 0x0f172a, label: 'THƯỜNG' },
    rare: { bg: 0x0369a1, border: 0x38bdf8, shadow: 0x075985, label: 'HIẾM' },
    epic: { bg: 0x7e22ce, border: 0xc084fc, shadow: 0x581c87, label: 'SỬ THI' },
    legendary: { bg: 0xb45309, border: 0xfacc15, shadow: 0x78350f, label: 'HUYỀN THOẠI' },
    corrupted: { bg: 0x991b1b, border: 0xf87171, shadow: 0x450a0a, label: 'BỊ NGUYỀN' },
};

const ACTION_LABELS: Record<string, { text: string; color: number }> = {
    upgrade_module: { text: '⭐ LÊN CẤP SAO', color: 0xfacc15 },
    stat_boost: { text: '✨ NÂNG CHỈ SỐ', color: 0x38bdf8 },
    new_module: { text: '🆕 THÊM / HỢP NHẤT', color: 0x4ade80 },
};

export class UpgradePanel extends Container {
    private bg: Graphics;
    private modalContainer: Container;
    private optionsContainer: Container;

    public onSelect: (upgrade: UpgradeDefinition) => void = () => {};

    constructor() {
        super();
        this.visible = false;

        // Semi-transparent backdrop
        this.bg = new Graphics();
        this.bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.bg.fill({ color: 0x000000, alpha: 0.78 });
        this.bg.eventMode = 'static';
        this.addChild(this.bg);

        this.modalContainer = new Container();
        this.modalContainer.x = GAME_WIDTH / 2;
        this.modalContainer.y = GAME_HEIGHT / 2;
        this.addChild(this.modalContainer);

        // ── Marth3 3D Dialog Card Base ──
        const cardW = 620;
        const cardH = 820;

        // 1. Soft Card Shadow
        const cardShadow = new Graphics();
        cardShadow.roundRect(-cardW / 2 + 6, -cardH / 2 + 16, cardW, cardH, 28)
            .fill({ color: 0x000000, alpha: 0.45 });
        this.modalContainer.addChild(cardShadow);

        // 2. Thick 3D Cyan/Blue Border Base
        const borderBg = new Graphics();
        borderBg.roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
            .fill(0x004466);
        borderBg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
            .fill(0x0284c7)
            .stroke({ color: 0xffffff, width: 4.5 });
        this.modalContainer.addChild(borderBg);

        // 3. Bright Cream Card Face
        const cardFace = new Graphics();
        cardFace.roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
            .fill(0xf8fafc);
        this.modalContainer.addChild(cardFace);

        // 4. Floating 3D Title Ribbon
        const ribbonW = 360;
        const ribbonH = 68;
        const ribbonY = -cardH / 2;

        const ribbon = new Graphics();
        ribbon.roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
            .fill(0xb45309);
        ribbon.roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
            .fill(0xf59e0b)
            .stroke({ color: 0xffffff, width: 4.5 });
        ribbon.roundRect(-ribbonW / 2 + 16, ribbonY + 4, ribbonW - 32, ribbonH * 0.4, 12)
            .fill({ color: 0xffffff, alpha: 0.3 });
        this.modalContainer.addChild(ribbon);

        const titleText = new Text({
            text: '⬆ LÊN CẤP!',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 30,
                fontWeight: '900',
                fill: 0xffffff,
                stroke: { color: 0x78350f, width: 4 },
                letterSpacing: 2,
            },
        });
        titleText.anchor.set(0.5);
        titleText.y = ribbonY + ribbonH / 2 - 2;
        this.modalContainer.addChild(titleText);

        // Subtitle
        const subText = new Text({
            text: 'Chọn 1 nâng cấp để gia tăng hỏa lực đoàn xe',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 18,
                fontWeight: '700',
                fill: 0x475569,
            },
        });
        subText.anchor.set(0.5);
        subText.y = ribbonY + ribbonH + 20;
        this.modalContainer.addChild(subText);

        // 5. Options Container
        this.optionsContainer = new Container();
        this.modalContainer.addChild(this.optionsContainer);
    }

    show(upgrades: UpgradeDefinition[]) {
        this.optionsContainer.removeChildren();

        const cardW = 560;
        const cardH = 175;
        const startY = -205;
        const gap = 190;

        for (let i = 0; i < upgrades.length; i++) {
            const upgrade = upgrades[i];
            const theme = RARITY_THEMES[upgrade.rarity] || RARITY_THEMES.common;
            const actionInfo = ACTION_LABELS[upgrade.actionType] || ACTION_LABELS.stat_boost;

            const optBtn = new Container();
            optBtn.y = startY + i * gap;

            const content = new Container();
            optBtn.addChild(content);

            // 1. 3D Card Shadow Base
            const shadow = new Graphics();
            shadow.roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 20)
                .fill(theme.shadow);
            optBtn.addChildAt(shadow, 0);

            // 2. Card Body
            const body = new Graphics();
            body.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20)
                .fill(theme.bg)
                .stroke({ color: 0xffffff, width: 3.5 });

            // Gloss sheen on top
            body.roundRect(-cardW / 2 + 8, -cardH / 2 + 6, cardW - 16, 42, 14)
                .fill({ color: 0xffffff, alpha: 0.12 });
            content.addChild(body);

            // 3. Top Badges Row: Rarity Badge + Action Type Badge
            const rarityBadge = new Graphics();
            rarityBadge.roundRect(-cardW / 2 + 16, -cardH / 2 + 14, 90, 24, 12)
                .fill(theme.border)
                .stroke({ color: 0xffffff, width: 1.5 });
            content.addChild(rarityBadge);

            const rarityText = new Text({
                text: theme.label,
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 11,
                    fontWeight: '900',
                    fill: 0xffffff,
                },
            });
            rarityText.anchor.set(0.5);
            rarityText.x = -cardW / 2 + 61;
            rarityText.y = -cardH / 2 + 26;
            content.addChild(rarityText);

            // Action Badge (Lên Sao / Nâng Chỉ Số / Thêm Mới)
            const actionBadge = new Graphics();
            actionBadge.roundRect(-cardW / 2 + 114, -cardH / 2 + 14, 145, 24, 12)
                .fill(0x0f172a)
                .stroke({ color: actionInfo.color, width: 1.5 });
            content.addChild(actionBadge);

            const actionText = new Text({
                text: actionInfo.text,
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 11,
                    fontWeight: '900',
                    fill: actionInfo.color,
                },
            });
            actionText.anchor.set(0.5);
            actionText.x = -cardW / 2 + 186;
            actionText.y = -cardH / 2 + 26;
            content.addChild(actionText);

            // 4. Target Module Scope Badge (Right-aligned)
            const scopeText = new Text({
                text: `ÁP DỤNG: ${upgrade.targetLabel}`,
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 13,
                    fontWeight: '900',
                    fill: 0xfacc15,
                    stroke: { color: 0x000000, width: 2 },
                },
            });
            scopeText.anchor.set(1, 0.5);
            scopeText.x = cardW / 2 - 18;
            scopeText.y = -cardH / 2 + 26;
            content.addChild(scopeText);

            // 5. Upgrade Name
            const nameText = new Text({
                text: upgrade.name,
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 24,
                    fontWeight: '900',
                    fill: 0xffffff,
                    stroke: { color: 0x000000, width: 3 },
                },
            });
            nameText.anchor.set(0, 0.5);
            nameText.x = -cardW / 2 + 18;
            nameText.y = -cardH / 2 + 64;
            content.addChild(nameText);

            // 6. Description Text
            const descText = new Text({
                text: upgrade.description,
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 17,
                    fontWeight: '600',
                    fill: 0xf1f5f9,
                    wordWrap: true,
                    wordWrapWidth: cardW - 36,
                    lineHeight: 22,
                },
            });
            descText.anchor.set(0, 0);
            descText.x = -cardW / 2 + 18;
            descText.y = -cardH / 2 + 88;
            content.addChild(descText);

            // 7. Interactive Hover & Touch
            optBtn.eventMode = 'static';
            optBtn.cursor = 'pointer';

            optBtn.on('pointerover', () => {
                optBtn.scale.set(1.03);
            });
            optBtn.on('pointerout', () => {
                optBtn.scale.set(1);
                content.y = 0;
            });
            optBtn.on('pointerdown', () => {
                content.y = 4;
            });
            optBtn.on('pointerup', () => {
                content.y = 0;
                this.hide();
                this.onSelect(upgrade);
            });

            this.optionsContainer.addChild(optBtn);
        }

        this.visible = true;
    }

    hide() {
        this.visible = false;
    }
}
